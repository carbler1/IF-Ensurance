"""The five insurance classes, their risks, and the score and premium math across them.

The house uses data/catalogue.json and data/home-profile.schema.json. The cottage, the boat,
the car and the dog use data/insurance-classes.json (mock: two risks each). A fix rule's context
is tested against the profile of the object it belongs to. Code decides every number here.
"""

import json
from functools import cache
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend import db, engine
from backend.models import InsuranceClass, InsuredObject, Profile, Tier

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
               "fields": [{"options": [], **f} for f in c["fields"]], "risks": c["risks"]}
              for c in _other_classes()["classes"]]
    return [house, *others]


def definition(class_id: str) -> dict:
    for d in definitions():
        if d["class_id"] == class_id:
            return d
    raise LookupError(class_id)


def risk_class(risk_id: str) -> str | None:
    for d in definitions():
        if any(r["id"] == risk_id for r in d["risks"]):
            return d["class_id"]
    return None


def demo_customer() -> dict:
    return _other_classes()["demo_customer"]


def base_premiums() -> dict[str, int]:
    return _other_classes()["base_premiums_eur"]


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


def _tier(score: int, tiers: list[Tier]) -> dict | None:
    reached = [t for t in sorted(tiers, key=lambda t: t.min_score) if score >= t.min_score]
    t = reached[-1] if reached else None
    return {"index": t.tier_index, "name": t.name, "min_score": t.min_score,
            "deductible_reduction_eur": t.deductible_reduction_eur} if t else None


def simulate(s: Session, objects: list[dict]) -> dict:
    """What a customer gains when every fix that applies to their objects is confirmed.
    objects: [{object_id?, class_id, name, profile: {field: value}}]."""
    rules = db.fix_rules(s)
    classes = {c.class_id: c for c in s.scalars(select(InsuranceClass))}
    out = []
    for o in objects:
        d = definition(o["class_id"])
        cls = classes[o["class_id"]]
        profile = o.get("profile") or {}
        fixes = []
        for e in d["risks"]:
            if not engine.matches(e["applies_when"], profile):
                continue
            v = engine.fix_value(rules, e, profile)
            fixes.append({"risk_id": e["id"], "title": e["title"], "category": e["category"],
                          "action": e["mitigation"]["action"], **v,
                          "rule_label": next((r.label for r in rules if r.rule_id == v["rule_id"]), None),
                          "rule_context": next((json.loads(r.context) if r.context else None
                                                for r in rules if r.rule_id == v["rule_id"]), None)})
        fixes.sort(key=lambda f: (-f["points"], f["risk_id"]))
        cap = round(cls.base_annual_premium_eur * cls.max_reduction_percent / 100)
        raw = sum(f["premium_reduction_eur"] for f in fixes)
        out.append({
            "object_id": o.get("object_id"), "class_id": o["class_id"], "class_name": cls.name,
            "name": o.get("name") or cls.name, "fixes": fixes,
            "points": sum(f["points"] for f in fixes),
            "premium": {"base": cls.base_annual_premium_eur, "cut_raw": raw, "cut": min(raw, cap),
                        "capped": raw > cap, "max_reduction_percent": cls.max_reduction_percent,
                        "after": cls.base_annual_premium_eur - min(raw, cap)},
        })
    start = db.settings(s).score_start
    total = sum(o["points"] for o in out)
    tiers = list(s.scalars(select(Tier)))
    return {
        "objects": out,
        "score": {"start": start, "points": total, "after": start + total,
                  "tier_before": _tier(start, tiers), "tier_after": _tier(start + total, tiers)},
        "premium": {"base": sum(o["premium"]["base"] for o in out), "cut": sum(o["premium"]["cut"] for o in out),
                    "after": sum(o["premium"]["after"] for o in out)},
    }


def customer_objects(s: Session, customer_id: str) -> list[dict]:
    """A customer's objects in the shape simulate() takes."""
    order = [d["class_id"] for d in definitions()]
    rows = sorted(s.scalars(select(InsuredObject).where(InsuredObject.customer_id == customer_id)),
                  key=lambda o: (order.index(o.class_id), o.object_id))
    return [{"object_id": o.object_id, "class_id": o.class_id, "name": o.name, "profile": object_profile(s, o)}
            for o in rows]
