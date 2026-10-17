# If Ensurance: staff dashboard

The If staff side of If Ensurance, built with Next.js 16 in the customer app's visual style. Staff use it to:

- set what each fix is worth for each of the five insurance classes (house, summer cottage, boat, car, dog): Care Score points, how fast the points decay and the yearly premium cut in euros, with different values per context (for example "houses built before 1970" or "large dogs");
- set each class's base premium and cap, and the starting Care Score;
- try a customer in the simulator and see their score, tier and premiums with every fix confirmed;
- see customers and their insured objects, set partner prices, the If discount and vetting, and set the tier rewards.

Every read and write goes through the backend's `/v1/admin` API (`src/lib/api.ts`), called from the dashboard's server with `ADMIN_TOKEN`. The dashboard never touches the database, and the backend does all the math. Endpoint list: `docs/systemdesign/api-contract.md`, section "Admin". All numbers are mock data.

## Run with everything else (Docker)

From the repo root:

```sh
cp .env.example .env   # set POSTGRES_PASSWORD, ADMIN_TOKEN and the tokens
docker compose up --build
```

Dashboard: http://localhost:3000. Change the host ports in `.env`.

## Run for development

Start the stack with `docker compose up postgres backend`, then:

```sh
npm install
BACKEND_URL=http://localhost:8000 ADMIN_TOKEN=<admin-token> npm run dev
```
