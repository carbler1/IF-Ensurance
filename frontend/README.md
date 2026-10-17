# If Life Partner: staff dashboard

The If staff side of If Life Partner, built with Next.js 16. It lists customers and lets staff set partner prices, the If discount, partner vetting and the Care Score tier rewards.

The dashboard calls the backend's `/v1/admin` endpoints from its server. The browser never sees the admin token. Endpoint shapes: `docs/systemdesign/api-contract.md`, section "Admin".

## Run with the backend (Docker)

From the repo root:

```sh
cp .env.example .env   # set ADMIN_TOKEN and the other tokens
docker compose up --build
```

Dashboard: http://localhost:3000. API: http://localhost:8000. Change the host ports with `FRONTEND_PORT` and `BACKEND_PORT` in `.env`.

## Run for development

```sh
npm install
BACKEND_URL=http://localhost:8000 ADMIN_TOKEN=<admin-token> npm run dev
```

The backend must run with the same `ADMIN_TOKEN`.
