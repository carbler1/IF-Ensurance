# Status

Where the project stands, checked against the code.

## First deploy: minimum steps (one at a time)

Goal: `docker compose up` serves the dashboard, the app demo and the API on one host. Tests and polish are skipped on purpose.

1. Finalize docs. Done.
2. Backend. Done: compose fixes, all three images build, `docker compose up` passes `/health`, dashboard, app demo.
3. Deploy. Below.

### 3. Deploy

Host: the PC (`pc-btw`, ssh alias `pc-btw`). Ollama runs there with `qwen3.5:9b`. Domains: `app.antal.fi` and `dashboard.antal.fi` (Zoner CNAMEs to `antal.bounceme.net`, which resolves to the PC). Router forwards ports 80 and 443 to the PC; the PC firewall allows them.

Done:
- PC `.env`: `OLLAMA_URL=http://host.docker.internal:11434`.
- DNS, router and firewall.
- Caddy container added to `docker-compose.yml` (`Caddyfile`); only Caddy publishes ports (80, 443).

Left:
- On the PC: pull, set `APP_DOMAIN`, `DASHBOARD_DOMAIN` and `EXPO_PUBLIC_API_URL=https://app.antal.fi` in `.env`, run `docker compose up -d --build`.
- Open both URLs.
- Upload one sample PDF from `samples/synthetic/` and check that a risk list comes back.

Known: the dashboard is public with no login.

## Working

### Core rule: "code decides, models read and write"

- Holds: code matches risks, orders the list (severity × probability, top 5), computes score, discount and premium, and picks partners (vetted, same city, best rating, top 3). Models only extract facts from PDFs (`backend/extract.py`) and write texts (`backend/write.py`).

### Risk values: severity and probability come only from the catalogue

**Verdict: true.**
- `backend/engine.py:64-65` copies both values from `data/catalogue.json`. The write schema has no such fields, and the model only returns catalogue ids from an allowed list (`backend/write.py`).
- The catalogue has 20 entries: severity 2–5, probability 2–4. All fit 1–5.

### Flow: upload, extract, match, risk list, maintenance

**Verdict: true, with three details.**
- (b) True (`pipeline.py`, `engine.py`). The list is cut to 5 items.
- (d) True: `GET /homes/me/maintenance` uses `backend/maintenance.py`. Due date = last confirmed job (or a profile date or year) + the check interval. The stub `engine.maintenance` raises `NotImplementedError` but is not used.

### Stack

- Backend: FastAPI, SQLAlchemy, Alembic migrations run on start (`backend/db.py`, `backend/entrypoint.sh`). Postgres 17 runs in `docker-compose.yml`.
- Worker: one process polls the `jobs` table every second (`backend/worker.py`), started next to the API in `entrypoint.sh`.
- Model: default `qwen3.5:9b` through Ollama (`backend/llm.py`).

### Jobs: timeout and polling

- Timeout: `LIMIT = 180` s in `backend/worker.py`, error code `timeout`.

### API

- Auth: one shared bearer token from `CUSTOMER_TOKEN`, one hardcoded demo customer `cust_01` and home `home_01` (`backend/api.py`).
- Core endpoints: all six exist under `/v1`.
- Upload limits: kuntotarkastus PDF only, up to 20 MB (`backend/upload.py`).

### Catalogue

- One file per risk in six category folders (electricity, heating, moisture, plumbing, roof, ventilation). `scripts/catalogue/validate.py` checks them and builds `data/catalogue.json`, which the backend reads.
- All 20 risks have a `partner_category` and a `check_interval_years` above 0.

### Mocked parts

- Partner data: partners are seeded from `fixtures/partners.json`, and bids from `data/demo-person.json` (`backend/db.py`).
- Premium changes: base premiums are fixed numbers in `data/insurance-classes.json`. The discount maths is real code (`insurance.simulate`), but it runs on mock prices and does not touch an insurer's system.
- Strong electronic ID: no identification code exists. The only trace is app text saying a relative "identifies with bank ID or mobile ID" (`mobile-app/src/lib/i18n.ts`).
- Partner confirmation: `POST /me/bookings/{risk_id}/advance` is the demo's "simulate next step"; no partner confirms anything (`backend/app_api.py`).

### Prompts

- Extract sends the whole report as one unit (`backend/extract.py`).
- Write flags doubts and proposes catalogue ids from the unmatched list (`backend/write.py`, `prompts/write.schema.json`).
- Settings: `prompts/VERSION` is 3, one file for both prompts. Temperature 0, `num_ctx` 16384, `think` false (`backend/llm.py`).
- Cut-off output raises `llm_truncated` and fails the job (`backend/llm.py`).

### Samples and palette

- Three synthetic PDFs exist in `samples/synthetic/`: 1975 detached house, 1992 flat, 2010 row house. `fixtures/homes/` holds matching profiles.
- Mobile app: background #f6f3f0, text #331e11 (dark brown), primary #0054f0 (`mobile-app/src/lib/theme.ts`).

## Not fully implemented

### Flow: upload, extract, match, risk list, maintenance

- (a) `POST /homes/me/documents` (`backend/upload.py`) accepts only type `kuntotarkastus`, PDFs up to 20 MB. It queues a job; a worker runs the pipeline, so results are not instant. The home is hardcoded to `home_01`.

### Risk states: open, booked, done

- The `work_orders` table exists, and `engine.py` and `insurance.py` read it (status `booked` or `confirmed`, not "done"). No code creates or changes a work order.
- 409 exists only for booking an already booked risk. Advancing past step 2 does not return 409; it silently does nothing.

### Jobs: timeout and polling

- The server side exists: `GET /jobs/{job_id}` returns status and stage (`backend/api.py`).

### API

- Work-order endpoints do not exist. The `work_orders` table is read but never written.
- Score has no `/homes/me` endpoint. Only a `ScoreEvent` model exists. Score is served by `GET /v1/me/insurances` and the mobile app's `/v1/me/app`.

### Scoring

- Decay: `half_life_years` is stored and passed through, but no code lowers points over time (`backend/insurance.py`, `backend/engine.py`).
- Proof: a fix counts when a booking reaches step 2 or a work order is `confirmed`. The booking step is advanced by a demo button, and bookings allow a `diy` mode. No document or inspector proof check exists.
- Rewards: a partner discount per tier exists. A deductible reduction exists only in `fixtures/score-tiers.json`, not in `data/score-model.json`. No "offers on If products" and no "may offer" wording found.

### Prompts

- Long reports are not split at the KH sections. A report that does not fit in `num_ctx` (16384) fails the job with `llm_truncated`.

### Catalogue

- Size: 20 risks exist; 58 are planned. The other 38 are listed under "To do" below.

## To do

Risk state: code uses 'confirmed', the claim says 'done'. Which is it?

- Open. Decide which name stays. Code uses `confirmed` (`work_orders.status`, `Booking` step 2).

### Planned: 38 extra risks

The catalogue holds 20 risks. These 38 more are planned, not built (source: the old catalogue review).

- Sockets without an earth conductor (Electricity): sockets lack a safe path for stray current.
- No surge protection (Electricity): voltage spikes can break devices.
- EV charger or e-bike charging not checked by an electrician (Electricity): overheating circuit or cable at night.
- Too few or battery-only smoke alarms (Fire safety): alarms are missing, old or not linked.
- No stove guard, liesivahti (Fire safety): a forgotten pan can start a fire.
- No extinguisher or fire blanket (Fire safety): a small fire cannot be stopped early.
- Liquefied gas or fuel stored in a basement or living space (Fire safety): explosion or fast fire.
- Oil boiler near the end of its service life (Heating): breakdown or oil leak.
- Old radiators with surface rust (Heating): leak that wets the floor.
- Oil tank room without a fire door or protection basin (Heating): fire or oil leak spreads.
- Heat pump or ground system not serviced in the last year (Heating): higher power use and failure.
- No backup heat in a winter power cut (Heating): cold home and frozen pipes.
- Water pipes in unheated rooms without protection (Heating): frozen pipe bursts.
- Blocked wall ventilation gaps in a brick-clad wall (Moisture): wall frame stays wet.
- Poor surface drainage next to the house (Moisture): water collects at the foundation.
- Worn sealant in the wet room (Moisture): water gets behind the surface.
- Wet-room waterproofing past its service life (Moisture): hidden water damage.
- Cracked sealant at a balcony or terrace door (Moisture): water enters the structure.
- No backflow valve in the sewer (Moisture): sewage flows back into the home.
- Drain pump station without an alarm (Moisture): pump failure goes unseen.
- Radon not measured (Indoor air): radioactive gas in indoor air.
- Asbestos and PAH survey missing before a renovation (Indoor air): harmful materials released in work.
- Cast-iron sewer pipes over 50 years old (Plumbing): old pipes crack or block.
- No leak tray under the dishwasher or washing machine (Plumbing): leaks reach the floor.
- Old washing machine hoses or no own shut-off valve (Plumbing): hose bursts.
- No water leak detector or automatic shut-off valve (Plumbing): leaks run for long.
- Water not shut off or monitored during long absences (Plumbing): leaks go unseen while away.
- Roof drains and gutters not cleaned each year (Roof): blocked drains cause overflow.
- Low-pitch or flat roof without a snow-load plan (Roof): heavy snow stresses the roof.
- Tall trees that can fall on the house (Roof): storm damage.
- Windows at the end of their service life (Roof): drafts and water leaks.
- Wood cladding and terrace need maintenance (Roof): rot and weathering.
- Wild animals in the roof or walls (Roof): damage to insulation and wiring.
- Supply-air valve blocked (Ventilation): poor air supply.
- Building or extension without a permit (Building and documents): legal and sale problems.
- Wet-room or electrical work done without documents (Building and documents): no proof of correct work.
- Entrance doors and windows with weak locks, no alarm (Security): easy break-in.
- Fire barrier between row house units not checked (Fire safety): fire spreads between units; row houses only.

### Water heater re-check interval

The research says the interval should drop from 10 to 5 years. `plumbing/water_heater.age.json` still has 10.

### Later: known gaps accepted for the first version

- A confirmed booking does not remove a risk or move the maintenance date.
- Dashboard partner edits never reach the app: the app reads `Bid`, not `Partner`.
- Onboarding ignores the user's input and always shows the demo home.
- The customer token ships in the public web bundle (`EXPO_PUBLIC_API_TOKEN`). Anyone who loads the demo can read it.
- "Reset all demo data" resets only bookings and reminders.
- The app loses language and onboarding state on every reload.
- `half_life_years` is editable but the score math ignores it (see Scoring above).
- Every customer and every upload uses the single demo home `home_01` (see Flow above).
