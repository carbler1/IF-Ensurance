# API fixtures

These are the fixtures Ege uses until the backend runs. Each file is one example response from `docs/systemdesign/api-contract.md` (v0.2), with the field names, types and ids the backend will return. Risk ids come from `data/catalogue.json`; partner ids and names from `fixtures/partners.json`; the home from `fixtures/homes/1975-detached.json`.

All files tell one story: the customer uploads a kuntotarkastus (condition inspection report) for the 1975 detached house, the risk list appears, they book an electrician for the screw-fuse panel, the partner confirms, and the care score goes from 1000 to 1120.

| File | Method and path | State of the story |
|---|---|---|
| `homes-me.json` | GET `/homes/me` | After the document is processed: the full 20-field profile, one processed document |
| `documents-post.json` | POST `/homes/me/documents` (202) | The upload was accepted and job `job_01` started |
| `jobs-running.json` | GET `/jobs/job_01` | The job is running, stage `matching` |
| `jobs-done.json` | GET `/jobs/job_01` | The job finished; the risk list is ready |
| `jobs-failed.json` | GET `/jobs/job_01` | Alternative outcome: the job hit the 180 s timeout |
| `risks.json` | GET `/homes/me/risks` | Five open risks, ordered by severity × probability |
| `risk-detail.json` | GET `/homes/me/risks/elec.panel.screw_fuse` | The panel risk with evidence, mitigation and the three electricians sorted by rating |
| `work-orders-post.json` | POST `/homes/me/work-orders` (201) | The customer booked `p_03` for the panel; the risk is now `booked` |
| `work-orders.json` | GET `/homes/me/work-orders` | The one booked work order |
| `work-order-confirm.json` | POST `/work-orders/wo_01/confirm` | The partner confirmed; score event +120 |
| `score.json` | GET `/homes/me/score` | After the confirm: score 1120, tier 0, 80 points to tier 1 |
| `maintenance.json` | GET `/homes/me/maintenance` | After the confirm: the panel item is rescheduled to 2041; the others have no evidence, so they are due on the profile creation date (2026-10-17) |
| `error-409.json` | POST `/work-orders/wo_01/confirm` (409) | A second confirm: error `already_confirmed`, nothing changed |

Run the checker from the repo root:

```
nix shell --impure --expr '(import <nixpkgs> {}).python3.withPackages (p: [p.jsonschema])' -c python3 -I fixtures/api/check.py
```

It loads every file, checks the field names of each object against the contract, and checks that every `risk_id` exists in the catalogue and every `partner_id` in the partner table. Exit 0 means clean.
