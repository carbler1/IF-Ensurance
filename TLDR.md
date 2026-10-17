# TLDR for Ege

Goal: run the repo on your Mac with Claude Code in VS Code, and connect your Lovable app to the backend.

## 1. Set up the Mac (once)
1. Install Nix: `curl -fsSL https://install.determinate.systems/nix | sh -s -- install`. Open a new terminal.
2. Install Claude Code and the VS Code Claude extension.
3. Clone the repo: `git clone <repo-url> && cd IF-Life-Partner`.
4. Switch to your branch: `git switch ege`. Update it: `git pull origin ege`.
5. Run `git add flake.nix flake.lock`, then `nix develop`. The first run takes a few minutes.
6. Open the folder in VS Code (`code .`). Start Claude Code in the integrated terminal.

## 2. Build the UI against the API contract
- Read `docs/systemdesign/api-contract.md`. The app must follow it.
- Example responses are in `fixtures/api/`. Use them as mock data until the backend answers.
- Do not store app data in Supabase.

## 3. Connect Lovable to the backend
The backend runs on Antton's machine. You do not run it.
1. Ask Antton for two values: the base URL and the customer token. Antton sends them in chat. Never commit them.
2. In the Lovable app, call `<base-url>/v1/...`. Send the header `Authorization: Bearer <customer-token>` on every request.
3. Send Antton the Lovable preview URL (the address the app loads from). Antton adds it to the CORS allow-list. Without this step the browser blocks every call.
4. The base URL changes each time Antton restarts the tunnel. Ask for the new one when calls fail.

## 4. Endpoints (all under `/v1`)
| Call | Use |
|---|---|
| `GET /homes/me` | Home, profile, documents |
| `POST /homes/me/documents` | Upload a PDF (multipart: `file`, `type=kuntotarkastus`). Returns `job_id` |
| `GET /jobs/{job_id}` | Poll every 2 s until `done` or `failed`. Stop after 200 s |
| `GET /homes/me/risks` | Risk list. An empty list is valid |
| `GET /homes/me/risks/{risk_id}` | One risk with partners |
| `GET /homes/me/maintenance` | Maintenance list |

## 5. Save your work
1. Work only on branch `ege`.
2. Commit with an imperative subject of 50 characters or fewer, for example `Add the risk list screen`.
3. Push: `git push origin ege`. Open a pull request to `main`. Antton merges it.
