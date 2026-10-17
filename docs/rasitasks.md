# Rasi: tasks

Role: analyst.  Put your documents in `docs/` on your branch `rasi`. Make one commit for each completed task.

Demo flow: upload a kuntotarkastus PDF, wait for the job, see the risk list, open one risk with its partners, see the maintenance list, book a partner, the partner confirms the fix, the care score rises.

Do tasks 1 and 2 first. Antton and Ege wait for them.

1. Pick the demo house from the 3 sample reports in `samples/synthetic/`: the 1975 detached house, the 1992 flat or the 2010 row house. Tell Antton and Ege at once.

   The choice decides the example content Ege designs with. Now all example content tells the 1975 house story. Another choice means Antton rewrites it. With the current catalogue, the cases are:
   - **1975 detached house:** 13 risks, for example the old screw-fuse panel, the old oil tank and the missing waterproofing in the wet room. The homeowner books an electrician for the panel, the electrician confirms, and the score goes from 1000 to 1120. The example content for this case is already done.
   - **1992 flat:** 2 risks: the hot-water tank and the ventilation service. The list is short, and both fixes are small.
   - **2010 row house:** no risks. The risk list is empty, so the booking and score story cannot be shown.
2. Read the 3 sample reports. List the risks that a real inspector would flag and that the catalogue does not have. For each new risk, name the house facts that trigger it, so Antton can add any facts the app does not collect yet.
3. Review the 20 entries in the risk catalogue (`data/catalogue/`). For each entry, state:
   - Whether it is a real risk in Finnish houses.
   - How bad it is (severity).
   - How likely it is (probability).
   - Which house facts trigger it.

   The 20 risks now in the catalogue. Severity and probability use a scale from 1 (low) to 5 (high).

   | Category | Risk | Severity | Probability |
   |---|---|---|---|
   | Electricity | Electrical installation not checked in 15 years | 3 | 3 |
   | Electricity | Old screw-fuse panel | 4 | 3 |
   | Electricity | Electric sauna stove wiring not checked in 10 years | 4 | 3 |
   | Electricity | Wet-room sockets without a residual-current device (a safety switch that cuts power on a leak to earth) | 4 | 2 |
   | Heating | Chimney not swept in the last year | 4 | 3 |
   | Heating | Steel oil tank over 30 years old | 5 | 3 |
   | Moisture | Wet room without modern waterproofing | 4 | 4 |
   | Moisture | False plinth risk structure not inspected | 5 | 3 |
   | Moisture | Crawl space or basement not inspected for moisture | 4 | 3 |
   | Moisture | No subsoil drains around the house | 4 | 3 |
   | Plumbing | Cast-iron floor drain in the wet room | 3 | 4 |
   | Plumbing | Pipe renovation overdue in a 1960s to 1980s flat | 4 | 4 |
   | Plumbing | Copper water pipes over 40 years old | 4 | 3 |
   | Plumbing | Galvanized steel water pipes | 4 | 4 |
   | Plumbing | Hot-water tank past its service life | 3 | 4 |
   | Roof | Bitumen felt roof over 25 years old | 4 | 4 |
   | Roof | Steel sheet roof over 40 years old | 3 | 3 |
   | Roof | Tile roof underlay over 30 years old | 4 | 3 |
   | Ventilation | Mechanical ventilation unit not serviced in 2 years | 2 | 4 |
   | Ventilation | Natural ventilation in a house from before 2000 | 3 | 3 |

   The app ranks risks by severity × probability, highest first. Each entry also holds a "why it matters" hint, a "what you gain" hint, a fix, a re-check interval and a service life.
4. Rewrite the customer text for each risk: "why it matters" and "what you gain". Use plain words.
5. Map each risk to the type of partner that fixes it. Check the map against `data/partner-categories.json`.
6. Give each risk a re-check interval in years, for the maintenance list.
7. Care score. The homeowner starts at 1000 points and earns points when a partner confirms a fix. Higher scores reach higher tiers with rewards. All numbers in `fixtures/score-tiers.json` are placeholders. Write:
   - A name for each tier.
   - Which rewards make sense for the customer and pay off for If (for example, a lower deductible, free check-ups, partner discounts).
   - How many points each fix should earn, compared with the others.
8. Write the demo story for the chosen house: what the customer, If and the partner each gain.
9. Prepare the submission PDF. Structure it on the 4 judging criteria in `docs/ifchallengedescription.md`:
   - Customer value and relevance.
   - Business value for If.
   - Feasibility and scalability.
   - Innovation and experience.
10. Make the video and the pitch together with Ege.
