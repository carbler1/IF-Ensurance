"""Risk list, partners, maintenance dates. Code decides. docs/DESIGN.md §5."""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# scripts/ is not a package; the matcher lives in scripts/catalogue/validate.py.
sys.path.insert(0, str(ROOT / "scripts" / "catalogue"))
from validate import condition_leaves, matches  # noqa: E402

from sqlalchemy import select  # noqa: E402

from backend import db  # noqa: E402
from backend.models import Home, Profile, RiskText, WorkOrder  # noqa: E402

DRAFT = "DRAFT: "


def _strip(s: str) -> str:
    return s[len(DRAFT):] if s.startswith(DRAFT) else s


def _load(s, home_id):
    row = s.get(Profile, home_id)
    profile = json.loads(row.profile) if row else {}
    entries = json.loads((ROOT / "data" / "catalogue.json").read_text())["entries"]
    return profile, {e["id"]: e for e in entries}


def fix_value(rules, entry: dict, profile: dict) -> dict:
    """Points and decay of one fix for this home. The first rule in priority
    order whose context matches the profile wins; without one the catalogue points stand."""
    for r in rules:
        if r.risk_id == entry["id"] and (r.context is None or matches(json.loads(r.context), profile)):
            return {"rule_id": r.rule_id, "points": r.points, "half_life_years": r.half_life_years}
    # An assigned risk has no points of its own; without an active rule it is worth 0.
    return {"rule_id": None, "points": entry.get("points") or 0, "half_life_years": entry.get("half_life_years")}


def _orders(s, home_id, status) -> set[str]:
    return set(s.scalars(select(WorkOrder.risk_id).where(WorkOrder.home_id == home_id, WorkOrder.status == status)))


def _items(s, home_id) -> list[tuple[dict, dict]]:
    """(item, entry) pairs, sorted and cut to 5."""
    profile, by_id = _load(s, home_id)
    texts = {t.risk_id: t for t in s.scalars(select(RiskText).where(RiskText.home_id == home_id))}
    booked = _orders(s, home_id, "booked")
    done = _orders(s, home_id, "confirmed")
    rules = db.fix_rules(s)
    out = []
    for rid, e in by_id.items():
        t = texts.get(rid)
        llm = bool(t and t.llm_proposed)
        if not (matches(e["applies_when"], profile) or llm) or rid in done:
            continue
        value = fix_value(rules, e, profile)
        out.append(({
            "risk_id": rid,
            "category": e["category"],
            "title": e["title"],
            "severity": e["severity"],
            "probability": e["probability"],
            "why": t.why if t else _strip(e["why_hint"]),
            "benefit": t.benefit if t else _strip(e["benefit_hint"]),
            "points_available": value["points"],
            "partner_category": e["mitigation"]["partner_category"],
            "llm_proposed": llm,
            "status": "booked" if rid in booked else "open",
        }, e))
    out.sort(key=lambda p: (p[0]["llm_proposed"], -p[0]["severity"] * p[0]["probability"], p[0]["risk_id"]))
    return out[:5]


def risk_list(s, home_id: str) -> dict:
    """Response body of GET /homes/me/risks: matched entries with texts, by severity x probability,
    LLM-proposed last, at most 5."""
    return {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "risks": [i for i, _ in _items(s, home_id)],
    }


def risk_detail(s, home_id: str, risk_id: str) -> dict:
    """The risk, its evidence quotes and up to 3 partners. Raises LookupError if unknown."""
    profile, _ = _load(s, home_id)
    pairs = [p for p in _items(s, home_id) if p[0]["risk_id"] == risk_id]
    if not pairs:
        raise LookupError(risk_id)
    item, e = pairs[0]
    evidence, seen = [], set()
    for _, leaf in condition_leaves(e["applies_when"]):
        ev = profile.get(leaf["field"])
        ev = ev.get("evidence") if isinstance(ev, dict) else None
        if ev and leaf["field"] not in seen:
            seen.add(leaf["field"])
            evidence.append({k: ev[k] for k in ("document_id", "page", "quote")})
    city = s.get(Home, home_id).city
    cat = e["mitigation"]["partner_category"]
    # Partners live in the database so If staff can change prices and vetting in the dashboard.
    partners = [p for p in db.partners(s)
                if cat in p["categories"] and p["area"] == city and p["if_vetted"]]
    partners.sort(key=lambda p: -p["rating"])
    return {
        **item,
        "evidence": evidence,
        "mitigation": {"action": e["mitigation"]["action"]},
        "partners": [{k: v for k, v in p.items() if k not in ("categories", "listing_fee_tier")}
                     for p in partners[:3]],
    }


def maintenance(s, home_id: str) -> list[dict]:
    """Unused stub. The real code is backend/maintenance.py."""
    raise NotImplementedError
