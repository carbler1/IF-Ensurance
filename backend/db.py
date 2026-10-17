"""Opens SQLite through SQLAlchemy, creates the tables, seeds home_01. DESIGN.md §5.
The tables are the models in models.py."""

import json
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import Engine, create_engine, event, select
from sqlalchemy.orm import Session

from backend.models import Base, Home, Partner, Profile, Tier

ROOT = Path(__file__).resolve().parent.parent
VAR = ROOT / "var"
DB_PATH = VAR / "ilp.sqlite"
UPLOADS = VAR / "uploads"

_engines: dict[Path, Engine] = {}


def _engine() -> Engine:
    """One engine per database file. Tests point DB_PATH at a temporary file."""
    if DB_PATH not in _engines:
        engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"timeout": 5})

        @event.listens_for(engine, "connect")
        def _pragmas(dbapi_conn, _):
            cur = dbapi_conn.cursor()
            cur.execute("PRAGMA journal_mode=WAL")
            cur.execute("PRAGMA busy_timeout=5000")
            cur.execute("PRAGMA foreign_keys=ON")
            cur.close()

        Base.metadata.create_all(engine)
        _engines[DB_PATH] = engine
    return _engines[DB_PATH]


def connect() -> Session:
    """A new session. The caller closes it (or uses it in a with block)."""
    UPLOADS.mkdir(parents=True, exist_ok=True)
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    return Session(_engine())


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def seed(s: Session) -> None:
    """Create home_01 (Esimerkkikatu 3, 20100 Turku) with every profile field "unknown".
    Copy the mock partners and tiers into their tables the first time."""
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
    for t in json.loads((ROOT / "fixtures" / "score-tiers.json").read_text())["tiers"]:
        add_missing(Tier, t["index"], Tier(
            tier_index=t["index"], name=t["name"], min_score=t["min_score"],
            deductible_reduction_eur=t["deductible_reduction_eur"], free_checkups=json.dumps(t["free_checkups"]),
            partner_discount_percent=t["partner_discount_percent"], updated_at=now))
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
    """A tier in the fixtures/score-tiers.json shape."""
    return {
        "index": t.tier_index,
        "name": t.name,
        "min_score": t.min_score,
        "deductible_reduction_eur": t.deductible_reduction_eur,
        "free_checkups": json.loads(t.free_checkups),
        "partner_discount_percent": t.partner_discount_percent,
    }


def partners(s: Session) -> list[dict]:
    """All partners in the fixtures/partners.json shape."""
    return [partner_dict(p) for p in s.scalars(select(Partner).order_by(Partner.partner_id))]


def tiers(s: Session) -> list[dict]:
    """All tiers in the fixtures/score-tiers.json shape."""
    return [tier_dict(t) for t in s.scalars(select(Tier).order_by(Tier.tier_index))]


if __name__ == "__main__":
    with connect() as session:
        seed(session)
