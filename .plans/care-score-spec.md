# Care score: interview decisions

Status: decided in interview, 2026-10-17 (5 question rounds). The finished analysis is in `docs/carescore.md`. This file is the decision log.

## Decisions

| Topic | Decision |
|---|---|
| Score range | 0 to 1000 |
| Tiers | Bronze 0, Silver 500, Gold 750, Platinum 850 |
| Tier names | Metals (Pronssi, Hopea, Kulta, Platina in Finnish) |
| Start score | Estimated from the preliminary questionnaire. Cap about 450. Bronze only until work is verified. Label "estimated" until the first verified item. |
| Points rule | severity x probability x 7, rounded to 10, cap 150. Pure formula. No fire bonus. |
| Scaling | Per home: (950 - S0) x weight / sum of weights. Full fix gives about 950. |
| Last 50 points | Upkeep bonus for on-time re-checks, up to 50. |
| Inspection with no work needed | Full points. |
| Tier loss | 90-day grace, then drop. |
| Claims | No claim penalty. Decay covers missed upkeep. Fraud sets the benefit score to 0. |
| Lead reward | Partner discounts: 0 / 5 / 10 / 15 percent, funded by partners. |
| Deductible (omavastuu) | 0 / 0 / 100 / 200 EUR |
| Offers on If products | From Silver (500). |
| Premium | Not automatic. Text "If may offer you a better price" from Gold. A button asks If to review the premium. |
| Free checkups | Not in phase 1. |
| Demo arc | The 1975 customer starts just under Silver and the panel fix crosses into Silver. A staged fixture seeds 6 earlier fixes. |

## Open items

- The demo arc needs a staged start. With the pure rule, one fix earns only about 60 points on a home with 13 risks. The seeded fixes make the arc work. See `docs/carescore.md` section 6.
- Adding the 38 new risks raises the sum of weights. Recompute the demo seed then.
- Partner funding of the discounts is an assumption. No partner agreed.
- Finnish rules on tier-based deductibles are not researched.
