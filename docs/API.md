# API reference

This file lists the HTTP endpoints that the backend serves today. The backend is a FastAPI app in `backend/api.py`.

## Conventions

- Format: JSON in, JSON out. Document upload uses multipart form data.
- Customer routes use the prefix `/v1`. They need the header `Authorization: Bearer <CUSTOMER_TOKEN>`. The server reads `CUSTOMER_TOKEN` from the environment.
- Admin routes use the prefix `/v1/admin`. They need the header `X-Admin-Token: <ADMIN_TOKEN>`. The server reads `ADMIN_TOKEN` from the environment. The customer token does not work on admin routes.
- CORS (cross-origin resource sharing): the server allows the origins in `CORS_ORIGINS` (comma-separated). It allows GET, POST and PUT. The admin PATCH, PUT and DELETE calls are made from the dashboard server, not from a browser.
- The demo has one customer, `cust_01`, and one home, `home_01`. Every customer route works on these two records.
- A job is one run of the document pipeline. A job has the stages `extracting`, `matching` and `writing`.

## Errors

Every error has this shape:

```json
{"error": {"code": "not_found", "message": "Risk x not found."}}
```

| HTTP | Code | When |
|---|---|---|
| 400 | `bad_request` | The body or a field is not valid, or a rule check fails (for example, a price minimum above the maximum). |
| 400 | `unsupported_document` | Upload: `type` is not `kuntotarkastus`, or the file is not a PDF. |
| 400 | `too_large` | Upload: the file is larger than 20 MB. |
| 401 | `unauthorized` | The token is missing or wrong. |
| 404 | `not_found` | The home, job, risk, booking, task or admin record does not exist. |
| 409 | `conflict` | The request conflicts with stored state. The server changes nothing. |
| 500 | `internal_error` | An unexpected server error. |

## Public

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | none | Liveness check. Returns `{"status": "ok"}`. |

## Customer routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/v1/homes/me` | bearer | Read the home, its profile and its documents. |
| POST | `/v1/homes/me/documents` | bearer | Upload a document and start a job. |
| GET | `/v1/jobs/{job_id}` | bearer | Read the status of a job. |
| GET | `/v1/homes/me/risks` | bearer | List the current risks. |
| GET | `/v1/homes/me/risks/{risk_id}` | bearer | Read one risk with evidence and partners. |
| GET | `/v1/homes/me/maintenance` | bearer | List maintenance items with due dates. |
| GET | `/v1/me/insurances` | bearer | List the customer's insured objects with fixes, points and premiums. |

### GET /v1/homes/me

Response fields:

| Field | Meaning |
|---|---|
| `home_id` | Home id (`home_01`). |
| `address` | `street`, `postal_code`, `city`. |
| `profile` | Profile fields, stored as JSON. |
| `documents` | List of `document_id`, `type`, `uploaded_at`, `status`. |

Errors: 404 if the home or its profile is missing.

### POST /v1/homes/me/documents

Request (multipart form):

| Field | Meaning |
|---|---|
| `file` | The PDF. Maximum 20 MB. The server checks that the file starts with `%PDF-`. |
| `type` | Must be `kuntotarkastus` (a Finnish condition inspection report). |

Response `202`: `document_id`, `job_id`.

Errors: 400 `unsupported_document`, 400 `too_large`, 400 `bad_request` (missing field).

### GET /v1/jobs/{job_id}

| Field | Meaning |
|---|---|
| `job_id` | Job id. |
| `status` | `queued`, `running`, `done` or `failed`. |
| `stage` | `extracting`, `matching` or `writing` while `running`. Otherwise `null`. |
| `started_at`, `finished_at` | Times, or `null`. |
| `error` | `null`, or an object with `code` and `message` when the job failed. |

The worker fails a job that runs longer than 180 s. It checks the time between pipeline stages, so a job can run past 180 s inside one stage. The error code is then `timeout`. A job that was running when the worker restarted fails with the code `worker_restart`. Other pipeline failures use the error's own code, or `pipeline_error`.

Errors: 404 if the job does not exist.

### GET /v1/homes/me/risks

Response: `generated_at` and `risks`.

The list holds at most 5 risks. The order is: risks that the catalogue matched first, then risks that the language model proposed. Inside each group, a higher severity times probability comes first. A tie sorts by `risk_id`. A risk that a partner confirmed is not listed.

Each risk has these fields:

| Field | Meaning |
|---|---|
| `risk_id`, `category`, `title` | Identity and text. |
| `severity`, `probability` | Numbers used for the order. |
| `why`, `benefit` | Explanation texts. |
| `points_available` | Score points the fix gives. Staff rules set this value. |
| `partner_category` | The kind of partner that does the fix. |
| `llm_proposed` | `true` if the language model proposed the risk. |
| `status` | `open` or `booked`. |

### GET /v1/homes/me/risks/{risk_id}

The response has all risk fields above, plus:

| Field | Meaning |
|---|---|
| `evidence` | List of `document_id`, `page`, `quote`. `page` is `null` if no page holds the quote. |
| `mitigation` | Object with `action`. |
| `partners` | Up to 3 vetted partners in the home's city, sorted by rating (highest first). Each partner has the fields that `db.partners` returns, without `categories` and `listing_fee_tier`. |

Errors: 404 if the risk is unknown or not in the current list.

### GET /v1/homes/me/maintenance

Response: `items`. Each item has `item_id`, `risk_id`, `title`, `due_at` (date), `interval_years`, `status` (`overdue`, `upcoming` or `scheduled`) and `partner_category`. An item is `upcoming` when it is due within 90 days.

### GET /v1/me/insurances

Response: the simulation result. It has `objects` (one per insured object, with `fixes`, `score`, `band`, `premium`), `aggregate` (score and tier), `premium` totals and `model`. Each fix has `risk_id`, `title`, `points`, `why` and `benefit`.

## Mobile app routes

These routes use the customer bearer token. Each route returns the full app data, so the app needs one call per action.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/v1/me/app` | bearer | Read all app data for `cust_01`. |
| POST | `/v1/me/bookings` | bearer | Book a fix. Returns `201`. |
| POST | `/v1/me/bookings/{risk_id}/advance` | bearer | Move a booking one step on. |
| PUT | `/v1/me/reminders/{task_id}` | bearer | Switch a task reminder on or off. |

App data fields: `customer`, `home`, `model`, `tiers`, `insurances`, `aggregate`, `risks`, `history`, `bids`, `tasks`, `reminders`.

POST `/v1/me/bookings` request:

| Field | Meaning |
|---|---|
| `risk_id` | The risk to book. |
| `bid_id` | The partner bid. |
| `mode` | `hire` or `diy`. |

Errors: 400 if `mode` is another value. 404 if the risk or bid is unknown. 409 if the risk already has a booking.

POST `/v1/me/bookings/{risk_id}/advance` has no body. A booking has steps 0, 1 and 2. Each call adds one step up to 2. Step 2 confirms the fix. At step 2 the call changes nothing. Errors: 404 if there is no booking.

PUT `/v1/me/reminders/{task_id}` request: `{"on": true}`. Errors: 404 if the task does not exist.

## Admin routes

All admin routes need `X-Admin-Token`. A missing or wrong token returns 401.

| Method | Path | Purpose | Request fields | Errors |
|---|---|---|---|---|
| GET | `/v1/admin/overview` | Counts of customers, homes, documents, work orders, bookings, rules, classes. | none | |
| GET | `/v1/admin/customers` | Customers with simulated scores. | none | |
| GET | `/v1/admin/classes` | Insurance classes with risks and base premium. | none | |
| PATCH | `/v1/admin/classes/{class_id}` | Set the base premium. | `base_annual_premium_eur` (0 to 1,000,000) | 404 |
| GET | `/v1/admin/settings` | Read the starting score and maximum score. | none | |
| PATCH | `/v1/admin/settings` | Set the starting score. | `insurance_score_start` | 400 if above the maximum |
| GET | `/v1/admin/bands` | Read the discount bands. | none | |
| PUT | `/v1/admin/bands` | Replace all discount bands (1 to 10). | `bands[]`: `min_score`, `percent` | 400 if a band starts above the maximum, or scores and percents do not both rise |
| GET | `/v1/admin/rules` | List fix rules. | none | |
| POST | `/v1/admin/rules` | Create a fix rule. Returns `201`. | `risk_id`, `label`, `context`, `priority`, `points`, `half_life_years` | 404 unknown risk, 400 bad context |
| PATCH | `/v1/admin/rules/{rule_id}` | Change a rule. | `points`, `half_life_years`, `active`, `priority` (optional) | 404 |
| DELETE | `/v1/admin/rules/{rule_id}` | Delete a rule. Returns `204`. | none | 404, 409 for a default rule |
| POST | `/v1/admin/simulate` | Simulate scores for given objects. | `objects[]`: `class_id`, `profile`, `history`, optional `object_id`, `name` | 400 unknown class |
| POST | `/v1/admin/demo/reset` | Clear demo bookings and reminders. Returns `{"status": "reset"}`. | none | |
| GET | `/v1/admin/partners` | List partners. | none | |
| PATCH | `/v1/admin/partners/{partner_id}` | Change a partner. | `price_min`, `price_max`, `tier_discount_percent`, `if_vetted`, `listing_fee_tier` (`basic` or `plus`) | 404, 400 if min above max |
| GET | `/v1/admin/tiers` | List tiers. | none | |
| PATCH | `/v1/admin/tiers/{tier_index}` | Change a tier. | `name`, `min_score`, `partner_discount_percent`, `bonuses[]` | 404, 400 if `min_score` is not between the tiers below and above |

A default rule has an id that starts with `default.`. Staff can switch it off but not delete it. Its priority does not change.
