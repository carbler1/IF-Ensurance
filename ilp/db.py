"""Opens SQLite, creates the tables, seeds home_01. DESIGN.md §5."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VAR = ROOT / "var"
DB_PATH = VAR / "ilp.sqlite"
UPLOADS = VAR / "uploads"


def connect():
    raise NotImplementedError


def seed(conn) -> None:
    """Create home_01 (Esimerkkikatu 3, 20100 Turku) with every profile field "unknown"."""
    raise NotImplementedError
