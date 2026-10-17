# Brief

## Mock data

Everything below is fictional or a placeholder. The pitch says so openly (decision 2).

- **Partners** (`fixtures/partners.json`): 15 fictional companies. Each has categories, an area, a price range, a rating, an If-vetted flag, a tier discount and a listing fee tier.
- **Score tiers** (`fixtures/score-tiers.json`): the score starts at 1000. There are 4 tiers at 1000, 1200, 1500 and 2000 points. The tier names are `TBD-0` to `TBD-3` until Rasi names them. The rewards are a deductible reduction, free check-ups and a partner discount.
- **Decay half-lives** (`fixtures/half-lives.json`): how fast earned points fade, in years, per category and per risk.
- **Points per fix** (in each catalogue entry): placeholder numbers.
- **Risk catalogue** (`data/catalogue.json`): 20 risks. Severity, probability, intervals and service lives are placeholders until Rasi's analysis arrives (the `source` field of each entry says so).
- **Sample homes** (`fixtures/homes/`): 3 houses: a 1975 detached house, a 1992 flat and a 2010 row house. Each has a full profile and the risks it should produce.
- **Sample reports** (`samples/synthetic/`): 3 synthetic kuntotarkastus (Finnish condition inspection report) PDFs, one for each sample home.
- **Demo customer** (seeded in the database): one home, `home_01`, at Esimerkkikatu 3, 20100 Turku. All profile fields start as unknown.
- **API examples** (`fixtures/api/`): one example response per endpoint. Together they tell one story: upload the 1975 house report, see the risks, book an electrician for the screw-fuse panel, the partner confirms, and the score goes from 1000 to 1120.
- **Partner confirmation:** no real partner. We fire the confirm call with curl (decision 31).
- **Rewards:** shown only. No real premium or deductible changes (decision 49).
- **Customer identity:** one demo customer, no real login. Auth is cut.
