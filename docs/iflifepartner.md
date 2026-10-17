# If Life Partner: service spec

Status: service concept agreed in interview, 2026-10-16. System design: `docs/systemdesign/DESIGN.md`.
Scope: this document describes the service. It does not describe the pitch.

## 1. Summary

If Life Partner is a native app. It gamifies taking care of a customer's house, car, etc. It finds the risks in a customer's home and life. It tells the customer how to reduce each risk. It rewards the customer when the work is done. 

Proof of the work comes from outside sources, never from the customer. The customer hire's a vetted IF partner for the job, or the customer can hire a vetted professional to inspect and grade their work giving confirmation of the quality. 

The customer collects a single **care score**, which combines how they have taken care of all their listed possessions in the app, for example their house and car. Different possessions also have their specific scores, house score, car score etc. A mitigation is an action that reduces the risk of the need for an insurance claim. A higher score can make the customer eligible for a lower premium, a lower deductible (omavastuu), partner discounts and tier benefits.

If as a company gets fewer claims, verified risk data, better-prepared claim documents, a way to improve customer retention and a way to acquire new customers. 

## 2. Scope and build order

| Order | Area | Status |
|---|---|---|
| 1 | Home: wiring, plumbing, insulation, water damage and other building risks | Build first |
| 2 | Car | Build if time allows |
| 3 | Personal life events, for example marriage or a new child | Build if time allows |

Market: Finland.
Languages: Finnish, Swedish and English.

## 3. Users

### 3.1 Customer
- The target user is the average Finnish person, including older people.
- The customer uses a native app.

### 3.2 Family member acting for the customer
- A relative can act for the customer.
- The customer grants this access through delegated authorisation, in the same way as Suomi.fi and Kela do it.
- The relative identifies with strong electronic identification (vahva sähköinen tunnistautuminen).

### 3.3 If staff
If staff use a dedicated interface for the analysed data:

| Role | Use |
|---|---|
| Underwriters | Set prices from verified risk data. |
| Claims handlers | See prepared documents and the mitigation history when a claim arrives. |
| Sales and product teams | See customer interests and coverage gaps, to recommend products. |
| Partner managers | Track partner quality and volumes. |

## 4. Access levels

| User | Gets |
|---|---|
| Anyone, without an If plan | A general risk list. It is not tailored to their home. Phase 1 builds no access levels: every customer gets the tailored list. |
| If good enough care score | Discounted offers for If insurance packages |
| If plan holder | A tailored risk list, checkups, discounts and score benefits. |

## 5. Customer journey (home)

1. The customer gives facts about the home.
2. The service maps and analyses the risks.
3. The app shows a short risk list. Each item states the reason and the benefit of fixing it.
4. The customer picks a risk and books a partner through competitive bidding among If vetted professionals (kilpailutus).
5. The partner does the job and confirms it to If.
6. The score rises. The app shows what raised it and by how much.
7. The maintenance list updates. The app reminds the customer of the next tasks.

## 6. Inputs

| Input | Trust level |
|---|---|
| Address lookup from public data | Unverified |
| Photos, for example of the electrical panel or pipes | Unverified |
| Short questionnaire | Unverified |
| Uploaded document, for example a sale listing or a condition inspection report (kuntotarkastus) | Supported. Trust level not decided. |
| Maintenance done by verified professional | Very high |
| Maintenance checked by verified professional | High |

Rules:
- Unverified inputs shape the risk list.
- The service verifies ownership of the home at some point. The exact point is not decided.

## 7. Risk list

- The list shows only what matters. It must not overwhelm the customer.
- Format of each item: risk area, why it is a risk, benefit of fixing it.

```
RISKS
1. Electricity: (why) (benefit from mitigation)
2. Plumbing:    (why) (benefit from mitigation)
3. ...
```

- Code matches the home's facts against a risk catalogue and orders the list. An AI model reads the documents and writes the texts. It may propose catalogue risks by id. The technical design is in `docs/systemdesign/DESIGN.md`.

## 8. Mitigation score

### 8.1 Structure
- The score is one combined number.
- The app shows a visual breakdown: what raised the score and by how much.

### 8.2 What raises the score
- Completed mitigations, confirmed or done by a verified outside source.
- Maintained mitigations.
- More spending on different If products.

### 8.3 What lowers the score
- Mitigations age. An old fix counts for less over time.
- Missed maintenance.
- Claims.

### 8.4 Fraud and rule breaking
- All proof that changes the score comes from outside sources. The customer cannot fake it.
- False information is fraud. Fraud sets the benefit score to 0.
- If handles serious rule breaking, for example with a ban. This is outside the service.

### 8.5 Rewards
All rewards improve as the score rises:
- Lower premium.
- Lower deductible (omavastuu).
- Partner discounts.
- Score tier benefits.
- Free or discounted checkups, for example of plumbing.

## 9. Proof of a fix

1. The partner who did the job confirms it to If.
2. If the job is done by the customer themselves, it can be proved by a verified partner's inspection. 

## 10. Partners

### 10.1 Selection
- If vets partners and lists only qualified ones.
- If decides which partners to prioritise.
- For each job, listed partners bid against each other (kilpailutus). The customer chooses.

### 10.2 Money flows
| Flow | Purpose |
|---|---|
| Partner pays If a fee | To get onto the list. |
| If pays partly for checkups of high score customers. | Prevention cost. |
| If provides discounts for maintenance work done by partners for high score individuals. | Customer reward. |

### 10.3 Partner benefit
- Only pre vetted and trusted partners can offer their services on the platform. Customers read this as a sign of trust.
- Partners get jobs from If customers.

## 11. Retention: why the customer returns

The customer can customise each of these:
- Seasonal reminders, for example before winter.
- Weather alerts for the home's location, with actions.
- Score progress and the next reward level.
- New life events, for example adding a car.

### 11.1 Maintenance list auto-update
The maintenance list stays current. These sources update it:
- Age of parts. Each item has a service life, for example a water heater or a roof.
- Partner reports. A finished job resets its item and schedules the next check.
- Weather and season.
- Changes in laws or policy terms. Example: a new law requires fire alarms in all apartments.

### 11.2 Gamification
- Completing maintenance is gamified through the scoring system. 

## 12. Data sharing

- Outside If, the service shares only what a booked job needs, and only with the partner the customer booked.
- If may later decide to share data with banks (for example, a high score can help get better loan terms). This is If's decision. It is not part of the service the team builds.
- Any sharing requires the customer's consent.

## 13. Value for If

- Fewer claims, because mitigated risks cause fewer accidents.
- Verified risk data for pricing.
- Prepared documents and data for claims and further review.
- Insight into customer interests, for product recommendations.
- More partners, and partner listing fees.
- A wider customer base. Most people rarely think about their insurer. This service puts If into daily life in a positive light.
- Lower staffing needs, or new tasks for staff. This point is internal. It is not part of the pitch.

## 14. Priorities

1. The customer is not overwhelmed. The interface is simple enough for older users.
2. If receives valuable data and analysis.
3. The gamification makes partaking in maintenance and using the app enjoyable. 
4. The customer get's trustworthy instructions on how to take care of their home, car etc.

## 15. Open questions

- When does the service verify ownership of the home?
- What trust level does an uploaded document, such as a kuntotarkastus, have?
- What score counts as "good enough" for benefits without a plan?
- What are the score tiers and the reward for each tier?
- How fast does a mitigation age in the score?
- How much does spending on If products raise the score, compared with risk reduction?
- Are premium and deductible changes legal and actuarially sound under Finnish insurance rules? (Unknown. Not researched.)

## 16. Out of scope

- The pitch.
- Data sharing with banks or other outside parties.
- Bans and other actions against rule breakers.
- Technical design and implementation. They are in `docs/systemdesign/DESIGN.md`.
