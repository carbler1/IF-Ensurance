"""Opens SQLite, creates the tables, seeds home_01. DESIGN.md §5."""

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VAR = ROOT / "var"
DB_PATH = VAR / "ilp.sqlite"
UPLOADS = VAR / "uploads"


def connect() -> sqlite3.Connection:
    UPLOADS.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=5)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    conn.execute("PRAGMA foreign_keys=ON")
    conn.executescript((Path(__file__).parent / "schema.sql").read_text())
    return conn


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def seed(conn) -> None:
    """Create home_01 (Esimerkkikatu 3, 20100 Turku) with every profile field "unknown".
    Copy the mock partners and tiers into their tables the first time."""
    now = now_iso()
    props = json.loads((ROOT / "data" / "home-profile.schema.json").read_text())["properties"]
    unknown = {"value": "unknown", "confidence": 0, "source": "none", "evidence": None, "doubt": False}
    profile = {name: dict(unknown) for name in props}
    with conn:
        conn.execute(
            "INSERT OR IGNORE INTO homes VALUES ('home_01', 'Esimerkkikatu 3', '20100', 'Turku', ?)", (now,))
        conn.execute(
            "INSERT OR IGNORE INTO profiles VALUES ('home_01', ?, ?)", (json.dumps(profile), now))
        for p in json.loads((ROOT / "fixtures" / "partners.json").read_text())["partners"]:
            conn.execute(
                "INSERT OR IGNORE INTO partners VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                (p["partner_id"], p["name"], json.dumps(p["categories"]), p["area"], p["price_range"]["min"],
                 p["price_range"]["max"], p["rating"], int(p["if_vetted"]), p["tier_discount_percent"],
                 p["listing_fee_tier"], now))
        for t in json.loads((ROOT / "fixtures" / "score-tiers.json").read_text())["tiers"]:
            conn.execute(
                "INSERT OR IGNORE INTO tiers VALUES (?,?,?,?,?,?,?)",
                (t["index"], t["name"], t["min_score"], t["deductible_reduction_eur"],
                 json.dumps(t["free_checkups"]), t["partner_discount_percent"], now))


def partners(conn) -> list[dict]:
    """All partners in the fixtures/partners.json shape."""
    return [{
        "partner_id": r["partner_id"],
        "name": r["name"],
        "categories": json.loads(r["categories"]),
        "area": r["area"],
        "price_range": {"min": r["price_min"], "max": r["price_max"]},
        "rating": r["rating"],
        "if_vetted": bool(r["if_vetted"]),
        "tier_discount_percent": r["tier_discount_percent"],
        "listing_fee_tier": r["listing_fee_tier"],
    } for r in conn.execute("SELECT * FROM partners ORDER BY partner_id")]


def tiers(conn) -> list[dict]:
    """All tiers in the fixtures/score-tiers.json shape."""
    return [{
        "index": r["tier_index"],
        "name": r["name"],
        "min_score": r["min_score"],
        "deductible_reduction_eur": r["deductible_reduction_eur"],
        "free_checkups": json.loads(r["free_checkups"]),
        "partner_discount_percent": r["partner_discount_percent"],
    } for r in conn.execute("SELECT * FROM tiers ORDER BY tier_index")]


if __name__ == "__main__":
    seed(connect())
