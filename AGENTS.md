# AGENTS.md

This repo holds If Life Partner. It is our answer to the If challenge "If Insurance Could Do More" at JunctionX Turku 2026.

## Project
- Service spec: `docs/iflifepartner.md`. What the service is and does.
- System design: `docs/systemdesign/DESIGN.md`. The only design document. Read it before any design or code work.
- Decision log: `docs/systemdesign/decisions.md`. One row per decision. Do not reopen a decided row without Antton.
- API contract: `docs/systemdesign/api-contract.md`. The frontend and the backend both follow it.
- Challenge brief: `docs/ifchallengedescription.md`.

Phases:
1. Working customer app for the house, the backend it needs, the LLM pipeline, the data form. This is now.
2. Full functionality, UI polish, scalability, the If staff insights system.
3. Translation for the demo, refinement, expansion.

Team:
- Antton: system design, backend, LLM pipeline, data form, all merging to `main`.
- Ege: UI in Lovable (React, TypeScript, Tailwind). Builds against the API contract. No Supabase for app data.
- Rasi: analysis documents in prose, like a hired consultant. Rasi does not write data structures. Antton converts the prose into the risk catalogue.

Rules of the design:
- Code decides, models read and write. Code matches risks, computes the score, the money and the partner list. Models extract facts from documents and write text.
- Criticality of a risk comes from the catalogue, never from a model. A model may only select catalogue ids.
- Build everything in English. Translation is phase 3.
- Phase 1 stores only what the endpoints need. The full store of inputs, prompts and model output is phase 2.
- Partner data, score numbers and tiers are mock data in phase 1.
- Never commit network or account details: IP addresses, VPN configuration, domain names, hostnames other than `pc-btw`, tokens, certificates, router settings. Put them in `docs/pc.md` or `.env` files, which git ignores. Design documents use placeholders such as `{BASE}` and `<public-hostname>`. Loopback addresses such as `127.0.0.1` and `localhost` are not network details and are allowed.

## Layout
- `flake.nix`, `flake.lock`: the dev shell. `.envrc`: loads it through direnv.
- `docs/`: documentation. `docs/systemdesign/`: the API contract and the decision log.
- `.plans/`: specs written by the `interview` skill.
- `backend/`: FastAPI, the worker and the database models (SQLAlchemy). `mobile-app/`: the customer app (Expo). `frontend/`: the If staff dashboard (Next.js), which goes through the backend's `/v1/admin` API.
- `docker-compose.yml`: runs Postgres, `backend`, `frontend` and a web demo of `mobile-app` together. Copy `.env.example` to `.env` first.
- `archive/`: superseded material, ignored by git. Do not read it or build from it unless Antton asks.

## Writing style
Write in Simplified Technical English (STE):
- Use one idea in each sentence.
- Use the active voice and plain words.
- Define each term and acronym the first time you use it.
- Put the most important information first.
- Keep facts, assumptions and unknowns apart.

## Start
1. Install Nix with flakes enabled. This works on macOS and Linux. On macOS: `curl -fsSL https://install.determinate.systems/nix | sh -s -- install`, then open a new terminal.
2. Install your own coding agent (Claude Code, Codex or similar). The flake installs no agent.
3. Run `nix develop` in this directory. With direnv and nix-direnv installed, run `direnv allow` once instead; the shell then loads on every `cd` into the repo.
4. Run your agent, for example `claude`.

The flake pins all inputs in `flake.lock`. Each teammate gets the same tools and skills.
Nix flakes in a git repository see only tracked files. Run `git add flake.nix flake.lock` before `nix develop`.

## What the shell gives you
- Tools: `git`, `gh`, `jq`, `rg` (ripgrep), `curl`. The shell uses your system `ssh`, so macOS options such as `UseKeychain` keep working.
- `claude`: a wrapper. It runs your installed Claude Code and loads one plugin from the Nix store. It finds Claude Code on `PATH` or in the standard install folders (`~/.npm-global/bin`, `~/.local/bin`, `~/.claude/local`). If Claude Code is not found, it prints an install hint and exits.
  - `ponytail` (DietrichGebert): "lazy senior dev" mode. It makes the smallest complete change.
- Project skills: the `shellHook` links these into `.claude/skills` (Claude Code) and `.agents/skills` (Codex and other agents), at the git repo root. It links only when that folder holds this flake:
  - `interview` (23jmo/jmo-skills): interviews you and writes a spec to `.plans/`.
  - `impeccable` (pbakaus/impeccable): frontend design: shape, critique, audit, polish, animate. On first use, its launcher downloads its engine binary to `~/.impeccable/` (network needed once; Nix does not pin that binary).
- `.gitignore` keeps `.claude/settings.local.json`, `docs/pc.md`, `.direnv/`, agent worktrees in `.claude/worktrees/` and the skill links in `.claude/skills/` and `.agents/skills/` out of git.


## Update or add
- Update one input: `nix flake update <input>`, for example `nix flake update ponytail`.
- Add a skill: add the repo as a `flake = false` input, then add a `ln -sfn` line to the loop in `shellHook`.
- Add a plugin: add the repo as an input, then add `--plugin-dir ${input}` to the wrapper.

## Version control
Branches:
- `main` is the integration branch. Nobody commits to `main` directly.
- Each person has one personal branch: `antton` (Antton: system design, backend, LLM pipeline, data form), `ege` (Ege: UI in Lovable), `rasi` (Rasi: analysis documents in `docs/`).
- Each person and their agents work only on their own branch.

Merging:
- Everyone else opens a PR from their branch to `main`. They do not merge it.

Commit style:
- Write the subject in the imperative mood. It must complete this sentence: "If applied, this commit will <subject>."
- Start the subject with a capital letter. Do not end it with a period.
- Keep the subject to 50 characters or fewer. The hard limit is 72.
- Add a body only when needed. Leave one blank line after the subject. Explain what changed and why.
- Examples:
  - `Add the API contract to the system design`
  - `Validate LLM output against the form schema`
  - `Add the risk catalogue schema`

Commit often enough, but not too often:
- Commit when a task or a logical unit is complete.
- Do not commit after every file edit. Do not make one large commit at the end of a day.
- Agents commit at most a few times for each task.
- Push to your own branch after each commit.
