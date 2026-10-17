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


def seed(conn) -> None:
    """Create home_01 (Esimerkkikatu 3, 20100 Turku) with every profile field "unknown"."""
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    props = json.loads((ROOT / "data" / "home-profile.schema.json").read_text())["properties"]
    unknown = {"value": "unknown", "confidence": 0, "source": "none", "evidence": None, "doubt": False}
    profile = {name: dict(unknown) for name in props}
    with conn:
        conn.execute(
            "INSERT OR IGNORE INTO homes VALUES ('home_01', 'Esimerkkikatu 3', '20100', 'Turku', ?)", (now,))
        conn.execute(
            "INSERT OR IGNORE INTO profiles VALUES ('home_01', ?, ?)", (json.dumps(profile), now))


if __name__ == "__main__":
    seed(connect())
