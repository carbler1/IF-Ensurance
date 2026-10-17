# Demo story: the 1975 house

Status: draft, 2026-10-17. Task 8 of `docs/rasitasks.md`. Author: Rasi (analyst).
Inputs: `docs/demohouse.md` (the house), `docs/carescore.md` (the numbers), `fixtures/partners.json` (the partners), `samples/synthetic/1975-omakotitalo-oljylammitys.md` (the report).

## Summary

This document tells the demo story. It shows what the customer, If and the partner each gain.

The story in one sentence: a homeowner uploads an old inspection report, sees the five risks that matter, books an electrician for the old fuse box, and watches the care score rise and unlock Silver.

All people, companies and numbers are fictional. The numbers are mock values.

## 1. The people

| Who | Role in the story |
|---|---|
| Kari | The homeowner. They are 68. They have lived in the 1975 house in Turku since 1993. They have an inspection report (kuntotarkastus) from 14 October 2026. They are not an expert and they do not want to read a long report. |
| Kari's daughter | A family member who helps. She is optional in the story. She acts for Kari with Kari's permission (delegated authorisation, like Suomi.fi). |
| Sähköasennus Aurasilta Oy | The partner. A vetted electrician in Turku. Rating 4.7. Price range 350 to 900 EUR for the visit. The partner is fictional. |
| If | The insurer. If staff see the verified data in their own view. |

## 2. The situation

Kari ordered the inspection report because the house is getting old. The report says "much to repair" (paljon korjattavaa). It names 6 key risks and 8 action items. Kari does not know where to start. Kari does not know which problem is dangerous and which one can wait.

Kari opens the app and uploads the report.

## 3. The story, scene by scene

The story has 9 scenes. The scene numbers follow the demo flow in `docs/rasitasks.md`. The video needs about 2 minutes 30 seconds.

### Scene 1: Upload the report (15 seconds)

- Kari uploads the PDF of the inspection report.
- The app says that it is reading the report. The state of the document is "waiting", then "read".
- The app does not ask 40 questions. It reads the facts from the report.

### Scene 2: The app reads the house (15 seconds)

- A short wait while the app works. It takes up to a few minutes in real life. The video cuts the wait.
- The app shows the facts that it found: built in 1975, oil heating, screw-fuse panel, copper pipes. Each fact shows where it came from: the report.
- Facts that the report does not give show as unknown. The app asks Kari 3 simple questions.

### Scene 3: The risk list (20 seconds)

- The app shows 5 risks, with the most serious first. The report holds more findings than that. The app does not show them all.
- The 5 risks are, in order:
  1. Wet room without modern waterproofing
  2. Steel oil tank over 30 years old
  3. Old screw-fuse panel
  4. Crawl space or basement not inspected for moisture
  5. No subsoil drains around the house
- Each risk has a short reason ("why it matters") and a short benefit ("what you gain"). The text is in `docs/customertext.md`.
- The copper water pipes and the cast-iron floor drain are 6th and 7th. The app keeps them for later.

The list is short because the app ranks risks by severity × probability. The app shows only what matters.

### Scene 4: Open one risk (25 seconds)

- Kari does not start with the biggest risk. A new wet room and a new oil tank cost thousands of euros. Kari picks the fuse box. The fuse box is cheap and takes one visit.
- Kari opens "Old screw-fuse panel". The screen shows:
  - **Why it matters:** "Your fuse box is old. It uses screw-in fuses. The fuse holders can come loose and get hot. A hot holder can start a fire."
  - **What you gain:** "An electrician checks the panel and can replace it. You get modern fuses and a safety switch."
  - **The quote from the report:** "Sähkökeskus on alkuperäinen tulppasulakekeskus." (page 16)
  - **Three recommended companies:**

| Company | Rating | Price range | If-vetted | Discount |
|---|---|---|---|---|
| Sähköasennus Aurasilta Oy | 4.7 | 350 to 900 EUR | Yes | 0% now |
| Liedon Sähkötiimi Oy | 4.2 | 300 to 4000 EUR | Yes | 0% now |
| Pikasähkö Hirvensalo Oy | 3.8 | 200 to 1800 EUR | No | 0% now |

- The discount is 0% now because Kari is in Bronze. The app shows a small line: "Reach Silver and get 5% off your next job."

### Scene 5: Book the electrician (15 seconds)

- Kari taps "Book" on Sähköasennus Aurasilta Oy.
- The app shows a confirmation. The risk is now "booked".
- Kari's daughter gets a message. She can see the booking.

### Scene 6: The electrician does the job (15 seconds)

- A cut in the video. The electrician visits, checks the panel and replaces it with automatic fuses and a residual-current device (a safety switch that cuts the power on a leak to earth).
- The electrician confirms the work in the app. The confirmation holds a short report and the date.
- The proof comes from the electrician. Kari cannot confirm it. This is the core rule of the service.

### Scene 7: The score rises (25 seconds)

- Kari gets a message: "Your fix is confirmed."
- The risk "Old screw-fuse panel" is now "done".
- The care score moves from **486** to **546**. The app shows the reason: "+60, electrical panel replaced".
- The tier changes from Bronze to **Silver**. The app shows what Silver gives:
  - 5% off the next job from a vetted partner.
  - Offers on If products.
- The app also shows the next tier: Gold at 750 points. It shows how many points Kari needs.

### Scene 8: The maintenance list (15 seconds)

- The maintenance list now shows the new tasks. The panel was replaced, so the next electrical check is in 15 years.
- The list shows other tasks with a due date and a state: overdue, due soon or scheduled. Examples: the chimney sweep, the hot-water tank, the oil tank inspection.
- A reminder goes to Kari when a task comes due. The app brings Kari back.

### Scene 9: The next step (10 seconds)

- Kari taps the oil tank risk. The app shows the same recommended companies, now with a 5% discount for the heating technician.
- The story ends with the app showing the score history: what raised the score, and by how much.

## 4. What each party gains

### 4.1 The customer

| What the customer gets | Why it matters |
|---|---|
| A short list of what matters | The report names 6 key risks and 8 action items in a long document. The app turns it into 5 risks. Kari knows where to start. |
| A reason in plain words | Each risk says why it matters and what Kari gains. No expert terms. |
| The proof from the report | The app shows the quote and the page. Kari can trust the risk. |
| Companies that If has vetted | Kari does not search for an electrician. The app shows rating, price range and discount. |
| A safer home | A new panel removes a cause of electrical fires. |
| A stronger insurance position | If the panel fails, the payment can be cut by an age deduction on old electrical equipment (terms 6.2.1.4). A new panel restarts the age. The If terms also ask that faulty electrical work is repaired and that approved installers do it (terms 5.2.7 and 5.2.8). |
| A reward | Silver gives 5% off the next job and offers on If products. Gold and Platinum add a lower deductible (omavastuu). |
| A record of the home | The score history shows every fix with a date and proof. This helps when Kari sells the house. |
| Help from the family | Kari's daughter can follow along and act for Kari. |

### 4.2 If

| What If gets | The mechanism |
|---|---|
| Fewer claims | Each fix removes a cause of claims. A fire from an old panel is one of the worst claims. |
| Verified risk data | An electrician confirms the panel type. If knows the real state of the home, not a guess. Underwriters see it in their own view. |
| Better claim documents | When a claim comes, the maintenance history is ready. Claims handlers work faster. |
| Retention | The maintenance list and the score bring Kari back every year. A customer with a home file and a reward has a reason to stay. |
| Acquisition | The report upload and Silver offers reach people who are not customers yet. A customer with a verified home is a low-risk lead. |
| A partner network | If vetted partners and sees their quality. Partners pay for listing and for volume. |
| Insight for sales | If staff see which risks customers have and which products fit. |
| A step beyond Kunnon Koti | Kunnon Koti is a partner inspection every 4 years with a report. This service is continuous, scored and rewarded. |

If keeps control of price. A lower premium is never automatic. The app says "may offer".

### 4.3 The partner

| What the partner gets | The mechanism |
|---|---|
| A ready customer | The customer has a documented risk with a quote from the report. The partner does not need to sell the need. |
| Volume | If sends vetted customers. The partner funds a small discount (5% at Silver, up to 15% at Platinum) in return for this volume. |
| Less work | The partner does not write a long offer. The partner confirms the work in the app in a few minutes. |
| A better reputation | The confirmation is proof of work. Rating and If-vetted badge help the partner win the next job. |
| Repeat work | The maintenance list brings the customer back at the right time: the next check, the next service. |
| A clear job | The risk tells the partner what to do. For example: inspect the panel and replace it with automatic fuses and a residual-current device. |

## 5. How the story ties to the judging criteria

| Criterion | What the story shows |
|---|---|
| Customer value and relevance | A real need: an owner of an old house who does not know where to start. The value is easy to see: 5 risks, a fix, a reward. |
| Business value for If | Fewer claims, verified data, retention and acquisition. The partner network pays for part of it. |
| Feasibility and scalability | Code matches facts to a catalogue of 58 risks. A model only reads documents and writes text. Partners confirm the work. The same method works for other homes and other possessions. |
| Innovation and experience | Insurance moves from claim time to care time. The customer sees a score, a tier and rewards. Insurance is not the centre of the experience. |

Task 9 builds the full submission from this table.

## 6. What is real and what is mocked

| Part | Real or mock |
|---|---|
| The inspection report | Synthetic. A fictional report for a fictional address. |
| Reading the report | Real in the prototype. A model reads the report and writes the text. |
| The risk catalogue | Real content. The numbers are first estimates. |
| The partners | Mock. All companies are fictional. |
| The partner confirmation | Mock. A button in the demo stands in for the partner's confirmation. |
| The score numbers and tiers | Mock. They are not checked with If. |
| The partner discount | Mock. No partner agreed to fund it. |
| The premium | Not shown. If decides prices. |
| Fraud-proof verification | Not built. The pitch says so. |

The pitch says this in plain words: "The numbers and partners are mock data. The mechanism is real."

## 7. Notes for Antton and Ege

1. The demo account starts at 486 points. It has 6 earlier verified fixes (chimney sweep, sauna stove wiring, wet-room RCD, hot-water tank, natural ventilation, electrical check). The panel fix then raises the score to 546 and unlocks Silver. See `docs/carescore.md` section 6.
2. The earlier example content says 1000 to 1120. Change it to 486 to 546, with "+60, electrical panel replaced".
3. The risk list must show the 5 risks in the order in scene 3. With the 6 seeded fixes, 7 risks stay open. Four risks have the same value (severity 4, probability 3) after the first two. They compete for three places. The app breaks the tie by the risk id in alphabetical order. This puts the panel (`elec.panel.screw_fuse`) first among them. Check that the tie-break does this.
4. The discount on the company cards is 0% at Bronze and 5% at Silver. Show the small line "Reach Silver and get 5% off your next job" at Bronze.
5. The daughter's view is optional. Build it only if there is time.
6. If the 38 new risks are added to the catalogue, the sum of the weights grows. Recompute the seed.

## 8. Facts, assumptions and unknowns

### Facts
- The report, the quotes and the facts come from `samples/synthetic/1975-omakotitalo-oljylammitys.md`.
- The partner data comes from `fixtures/partners.json`.
- The score numbers come from `docs/carescore.md`.

### Assumptions
- A model reads the report and finds the 5 risks in the order in scene 3. This has to be tested with the real pipeline.
- Kari accepts a short, plain text better than a long report.
- An electrician can replace a panel in one visit.
- The age deduction restarts when the panel is replaced. The terms count the age from the date of use or renewal (terms 6.2.1.4). I did not check this with If.

### Unknowns
- How long the real reading takes for a 20-page report.
- Whether the partners accept a discount for volume.
- Whether the app can let a family member act in the demo.
- Which risks the real pipeline finds in the synthetic report, and in which order. The five risks in scene 3 are my expected result.
