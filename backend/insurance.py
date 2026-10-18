"""The five insurance classes, their risks, and the score and premium math across them.

The house uses data/catalogue.json and data/home-profile.schema.json. The cottage, the boat,
the car and the dog use data/insurance-classes.json (mock: two risks each). A fix rule's context
is tested against the profile of the object it belongs to. Code decides every number here.

Score model (data/score-model.json, editable in the dashboard): each insurance has its own score,
starting at insurance_score_start and capped at max_score. Confirmed fixes add their points. The
insurance's score sets its discount band (percent off its own premium). The aggregate score is the
average of a customer's insurance scores and sets the tier; tier bonuses are display texts only.
"""

import json
from datetime import datetime, timezone
from functools import cache
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend import db, engine
from backend.models import AssignedRisk, Booking, InsuranceClass, InsuredObject, Profile, WorkOrder

ROOT = Path(__file__).resolve().parent.parent
UNKNOWN = "unknown"


@cache
def _other_classes() -> dict:
    return json.loads((ROOT / "data" / "insurance-classes.json").read_text())


@cache
def definitions() -> list[dict]:
    """Each class with its profile fields and its risks: [{class_id, name, fields, risks}]."""
    schema = json.loads((ROOT / "data" / "home-profile.schema.json").read_text())["properties"]
    house_fields = []
    for name, p in schema.items():
        v = p["properties"]["value"]
        kind = "enum" if "enum" in v else "date" if v.get("$ref", "").endswith("/date") else "year"
        house_fields.append({"name": name, "kind": kind, "description": p["description"],
                             "options": [o for o in v.get("enum", []) if o != UNKNOWN]})
    house = {"class_id": "house", "name": "House", "fields": house_fields,
             "risks": json.loads((ROOT / "data" / "catalogue.json").read_text())["entries"]}
    others = [{"class_id": c["class_id"], "name": c["name"],
               "fields": [{"options": [], **f} for f in c["fields"]], "risks": c.get("risks", [])}
              for c in _other_classes()["classes"]]
    return [house, *others]


def assigned_risks(s: Session, object_ids: list[str] | None = None) -> list[dict]:
    """Risks assigned to insured objects (the demo customer's app risks), in catalogue-entry shape
    plus the app texts. They always apply to their object."""
    q = (select(AssignedRisk, InsuredObject).join(InsuredObject, AssignedRisk.object_id == InsuredObject.object_id)
         .order_by(AssignedRisk.sort_order))
    if object_ids is not None:
        q = q.where(AssignedRisk.object_id.in_(object_ids))
    return [{"id": r.risk_id, "category": r.area, "title": r.title, "points": None, "assigned": True,
             "object_id": r.object_id, "object_name": o.name, "class_id": o.class_id,
             "mitigation": {"action": r.fix, "partner_category": ""},
             "why": r.why, "explain": r.explain, "fix": r.fix, "diy": r.diy, "area": r.area}
            for r, o in s.execute(q).all()]


def class_risks(s: Session, class_id: str) -> list[dict]:
    """A class's catalogue risks plus every risk assigned to an object of that class."""
    return [*definition(class_id)["risks"], *(r for r in assigned_risks(s) if r["class_id"] == class_id)]


def definition(class_id: str) -> dict:
    for d in definitions():
        if d["class_id"] == class_id:
            return d
    raise LookupError(class_id)


def risk_class(s: Session, risk_id: str) -> str | None:
    for d in definitions():
        if any(r["id"] == risk_id for r in d["risks"]):
            return d["class_id"]
    a = s.get(AssignedRisk, risk_id)
    return s.get(InsuredObject, a.object_id).class_id if a else None


def object_profile(s: Session, obj: InsuredObject) -> dict:
    """The profile of one object as {field: value}. A house reads the pipeline's profile."""
    if obj.class_id == "house":
        row = s.get(Profile, obj.object_id)
        full = json.loads(row.profile) if row else {}
        return {k: (v.get("value", UNKNOWN) if isinstance(v, dict) else v) for k, v in full.items()}
    return json.loads(obj.profile or "{}")


def validate_context(condition: dict, class_id: str) -> None:
    """Raise ValueError unless the condition is valid applies_when grammar over the class's fields."""
    fields = {f["name"]: f for f in definition(class_id)["fields"]}

    def check(c):
        if not isinstance(c, dict) or "op" not in c:
            raise ValueError("Each condition needs an op.")
        op = c["op"]
        if op in ("and", "or"):
            if not isinstance(c.get("args"), list) or not c["args"]:
                raise ValueError(f"{op} needs at least one condition.")
            for a in c["args"]:
                check(a)
            return
        if op == "not":
            if not isinstance(c.get("args"), list) or len(c["args"]) != 1:
                raise ValueError("not needs exactly one condition.")
            check(c["args"][0])
            return
        f = fields.get(c.get("field"))
        if f is None:
            raise ValueError(f"Unknown field {c.get('field')!r} for this insurance class.")
        if op == "exists":
            return
        value = c.get("value")
        if op == "in":
            if not isinstance(value, list) or not value:
                raise ValueError("in needs a list of values.")
            if f["kind"] == "enum" and any(v not in [*f["options"], UNKNOWN] for v in value):
                raise ValueError(f"A value is not an option of {f['name']}.")
            return
        if op not in ("lt", "gt", "eq"):
            raise ValueError(f"Unknown op {op!r}.")
        if f["kind"] == "year" and not (isinstance(value, int) and not isinstance(value, bool)):
            raise ValueError(f"{f['name']} needs a whole year.")
        if f["kind"] == "date" and not (isinstance(value, str) and len(value) == 10):
            raise ValueError(f"{f['name']} needs a date like 2024-01-31.")
        if f["kind"] == "enum" and value not in f["options"]:
            raise ValueError(f"{value!r} is not an option of {f['name']}.")

    check(condition)


def band(score: int, bands: list[dict]) -> int:
    """Percent off an insurance's own premium at this insurance score; 0 below the lowest band."""
    return max((b["percent"] for b in bands if score >= b["min_score"]), default=0)


def next_band(score: int, bands: list[dict]) -> dict | None:
    """The next band above this score, with the points still missing."""
    up = [b for b in bands if b["min_score"] > score]
    return {**up[0], "points_to": up[0]["min_score"] - score} if up else None


def _tier(score: int, tiers: list[dict]) -> dict | None:
    reached = [t for t in tiers if score >= t["min_score"]]
    return reached[-1] if reached else None


def _next_tier(score: int, tiers: list[dict]) -> dict | None:
    up = [t for t in tiers if t["min_score"] > score]
    return {"name": up[0]["name"], "min_score": up[0]["min_score"], "points_to": up[0]["min_score"] - score} if up else None


def _confirmed(s: Session, object_id: str) -> dict[str, str | None]:
    """{risk_id: confirmed_at} for this object: a confirmed work order (house API) or an app booking at step 2."""
    orders = s.execute(select(WorkOrder.risk_id, WorkOrder.confirmed_at)
                       .where(WorkOrder.home_id == object_id, WorkOrder.status == "confirmed"))
    booked = s.execute(select(Booking.risk_id, Booking.confirmed_at)
                       .where(Booking.object_id == object_id, Booking.step == 2))
    return {**dict(orders.all()), **dict(booked.all())}


@cache
def _default_half_lives() -> dict:
    return json.loads((ROOT / "fixtures" / "half-lives.json").read_text())["defaults"]


def decayed(points: int, confirmed_at: str | None, half_life: int | None, now: datetime | None = None) -> int:
    """points * 0.5 ** (years since confirmed_at / half_life). No decay without a date or a half-life."""
    if not confirmed_at or not half_life:
        return points
    t = datetime.fromisoformat(confirmed_at)
    t = t if t.tzinfo else t.replace(tzinfo=timezone.utc)
    years = max(0.0, ((now or datetime.now(timezone.utc)) - t).total_seconds() / (365.25 * 86400))
    return round(points * 0.5 ** (years / half_life))


def simulate(s: Session, objects: list[dict]) -> dict:
    """Each insurance's score now and with every open fix confirmed, its discount band and premium,
    and the aggregate score (the average) with its tier.
    objects: [{object_id?, class_id, name?, profile: {field: value}, history?: [{label, points}]}]."""
    rules = db.fix_rules(s)
    classes = {c.class_id: c for c in s.scalars(select(InsuranceClass))}
    st = db.settings(s)
    bands = db.bands(s)
    tiers = db.tiers(s)
    clamp = lambda x: max(0, min(st.max_score, x))  # noqa: E731
    out = []
    for o in objects:
        d = definition(o["class_id"])
        cls = classes[o["class_id"]]
        profile = o.get("profile") or {}
        confirmed = _confirmed(s, o["object_id"]) if o.get("object_id") else {}
        assigned = assigned_risks(s, [o["object_id"]]) if o.get("object_id") else []
        fixes, done_rows, done_points = [], [], 0
        for e in [*d["risks"], *assigned]:
            # Catalogue risks apply when their condition matches; assigned risks always apply.
            if not e.get("assigned") and not engine.matches(e["applies_when"], profile):
                continue
            v = engine.fix_value(rules, e, profile)
            if e["id"] in confirmed:
                hl = v["half_life_years"] or _default_half_lives().get(e["category"])
                cur = decayed(v["points"], confirmed[e["id"]], hl)
                done_rows.append({"risk_id": e["id"], "base_points": v["points"], "points": cur})
                done_points += cur
                continue
            fixes.append({"risk_id": e["id"], "title": e["title"], "category": e["category"],
                          "action": e["mitigation"]["action"], "assigned": bool(e.get("assigned")), **v,
                          "rule_label": next((r.label for r in rules if r.rule_id == v["rule_id"]), None),
                          "rule_context": next((json.loads(r.context) if r.context else None
                                                for r in rules if r.rule_id == v["rule_id"]), None)})
        fixes.sort(key=lambda f: (-f["points"], f["risk_id"]))
        history = o.get("history") or []
        now = clamp(st.insurance_score_start + sum(h["points"] for h in history) + done_points)
        after = clamp(now + sum(f["points"] for f in fixes))
        base = cls.base_annual_premium_eur
        out.append({
            "object_id": o.get("object_id"), "class_id": o["class_id"], "class_name": cls.name,
            "name": o.get("name") or cls.name, "history": history, "fixes": fixes, "done": done_rows,
            "points": sum(f["points"] for f in fixes),
            "score": {"now": now, "after": after, "next_band": next_band(now, bands)},
            "band": {"now": band(now, bands), "after": band(after, bands)},
            "premium": {"base": base, "now": round(base * (1 - band(now, bands) / 100)),
                        "after": round(base * (1 - band(after, bands) / 100))},
        })
    agg_now = round(sum(o["score"]["now"] for o in out) / len(out)) if out else 0
    agg_after = round(sum(o["score"]["after"] for o in out) / len(out)) if out else 0
    return {
        "objects": out,
        "aggregate": {"now": agg_now, "after": agg_after, "tier_now": _tier(agg_now, tiers),
                      "tier_after": _tier(agg_after, tiers), "next_tier": _next_tier(agg_now, tiers)},
        "premium": {k: sum(o["premium"][k] for o in out) for k in ("base", "now", "after")},
        "model": {"insurance_score_start": st.insurance_score_start, "max_score": st.max_score, "bands": bands,
                  "tiers": tiers},
    }


def customer_objects(s: Session, customer_id: str) -> list[dict]:
    """A customer's objects in the shape simulate() takes."""
    order = [d["class_id"] for d in definitions()]
    rows = sorted(s.scalars(select(InsuredObject).where(InsuredObject.customer_id == customer_id)),
                  key=lambda o: (order.index(o.class_id), o.object_id))
    return [{"object_id": o.object_id, "class_id": o.class_id, "name": o.name, "profile": object_profile(s, o),
             "history": json.loads(o.history or "[]")} for o in rows]
