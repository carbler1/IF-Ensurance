# If Life Partner: staff dashboard

The If staff side of If Life Partner, built with Next.js 16 in the customer app's visual style. Staff use it to:

- set what each fix is worth: Care Score points, how fast the points decay and the yearly premium cut in euros, with different values per context (for example "houses built before 1970");
- set the global numbers: the starting Care Score, the base premium and the cap on premium cuts;
- try any home in the simulator and see its score, tier and premium with every fix confirmed;
- see customers, set partner prices, the If discount and vetting, and set the tier rewards.

The dashboard reads and writes Postgres directly (Drizzle ORM, `src/db/`). The backend owns the tables (`backend/models.py`), creates them and seeds them on its first start, and uses the same fix rules for the customer API. All numbers are mock data.

## Run with everything else (Docker)

From the repo root:

```sh
cp .env.example .env   # set POSTGRES_PASSWORD and the tokens
docker compose up --build
```

Dashboard: http://localhost:3000. Change the host ports in `.env`.

## Run for development

Start Postgres and the backend with `docker compose up postgres backend`, then:

```sh
npm install
DATABASE_URL=postgres://ilp:<postgres-password>@localhost:5432/ilp npm run dev
```

## Keep in step

- `src/db/schema.ts` copies the tables of `backend/models.py`.
- `src/lib/match.ts` copies `matches()` from `scripts/catalogue/validate.py`; `src/lib/math.ts` picks the rule the same way as `fix_value()` in `backend/engine.py`.
