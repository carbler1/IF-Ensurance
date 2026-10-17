# API contract, phase 1

Owner: Antton (integration). Design: `docs/systemdesign/DESIGN.md`.
For Ege: build the app against these shapes. Each response example is a file in `fixtures/api/`. Use them as fixtures until the backend runs. Do not store app data in Supabase.
For the backend: contract tests check every endpoint against these shapes.

Version: 0.3, 2026-10-17 (removed `premium_reduction_eur` from risks, which no client used; earlier: 0.2 audit fixes). Changes go through Antton. Field additions are allowed without a version bump; renames and removals are not.

## Conventions
- Base URL: `{BASE}/v1` over HTTPS. The value of `BASE` comes later.
- CORS (cross-origin resource sharing): the backend allows only an explicit list of origins (the Lovable preview URL and the demo URL). No wildcard.
- JSON in, JSON out. `Content-Type: application/json`, except document upload (multipart).
- Auth, phase 1 mock: header `Authorization: Bearer <CUSTOMER_TOKEN>`. One demo customer. Partners use `X-Partner-Token: <PARTNER_TOKEN>`. Both values come from `.env`.
- Ids are opaque strings. Times are ISO 8601 UTC. Money is integer euros. Language is English.
- Errors: `{"error": {"code": "not_found", "message": "..."}}` (example: `fixtures/api/error-409.json`) with HTTP 400, 401, 404, 409 or 500. `409` means the request conflicts with the current state or the stored data, and nothing changed.
- Two words with a fixed meaning: a **job** is a pipeline run. A **work order** is a booked mitigation with a partner.
- Risk state machine: `open → booked → done`. `status` is derived from work orders, never stored in a list. A request that repeats a transition returns `409` and creates no event.
- Pipeline flow: `docs/systemdesign/DESIGN.md` §6.
- Risk list tie-break: equal `severity × probability` sorts by `risk_id` ascending. Work-order `status` is `booked` or `confirmed`.

## Endpoints

| Method | Path | Purpose | Phase |
|---|---|---|---|
| GET | `/homes/me` | The customer's home and profile | 1 core |
| POST | `/homes/me/documents` | Upload a document; starts a job | 1 core |
| GET | `/jobs/{job_id}` | Job status | 1 core |
| GET | `/homes/me/risks` | Current risk list | 1 core |
| GET | `/homes/me/risks/{risk_id}` | One risk with detail and partners | 1 core |
| POST | `/homes/me/work-orders` | Book a partner for a risk | 1 last, maybe |
| GET | `/homes/me/work-orders` | List work orders | 1 last, maybe |
| POST | `/work-orders/{work_order_id}/confirm` | Partner confirms the job (partner token) | 1 last, maybe |
| GET | `/homes/me/score` | Care score, tier, benefit, history | 1 last, maybe |
| GET | `/homes/me/maintenance` | Maintenance list with due dates | 1 core |

### GET /homes/me
Example: `fixtures/api/homes-me.json`.
Every profile field is present. An unknown field has `value: "unknown"` and `source: "none"`. `source` is one of `partner`, `document`, `register`, `customer`, `none`. Phase 1 always returns `doubt: false`. Document `status` is `queued`, `processed` or `failed`.

### POST /homes/me/documents
Multipart: `file` (PDF, max 20 MB), `type`. Phase 1 accepts only `type: kuntotarkastus` with a PDF. Any other type or content returns `400` with code `unsupported_document`. The server checks the PDF magic bytes and the size; it ignores the client filename and stores the file under `document_id`.

Response `202`. Example: `fixtures/api/documents-post.json`.

### GET /jobs/{job_id}
Example: `fixtures/api/jobs-running.json`, `fixtures/api/jobs-done.json` and `fixtures/api/jobs-failed.json`.
`status` is `queued`, `running`, `done` or `failed`. `stage` is `extracting`, `matching` or `writing` while running, else `null`. Poll every 2 s until `done` or `failed`; stop after 200 s and offer a retry. The backend fails a job after 180 s. On `failed`, `error` has `code` and `message`.

### GET /homes/me/risks
Example: `fixtures/api/risks.json`.
Ordered by `severity × probability`, LLM-proposed items last. At most 5 items with `status` `open` or `booked`. Done items are not listed here; they appear in the score breakdown.
`points_available` comes from the fix rules that If staff set in the dashboard: of the fix's active rules whose context matches the home profile, the one with the highest priority wins (`engine.fix_value`). Without a rule, the catalogue points apply. The points go to the house insurance's score (see `/me/insurances`).

### GET /homes/me/risks/{risk_id}
The risk object, plus `evidence`, `mitigation` and `partners`.
Example: `fixtures/api/risk-detail.json`.
Partners are sorted by rating. Phase 1 shows at most 3.

### POST /homes/me/work-orders
```json
{"risk_id": "elec.panel.screw_fuse", "partner_id": "p_03"}
```
Response `201`. Example: `fixtures/api/work-orders-post.json`.
The risk's `status` becomes `booked`. `409` when the risk is already `booked` or `done`, or when the partner's categories do not include the risk's `partner_category`.

### GET /homes/me/work-orders
Example: `fixtures/api/work-orders.json`.

### POST /work-orders/{work_order_id}/confirm
Header `X-Partner-Token`. Body optional:
```json
{"note": "Panel replaced with automatic fuses.", "photo_url": null}
```
Example response: `fixtures/api/work-order-confirm.json`.
The risk's `status` becomes `done`, the next maintenance read uses `confirmed_at` as the base date, and the catalogue entry's `on_done` fact is written to the profile with `source: partner`. All three happen in one transaction with the score event. A second confirm returns `409` and creates no event. An entry earns points at most once per its `check_interval_years`. Phase 1 fires this with curl.

### GET /homes/me/score
Example: `fixtures/api/score.json`.
`score` is computed at read time: `1000 + Σ decayed_points − penalties`. The store holds events with `delta` only; `score_after` in `history` is computed in the response from the undecayed deltas, so it can differ from `score` once decay applies. `benefit` comes from the tier table, which maps each tier to `deductible_reduction_eur` and `free_checkups`. Tier names are placeholders.

### GET /homes/me/maintenance
Example: `fixtures/api/maintenance.json`.
`due_at` = base date + `interval_years`, where the base date is the last known evidence for the entry (confirmed work order or profile fact). With no evidence, `due_at` is the profile creation date. `due_at` is never before the profile creation date. `status` is `overdue`, `upcoming` (within 90 days) or `scheduled`. Sorted by `due_at`. The list is computed at each read and nothing is stored. `item_id` is opaque and may change between reads; use `risk_id` as the key.

### GET /me/insurances
Added 2026-10-17. The demo customer's five insurances (house, summer cottage, boat, car, dog) under the score model in `data/score-model.json`:
- Each object has its own `score` (`now`, `after` every open fix, `next_band`), from 0 to `max_score`. A new insurance starts at `insurance_score_start` (500); `history` and confirmed fixes move it.
- `band` (`now`, `after`) is the percent off that insurance's own premium; `premium` has `base`, `now`, `after` in euros a year.
- `fixes` lists each open fix with `points`, `half_life_years`, `why` and `benefit`.
- `aggregate` (`now`, `after`) is the average of the insurance scores; `tier_now`/`tier_after` carry the tier with its `bonuses` (display texts; they change no price) and `next_tier`.
- `model` echoes the bands and tiers in use.

## Admin (If staff dashboard)
Added 2026-10-17. The dashboard in `frontend/` calls these from its server and never touches the database. Auth: header `X-Admin-Token: <ADMIN_TOKEN>` from `.env`; the customer token does not work here.

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/overview` | Counts: customers, homes, documents and work orders by status, active rules, classes |
| GET | `/admin/customers` | Each customer with their objects, profiles, open fixes, premiums and Care Score with every fix done |
| GET | `/admin/classes` | The five insurance classes: profile fields, risks, base premium, cap |
| PATCH | `/admin/classes/{class_id}` | `base_annual_premium_eur` |
| GET, PATCH | `/admin/settings` | `insurance_score_start` (score of a new insurance, ≤ `max_score`); `max_score` is read-only |
| GET, PUT | `/admin/bands` | The discount bands `[{min_score, percent}]`. PUT replaces them all; scores and percents must both rise. `400` otherwise |
| GET | `/admin/rules` | All fix rules |
| POST | `/admin/rules` | A context rule: `risk_id`, `label`, `context` (applies_when grammar over the class's fields), `priority`, `points`, `half_life_years`. `400` on a bad context |
| PATCH | `/admin/rules/{rule_id}` | The numbers, `priority` (not for a default rule) and `active` |
| DELETE | `/admin/rules/{rule_id}` | `204`. `409` for a default rule |
| POST | `/admin/simulate` | `{"objects": [{"class_id", "profile", "history"}]}` → the `/me/insurances` shape. Nothing is saved |
| GET, PATCH | `/admin/partners`, `/admin/partners/{partner_id}` | Prices (min ≤ max), If discount, vetting, listing tier |
| GET, PATCH | `/admin/tiers`, `/admin/tiers/{index}` | Name, minimum aggregate score (between the neighbours), partner discount %, `bonuses` (list of texts) |

Rule choice (`engine.fix_value`): of a fix's active rules whose context matches the object's profile, the highest priority wins; the default rule (priority 0, no context) is the fallback. The points go to that insurance's score.

`GET /health` (no auth, outside `/v1`) returns `{"status": "ok"}` for docker compose.

## Not in phase 1
Photos and other document types as intake, notifications, partner bidding, family access, If staff endpoints, multiple homes per customer, real auth.
