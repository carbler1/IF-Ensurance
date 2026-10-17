"""GET /homes/me/maintenance. DESIGN.md §7. Code decides every date."""

import json
import re
import sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts" / "catalogue"))
from validate import matches  # noqa: E402

from sqlalchemy import func, select  # noqa: E402

from backend.models import Home, Profile, WorkOrder  # noqa: E402

_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}")


def _add_years(d, n):
    try:
        return d.replace(year=d.year + n)
    except ValueError:  # 29 Feb in a non-leap year
        return d.replace(year=d.year + n, day=28)


def maintenance(s, home_id, today=None):
    today = today or date.today()
    created = date.fromisoformat(s.get(Home, home_id).created_at[:10])
    profile = json.loads(s.get(Profile, home_id).profile)
    entries = json.loads((ROOT / "data" / "catalogue.json").read_text())["entries"]
    rows = []
    for e in entries:
        if not matches(e["applies_when"], profile):
            continue
        base = None
        w = s.scalar(select(func.max(WorkOrder.confirmed_at)).where(
            WorkOrder.home_id == home_id, WorkOrder.risk_id == e["id"], WorkOrder.status == "confirmed",
            WorkOrder.confirmed_at.is_not(None)))
        if w:
            base = date.fromisoformat(w[:10])
        else:
            v = profile.get(e["on_done"]["field"])
            v = v.get("value") if isinstance(v, dict) else v
            if isinstance(v, str) and _DATE.match(v):
                base = date.fromisoformat(v[:10])
            elif isinstance(v, int) and not isinstance(v, bool):
                base = date(v, 1, 1)
        n = e["check_interval_years"]
        due = max(_add_years(base, n) if base else created, created)
        status = "overdue" if due < today else "upcoming" if due <= today + timedelta(days=90) else "scheduled"
        rows.append((due, e["id"], {"risk_id": e["id"], "title": e["mitigation"]["action"], "due_at": due.isoformat(),
                                    "interval_years": n, "status": status,
                                    "partner_category": e["mitigation"]["partner_category"]}))
    rows.sort(key=lambda r: (r[0], r[1]))
    return {"items": [{"item_id": f"mt_{i:02d}", **r[2]} for i, r in enumerate(rows, 1)]}
