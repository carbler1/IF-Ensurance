"""Check the API fixtures in fixtures/api/ against the contract shapes.

Run from the repo root:
  python3 -I fixtures/api/check.py

Exit 0 means every file loads, every object has exactly the contract's
field names, every risk_id exists in data/catalogue.json and every
partner_id exists in fixtures/partners.json.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
API = ROOT / "fixtures" / "api"

# Field names per object type, copied from docs/systemdesign/api-contract.md v0.2.
KEYS = {
    "home": {"home_id", "address", "profile", "documents"},
    "address": {"street", "postal_code", "city"},
    "profile_field": {"value", "confidence", "source", "doubt"},
    "document": {"document_id", "type", "uploaded_at", "status"},
    "documents_post": {"document_id", "job_id"},
    "job": {"job_id", "status", "stage", "started_at", "finished_at", "error"},
    "job_error": {"code", "message"},
    "risk_list": {"generated_at", "risks"},
    "risk": {
        "risk_id", "category", "title", "severity", "probability", "why",
        "benefit", "points_available", "premium_reduction_eur", "partner_category", "llm_proposed", "status",
    },
    "risk_detail_extra": {"evidence", "mitigation", "partners"},
    "evidence": {"document_id", "page", "quote"},
    "mitigation": {"action"},
    "partner": {
        "partner_id", "name", "rating", "price_range", "if_vetted",
        "tier_discount_percent", "area",
    },
    "price_range": {"min", "max"},
    "work_order": {
        "work_order_id", "risk_id", "partner_id", "status", "created_at", "confirmed_at",
    },
    "work_order_list": {"work_orders"},
    "confirm": {"work_order_id", "status", "confirmed_at", "score_event"},
    "score_event": {"event_id", "delta", "score_after", "reason"},
    "score": {"score", "tier", "next_tier", "benefit", "breakdown", "history"},
    "tier": {"index", "name", "min_score"},
    "next_tier": {"index", "name", "min_score", "points_needed"},
    "benefit": {"deductible_reduction_eur", "free_checkups"},
    "breakdown_item": {"risk_id", "title", "points", "completed_at", "decayed_points"},
    "history_item": {"event_id", "at", "delta", "score_after", "reason"},
    "maintenance_list": {"items"},
    "maintenance_item": {
        "item_id", "risk_id", "title", "due_at", "interval_years", "status", "partner_category",
    },
    "error_envelope": {"error"},
    "error": {"code", "message"},
}

PROFILE_FIELDS = {
    "house_type", "building_year", "heating", "panel_type", "pipe_material",
    "roof_material", "last_pipe_renovation", "last_electrical_check", "ventilation",
    "sauna", "bathroom_waterproofing_year", "floor_drain_type", "water_heater_year",
    "foundation_type", "subsoil_drains", "last_roof_renovation", "oil_tank_year",
    "last_chimney_sweep", "last_moisture_inspection", "last_ventilation_service",
}
SOURCES = {"partner", "document", "register", "customer", "none"}

errors = []


def fail(msg):
    errors.append(msg)


def load(name):
    path = API / name
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError) as e:
        fail(f"{name}: cannot load: {e}")
        return None


def keys(name, obj, kind, where=""):
    """Assert obj is a dict with exactly KEYS[kind]."""
    label = f"{name}{where}"
    if not isinstance(obj, dict):
        fail(f"{label}: expected object for {kind}")
        return False
    expected = KEYS[kind]
    got = set(obj)
    if got != expected:
        missing = sorted(expected - got)
        extra = sorted(got - expected)
        fail(f"{label}: {kind} keys differ; missing {missing}, extra {extra}")
        return False
    return True


def check_risk(name, r, where, catalogue_ids, catalogue):
    if not keys(name, r, "risk", where):
        return
    rid = r["risk_id"]
    if rid not in catalogue_ids:
        fail(f"{name}{where}: risk_id {rid!r} not in catalogue")
        return
    entry = catalogue[rid]
    for field, cat_field in (
        ("category", "category"), ("title", "title"), ("severity", "severity"),
        ("probability", "probability"), ("points_available", "points"),
    ):
        if r[field] != entry[cat_field]:
            fail(f"{name}{where}: {field}={r[field]!r} differs from catalogue {entry[cat_field]!r}")
    if r["partner_category"] != entry["mitigation"]["partner_category"]:
        fail(f"{name}{where}: partner_category differs from catalogue")
    if r["status"] not in {"open", "booked"}:
        fail(f"{name}{where}: status {r['status']!r} not open or booked")
    if r["llm_proposed"] is not False:
        fail(f"{name}{where}: llm_proposed must be false for a catalogue match")


def main():
    with open(ROOT / "data" / "catalogue.json", encoding="utf-8") as f:
        catalogue = {e["id"]: e for e in json.load(f)["entries"]}
    with open(ROOT / "fixtures" / "partners.json", encoding="utf-8") as f:
        partners = {p["partner_id"]: p for p in json.load(f)["partners"]}
    catalogue_ids = set(catalogue)
    partner_ids = set(partners)

    # 1. homes-me.json
    name = "homes-me.json"
    d = load(name)
    if d is not None and keys(name, d, "home"):
        keys(name, d["address"], "address", ".address")
        prof = d["profile"]
        if set(prof) != PROFILE_FIELDS:
            fail(f"{name}.profile: fields differ; missing {sorted(PROFILE_FIELDS - set(prof))}, extra {sorted(set(prof) - PROFILE_FIELDS)}")
        for k, v in prof.items():
            if keys(name, v, "profile_field", f".profile.{k}"):
                if v["source"] not in SOURCES:
                    fail(f"{name}.profile.{k}: bad source {v['source']!r}")
                if v["value"] == "unknown" and v["source"] != "none":
                    fail(f"{name}.profile.{k}: unknown value must have source none")
                if not isinstance(v["doubt"], bool):
                    fail(f"{name}.profile.{k}: doubt must be boolean")
        for i, doc in enumerate(d["documents"]):
            keys(name, doc, "document", f".documents[{i}]")

    # 2. documents-post.json
    name = "documents-post.json"
    d = load(name)
    if d is not None:
        keys(name, d, "documents_post")

    # 3-5. jobs
    for name, status in (("jobs-running.json", "running"), ("jobs-done.json", "done"), ("jobs-failed.json", "failed")):
        d = load(name)
        if d is None or not keys(name, d, "job"):
            continue
        if d["status"] != status:
            fail(f"{name}: status {d['status']!r}, expected {status!r}")
        if status == "running":
            if d["stage"] not in {"extracting", "matching", "writing"}:
                fail(f"{name}: bad stage {d['stage']!r}")
            if d["finished_at"] is not None or d["error"] is not None:
                fail(f"{name}: running job must have finished_at null and error null")
        else:
            if d["stage"] is not None:
                fail(f"{name}: stage must be null when not running")
            if d["finished_at"] is None:
                fail(f"{name}: finished_at must be set")
        if status == "failed":
            keys(name, d["error"], "job_error", ".error")
        elif d["error"] is not None:
            fail(f"{name}: error must be null")

    # 6. risks.json
    name = "risks.json"
    d = load(name)
    if d is not None and keys(name, d, "risk_list"):
        risks = d["risks"]
        if not 1 <= len(risks) <= 5:
            fail(f"{name}: expected 1 to 5 risks, got {len(risks)}")
        for i, r in enumerate(risks):
            check_risk(name, r, f".risks[{i}]", catalogue_ids, catalogue)
        products = [r.get("severity", 0) * r.get("probability", 0) for r in risks]
        if products != sorted(products, reverse=True):
            fail(f"{name}: risks not ordered by severity x probability descending: {products}")
        ids = [r.get("risk_id") for r in risks]
        if len(ids) != len(set(ids)):
            fail(f"{name}: duplicate risk_id")

    # 7. risk-detail.json
    name = "risk-detail.json"
    d = load(name)
    if d is not None:
        if not isinstance(d, dict):
            fail(f"{name}: expected object")
        else:
            expected = KEYS["risk"] | KEYS["risk_detail_extra"]
            if set(d) != expected:
                fail(f"{name}: keys differ; missing {sorted(expected - set(d))}, extra {sorted(set(d) - expected)}")
            else:
                base = {k: d[k] for k in KEYS["risk"]}
                check_risk(name, base, "", catalogue_ids, catalogue)
                for i, ev in enumerate(d["evidence"]):
                    keys(name, ev, "evidence", f".evidence[{i}]")
                keys(name, d["mitigation"], "mitigation", ".mitigation")
                ps = d["partners"]
                if len(ps) > 3:
                    fail(f"{name}: more than 3 partners")
                ratings = []
                for i, p in enumerate(ps):
                    if not keys(name, p, "partner", f".partners[{i}]"):
                        continue
                    keys(name, p["price_range"], "price_range", f".partners[{i}].price_range")
                    pid = p["partner_id"]
                    if pid not in partner_ids:
                        fail(f"{name}.partners[{i}]: partner_id {pid!r} not in partners.json")
                        continue
                    src = partners[pid]
                    if p["name"] != src["name"]:
                        fail(f"{name}.partners[{i}]: name differs from partners.json")
                    if d["partner_category"] not in src["categories"]:
                        fail(f"{name}.partners[{i}]: {pid} is not a {d['partner_category']}")
                    ratings.append(p["rating"])
                if ratings != sorted(ratings, reverse=True):
                    fail(f"{name}: partners not sorted by rating")

    # 8. work-orders-post.json, 9. work-orders.json
    def check_wo(name, wo, where):
        if not keys(name, wo, "work_order", where):
            return
        if wo["risk_id"] not in catalogue_ids:
            fail(f"{name}{where}: risk_id {wo['risk_id']!r} not in catalogue")
        if wo["partner_id"] not in partner_ids:
            fail(f"{name}{where}: partner_id {wo['partner_id']!r} not in partners.json")
        elif wo["risk_id"] in catalogue_ids:
            cat = catalogue[wo["risk_id"]]["mitigation"]["partner_category"]
            if cat not in partners[wo["partner_id"]]["categories"]:
                fail(f"{name}{where}: partner {wo['partner_id']} is not a {cat}")
        if wo["status"] not in {"booked", "confirmed"}:
            fail(f"{name}{where}: bad status {wo['status']!r}")

    name = "work-orders-post.json"
    d = load(name)
    if d is not None:
        check_wo(name, d, "")
        if isinstance(d, dict) and d.get("status") != "booked":
            fail(f"{name}: a new work order must be booked")

    name = "work-orders.json"
    d = load(name)
    if d is not None and keys(name, d, "work_order_list"):
        for i, wo in enumerate(d["work_orders"]):
            check_wo(name, wo, f".work_orders[{i}]")

    # 10. work-order-confirm.json
    name = "work-order-confirm.json"
    d = load(name)
    confirm_event = None
    if d is not None and keys(name, d, "confirm"):
        if d["status"] != "confirmed":
            fail(f"{name}: status must be confirmed")
        if keys(name, d["score_event"], "score_event", ".score_event"):
            confirm_event = d["score_event"]

    # 11. score.json
    name = "score.json"
    d = load(name)
    if d is not None and keys(name, d, "score"):
        keys(name, d["tier"], "tier", ".tier")
        keys(name, d["next_tier"], "next_tier", ".next_tier")
        keys(name, d["benefit"], "benefit", ".benefit")
        total = 0
        for i, b in enumerate(d["breakdown"]):
            if keys(name, b, "breakdown_item", f".breakdown[{i}]"):
                if b["risk_id"] not in catalogue_ids:
                    fail(f"{name}.breakdown[{i}]: risk_id {b['risk_id']!r} not in catalogue")
                elif b["points"] != catalogue[b["risk_id"]]["points"]:
                    fail(f"{name}.breakdown[{i}]: points differ from catalogue")
                total += b["decayed_points"]
        if d["score"] != 1000 + total:
            fail(f"{name}: score {d['score']} != 1000 + decayed points {total}")
        for i, h in enumerate(d["history"]):
            keys(name, h, "history_item", f".history[{i}]")
        if isinstance(d["tier"], dict) and isinstance(d["next_tier"], dict):
            if d["tier"].get("min_score", 0) > d["score"]:
                fail(f"{name}: score below tier min_score")
            if d["next_tier"].get("min_score", 0) - d["score"] != d["next_tier"].get("points_needed"):
                fail(f"{name}: points_needed does not equal next_tier.min_score - score")
        if confirm_event is not None:
            ids = {h.get("event_id") for h in d["history"] if isinstance(h, dict)}
            if confirm_event["event_id"] not in ids:
                fail(f"{name}: history lacks the confirm event {confirm_event['event_id']}")
            if d["score"] != confirm_event["score_after"]:
                fail(f"{name}: score differs from confirm score_after")

    # 12. maintenance.json
    name = "maintenance.json"
    d = load(name)
    if d is not None and keys(name, d, "maintenance_list"):
        dues = []
        for i, m in enumerate(d["items"]):
            if not keys(name, m, "maintenance_item", f".items[{i}]"):
                continue
            if m["risk_id"] not in catalogue_ids:
                fail(f"{name}.items[{i}]: risk_id {m['risk_id']!r} not in catalogue")
            else:
                entry = catalogue[m["risk_id"]]
                if m["interval_years"] != entry["check_interval_years"]:
                    fail(f"{name}.items[{i}]: interval_years differs from catalogue check_interval_years")
                if m["partner_category"] != entry["mitigation"]["partner_category"]:
                    fail(f"{name}.items[{i}]: partner_category differs from catalogue")
            if m["status"] not in {"overdue", "upcoming", "scheduled"}:
                fail(f"{name}.items[{i}]: bad status {m['status']!r}")
            if len(m["due_at"]) != 10:
                fail(f"{name}.items[{i}]: due_at must be YYYY-MM-DD")
            dues.append(m["due_at"])
        if dues != sorted(dues):
            fail(f"{name}: items not sorted by due_at")

    # 13. error-409.json
    name = "error-409.json"
    d = load(name)
    if d is not None and keys(name, d, "error_envelope"):
        if keys(name, d["error"], "error", ".error"):
            if d["error"]["code"] != "already_confirmed":
                fail(f"{name}: code must be already_confirmed")

    if errors:
        for e in errors:
            print("FAIL", e)
        print(f"{len(errors)} problem(s)")
        return 1
    print("fixtures/api: 13 files OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
