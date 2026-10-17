# Demo house choice

Status: decided, 2026-10-17. Task 1 of `docs/rasitasks.md`. Author: Rasi (analyst).

## Decision

The demo house is the **1975 detached house** (omakotitalo) in Turku.

Sample report: `samples/synthetic/1975-omakotitalo-oljylammitys.md`.

Antton and Ege keep the current example content. Antton does not rewrite it.

## Why this house

1. **It has the most risks.** The catalogue gives 13 risks for this house. The 1992 flat gives 2. The 2010 row house gives none. A demo needs a risk list that is worth reading.
2. **The risks are serious and easy to understand.** The old screw-fuse panel, the 51-year-old oil tank and the missing wet-room waterproofing are risks that an average Finnish person understands at once. Each one can end in a fire, an oil leak or a water damage.
3. **The customer can fix every risk.** In a detached house the owner controls the whole building. The owner can book a partner for each risk. In the 1992 flat the housing company controls the pipes, the roof and the facade. The customer cannot book a partner for those.
4. **The booking and score story works.** The homeowner books an electrician for the panel. The electrician confirms the fix. The score goes from 1000 to 1120. This is the full demo flow from the task list.
5. **It matches the risk assessment.** In `docs/riskassesment.md`, the detached house has the most hazard categories. The 1975 report touches many of them: fire, electrical, water, moisture, oil tank, roof, drainage and windows.
6. **The example content is done.** Ege can design with it now.

## Why not the other two

| House | Risks in the catalogue | Problem for the demo |
|---|---|---|
| 1992 flat | 2: hot-water tank, ventilation service | The list is short and both fixes are small. The housing company already renewed the pipes and the panel in 2019. The demo shows no big gain. |
| 2010 row house | 0 | The risk list is empty. The booking and score story cannot be shown. |

The two other houses are still useful. They show that the app does not invent risks. Use them as a short second case in the pitch: "a modern home gets a clean report". Do not use them as the main demo.

## What the demo shows

The demo follows the flow in `docs/rasitasks.md`:

1. The customer uploads the 1975 inspection report (kuntotarkastus).
2. The app shows the risk list. The highest risks are first.
3. The customer opens one risk, for example the old screw-fuse panel. The app shows the partners.
4. The customer books an electrician.
5. The electrician confirms the fix.
6. The care score goes from 1000 to 1120.

Task 8 holds the full story of what the customer, If and the partner each gain.

## What the choice means for the others

- **Ege:** design with the 1975 house content. No change.
- **Antton:** no rewrite. The 1975 house needs a few more facts and risks, listed in `docs/missingrisks.md` (task 2). These are optional for the demo.
- **Rasi:** write the demo story for the 1975 house (task 8).

## Message for Antton and Ege

Copy this message to Antton and Ege. This document cannot send it.

> The demo house is the 1975 detached house. Keep the current example content. No rewrite. Details: `docs/demohouse.md` on branch `rasi`. The list of missing risks follows in `docs/missingrisks.md`.
