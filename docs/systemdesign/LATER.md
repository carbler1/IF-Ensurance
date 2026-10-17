# Later

Things we will use later, or could use later. Phase 1 does not build them. `docs/systemdesign/DESIGN.md` holds what we build now.

## 1. Product modules (module and interface only)

| Module | Does | Reads | Writes | Plugs in at |
|---|---|---|---|---|
| Full store | Keeps every input, prompt, raw model text, model name, prompt version, `prompt_eval_count`, profile version, list and event. Phase 2 insights need it | pipeline steps | `llm_calls`, `profile_versions`, `events` tables | each pipeline step and endpoint write |
| If staff insights | Underwriters, claims handlers, sales and partner managers see the data (spec §3.3) | full store | notes, flags | read-only over the full store |
| Judge | A second model (gpt-oss:20b) checks low-confidence entries and missed risks. VRAM switching costs 2 to 10 s | write step output, profile | `doubt` flags | a step after the write step |
| More intake | Sale listings, energy certificates, isännöitsijäntodistus, work history, scanned PDFs as page images, technical photos with a vision model. Photos give facts only, never criticality | new document types | profile candidates | one extract prompt per type |
| Open registers | Ryhti open building layer (CC BY 4.0): build year, material, heating for an address | Ryhti | candidates with `source: register` | merge step |
| Partner page | Partners see bookings, confirm jobs and bid (kilpailutus) | work orders | confirmations, bids | replaces the curl confirm |
| Retention | Seasonal reminders, weather alerts (FMI CAP feed, CC BY 4.0), score progress, law changes (spec §11) | maintenance list, FMI, home location | notifications | reads the maintenance list |
| Access levels | General list without a plan; tailored list and benefits for plan holders; offers above a score threshold (spec §4) | the customer's plan (mock) | — | a filter on the risk list and the score |
| Family delegation | A relative acts for the customer with strong e-ID, as Suomi.fi does (spec §3.2) | delegation records | — | auth |
| Ownership check | Verifies that the customer owns the home | registers | — | before benefits apply |
| Car, life events | New possession types with their own catalogues and scores; the care score combines them | new catalogues | per-possession scores | a `possession` level above `homes` |
| Expo app | Port the Lovable screens to Expo (React Native). Lovable stays the design source | the API | — | the same contract |
| Hosting | Backend and worker as NixOS services on pc-btw. Secrets in an EnvironmentFile outside the Nix store. A stable hostname instead of the quick tunnel | — | — | — |
| Translation | Finnish and Swedish for the demo (phase 3) | UI strings, model texts | — | — |

## 2. Pipeline hardening

- Merge by trust rank: `partner > document > register > customer`; same rank, newer wins. Confidence below 0.5 sets `doubt: true`. Clamp confidence to [0, 1]. An `"unknown"` candidate never replaces a known value (phase 1 already does this). Until trust rank exists, a later upload can overwrite a `source: partner` fact.
- Writer `doubt` flag with a reason, shown to If staff. It does not change the score.
- Drop a candidate whose quote is not in the page text. Normalise CRLF first.
- Check each candidate value against the field type in the profile schema.
- Restrict the write schema per call: item ids to the matched ids, proposed ids to the unmatched ids.
- Check that "up to N care points" in a `benefit` text equals the entry's points.
- Above 20 matched entries, trim the unmatched list in the write call.
- Keep the system prompt byte-identical between calls, so that Ollama reuses its cache.
- Delete the PDF after the job; keep only the quotes.
- Seed flag that loads `fixtures/homes/1975-detached.json` as a fallback when Ollama is down.

Measurements from pc-btw (2026-10-17, Ollama 0.32.3): server default `num_ctx` is 4096; schema output valid on 103 of 103 calls; whole-report extraction takes 12 to 19 s; `qwen3.5:4b` invented 31 % of values and is not a fallback; thinking on makes a call take 54 s and cuts the JSON.

## 3. Score and rewards

Rasi decides the numbers and names in prose. Antton converts them into `fixtures/score-tiers.json` and the catalogue.

- Decay: points × `0.5 ^ (years_since / half_life_years)`, computed at read time. Phase 1 uses the mock half-lives in `fixtures/half-lives.json`.
- Penalties: missed maintenance, claims. Fraud sets the benefit score to 0. Phase 1 has no penalties.
- Slots with mock values: tier thresholds 1000/1200/1500/2000; tier names `TBD-0` to `TBD-3`; deductible reduction 0/50/100/150 €; free checkups none/plumbing/+electrical/+roof; partner discount cap 0/5/10/10 %.
- Not set: missed-maintenance penalty, claim penalty, "good enough" score without a plan, weight of spending on If products.
- No premium change until Rasi's legality memo. Finnish insurers today waive the deductible after an alarm limits damage.

## 4. Catalogue upkeep

From Rasi's prose to entries: Antton or a chat agent reads the prose and edits the entry JSON. `validate.py` checks it. Rasi reads the result for meaning.

Drafting rules:
- The prose is the only source. Add no knowledge of your own.
- Severity 1 small, 2 minor, 3 moderate, 4 severe (fire, structural damage), 5 loss of the house or a life. Probability 1 rare to 5 expected. A number in the text wins.
- Numbers come from the text. A missing number stays a gap.
- A build-year range uses `gt` on the year before and `lt` on the year after.
- `half_life_years` defaults to `check_interval_years`.
- `known_quirks` holds only claims the text makes.
- The condition must be false after the fix: one `tests.reject` profile has the `on_done` facts applied.

Known fixes:
- `on_done` becomes a list, so confirming one job can close sibling entries (panel + electrical check, ventilation + service date).
- The validator type-checks `lt` and `gt` values.
- `plumb.water_heater.age` fires on a district-heated flat: the profile cannot say "no tank".
- The grammar has no "today". Six entries hard-code dates and need a yearly review.
- `source` fields are placeholders. Rasi's analysis fills them.

## 5. Data consistency

The synthetic 1975 report, its PDF, `fixtures/homes/1975-detached.json`, `fixtures/api/` and `prompts/examples/*-1-*` tell the same story since 2026-10-17.

Other gaps:
- The extract system prompt (since version 2) says "a report, or one part of it". The new wording is untested. Version 3 changed rule 3 and the `last_ventilation_service` line; also untested.

## 6. Tests

| Test | Status |
|---|---|
| `validate.py`: entries validate, per-entry match and reject tests pass | exists |
| `fixtures/check.py`: sample homes and partner rules | exists, exits 1 on any error |
| `fixtures/api/check.py`: fixture files parse | exists |
| Matcher unknown cases | later |
| Endpoint key sets against `fixtures/api/` | later |
| A job on a fake Ollama client | later |
| Golden extraction on the 1975 report, by hand on pc-btw | later, needs §5 fixed |
| Confirm twice gives 409; score at a fixed date | later |

## 7. Security and operations

- Run the tunnel only during tests and the demo.
- Use synthetic or own documents only. Delete `var/` after the event.
- The repo becomes public at submission. No network details, tokens or real addresses in git.

## 8. Pitch notes

- Mocked, honest in the pitch: fraud-proof verification, premium changes, the partner network, strong e-ID, partner confirmation, score numbers.
- Precedent: If's Kunnon Koti (a partner inspects detached houses every 4 years and writes a checklist report, no effect on the premium). This service is the continuous, scored, rewarded version.

## 9. Open questions

- When does the service verify ownership of the home?
- What trust level does an uploaded document have?
- What score is "good enough" for benefits without a plan? Tiers, rewards, ageing, weight of If products: Rasi.
- Are premium and deductible changes legal under Finnish insurance rules? Rasi's legality memo.
- Does the partner filter use the municipality or a distance?
- When does the matcher get a reference date ("N years before today")?
