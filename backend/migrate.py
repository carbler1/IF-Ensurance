"""Bring the database to the newest Alembic revision. The container runs this once at start,
before the API and the worker (backend/entrypoint.sh). Run by hand: python -m backend.migrate

A database that the old create_all built already has the tables but no alembic_version. It is
stamped at the first revision (whose schema it has) and then upgraded, instead of failing on
"table already exists"."""

from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect

from backend.db import _url

FIRST_REVISION = "e2ce4faa346e"  # initial schema


def main() -> None:
    cfg = Config(str(Path(__file__).with_name("alembic.ini")))
    engine = create_engine(_url())
    tables = set(inspect(engine).get_table_names())
    engine.dispose()
    if "homes" in tables and "alembic_version" not in tables:
        command.stamp(cfg, FIRST_REVISION)
    command.upgrade(cfg, "head")


if __name__ == "__main__":
    main()
