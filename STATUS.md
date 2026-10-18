# Status

Where the project stands, checked against the code.

## Deployment

Live: `https://app.antal.fi` (app demo and API) and `https://dashboard.antal.fi` (staff dashboard). Five containers (postgres, backend, frontend, mobile, caddy) run on one host. Caddy is the only service that publishes ports (80, 443) and issues the HTTPS certificates.

Broken: PDF upload. The extract job fails after 180 s with `llm_unreachable: timed out`. Ollama on the host runs `qwen3.5:9b` on the CPU only (its log shows `inference compute id=cpu`), although the host has an AMD GPU and a ROCm Ollama package in its config. Why the GPU is not used is not diagnosed.

Open:
- The dashboard is public and has no login.
- The router has no DHCP reservation for the host, so the port forward breaks if the host's LAN address changes.

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

## To do

Grouped by what to solve together. None of it blocks the first version.

### Bookings, work orders and risk state

- No code creates or changes a `work_orders` row, and no work-order endpoints exist. `engine.py` and `insurance.py` read the table (`booked`, `confirmed`).
- A confirmed booking does not remove the risk or move the maintenance date.
- Advancing a booking past step 2 does nothing and returns no 409 (409 exists only for booking an already booked risk).
- Decide the state name: code uses `confirmed`, the claim says "done".

### Scoring

- `half_life_years` is editable and stored, but no code lowers points over time (`backend/insurance.py`, `backend/engine.py`).
- A fix counts when a booking reaches step 2 (a demo button advances it; `diy` mode allowed) or a work order is `confirmed`. No document or inspector proof check exists.
- The deductible reduction exists only in `fixtures/score-tiers.json`, not in `data/score-model.json`. No "offers on If products" wording exists.

### Customers and homes

- Every customer and every upload uses the demo home `home_01` and one shared customer token (`backend/api.py`, `backend/upload.py`).
- Onboarding ignores the user's input and always shows the demo home.
- The customer token ships in the public web bundle (`EXPO_PUBLIC_API_TOKEN`).

### Demo state

- Dashboard partner edits never reach the app: the app reads `Bid`, not `Partner`.
- "Reset all demo data" resets only bookings and reminders.
- The app loses language and onboarding state on every reload.

### Extraction

- Long reports are not split at the KH sections. A report that does not fit in `num_ctx` (16384) fails the job with `llm_truncated`.

### Catalogue

- `plumbing/water_heater.age.json` has a 10-year re-check interval; the research says 5.
- 38 more risks are planned (20 exist, 58 total):
  - Electricity (3): no earth conductor in sockets; no surge protection; EV or e-bike charger not checked by an electrician.
  - Fire safety (5): too few or battery-only smoke alarms; no stove guard (liesivahti); no extinguisher or fire blanket; liquefied gas or fuel stored indoors; fire barrier between row house units unchecked (row houses only).
  - Heating (6): oil boiler near end of life; rusty old radiators; oil tank room without fire door or basin; heat pump or ground system not serviced in a year; no backup heat in a winter power cut; unprotected water pipes in unheated rooms.
  - Moisture (7): blocked wall ventilation gaps in brick cladding; poor surface drainage; worn wet-room sealant; wet-room waterproofing past its life; cracked balcony or terrace door sealant; no sewer backflow valve; drain pump station without an alarm.
  - Indoor air (2): radon not measured; asbestos and PAH survey missing before renovation.
  - Plumbing (5): cast-iron sewer pipes over 50 years; no leak tray under dishwasher or washing machine; old washing machine hoses or no own shut-off valve; no leak detector or automatic shut-off valve; water not shut off or monitored during long absences.
  - Roof (6): gutters and drains not cleaned yearly; low-pitch or flat roof without a snow-load plan; tall trees that can fall on the house; windows at end of life; wood cladding and terrace need maintenance; wild animals in roof or walls.
  - Ventilation (1): supply-air valve blocked.
  - Building and documents (2): building or extension without a permit; wet-room or electrical work without documents.
  - Security (1): weak door and window locks, no alarm.
