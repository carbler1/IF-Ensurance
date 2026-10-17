# Care score: tiers, rewards and points

Status: decided in interview, 2026-10-17. Task 7 of `docs/rasitasks.md`. Author: Rasi (analyst), with Claude.
Scope: this document sets the tier names, the rewards, and the points for each fix. Antton converts it into `fixtures/score-tiers.json` and the catalogue. All numbers are mock values for the demo. The pitch says so.

## Summary

- The care score is a number from 0 to 1000.
- There are 4 tiers: Bronze, Silver, Gold and Platinum.
- A customer starts with an estimate from the first questionnaire. The estimate has a cap of about 450. That is inside Bronze.
- Verified fixes raise the score. A fix is verified when a partner, an inspector or a document confirms it. A customer answer is never proof.
- Silver gives a partner discount and offers on If products. Gold and Platinum add a lower deductible and a line that If may offer a better price.
- Each fix earns points from a rule: severity × probability. The score is scaled for each home, so every home can reach about 950 by fixing what applies to it.
- On-time re-checks can add up to 50 more points. This lifts a customer from 950 to 1000.

## 1. Tiers

| Tier | Finnish | Swedish | Score from |
|---|---|---|---|
| Bronze | Pronssi | Brons | 0 |
| Silver | Hopea | Silver | 500 |
| Gold | Kulta | Guld | 750 |
| Platinum | Platina | Platina | 850 |

- The names use the metals idea. They are well known in all three languages.
- A tier needs verified points. A customer who only answers questions can reach at most about 450 (Bronze).
- A customer drops a tier when the score falls below the tier line. The customer then has 90 days to renew a check. The benefits stay during the 90 days.

## 2. Rewards

| Reward | Bronze | Silver | Gold | Platinum |
|---|---|---|---|---|
| Partner discount | 0% | 5% | 10% | 15% |
| Lower deductible (omavastuu) | 0 EUR | 0 EUR | 100 EUR | 200 EUR |
| Offers on If products | – | Yes | Yes | Yes |
| "If may offer you a better price" and a button "ask If to review my premium" | – | – | Yes | Yes |

### 2.1 Why each reward works

| Reward | Why it is good for the customer | Why it pays off for If |
|---|---|---|
| Partner discount | The customer pays less for the fix. The discount makes fixing a risk cheaper right when the customer is motivated. | Partners fund the discount. They give it for guaranteed volume and vetted leads. It costs If nothing. More fixes mean fewer claims. |
| Lower deductible | The customer pays less after a claim. It is easy to understand. | If pays the difference only when a claim happens. A customer with a high score has a lower risk of a claim. |
| Offers on If products | A customer without an If plan gets a better offer for a well-kept home. | It brings new customers who are already low risk. If sees verified data before it sells. |
| Premium review line | The customer knows that care can lead to a better price. | A lead for the underwriters. The price stays in If's own hands. |

### 2.2 Rules for rewards

- If decides every price change. A lower premium is never automatic. The app says "may offer" and never "will offer".
- A customer who only answered questions can use no reward. The tier is locked until one item is verified. See section 5.
- The partner discount applies to fixes from partners that If has vetted.
- Free checkups paid by If are not in phase 1. The fixture now lists them. Antton sets them to an empty list.

## 3. Points for each fix

### 3.1 The rule

The weight of a fix is:

weight = severity × probability × 7, rounded to the nearest 10, with a cap of 150.

- Severity and probability are the values from `docs/cataloguereview.md`. Both use a scale from 1 to 5.
- No hand adjustment. Fire risks already rank high because their severity is 5.
- The weight is not yet the points. The app scales weights for each home (section 3.2).
- A fix has the same weight whoever does it.
- A diagnosis that ends in "verified, no work needed" earns the full weight.
- Advice-only risks have weight 0. This keeps the score tied to claims.

### 3.2 Scaling for each home

Each home has its own list of risks. A modern home may have 2 risks. An old home may have 13. The score scales so that both can reach about 950.

- W is the sum of the weights of all risks on the home's list.
- S0 is the start estimate (section 4).
- A verified fix with weight w earns this many points: (950 − S0) × w ÷ W.
- The score is S0 plus the points of all verified fixes, after decay.
- The score is limited to 1000.

### 3.3 Weight of every risk

| Category | Risk | Severity | Probability | Weight |
|---|---|---|---|---|
| Electricity | Electrical installation not checked in 15 years | 3 | 3 | 60 |
| Electricity | Old screw-fuse panel | 4 | 3 | 80 |
| Electricity | Electric sauna stove wiring not checked in 10 years | 4 | 3 | 80 |
| Electricity | Wet-room sockets without a residual-current device | 4 | 2 | 60 |
| Electricity | No surge protection | 3 | 3 | 60 |
| Electricity | EV charger or e-bike charging not checked | 5 | 3 | 110 |
| Fire safety | Too few or old smoke alarms | 5 | 4 | 140 |
| Fire safety | No stove guard (liesivahti) | 5 | 3 | 110 |
| Fire safety | No extinguisher or fire blanket | 4 | 3 | 80 |
| Fire safety | Gas or fuel stored in a basement or living space | 5 | 2 | 70 |
| Heating | Chimney not swept in the last year | 4 | 3 | 80 |
| Heating | Steel oil tank over 30 years old | 5 | 3 | 110 |
| Heating | Oil boiler near the end of its service life | 3 | 3 | 60 |
| Heating | Old radiators with surface rust | 3 | 2 | 40 |
| Heating | Oil tank room without a fire door or protection basin | 4 | 2 | 60 |
| Heating | Heat pump or ground system not serviced | 3 | 3 | 60 |
| Heating | Water pipes in unheated rooms | 4 | 3 | 80 |
| Moisture | Wet room without modern waterproofing | 4 | 4 | 110 |
| Moisture | False plinth risk structure not inspected | 5 | 3 | 110 |
| Moisture | Crawl space or basement not inspected for moisture | 4 | 3 | 80 |
| Moisture | No subsoil drains around the house | 4 | 3 | 80 |
| Moisture | Blocked wall ventilation gaps in a brick-clad wall | 4 | 3 | 80 |
| Moisture | Poor surface drainage next to the house | 4 | 4 | 110 |
| Moisture | Worn sealant in the wet room | 3 | 4 | 80 |
| Moisture | Wet-room waterproofing past its service life | 4 | 3 | 80 |
| Moisture | Cracked sealant at a balcony or terrace door | 3 | 3 | 60 |
| Moisture | Sewer backflow protection | 4 | 2 | 60 |
| Plumbing | Cast-iron floor drain in the wet room | 3 | 4 | 80 |
| Plumbing | Pipe renovation overdue in a 1960s to 1980s flat | 4 | 4 | 110 |
| Plumbing | Copper water pipes over 40 years old | 4 | 3 | 80 |
| Plumbing | Galvanized steel water pipes | 4 | 4 | 110 |
| Plumbing | Hot-water tank past its service life | 3 | 4 | 80 |
| Plumbing | Cast-iron sewer pipes over 50 years old | 4 | 3 | 80 |
| Plumbing | No leak tray under the dishwasher or washing machine | 3 | 4 | 80 |
| Plumbing | Old washing machine hoses or no own shut-off valve | 3 | 3 | 60 |
| Plumbing | No leak detector or automatic shut-off valve | 4 | 3 | 80 |
| Plumbing | Water not shut off during long absences | 4 | 3 | 80 |
| Roof | Bitumen felt roof over 25 years old | 4 | 4 | 110 |
| Roof | Steel sheet roof over 40 years old | 3 | 3 | 60 |
| Roof | Tile roof underlay over 30 years old | 4 | 3 | 80 |
| Roof | Tall trees that can fall on the house | 4 | 2 | 60 |
| Roof | Windows at the end of their service life | 2 | 4 | 60 |
| Roof | Wood cladding needs maintenance | 2 | 4 | 60 |
| Roof | Terrace needs maintenance | 2 | 4 | 60 |
| Roof | Wild animals in the roof or walls | 2 | 3 | 40 |
| Ventilation | Mechanical ventilation unit not serviced in 2 years | 2 | 4 | 60 |
| Ventilation | Natural ventilation in a house from before 2000 | 3 | 3 | 60 |
| Ventilation | Supply-air valve blocked | 2 | 4 | 60 |
| Building and documents | Building or extension without a permit | 4 | 2 | 60 |
| Building and documents | Wet-room or electrical work without documents | 4 | 3 | 80 |
| Security | Weak locks and no alarm | 3 | 3 | 60 |

### 3.4 Risks with weight 0

| Risk | Why |
|---|---|
| Radon not measured | Advice only. Not a claims driver. Weight 40 if a renovation is under way (severity 3, probability 2). |
| Asbestos and PAH survey missing | Advice only, unless a renovation is under way. Then weight 80. |
| Roof drains and gutters not cleaned each year | Advice only. An independent inspector can confirm the work. Then weight 80. |
| Low-pitch roof without a snow-load plan | Advice only. |
| No backup heat in a winter power cut | Advice only. |
| Fire barrier between row house units | Housing company risk. |
| Housing company renovation costs | Housing company risk. |
| Shared heat pump near the end of its service life | Housing company risk. |

### 3.5 The strongest and the weakest fixes

- The highest weight is 140: smoke alarms. Next are 110: oil tank, EV and e-bike charging, stove guard, wet-room waterproofing, false plinth, surface drainage, flat pipe renovation, galvanized pipes and bitumen roof.
- The lowest weight is 40: old radiators and wild animals.
- A cheap fix with a high severity, like smoke alarms, earns more than a costly fix with a medium severity, like a new hot-water tank. This is the intent.
- The old hand-set points in the catalogue (30 to 150) are replaced by this rule. The panel falls from 120 to 80. The chimney sweep rises from 30 to 80.

## 4. The start score

The start score S0 comes from the first questionnaire.

- S0 = 450 × (1 − open weight ÷ total weight of the home's possible risks).
- A risk is open if the customer answers "problem" or "don't know".
- A risk is cleared if the customer answers "fine". The risk stays on the list with the label "needs proof".
- S0 is never above 450.
- The app shows the score with the word "estimated" and locks the tier rewards until one item is verified.
- After the first verified item, the "estimated" label goes away.

Why 450: it keeps a customer in Bronze until work is proven. It stops a customer from earning Silver or Gold by answering "fine" to every question.

## 5. Keeping and losing points

- Points decay with the half-lives in `fixtures/half-lives.json`. A re-check restores the points. The formula is in `fixtures/score-tiers.json`.
- A claim never lowers the score.
- Fraud sets the benefit score to 0.
- Missed re-checks lower the score only through decay.
- On-time re-checks add up to 50 points. The bonus rewards a customer who keeps every re-check current on the maintenance list. It is the only way to reach above 950.
- A customer who drops below a tier line has 90 days to renew a check.

## 6. Demo example (1975 detached house)

The demo has one staged fixture. It makes the electrician fix cross into Silver.

With the phase 1 catalogue, the 1975 house has 13 risks. Their weights add up to W = 1040.

| Risk | Weight |
|---|---|
| Old screw-fuse panel | 80 |
| Electrical installation not checked | 60 |
| Sauna stove wiring | 80 |
| Wet-room sockets without RCD | 60 |
| Chimney not swept | 80 |
| Steel oil tank | 110 |
| Wet room without waterproofing | 110 |
| Crawl space or basement not inspected | 80 |
| No subsoil drains | 80 |
| Cast-iron floor drain | 80 |
| Copper pipes | 80 |
| Hot-water tank | 80 |
| Natural ventilation | 60 |
| **Sum** | **1040** |

Worked example:

- If the customer answers every question as "problem" or "don't know", S0 is low. Using the 20 phase 1 risks (total weight 1680), S0 = 450 × (1 − 1040 ÷ 1680) = 171.
- Each fix is then worth (950 − 171) × w ÷ 1040. The panel fix earns 60 points.
- For the demo, Antton seeds the customer with 6 earlier verified fixes: chimney sweep (80), sauna stove wiring (80), wet-room RCD (60), hot-water tank (80), natural ventilation (60) and electrical check (60). Together they weigh 420.
- The score before the demo is 171 + 779 × 420 ÷ 1040 = 486. This is just under Silver.
- The panel fix earns 779 × 80 ÷ 1040 = 60 points. The score becomes 546.
- The app shows: Silver unlocked, partner discount 5%, offers on If products.

Notes on the demo:

- The earlier numbers in the example content (1000 to 1120) must change to 486 to 546.
- If Antton adds the 38 new risks, W grows and each fix earns fewer points. Recompute the seed or the number of seeded fixes.
- The staged start is allowed. The pitch says the demo account is an existing customer. The numbers are mock.

## 7. Changes for Antton

1. Set `score_start` to the questionnaire estimate, not 1000. Add the cap of 450.
2. Replace the tier table in `fixtures/score-tiers.json`:

| Index | Name | Min score | Deductible reduction (EUR) | Partner discount (%) | Free checkups |
|---|---|---|---|---|---|
| 0 | Bronze | 0 | 0 | 0 | none |
| 1 | Silver | 500 | 0 | 5 | none |
| 2 | Gold | 750 | 100 | 10 | none |
| 3 | Platinum | 850 | 200 | 15 | none |

3. Add the reward flags `if_offers` (Silver and up) and `premium_review` (Gold and up).
4. Replace each `points` value in the catalogue with the weight in section 3.3. The app computes the earned points as in section 3.2.
5. Add the upkeep bonus (up to 50 points) and the cap of 1000.
6. Add the 90-day grace period before a tier drop.
7. Add the label "estimated" and the tier lock until the first verified item.
8. Update `fixtures/check.py` if it checks that points sum to the old values.

## 8. Facts, assumptions and unknowns

### Facts
- The score range, the tiers and thresholds, the rewards and the rules in this document come from the interview on 2026-10-17.
- Severity and probability come from `docs/cataloguereview.md`.
- The decay half-lives are mock values in `fixtures/half-lives.json`.

### Assumptions
- Partners accept to fund a discount of 5%, 10% and 15% for volume. No partner has agreed.
- A deductible reduction of 100 and 200 EUR is small enough for If to fund. If has not checked this.
- A customer will understand the score scale from 0 to 1000 and four metal tiers.
- The demo can use a staged account.

### Unknowns
- Whether Finnish insurance rules allow tier-based changes to the deductible. The spec lists this as not researched.
- The real value of an upkeep bonus for retention.
- Whether a customer who answers "fine" to all questions behaves honestly. The cap of 450 limits the damage.
- Whether a score on a scale from 0 to 1000 with a start estimate surprises customers who see it fall by decay.
- Whether radon should score at all during a renovation. I set the weight to 40.
