"""Risk list, partners, maintenance dates. Code decides. DESIGN.md §7."""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
# scripts/ is not a package; the matcher lives in scripts/catalogue/validate.py.
sys.path.insert(0, str(ROOT / "scripts" / "catalogue"))
from validate import condition_leaves, matches  # noqa: E402

DRAFT = "DRAFT: "


def _strip(s: str) -> str:
    return s[len(DRAFT):] if s.startswith(DRAFT) else s


def _load(conn, home_id):
    row = conn.execute("SELECT profile FROM profiles WHERE home_id=?", (home_id,)).fetchone()
    profile = json.loads(row[0]) if row else {}
    entries = json.loads((ROOT / "data" / "catalogue.json").read_text())["entries"]
    return profile, {e["id"]: e for e in entries}


def _items(conn, home_id) -> list[tuple[dict, dict]]:
    """(item, entry) pairs, sorted and cut to 5."""
    profile, by_id = _load(conn, home_id)
    texts = {r[0]: r for r in conn.execute(
        "SELECT risk_id, why, benefit, llm_proposed FROM risk_texts WHERE home_id=?", (home_id,))}
    booked = {r[0] for r in conn.execute(
        "SELECT risk_id FROM work_orders WHERE home_id=? AND status='booked'", (home_id,))}
    done = {r[0] for r in conn.execute(
        "SELECT risk_id FROM work_orders WHERE home_id=? AND status='confirmed'", (home_id,))}
    out = []
    for rid, e in by_id.items():
        t = texts.get(rid)
        llm = bool(t and t["llm_proposed"])
        if not (matches(e["applies_when"], profile) or llm) or rid in done:
            continue
        out.append(({
            "risk_id": rid,
            "category": e["category"],
            "title": e["title"],
            "severity": e["severity"],
            "probability": e["probability"],
            "why": t["why"] if t else _strip(e["why_hint"]),
            "benefit": t["benefit"] if t else _strip(e["benefit_hint"]),
            "points_available": e["points"],
            "partner_category": e["mitigation"]["partner_category"],
            "llm_proposed": llm,
            "status": "booked" if rid in booked else "open",
        }, e))
    out.sort(key=lambda p: (p[0]["llm_proposed"], -p[0]["severity"] * p[0]["probability"], p[0]["risk_id"]))
    return out[:5]


def risk_list(conn, home_id: str) -> dict:
    """Response body of GET /homes/me/risks: matched entries with texts, by severity x probability,
    LLM-proposed last, at most 5."""
    return {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "risks": [i for i, _ in _items(conn, home_id)],
    }


def risk_detail(conn, home_id: str, risk_id: str) -> dict:
    """The risk, its evidence quotes and up to 3 partners. Raises LookupError if unknown."""
    profile, _ = _load(conn, home_id)
    pairs = [p for p in _items(conn, home_id) if p[0]["risk_id"] == risk_id]
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
    city = conn.execute("SELECT city FROM homes WHERE home_id=?", (home_id,)).fetchone()[0]
    cat = e["mitigation"]["partner_category"]
    partners = [p for p in json.loads((ROOT / "fixtures" / "partners.json").read_text())["partners"]
                if cat in p["categories"] and p["area"] == city and p["if_vetted"]]
    partners.sort(key=lambda p: -p["rating"])
    return {
        **item,
        "evidence": evidence,
        "mitigation": {"action": e["mitigation"]["action"]},
        "partners": [{k: v for k, v in p.items() if k not in ("categories", "listing_fee_tier")}
                     for p in partners[:3]],
    }


def maintenance(conn, home_id: str) -> list[dict]:
    """Due date = last known date + check_interval_years, or today."""
    raise NotImplementedError
