# Antton: tasks

Role: integration and all missing parts.

Demo flow: upload a kuntotarkastus PDF, wait for the job, see the risk list, open one risk with its partners, see the maintenance list, book a partner, the partner confirms the fix with curl, the care score rises.

State: the core backend exists in `ilp/`. `tests/test_api.py` passes. Work orders, confirmation and score have no endpoints.

Cut: auth, phase 2.

0. Send Ege example content from `fixtures/api/` now, in a form he can read. He designs with it.
1. Run end to end on pc-btw. Seed the database, start the API and the worker, and upload each PDF in `samples/synthetic/`. Check each risk list by eye with the real Ollama model.
2. Remove auth. Make `require_token` in `ilp/api.py` a no-op. Update `docs/systemdesign/api-contract.md`.
3. Reachability: run the cloudflared tunnel.
4. CORS: put Ege's frontend URL in `CORS_ORIGINS` in `.env`.
5. Integrate Ege's screens:
   - Wire the screens to the API. Keep the API base URL in one place.
   - Send no auth header.
   - Walk the demo flow on the phone.
6. Care score: build `POST` and `GET /homes/me/work-orders`, `POST /work-orders/{id}/confirm` and `GET /homes/me/score` from `docs/systemdesign/api-contract.md`. The tables `work_orders` and `score_events` exist in `ilp/schema.sql`. The confirm call skips the partner token check, because auth is cut. Put Rasi's tier names, rewards and points into `fixtures/score-tiers.json` and the catalogue.
7. Partners: add mock partners to `fixtures/partners.json` so each risk gets 3 partners in Turku with `if_vetted: true`. The filter in `ilp/engine.py:84` gives 1 or 2 now, and Ege designs for 3.
8. Catalogue: turn Rasi's prose into catalogue JSON. If a new risk needs a fact the app does not collect, add it to `data/home-profile.schema.json` and the extract prompt. Run `scripts/catalogue/validate.py`. Repeat step 1.
9. Demo reset: delete `var/`, seed again, and do one dry run of the full flow.

Order: steps 0 to 4, 6 and 7 now. Step 5 when Ege's screens exist. Step 8 when Rasi delivers. Step 9 last.

Unknowns: the state of Ege's frontend, whether the Ollama model gives usable output on the samples.
