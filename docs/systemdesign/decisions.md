# Decision log

One line per decision. Newest at the bottom. Status: decided, mocked, deferred, open, parked. **(A)** = made by Antton's agent alone, waiting for veto. Rows merged after the 2026-10-17 audit keep the lowest number. Compacted 2026-10-17: rows 4 (closed by 42), 16 (historical), 39 (merged into 35) and 44 (superseded by 45 and 46) removed.

| # | Topic | Decision | Status |
|---|---|---|---|
| 1 | Catalogue source | Rasi writes analysis prose, not data structures. Antton or a chat agent edits the entry JSON from the prose by the drafting rules in `docs/systemdesign/LATER.md` §4; the validator checks; Antton reviews the diff; Rasi reads the result for meaning. The LLM conversion script is archived (decision 46). | decided |
| 2 | Not buildable | Fraud-proof verification, real premium changes, a real partner network and strong e-ID are mocked. The mock is honest in the pitch. | mocked |
| 3 | VRAM model switching | Solve later. | deferred |
| 5 | Lovable | Ege builds against the API contract with example JSON as fixtures. No Supabase for app data. | decided |
| 6 | Model and criticality | Vision model extracts facts. The writer model may propose catalogue entries by id only. Code copies severity, probability, points and quirks from the catalogue. A model never sets them. | decided |
| 7 | Partners | Mock partner data and a mock confirmation. | mocked |
| 8 | Score numbers | Mock points, tiers and decay until Rasi delivers (decision 48). | mocked |
| 9 | Languages | Build in English. Translate what the demo needs in phase 3. | decided |
| 10 | Premium legality | Rasi researches. | deferred |
| 11 | Raw data storage | Phase 1 stores only what the endpoints need. Raw model text goes to the worker log. The full store of every input, prompt and model output is phase 2. | deferred |
| 12 | Customer forms | Not the main intake. May serve verification. | decided |
| 13 | Open data | Use open data sources where reliable. Ryhti is optional enrichment, not a dependency. | decided |
| 14 | LLM check | The writer model flags doubts in the same call (`doubt` + reason). Flags do not change the score. Judge is an empty pluggable slot for phase 2. Score, money and partners are code. | decided |
| 15 | RAG | Not in phase 1. Matched catalogue entries go into the prompt directly. | deferred |
| 18 | Intake types | Phase 1 accepts the kuntotarkastus PDF only; other types return 400. Next: sale listing, then inspection, sale/ownership and work-history documents. Technical photos: later. | decided |
| 21 | Run mode | Background job with status polling. Job time limit 180 s; worker fails stale jobs on start; app stops polling at 200 s. Batch is a scale-up note. | decided |
| 22 | Phase 1 scope | Core: upload → job → risk list, risk detail with partners, maintenance list. Last, maybe: booking, confirmation, score. Endpoint phases in `api-contract.md`. | decided |
| 23 | Matching | Code matches by conditions; the model may add catalogue ids, marked llm_proposed. | decided |
| 24 | Catalogue format | JSON, not Nix (confirmed with the Nix design session). One file per entry, `data/catalogue/<category>/<name>.json`; id and category come from the path and are not in the file. Phase 1 machinery: one schema file, per-entry tests.match / tests.reject, a merge script, the `<file> [<id>] <path>: <message>` error format. Not in phase 1: defaults cascade, json2nix.py, CI check. Both conversion directions stay cheap. | decided |
| 25 | First document | Kuntotarkastus PDF first, sale listing second. | decided |
| 26 | Score shape | One number, no cap, computed at read time as 1000 + Σ decayed points − penalties. The store holds events with a delta only. Tier names: Rasi (decision 48). | decided |
| 27 | Samples | The three synthetic reports in `samples/synthetic/`. The Kunnon Koti PDF is not used (archived). | decided |
| 28 | Maintenance list | Derived from catalogue intervals. Base date = last known evidence; with none, due at profile creation, never in the past. | decided |
| 29 | Tests | Phase 1 uses only the existing checks (`validate.py`, `fixtures/check.py`, `fixtures/api/check.py`). The rest is in `docs/systemdesign/LATER.md` §6. | decided (A) |
| 30 | Mock numbers | Score starts at 1000; tiers at 1000/1200/1500/2000; list shows max 5 open or booked risks. | mocked (A) |
| 31 | Proof in phase 1 | Partner confirmation endpoint fired by curl. Built only if the core is done. Partner page is phase 2. | mocked (A) |
| 32 | Pipeline model | qwen3.5:9b only, gpt-oss:20b for the judge slot. | decided |
| 34 | Where Nix is used | Dev shell and pinned tools (now). pc-btw host config (now). Phase 2: backend and worker as NixOS services on pc-btw. | decided |
| 35 | Ollama call settings | Measured on pc-btw 2026-10-17 (server default `num_ctx` 4096, Ollama 0.32.3). Every call sets `num_ctx` 16384, `think: false`, `format` = schema, temperature 0. The job fails on `done_reason` `length` or `prompt_eval_count` at `num_ctx`. Extraction runs on the whole report under 20,000 characters, else on top-level KH sections of 8,000 to 20,000 characters; per-subsection chunks invented 19 % of values. Schema output valid on 103 of 103 calls. | decided |
| 36 | Profile merge order | Phase 1: a candidate that is not `"unknown"` replaces the current value. Trust ranks, doubt flags and confidence rules: `docs/systemdesign/LATER.md` §2. | decided |
| 37 | Condition semantics | Numeric tests on `"unknown"` do not match; `in` matches `"unknown"` only when listed; `exists` is false for `"unknown"`. So `not` over an unknown test is true: no record counts as at risk (six entries rely on it). | decided |
| 38 | Work order states | `open → booked → done`, derived from work orders. Repeats and wrong-category bookings return 409 with no event. Status change, score event and profile fact are one transaction. Points at most once per `check_interval_years`. | decided |
| 40 | Uploads | Server checks PDF magic bytes and 20 MB; files stored under `document_id`, never the client filename. | decided |
| 41 | CORS and HTTPS | The tunnel ends HTTPS. The backend serves plain HTTP on 127.0.0.1:8000 with an explicit CORS origin allow-list. | decided |
| 42 | Reachability | Phase 1: a cloudflared quick tunnel on pc-btw (`cloudflared tunnel --url http://localhost:8000`). No account, no DNS, no certificate work. The URL is `{BASE}` and changes on restart. Run it only during tests and the demo. Ollama stays VPN-only. Phase 2: a stable hostname. | decided |
| 43 | Backend stack | Python 3.13, FastAPI, SQLite (one file), a jobs table polled by one worker process, pypdfium2, httpx to Ollama, jsonschema; all from nixpkgs through `nix develop .#backend`. Confirmed by Antton 2026-10-17. | decided |
| 45 | Design documents | `docs/systemdesign/DESIGN.md` holds what phase 1 builds. `docs/systemdesign/LATER.md` holds everything for later. Superseded material is in `archive/` (git-excluded). | decided |
| 46 | Architect bundle and scripts | The architect bundle, the conversion script, the open-data scripts and the Ollama probe scripts move to `archive/`. Nothing is built from the bundle's `tasks.json`. | decided |
| 47 | Customer app shell | Phase 1: the Lovable web app in Chrome on the phone. Phase 2: port to Expo (React Native), with Lovable as the design source. | decided |
| 48 | Score numbers and tier names | Rasi decides them in prose. Antton converts them into `fixtures/score-tiers.json` and the catalogue. The slots are in `docs/systemdesign/LATER.md` §3. | decided |
| 49 | Reward shown | Deductible reduction and free checkups per tier. No premium change until Rasi's legality memo (decision 10). | mocked (A) |
| 50 | Document trust level | Open (spec §15). Phase 1 behaviour: an uploaded report shapes the profile and the risk list. It never raises the score. Only a partner confirmation raises the score. | open |
| 51 | Outside phase 1 | Car, life events, family delegation, access levels, retention, If staff insights, photos, judge, partner page: module and interface only, in `docs/systemdesign/LATER.md` §1. | decided |
