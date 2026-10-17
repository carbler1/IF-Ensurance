-- Phase 1 tables. DESIGN.md §5. To reset: delete var/ and seed again.

CREATE TABLE IF NOT EXISTS homes (
    home_id     TEXT PRIMARY KEY,
    street      TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    city        TEXT NOT NULL,
    created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
    home_id    TEXT PRIMARY KEY REFERENCES homes(home_id),
    profile    TEXT NOT NULL, -- JSON, the 20 fields of data/home-profile.schema.json
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
    document_id TEXT PRIMARY KEY,
    home_id     TEXT NOT NULL REFERENCES homes(home_id),
    type        TEXT NOT NULL,
    uploaded_at TEXT NOT NULL,
    status      TEXT NOT NULL  -- queued, processed, failed
);

CREATE TABLE IF NOT EXISTS jobs (
    job_id      TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(document_id),
    status      TEXT NOT NULL, -- queued, running, done, failed
    stage       TEXT,          -- extracting, matching, writing
    started_at  TEXT,
    finished_at TEXT,
    error       TEXT
);

CREATE TABLE IF NOT EXISTS risk_texts (
    home_id      TEXT NOT NULL REFERENCES homes(home_id),
    risk_id      TEXT NOT NULL,
    why          TEXT NOT NULL,
    benefit      TEXT NOT NULL,
    llm_proposed INTEGER NOT NULL DEFAULT 0,
    generated_at TEXT NOT NULL,
    PRIMARY KEY (home_id, risk_id)
);

-- Maybe: booking, confirm, score.
CREATE TABLE IF NOT EXISTS work_orders (
    work_order_id TEXT PRIMARY KEY,
    home_id       TEXT NOT NULL REFERENCES homes(home_id),
    risk_id       TEXT NOT NULL,
    partner_id    TEXT NOT NULL,
    status        TEXT NOT NULL, -- booked, confirmed
    created_at    TEXT NOT NULL,
    confirmed_at  TEXT
);

CREATE TABLE IF NOT EXISTS score_events (
    event_id      TEXT PRIMARY KEY,
    home_id       TEXT NOT NULL REFERENCES homes(home_id),
    at            TEXT NOT NULL,
    delta         INTEGER NOT NULL,
    reason        TEXT NOT NULL,
    work_order_id TEXT REFERENCES work_orders(work_order_id)
);

-- Editable by If staff through /v1/admin. Seeded once from fixtures/partners.json
-- and fixtures/score-tiers.json; after that the database is the source.
CREATE TABLE IF NOT EXISTS partners (
    partner_id            TEXT PRIMARY KEY,
    name                  TEXT NOT NULL,
    categories            TEXT NOT NULL, -- JSON list of partner categories
    area                  TEXT NOT NULL,
    price_min             INTEGER NOT NULL, -- euros
    price_max             INTEGER NOT NULL, -- euros
    rating                REAL NOT NULL,
    if_vetted             INTEGER NOT NULL,
    tier_discount_percent INTEGER NOT NULL,
    listing_fee_tier      TEXT NOT NULL,
    updated_at            TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tiers (
    tier_index               INTEGER PRIMARY KEY,
    name                     TEXT NOT NULL,
    min_score                INTEGER NOT NULL,
    deductible_reduction_eur INTEGER NOT NULL,
    free_checkups            TEXT NOT NULL, -- JSON list of checkup kinds
    partner_discount_percent INTEGER NOT NULL,
    updated_at               TEXT NOT NULL
);
