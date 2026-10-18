"""Opens the database through SQLAlchemy, creates the tables, seeds home_01. docs/DESIGN.md §7.
The tables are the models in models.py.

DATABASE_URL picks the database: Postgres in docker compose, for example
postgresql+psycopg://user:password@postgres:5432/ilp, with the schema from the Alembic migrations
in backend/migrations/. Without it, a SQLite file at DB_PATH (local runs and the tests), built
straight from the models."""

import json
import os
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import Engine, create_engine, delete, event, select
from sqlalchemy.orm import Session

from backend.models import (AssignedRisk, Base, Bid, Booking, Customer, DiscountBand, FixRule, Home, InsuranceClass,
                            InsuranceSettings, InsuredObject, MaintenanceTask, Partner, Profile, Reminder, Tier)

ROOT = Path(__file__).resolve().parent.parent
VAR = ROOT / "var"
DB_PATH = VAR / "ilp.sqlite"
UPLOADS = VAR / "uploads"

_engines: dict[str, Engine] = {}


def _url() -> str:
    return os.environ.get("DATABASE_URL") or f"sqlite:///{DB_PATH}"


def _engine() -> Engine:
    """One engine per database URL. Tests point DB_PATH at a temporary SQLite file."""
    url = _url()
    if url not in _engines:
        if url.startswith("sqlite"):
            DB_PATH.parent.mkdir(parents=True, exist_ok=True)
            engine = create_engine(url, connect_args={"timeout": 5})

            @event.listens_for(engine, "connect")
            def _pragmas(dbapi_conn, _):
                cur = dbapi_conn.cursor()
                cur.execute("PRAGMA journal_mode=WAL")
                cur.execute("PRAGMA busy_timeout=5000")
                cur.execute("PRAGMA foreign_keys=ON")
                cur.close()
            # Local runs and the tests: build the tables straight from the models.
            Base.metadata.create_all(engine)
        else:
            # Postgres: Alembic owns the schema (backend/migrate.py runs before the API and the worker).
            engine = create_engine(url, pool_pre_ping=True)
        _engines[url] = engine
    return _engines[url]


def connect() -> Session:
    """A new session. The caller closes it (or uses it in a with block)."""
    UPLOADS.mkdir(parents=True, exist_ok=True)
    return Session(_engine())


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def seed(s: Session) -> None:
    """Create the static mock data the first time: partners, the score model, the insurance classes
    and the fix rules. Rows that exist stay as they are, so edits made in the dashboard survive.
    Then refresh the demo customer from data/demo-person.json (sync_demo_person)."""
    now = now_iso()

    def add_missing(model, key, row):
        if s.get(model, key) is None:
            s.add(row)

    for p in json.loads((ROOT / "fixtures" / "partners.json").read_text())["partners"]:
        add_missing(Partner, p["partner_id"], Partner(
            partner_id=p["partner_id"], name=p["name"], categories=json.dumps(p["categories"]), area=p["area"],
            price_min=p["price_range"]["min"], price_max=p["price_range"]["max"], rating=p["rating"],
            if_vetted=int(p["if_vetted"]), tier_discount_percent=p["tier_discount_percent"],
            listing_fee_tier=p["listing_fee_tier"], updated_at=now))
    # The score model (data/score-model.json): insurance scores, discount bands, aggregate tiers. Mock numbers.
    model = json.loads((ROOT / "data" / "score-model.json").read_text())
    for t in model["tiers"]:
        add_missing(Tier, t["index"], Tier(
            tier_index=t["index"], name=t["name"], min_score=t["min_score"],
            partner_discount_percent=t["partner_discount_percent"], bonuses=json.dumps(t["bonuses"]), updated_at=now))
    for b in model["bands"]:
        add_missing(DiscountBand, b["min_score"], DiscountBand(min_score=b["min_score"], percent=b["percent"], updated_at=now))
    demo = json.loads((ROOT / "data" / "demo-person.json").read_text())
    add_missing(InsuranceSettings, 1, InsuranceSettings(
        settings_id=1, insurance_score_start=model["insurance_score_start"], max_score=model["max_score"],
        inspection_price_factor=demo["inspection_price_factor"], updated_at=now))
    other = json.loads((ROOT / "data" / "insurance-classes.json").read_text())
    names = {"house": "House", **{c["class_id"]: c["name"] for c in other["classes"]}}
    for class_id, premium in other["base_premiums_eur"].items():
        add_missing(InsuranceClass, class_id, InsuranceClass(
            class_id=class_id, name=names[class_id], base_annual_premium_eur=premium, updated_at=now))
    s.flush()

    entries = json.loads((ROOT / "data" / "catalogue.json").read_text())["entries"]
    entries += [{"id": r["risk_id"], "points": r["points"], "category": r["area"]} for r in demo["risks"]]
    half_lives = json.loads((ROOT / "fixtures" / "half-lives.json").read_text())["defaults"]
    for e in entries:
        add_missing(FixRule, f"default.{e['id']}", FixRule(
            rule_id=f"default.{e['id']}", risk_id=e["id"], label="Default", context=None, priority=0,
            points=e["points"], half_life_years=e.get("half_life_years") or half_lives.get(e["category"], 5),
            active=1, updated_at=now))
    # Default rules of risks that no longer exist (an older demo data set) would only clutter the dashboard.
    known = {f"default.{e['id']}" for e in entries}
    s.execute(delete(FixRule).where(FixRule.rule_id.like("default.%"), FixRule.rule_id.not_in(known)))
    # One example of a context rule, so the dashboard shows how a context changes the value.
    add_missing(FixRule, "example.elec_check_pre1970", FixRule(
        rule_id="example.elec_check_pre1970", risk_id="elec.check.overdue", label="Houses built before 1970",
        context=json.dumps({"op": "lt", "field": "building_year", "value": 1970}), priority=10,
        points=110, half_life_years=10, active=1, updated_at=now))
    s.commit()
    sync_demo_person(s, demo)


def sync_demo_person(s: Session, demo: dict | None = None) -> None:
    """Make the demo customer exactly what data/demo-person.json says: who they are, their home,
    their five insured objects, the risks the app shows, the partner bids and the maintenance tasks.
    Bookings and reminders are the app's runtime state and stay (reset_demo clears them)."""
    demo = demo or json.loads((ROOT / "data" / "demo-person.json").read_text())
    now = now_iso()
    cust, home = demo["customer"], demo["home"]
    c = s.get(Customer, cust["customer_id"])
    new_customer = c is None
    if new_customer:
        s.add(Customer(customer_id=cust["customer_id"], name=cust["name"], created_at=now))
    else:
        c.name = cust["name"]

    h = s.get(Home, home["home_id"])
    if h is None:
        s.add(Home(home_id=home["home_id"], street=home["street"], postal_code=home["postal_code"], city=home["city"], created_at=now))
    else:
        h.street, h.postal_code, h.city = home["street"], home["postal_code"], home["city"]
    s.flush()
    if s.get(Profile, home["home_id"]) is None:
        # The pipeline fills the house profile from an uploaded report; it starts all "unknown".
        props = json.loads((ROOT / "data" / "home-profile.schema.json").read_text())["properties"]
        unknown = {"value": "unknown", "confidence": 0, "source": "none", "evidence": None, "doubt": False}
        s.add(Profile(home_id=home["home_id"], profile=json.dumps({n: dict(unknown) for n in props}), updated_at=now))

    details = {"house": {k: home[k] for k in ("address", "type", "year", "size", "heating")}}
    for o in demo["objects"]:
        row = s.get(InsuredObject, o["object_id"])
        values = dict(customer_id=cust["customer_id"], class_id=o["class_id"], name=o["name"],
                      profile=json.dumps(o["profile"]) if "profile" in o else None,
                      history=json.dumps(o["history"]), details=json.dumps(details.get(o["class_id"], {})))
        if row is None:
            s.add(InsuredObject(object_id=o["object_id"], created_at=now, **values))
        else:
            for k, v in values.items():
                setattr(row, k, v)
    s.flush()

    def replace_all(model, key: str, rows: list[dict], scope=None):
        """Upsert these rows and delete the model's other rows (within scope)."""
        ids = [r[key] for r in rows]
        q = delete(model).where(getattr(model, key).not_in(ids))
        s.execute(q.where(scope) if scope is not None else q)
        for r in rows:
            s.merge(model(**r))

    object_ids = [o["object_id"] for o in demo["objects"]]
    replace_all(AssignedRisk, "risk_id", [{k: r[k] for k in ("risk_id", "object_id", "area", "title", "why", "explain", "fix", "diy", "sort_order")}
                                          for r in demo["risks"]], AssignedRisk.object_id.in_(object_ids))
    replace_all(Bid, "bid_id", demo["bids"])
    s.execute(delete(Reminder).where(Reminder.task_id.not_in([t["task_id"] for t in demo["tasks"]])))
    replace_all(MaintenanceTask, "task_id", [{**t, "customer_id": cust["customer_id"]} for t in demo["tasks"]],
                MaintenanceTask.customer_id == cust["customer_id"])
    s.flush()
    if new_customer:
        for task_id in demo["reminders"]:
            s.add(Reminder(customer_id=cust["customer_id"], task_id=task_id))
    s.commit()


def reset_demo(s: Session) -> None:
    """Restore the whole demo: clear bookings and reminders, drop the dashboard-editable tables
    (partners, tiers, discount bands, insurance settings, fix rules), then seed them again."""
    demo = json.loads((ROOT / "data" / "demo-person.json").read_text())
    cid = demo["customer"]["customer_id"]
    s.execute(delete(Booking).where(Booking.customer_id == cid))
    s.execute(delete(Reminder).where(Reminder.customer_id == cid))
    s.add_all(Reminder(customer_id=cid, task_id=t) for t in demo["reminders"])
    for m in (Partner, Tier, DiscountBand, InsuranceSettings, FixRule):
        s.execute(delete(m))
    s.commit()
    seed(s)


def partner_dict(p: Partner) -> dict:
    """A partner in the fixtures/partners.json shape."""
    return {
        "partner_id": p.partner_id,
        "name": p.name,
        "categories": json.loads(p.categories),
        "area": p.area,
        "price_range": {"min": p.price_min, "max": p.price_max},
        "rating": p.rating,
        "if_vetted": bool(p.if_vetted),
        "tier_discount_percent": p.tier_discount_percent,
        "listing_fee_tier": p.listing_fee_tier,
    }


def tier_dict(t: Tier) -> dict:
    """A tier in the data/score-model.json shape."""
    return {
        "index": t.tier_index,
        "name": t.name,
        "min_score": t.min_score,
        "partner_discount_percent": t.partner_discount_percent,
        "bonuses": json.loads(t.bonuses),
    }


def fix_rules(s: Session) -> list[FixRule]:
    """All active fix rules, highest priority first (ties by rule_id)."""
    return list(s.scalars(select(FixRule).where(FixRule.active == 1)
                          .order_by(FixRule.priority.desc(), FixRule.rule_id)))


def settings(s: Session) -> InsuranceSettings:
    return s.get(InsuranceSettings, 1)


def partners(s: Session) -> list[dict]:
    """All partners in the fixtures/partners.json shape."""
    return [partner_dict(p) for p in s.scalars(select(Partner).order_by(Partner.partner_id))]


def tiers(s: Session) -> list[dict]:
    """All tiers in the data/score-model.json shape, lowest first."""
    return [tier_dict(t) for t in s.scalars(select(Tier).order_by(Tier.tier_index))]


def bands(s: Session) -> list[dict]:
    """The discount bands, lowest first: [{min_score, percent}]."""
    return [{"min_score": b.min_score, "percent": b.percent}
            for b in s.scalars(select(DiscountBand).order_by(DiscountBand.min_score))]


if __name__ == "__main__":
    with connect() as session:
        seed(session)
