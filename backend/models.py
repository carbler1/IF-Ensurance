"""The database tables as SQLAlchemy 2.0 models. DESIGN.md §5. db.py creates them with
Base.metadata.create_all; there is no SQL schema file. The database is Postgres in docker
compose (DATABASE_URL) and a SQLite file otherwise. To reset: drop the database and seed again.
The staff dashboard (frontend/src/db/schema.ts) reads and writes these tables directly;
keep its copy of a table in step when you change one here.

Times are ISO 8601 UTC strings and JSON columns are text.
"""

from sqlalchemy import REAL, ForeignKey, Integer, Text, create_engine, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Home(Base):
    __tablename__ = "homes"

    home_id: Mapped[str] = mapped_column(Text, primary_key=True)
    street: Mapped[str] = mapped_column(Text)
    postal_code: Mapped[str] = mapped_column(Text)
    city: Mapped[str] = mapped_column(Text)
    created_at: Mapped[str] = mapped_column(Text)


class Profile(Base):
    __tablename__ = "profiles"

    home_id: Mapped[str] = mapped_column(Text, ForeignKey("homes.home_id"), primary_key=True)
    profile: Mapped[str] = mapped_column(Text)  # JSON, the 20 fields of data/home-profile.schema.json
    updated_at: Mapped[str] = mapped_column(Text)


class Document(Base):
    __tablename__ = "documents"

    document_id: Mapped[str] = mapped_column(Text, primary_key=True)
    home_id: Mapped[str] = mapped_column(Text, ForeignKey("homes.home_id"))
    type: Mapped[str] = mapped_column(Text)
    uploaded_at: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text)  # queued, processed, failed


class Job(Base):
    __tablename__ = "jobs"

    job_id: Mapped[str] = mapped_column(Text, primary_key=True)
    document_id: Mapped[str] = mapped_column(Text, ForeignKey("documents.document_id"))
    status: Mapped[str] = mapped_column(Text)  # queued, running, done, failed
    stage: Mapped[str | None] = mapped_column(Text)  # extracting, matching, writing
    started_at: Mapped[str | None] = mapped_column(Text)
    finished_at: Mapped[str | None] = mapped_column(Text)
    error: Mapped[str | None] = mapped_column(Text)
    queued_at: Mapped[str | None] = mapped_column(Text)  # the worker takes the oldest queued job first


class RiskText(Base):
    __tablename__ = "risk_texts"

    home_id: Mapped[str] = mapped_column(Text, ForeignKey("homes.home_id"), primary_key=True)
    risk_id: Mapped[str] = mapped_column(Text, primary_key=True)
    why: Mapped[str] = mapped_column(Text)
    benefit: Mapped[str] = mapped_column(Text)
    llm_proposed: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    generated_at: Mapped[str] = mapped_column(Text)


# Maybe: booking, confirm, score.
class WorkOrder(Base):
    __tablename__ = "work_orders"

    work_order_id: Mapped[str] = mapped_column(Text, primary_key=True)
    home_id: Mapped[str] = mapped_column(Text, ForeignKey("homes.home_id"))
    risk_id: Mapped[str] = mapped_column(Text)
    partner_id: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text)  # booked, confirmed
    created_at: Mapped[str] = mapped_column(Text)
    confirmed_at: Mapped[str | None] = mapped_column(Text)


class ScoreEvent(Base):
    __tablename__ = "score_events"

    event_id: Mapped[str] = mapped_column(Text, primary_key=True)
    home_id: Mapped[str] = mapped_column(Text, ForeignKey("homes.home_id"))
    at: Mapped[str] = mapped_column(Text)
    delta: Mapped[int] = mapped_column(Integer)
    reason: Mapped[str] = mapped_column(Text)
    work_order_id: Mapped[str | None] = mapped_column(Text, ForeignKey("work_orders.work_order_id"))


# Editable by If staff in the dashboard. Seeded once from fixtures/partners.json
# and fixtures/score-tiers.json; after that the database is the source.
class Partner(Base):
    __tablename__ = "partners"

    partner_id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    categories: Mapped[str] = mapped_column(Text)  # JSON list of partner categories
    area: Mapped[str] = mapped_column(Text)
    price_min: Mapped[int] = mapped_column(Integer)  # euros
    price_max: Mapped[int] = mapped_column(Integer)  # euros
    rating: Mapped[float] = mapped_column(REAL)
    if_vetted: Mapped[int] = mapped_column(Integer)
    tier_discount_percent: Mapped[int] = mapped_column(Integer)
    listing_fee_tier: Mapped[str] = mapped_column(Text)
    updated_at: Mapped[str] = mapped_column(Text)


class Tier(Base):
    __tablename__ = "tiers"

    tier_index: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    name: Mapped[str] = mapped_column(Text)
    min_score: Mapped[int] = mapped_column(Integer)
    deductible_reduction_eur: Mapped[int] = mapped_column(Integer)
    free_checkups: Mapped[str] = mapped_column(Text)  # JSON list of checkup kinds
    partner_discount_percent: Mapped[int] = mapped_column(Integer)
    updated_at: Mapped[str] = mapped_column(Text)


# Score and price math, set by If staff in the dashboard. Code picks the rule; a model never does.
class FixRule(Base):
    """What one catalogue fix is worth in one context. For a home, the active rule with the
    highest priority whose context matches the profile wins. context is null for "any home",
    else a condition in the catalogue's applies_when grammar (scripts/catalogue/validate.py)."""

    __tablename__ = "fix_rules"

    rule_id: Mapped[str] = mapped_column(Text, primary_key=True)
    risk_id: Mapped[str] = mapped_column(Text)  # catalogue entry id
    label: Mapped[str] = mapped_column(Text)
    context: Mapped[str | None] = mapped_column(Text)  # JSON condition, or null for any home
    priority: Mapped[int] = mapped_column(Integer)  # higher wins; the default rule is 0
    points: Mapped[int] = mapped_column(Integer)  # Care Score points when the fix is confirmed
    half_life_years: Mapped[int] = mapped_column(Integer)  # the points halve every this many years
    premium_reduction_eur: Mapped[int] = mapped_column(Integer)  # yearly premium cut, euros
    active: Mapped[int] = mapped_column(Integer)
    updated_at: Mapped[str] = mapped_column(Text)


class InsuranceSettings(Base):
    """One row (settings_id 1): the global numbers of the score and the premium."""

    __tablename__ = "insurance_settings"

    settings_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    score_start: Mapped[int] = mapped_column(Integer)  # Care Score of a new home
    base_annual_premium_eur: Mapped[int] = mapped_column(Integer)
    max_reduction_percent: Mapped[int] = mapped_column(Integer)  # cap on the sum of fix reductions
    updated_at: Mapped[str] = mapped_column(Text)


class ReferenceData(Base):
    """Copies of the static files the dashboard needs (the catalogue, the profile schema),
    refreshed from data/ each time the backend starts. The files stay the source."""

    __tablename__ = "reference_data"

    key: Mapped[str] = mapped_column(Text, primary_key=True)  # catalogue, profile_schema
    data: Mapped[str] = mapped_column(Text)  # JSON
    updated_at: Mapped[str] = mapped_column(Text)


if __name__ == "__main__":
    # Print the CREATE TABLE statements.
    from sqlalchemy.schema import CreateTable

    engine = create_engine("sqlite://")
    for table in Base.metadata.sorted_tables:
        print(str(CreateTable(table).compile(engine)).strip() + ";\n")
