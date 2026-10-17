"""The database tables as SQLAlchemy 2.0 models. DESIGN.md §5. db.py creates them with
Base.metadata.create_all; there is no SQL schema file. To reset: delete var/ and seed again.

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


# Editable by If staff through /v1/admin. Seeded once from fixtures/partners.json
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


if __name__ == "__main__":
    # Print the CREATE TABLE statements.
    from sqlalchemy.schema import CreateTable

    engine = create_engine("sqlite://")
    for table in Base.metadata.sorted_tables:
        print(str(CreateTable(table).compile(engine)).strip() + ";\n")
