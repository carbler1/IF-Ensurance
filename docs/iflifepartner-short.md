# If Life Partner: one-page summary

Condensed from `iflifepartner.md` (service spec, 2026-10-16).

## What it is
If Life Partner is a native app for Finnish customers. It finds risks in the customer's home and life, tells the customer how to reduce them, and rewards completed work. It answers the If challenge "If Insurance Could Do More" with prevention.

## How it works
1. The customer describes the home: address, photos, questionnaire, documents.
2. An AI model produces a short risk list. Each item states the risk, the reason and the benefit of fixing it.
3. The customer books a vetted partner through competitive bidding (kilpailutus).
4. The partner confirms the job to If. An expert inspects if that is not enough.
5. The **mitigation score** rises. A mitigation is an action that reduces a risk.

## Mitigation score
- Raised by: confirmed mitigations, maintenance, use of more If products.
- Lowered by: aging fixes, missed maintenance, claims.
- Fraud sets the score to 0. All proof comes from outside sources.
- Rewards: lower premium, lower deductible (omavastuu), partner discounts, tier benefits, free checkups.

## Who is involved
- **Customers**, including older people. A relative can act for them through delegated authorisation.
- **Partners** pay a listing fee. They get jobs and "certified by If" status.
- **If staff** (underwriting, claims, sales, partner management) use the analysed data.

## Value for If
Fewer claims, verified risk data for pricing, prepared claim documents, product insight, partner fees, and daily contact with customers.

## Scope
- Build order: home first, then car, then life events.
- Languages: Finnish, Swedish, English.
- Out of scope: the pitch, data sharing outside If, technical implementation.

## Key open questions
Score tiers and thresholds, aging rate, when ownership is verified, document trust levels, and whether premium and deductible changes are legal under Finnish insurance rules.
