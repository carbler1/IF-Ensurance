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
