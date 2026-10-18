# Status

Where the project stands, checked against the code.

## Deployment

- Live: `https://app.antal.fi` (customer app and API) and `https://dashboard.antal.fi` (staff dashboard). Five containers (postgres, backend, frontend, mobile, caddy) run on the PC. Caddy is the only service that publishes ports (80, 443) and issues the HTTPS certificates.
- Access: the app lists 50 preset homes; a visitor picks a free one and sets a password (`POST /v1/claim`). The dashboard lists 6 mock company accounts; the first visitor to pick one sets its password. `home_01` is the shared demo home, reached only with `CUSTOMER_TOKEN`.
- Update the PC by hand (nothing deploys automatically): `ssh pc-btw`, then `cd ~/IF-Life-Partner && git pull --ff-only && docker compose up -d --build`. The PC `.env` needs every key of `.env.example`, including `SESSION_SECRET`.
- Reset the demo: `scripts/reset-demo.sh` on the PC restores partners, tiers, bands, rules, bookings and reminders, and unclaims the staff accounts. Homes stay claimed.
- LLM: Ollama on the PC runs `qwen3.5:9b` on the AMD GPU (about 149 tokens/s). A sample report goes through upload, extract and write in about 45 s.
- Local development on the laptop: `ilp-dev` (script in `~/.local/bin`, outside the repo) runs the backend (:8000), the dashboard (:3000) and the app (:8082) with hot reload.

## Working

- Core rule "code decides, models read and write" holds. Code matches risks, ranks them (severity × probability, top 5), computes score, discount and premium, and picks partners. Models only extract facts from PDFs (`backend/extract.py`) and write texts (`backend/write.py`).
- Flow: upload a kuntotarkastus PDF (up to 20 MB), extract, match, risk list, maintenance dates. Only the API takes uploads; neither app has an upload screen.
- Score: each confirmed fix counts `points × 0.5 ^ (years / half_life_years)`. Staff edit points, half-lives, bands and tiers in the dashboard.
- Auth: one bearer token per claimed home, a signed session cookie for the dashboard, per-IP rate limit and lockout on claims and logins.
- Catalogue: 20 risks in six folders under `data/catalogue/`; `scripts/catalogue/validate.py` checks them and builds `data/catalogue.json`.
- Mocked: partners and bids, premiums, strong electronic ID, partner confirmation (the demo's "simulate next step" button confirms a booking).
- Extract sends the whole report in one call (`num_ctx` 16384). A longer report fails fast with `document_too_long`.

## Open

- Dashboard logout does not invalidate the session cookie; it stays valid up to 12 hours (`frontend/src/lib/session.ts`).
- Raise `NUM_CTX` to 32768 (fits the GPU, +0.6 GiB, no slowdown measured) and scale the `document_too_long` limit in `backend/extract.py` with it. Reports over about 25k characters are rejected today. Compare extracted values with the expected answers first.
- No upload screen in the app or the dashboard; failed jobs show only through the API.
- Work orders: no endpoints create or confirm a `work_orders` row. A confirmed booking does not remove its risk or move the maintenance date. `advance` past step 2 does nothing and returns no 409. Decide the state name (`confirmed` in code, "done" in the claim).
- Partner edits in the dashboard never reach the app (the app reads `Bid`, not `Partner`; plan: nullable `Bid.partner_id` overlay).
- Deductible reduction exists only in `fixtures/score-tiers.json`, not in `data/score-model.json`; no wording for "offers on If products". The docs say nothing about it.
- Catalogue: 38 more risks are planned (20 exist, 58 total): electricity 3, fire safety 5, heating 6, moisture 7, indoor air 2, plumbing 5, roof 6, ventilation 1, building documents 2, security 1. New folders: `fire_safety`, `indoor_air`, `building_docs`, `security`. The risk-by-risk list is in the previous `STATUS.md` (commit 9731b8b).
- Per-home limits: a second sign-in on another device logs out the first (one token per home); rate limit and lockout counters live in memory and reset on restart; uploaded PDFs are never deleted.
- Small known bugs: startup recovery can fail a live worker's job (only with two workers); `seed()` is not safe to run in parallel; a failed job leaves the profile already merged; a second upload keeps stale fields from the first; the upload handler does blocking I/O; the "Check roof snow load" task goes to flat homes; `RISK_IDS` in `backend/presets.py` is unused.
- Untested: the new login, claim and onboarding flows in a real browser; the nginx changes in a running container; mobile `tsc` needs `npm ci` in `mobile-app/`.
- Router: no DHCP reservation for the PC (192.168.50.17); the port forward breaks if its address changes. You do this in the router.
- Repo clean-up: `frontend/AGENTS.md` is untracked (written by a tool, keep or delete); the local branches `dev` and `dev2` are fully merged and can be deleted.
- Hackathon submission: pitch video (2 minutes at most), pitch deck PDF, project description, source-code link and publicity, team phone numbers and Discord name.
