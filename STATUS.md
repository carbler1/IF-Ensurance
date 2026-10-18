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

Grouped by what to solve together. None of it blocks the first version. Each group ends with a plan (planned only, nothing built).

### Bookings, work orders and risk state

- No code creates or changes a `work_orders` row, and no work-order endpoints exist. `engine.py` and `insurance.py` read the table (`booked`, `confirmed`).
- A confirmed booking does not remove the risk or move the maintenance date.
- Advancing a booking past step 2 does nothing and returns no 409 (409 exists only for booking an already booked risk).
- Decide the state name: code uses `confirmed`, the claim says "done".

Plan (size M; L if the app-to-house bridge is included). Today two systems exist and nothing links them: the house API uses `work_orders` per home, the app uses `bookings` per risk (steps 0 to 2, with `confirmed_at`). Do this group before Scoring: it owns the confirm write.
1. Keep `confirmed`; change the product claim from "done" (engine.py:51, insurance.py:159, maintenance.py:38 and `fixtures/api/work-order-confirm.json` all use `confirmed`).
2. `backend/api.py`: add `POST /v1/homes/me/work-orders` (409 if the risk already has a booked or confirmed order), `GET` on the same path, and `POST .../{id}/confirm` (set status and `confirmed_at`, insert a `ScoreEvent`). Build to `fixtures/api/work-orders*.json`; check with `fixtures/api/check.py`. No migration unless a unique (home_id, risk_id) constraint is added.
3. Confirm effects need no new code: `engine._items` already drops confirmed risks and `maintenance.py` already uses the latest `confirmed_at`. Add a test for both.
4. `backend/app_api.py` `advance()`: raise 409 when `step >= 2`, in the style of `book()`.
5. App side: hiding confirmed risks breaks the done screen (`risks/[id].tsx:40`) and `history`. App maintenance dates come from seed `MaintenanceTask.due` rows, so moving one needs a recompute in `advance()`.
- Could break: the mobile done screen, `check.py` expectations, Scoring tests.
- Decide: `confirmed` or "done" (recommended `confirmed`); hide a confirmed risk in the app or show it as done; merge app bookings and house work orders or keep them apart; who confirms (partner or customer); whether the 409 also covers repeated confirm calls.

### Scoring

- `half_life_years` is editable and stored, but no code lowers points over time (`backend/insurance.py`, `backend/engine.py`).
- A fix counts when a booking reaches step 2 (a demo button advances it; `diy` mode allowed) or a work order is `confirmed`. No document or inspector proof check exists.
- The deductible reduction exists only in `fixtures/score-tiers.json`, not in `data/score-model.json`. No "offers on If products" wording exists.

Plan (size M). Start after the Bookings group.
1. Decay in `backend/insurance.py`: `_confirmed` returns {risk_id: confirmed_at} (`WorkOrder` and `Booking` both have the column). In `simulate()`, replace `done_points += points` with `round(points * 0.5 ** (years / half_life_years))`. Take `half_life_years` from `engine.fix_value`; if null, use the category default in `fixtures/half-lives.json`, else no decay. A null `confirmed_at` means no decay. Nothing is stored, so decay applies to old data at once; `engine.py` needs no change.
2. Return the done rows (risk_id, base points, current points) from `simulate()` for the dashboard and app.
3. Proof: add a nullable `proof` (or boolean `verified`) to `Booking` and `WorkOrder` in `backend/models.py`; `_confirmed` counts a fix only when it is set; staff set it through a new `backend/admin.py` endpoint. Backfill seeded bookings as verified, or demo scores drop to zero.
4. Deductible: add `deductible_reduction_eur` per tier to `data/score-model.json`, the `Tier` model, `db.tier_dict` and `db.tiers`, `TierPatch` and `patch_tier`. Seed 0/50/100/150 from `fixtures/score-tiers.json`. Add the bonus text "Offers on If products".
5. Dashboard `frontend/src/app/scoring/page.tsx`: deductible field, decayed against base points, half-life tooltip.
- Could break: scores drop right after deploy (bands and tiers can shift); new `Tier` and proof columns need a migration or a demo reset; keep `/v1/me/app` changes additive.
- Decide: exponential or linear decay, and a floor; what counts as proof, who verifies, whether `diy` needs proof; whether the demo step button skips the proof gate; deductible amounts and the offers wording; whether to merge `score-tiers.json` and `score-model.json`.

### Customers and homes

- Every customer and every upload uses the demo home `home_01` and one shared customer token (`backend/api.py`, `backend/upload.py`).
- Onboarding ignores the user's input and always shows the demo home.
- The customer token ships in the public web bundle (`EXPO_PUBLIC_API_TOKEN`).

Plan (size M; L with real login). Do together with the persistence step of "Demo state" (both change `store.tsx`).
1. `backend/models.py`: add `customers.token_hash` (nullable, unique, SHA-256) and `homes.customer_id` (nullable FK). One Alembic revision after e4c569627165 links `home_01` to `cust_01`. Check SQLite and Postgres.
2. `backend/db.py` `seed()`: set cust_01's `token_hash` from `CUSTOMER_TOKEN` so the demo keeps working. `sync_demo_person` and `reset_demo` must not wipe other customers.
3. Auth: `require_token` in `backend/api.py` hashes the bearer token, looks up the customer and returns `customer_id`; the home comes from the customer. Replace the `HOME_ID` and `CUSTOMER_ID` constants in `api.py`, `app_api.py` (5 uses) and `upload.py` (`home_01`).
4. Add `POST /v1/signup {street, postal_code, city}` (no auth): creates the customer, home and empty profile, returns `{token, home_id}`.
5. Mobile: `api.ts` drops `EXPO_PUBLIC_API_TOKEN`, holds the token, adds `signup()`; `store.tsx` persists the token and skips onboarding when present; `Onboarding.tsx` "found" step calls `signup()`; remove the token from `.env.example` and the build args.
6. Tests: update `tests/test_api.py`; add a two-customer isolation test and a signup test.
- Could break: the demo seed must keep cust_01 and home_01 tied; old app builds stop working; a new customer has no `AssignedRisk`, `Bid` or `MaintenanceTask` rows, so `/me/app` is empty or errors; `reset_demo` covers only the demo customer; dashboard assumptions about `home_01` are unchecked.
- Decide: anonymous device token or real login; signup open, rate-limited or invite-only; a new customer sees empty data or a cloned demo set; whether production keeps `CUSTOMER_TOKEN`; token expiry.

### Demo state

- Dashboard partner edits never reach the app: the app reads `Bid`, not `Partner`.
- "Reset all demo data" resets only bookings and reminders.
- The app loses language and onboarding state on every reload.

Plan (size M).
1. Partner edits: the dashboard PATCH writes `Partner` (`admin.py:273`), the app reads `Bid` (`app_api.py:58`), and they share no key. Add a nullable `partner_id` to `Bid` (`models.py`, `db.py` sync, `data/demo-person.json`). `app_data` then overlays the linked Partner's name, rating and price (min price x (100 - tier discount) / 100) and hides non-vetted partners. `reviews` and `earliest` stay on `Bid`; `book()` is unchanged. Test: PATCH a partner, GET `/app`, price changed.
2. Reset: extend `reset_demo` (`db.py:182`) to delete Partner, Tier, DiscountBand, InsuranceSettings and FixRule rows, then run `seed()` and `sync_demo_person`. Update the dashboard confirm text (`frontend/src/lib/api.ts:56`).
3. Persistence: `store.tsx:62-63` uses localStorage on web and `@react-native-async-storage/async-storage` on native (the only new dependency, via `npx expo install`). Gate rendering on a hydrated flag (`_layout.tsx:72`) to avoid an onboarding flash.
- Could break: bid prices in `demo-person.json` that tests or the pitch rely on; the Booking FK to bids; jest store tests need a storage mock; reset now deletes dashboard-edited score settings; Partner categories do not map to bids, so all vetted partners would show on every risk.
- Decide: all partners in the app or a hand-picked few; the shown price (min, max or midpoint) and whether the tier discount applies; whether reset wipes tiers, bands and rules or only partners; whether onboarding resets with the demo reset; whether the AsyncStorage dependency is OK.

### Extraction

- Long reports are not split at the KH sections. A report that does not fit in `num_ctx` (16384) fails the job with `llm_truncated`.

Plan (size M). Today `extract.run` sends the whole text in one call, `llm.chat` has a fixed 170 s timeout, and `worker.LIMIT = 180` is only checked between steps. The live host runs Ollama on CPU, which makes the timeout the first problem.
1. `backend/extract.py`: add `_chunks()`. Split only when the text exceeds a budget (about 12k chars as a first guess; the samples are 16k to 20k chars and fit today). Split on KH headings (regex `^#{1,2} \d+(\.\d+)?\.? `, fallback blank lines or pages), pack whole sections greedily, and prepend the title and chapter 1 to 2 header block to each chunk. Keep chunks large and few: `prompts/extract.md` notes that small units made the model invent values.
2. Add `_combine()`: dedupe candidates by `field`, drop `unknown` when another chunk has a value, keep the higher confidence (tie: later chunk). Existing validation and `merge()` stay unchanged.
3. `backend/llm.py`: add a `timeout` parameter; keep `llm_truncated` for a single oversize chunk. `backend/pipeline.py`: pass `check` into `extract.run`. `backend/worker.py`: scale `LIMIT` (for example 120 s plus about 150 s per chunk) or raise it to about 900 s. On CPU, N chunks take about N times as long, so a fixed 180 s still times out.
4. `prompts/extract.md`: update the "whole report as one unit" paragraph; bump `prompts/VERSION` only if the text changes.
- Test: run the three sample PDFs with the budget forced low and compare with the single-call result and the `.md` ground truth; unit-test `_chunks` and `_combine` with `llm.chat` stubbed; make a long synthetic PDF over 16k tokens.
- Could break: more invented values; conflicting values across chunks; headings lost in PDF text; quotes that straddle a chunk boundary; worker tests that assume 180 s.
- Decide: budget in chars or tokens; the new `LIMIT`; the conflict rule; accept some invention risk or add a second whole-report pass; a faster or smaller model on CPU.

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

Plan (size L; the schema, prefix and icon work is S).
1. Set `check_interval_years` to 5 in `data/catalogue/plumbing/water_heater.age.json` (keep `half_life_years` 10 and `service_life_years` 20). Confirm the 5-year source in `docs/RESEARCH.md` first; a grep did not find it.
2. The category is the folder name (no enum). Add four folders and their prefixes in `data/catalogue/id-prefixes.json`: `fire_safety`, `indoor_air`, `building_docs`, `security`.
3. One owner does all shared edits first: the prefixes and any new fields in `data/home-profile.schema.json`. Fire safety, radon, locks and alarms, and documents mostly need new fields (the alternative is to match them on `building_year` and `house_type` only). New fields need an enum or year type with an "unknown" default, and must exist in `data/demo-person.json` and `fixtures/`.
4. Parallel batches, one file per risk, each batch writing only its own folders: A electricity 3, ventilation 1, security 1, building_docs 2; B fire_safety 5, heating 6; C moisture 7, indoor_air 2; D plumbing 5, roof 6. No batch edits the schema, `data/partner-categories.json` or `docs/CATALOGUE.md`.
5. Reuse the 14 existing partner categories (`locksmith_alarm`, `hazmat_surveyor`, `independent_inspector`, `chimney_sweep`, and others). A new one must be added in both `data/partner-categories.json` and the enum in `data/catalogue.schema.json`.
6. Run `python3 scripts/catalogue/validate.py` once at the end (it rebuilds `data/catalogue.json`), then the tests in `tests/`.
7. Add icons for the four categories to `categoryIcon` in `frontend/src/components/ui.tsx` (the mobile app's icon map is unchecked). The docs session updates `docs/CATALOGUE.md` last (20 to 58 risks).
- Could break: tests that hard-code 20 risks; the default half-life in `backend/db.py` for unknown categories.
- Decide: which 38 risks exactly; new profile fields or matching on existing ones; the four folder names and prefixes; the points and severity scale; whether to keep the "DRAFT" hint style.
