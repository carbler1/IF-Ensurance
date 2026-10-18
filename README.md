# Ensurance

*Insure what you have. Ensure it lasts.*

JunctionX Turku 2026, If challenge: "If Insurance Could Do More".

## Problem

Small missed checks become large damage bills. Examples: a pipe bursts behind a wall, the engine fails after a skipped winter service, a dog's vaccine lapses. One fire or water damage costs about €10,000 (Finance Finland, Insurance Survey 2025).

Customers meet their insurer at signing and at claims, rarely in between. They also face four gaps:

- **Scattered:** policies, memberships and bills sit in different places.
- **No full picture:** they do not know what they pay each month or whether they are over- or under-insured.
- **No help on hand:** when something breaks, they find a plumber and a fair price alone.
- **Care unrewarded:** servicing a heat pump or fitting smoke alarms does not change the price.

## Idea

One app for everything a customer insures and pays.

1. **Bookkeeping:** every insurance cost in one list.
2. **Whole picture:** what is insured, what is covered, and the monthly cost.
3. **Scores:** each category (home, cottage, boat, car, dog) gets a score for the condition of the item, not just the policy.

When the app finds a problem, the fix happens in the same app:

1. **Spot:** the app flags a need from a report, a reminder or the item's age.
2. **Match:** it offers a vetted service partner from If's network.
3. **Book:** the customer books and pays in the app.
4. **Record:** the finished job is logged and raises the item's score.

Example: an inspection report notes 40-year-old water pipes. The app suggests a pipe check by a local partner. The customer books it, and the house score rises.

## Score and rewards

Many small jobs add points. Point values below are from the demo; the slides mark sensor, inspection and gutter values as illustrative.

| Action | Type | Points |
|---|---|---|
| Heat pump installed | Upgrade | +60 |
| Smoke alarms registered | Safety | +20 |
| Water leak sensor fitted | Sensor | +30 |
| Roof inspected | Inspection | +25 |
| Gutters cleaned | Maintenance | +10 |

**Discount per insurance** (set by that insurance's own score):

| Score | Discount |
|---|---|
| Below 500 | none |
| 500+ | 5% |
| 700+ | 10% |
| 900+ | 15% |

**Tier** (set by the aggregate score across all insurances):

| Tier | Threshold | Rewards |
|---|---|---|
| Bronze | 0+ | Seasonal reminders, 5% partner discount |
| Silver | 500+ | 1 free checkup a year, 10% partner discount |
| Gold | 700+ | One month off one insurance, 1 free checkup a year, 15% partner discount |
| Platinum | 850+ | One month off one insurance, free yearly home check, weekend trip for two, 20% partner discount |

## Platform model

- **Customers** give data on items and their condition. They get one app, quick fixes and lower premiums.
- **Service partners** give vetted work at agreed prices. They get customers who need them now.
- **If** matches needs to services and sets prices and rewards. It gains fewer claims, a possible fee per job, and per-item risk data for its pricing and risk models.

## Stack

| Part | Technology |
|---|---|
| Mobile app (customer) | Expo |
| Web app (If staff dashboard) | Next.js |
| Backend | FastAPI API, worker, LLM pipeline |
| Database | PostgreSQL |

## Staff dashboard

If staff tune prices and rewards in one place:

- **Compute:** see how aggregate and individual scores spread across customers and relate to claims.
- **Simulate:** test new discount bands or rewards and see the premium impact before launch.
- **Set:** publish prices, tiers and partner offers to the app.

## Team

Eero, Joona, Antton, Oleksii, Oskari.
