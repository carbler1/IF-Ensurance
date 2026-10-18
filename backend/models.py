"""The database tables as SQLAlchemy 2.0 models. docs/DESIGN.md §7. On Postgres (docker compose,
DATABASE_URL) the Alembic migrations in backend/migrations/ build the schema; after a change here,
add one: alembic -c backend/alembic.ini revision --autogenerate -m "...". A SQLite file (local
runs, tests) is built straight from these models. To reset: drop the database and seed again.
Only the backend touches the database; the staff dashboard goes through /v1/admin.

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
    min_score: Mapped[int] = mapped_column(Integer)  # aggregate score (average of the insurance scores)
    partner_discount_percent: Mapped[int] = mapped_column(Integer)
    bonuses: Mapped[str] = mapped_column(Text)  # JSON list of display texts; they change no price
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
    points: Mapped[int] = mapped_column(Integer)  # added to the insurance's score when the fix is confirmed
    half_life_years: Mapped[int] = mapped_column(Integer)  # the points halve every this many years
    active: Mapped[int] = mapped_column(Integer)
    updated_at: Mapped[str] = mapped_column(Text)


class InsuranceSettings(Base):
    """One row (settings_id 1): the global numbers of the insurance scores."""

    __tablename__ = "insurance_settings"

    settings_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    insurance_score_start: Mapped[int] = mapped_column(Integer)  # score of a new insurance
    max_score: Mapped[int] = mapped_column(Integer)  # an insurance score never goes above this
    inspection_price_factor: Mapped[float] = mapped_column(REAL, server_default=text("0.45"))  # DIY check vs full fix price
    updated_at: Mapped[str] = mapped_column(Text)


class DiscountBand(Base):
    """From min_score up to the next band, an insurance gets percent off its own premium.
    Below the lowest band there is no discount."""

    __tablename__ = "discount_bands"

    min_score: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    percent: Mapped[int] = mapped_column(Integer)
    updated_at: Mapped[str] = mapped_column(Text)


class InsuranceClass(Base):
    """The premium numbers of one insurance class: house, cottage, boat, car, dog.
    The risks and profile fields of a class are static data (backend/insurance.py)."""

    __tablename__ = "insurance_classes"

    class_id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    base_annual_premium_eur: Mapped[int] = mapped_column(Integer)
    updated_at: Mapped[str] = mapped_column(Text)


class Customer(Base):
    __tablename__ = "customers"

    customer_id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    created_at: Mapped[str] = mapped_column(Text)


class InsuredObject(Base):
    """One insured thing of a customer. A house keeps its profile in profiles (object_id is the
    home_id, the pipeline fills it); every other class keeps a small profile here."""

    __tablename__ = "insured_objects"

    object_id: Mapped[str] = mapped_column(Text, primary_key=True)
    customer_id: Mapped[str] = mapped_column(Text, ForeignKey("customers.customer_id"))
    class_id: Mapped[str] = mapped_column(Text, ForeignKey("insurance_classes.class_id"))
    name: Mapped[str] = mapped_column(Text)
    profile: Mapped[str | None] = mapped_column(Text)  # JSON {field: value}; null for a house
    history: Mapped[str] = mapped_column(Text, server_default=text("'[]'"))  # JSON [{label, points}] since insured
    details: Mapped[str] = mapped_column(Text, server_default=text("'{}'"))  # JSON facts the app shows, e.g. the house size
    created_at: Mapped[str] = mapped_column(Text)


# The demo customer's app content (data/demo-person.json), refreshed from that file on every start.
class AssignedRisk(Base):
    """A risk assigned to one insured object, with the texts the app shows. It always applies to that
    object (no catalogue condition). Its points come from the fix rules (default.<risk_id>)."""

    __tablename__ = "assigned_risks"

    risk_id: Mapped[str] = mapped_column(Text, primary_key=True)
    object_id: Mapped[str] = mapped_column(Text, ForeignKey("insured_objects.object_id"))
    area: Mapped[str] = mapped_column(Text)  # the app's icon group: electricity, plumbing, frost, ...
    title: Mapped[str] = mapped_column(Text)
    why: Mapped[str] = mapped_column(Text)
    explain: Mapped[str] = mapped_column(Text)
    fix: Mapped[str] = mapped_column(Text)
    diy: Mapped[str] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer)


class Bid(Base):
    """A partner offer the app shows on every risk (mock)."""

    __tablename__ = "bids"

    bid_id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    rating: Mapped[float] = mapped_column(REAL)
    reviews: Mapped[int] = mapped_column(Integer)
    price: Mapped[int] = mapped_column(Integer)  # euros, before the tier discount
    earliest: Mapped[str] = mapped_column(Text)  # display text, e.g. "Tue 20 Oct"
    sort_order: Mapped[int] = mapped_column(Integer)


class Booking(Base):
    """A fix the customer booked in the app. Step 0 booked, 1 in progress, 2 confirmed by the
    partner; a confirmed booking adds the fix's points to its insurance's score."""

    __tablename__ = "bookings"

    risk_id: Mapped[str] = mapped_column(Text, primary_key=True)
    customer_id: Mapped[str] = mapped_column(Text, ForeignKey("customers.customer_id"))
    object_id: Mapped[str] = mapped_column(Text, ForeignKey("insured_objects.object_id"))
    bid_id: Mapped[str] = mapped_column(Text, ForeignKey("bids.bid_id"))
    mode: Mapped[str] = mapped_column(Text)  # hire, diy
    step: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[str] = mapped_column(Text)
    confirmed_at: Mapped[str | None] = mapped_column(Text)


class MaintenanceTask(Base):
    __tablename__ = "maintenance_tasks"

    task_id: Mapped[str] = mapped_column(Text, primary_key=True)
    customer_id: Mapped[str] = mapped_column(Text, ForeignKey("customers.customer_id"))
    season: Mapped[str] = mapped_column(Text)  # autumn, winter, spring, summer
    title: Mapped[str] = mapped_column(Text)
    due: Mapped[str] = mapped_column(Text)  # display text
    reason: Mapped[str] = mapped_column(Text)  # age, partner, weather, law
    reason_text: Mapped[str] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer)


class Reminder(Base):
    """A maintenance task the customer wants a reminder for."""

    __tablename__ = "reminders"

    customer_id: Mapped[str] = mapped_column(Text, ForeignKey("customers.customer_id"), primary_key=True)
    task_id: Mapped[str] = mapped_column(Text, ForeignKey("maintenance_tasks.task_id"), primary_key=True)


if __name__ == "__main__":
    # Print the CREATE TABLE statements.
    from sqlalchemy.schema import CreateTable

    engine = create_engine("sqlite://")
    for table in Base.metadata.sorted_tables:
        print(str(CreateTable(table).compile(engine)).strip() + ";\n")
