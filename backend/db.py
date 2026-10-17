"""Opens the database through SQLAlchemy, creates the tables, seeds home_01. DESIGN.md §5.
The tables are the models in models.py.

DATABASE_URL picks the database: Postgres in docker compose, for example
postgresql+psycopg://user:password@postgres:5432/ilp, with the schema from the Alembic migrations
in backend/migrations/. Without it, a SQLite file at DB_PATH (local runs and the tests), built
straight from the models."""

import json
import os
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import Engine, create_engine, event, select
from sqlalchemy.orm import Session

from backend.models import (Base, Customer, DiscountBand, FixRule, Home, InsuranceClass, InsuranceSettings, InsuredObject,
                            Partner, Profile, Tier)

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
    """Create home_01 (Esimerkkikatu 3, 20100 Turku) with every profile field "unknown", the demo
    customer with a house, a cottage, a boat, a car and a dog, and the mock partners, tiers,
    insurance classes and fix rules. Rows that exist stay as they are."""
    now = now_iso()
    props = json.loads((ROOT / "data" / "home-profile.schema.json").read_text())["properties"]
    unknown = {"value": "unknown", "confidence": 0, "source": "none", "evidence": None, "doubt": False}
    profile = {name: dict(unknown) for name in props}

    def add_missing(model, key, row):
        if s.get(model, key) is None:
            s.add(row)

    add_missing(Home, "home_01", Home(home_id="home_01", street="Esimerkkikatu 3", postal_code="20100",
                                      city="Turku", created_at=now))
    s.flush()  # the profile references the home
    add_missing(Profile, "home_01", Profile(home_id="home_01", profile=json.dumps(profile), updated_at=now))
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
    add_missing(InsuranceSettings, 1, InsuranceSettings(
        settings_id=1, insurance_score_start=model["insurance_score_start"], max_score=model["max_score"], updated_at=now))
    other = json.loads((ROOT / "data" / "insurance-classes.json").read_text())
    names = {"house": "House", **{c["class_id"]: c["name"] for c in other["classes"]}}
    for class_id, premium in other["base_premiums_eur"].items():
        add_missing(InsuranceClass, class_id, InsuranceClass(
            class_id=class_id, name=names[class_id], base_annual_premium_eur=premium, updated_at=now))
    cust = other["demo_customer"]
    add_missing(Customer, cust["customer_id"], Customer(customer_id=cust["customer_id"], name=cust["name"], created_at=now))
    s.flush()  # objects reference the customer and the classes
    for o in cust["objects"]:
        add_missing(InsuredObject, o["object_id"], InsuredObject(
            object_id=o["object_id"], customer_id=cust["customer_id"], class_id=o["class_id"], name=o["name"],
            profile=json.dumps(o["profile"]) if "profile" in o else None, history=json.dumps(o.get("history", [])),
            created_at=now))

    entries = json.loads((ROOT / "data" / "catalogue.json").read_text())["entries"]
    entries += [r for c in other["classes"] for r in c["risks"]]
    half_lives = json.loads((ROOT / "fixtures" / "half-lives.json").read_text())["defaults"]
    for e in entries:
        add_missing(FixRule, f"default.{e['id']}", FixRule(
            rule_id=f"default.{e['id']}", risk_id=e["id"], label="Default", context=None, priority=0,
            points=e["points"], half_life_years=e.get("half_life_years") or half_lives.get(e["category"], 5),
            active=1, updated_at=now))
    # One example of a context rule, so the dashboard shows how a context changes the value.
    add_missing(FixRule, "example.elec_check_pre1970", FixRule(
        rule_id="example.elec_check_pre1970", risk_id="elec.check.overdue", label="Houses built before 1970",
        context=json.dumps({"op": "lt", "field": "building_year", "value": 1970}), priority=10,
        points=110, half_life_years=10, active=1, updated_at=now))
    s.commit()


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
