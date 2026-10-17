"""Opens SQLite, creates the tables, seeds home_01. DESIGN.md §5."""

import sqlite3
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
    raise NotImplementedError
