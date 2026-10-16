# AGENTS.md

This repo holds If Life Partner. It is our answer to the If challenge "If Insurance Could Do More" at JunctionX Turku 2026.

## Project
- Plan to build: `docs/iflifepartner.md` (the service spec). The technical design comes next.
- Challenge brief: `docs/ifchallengedescription.md`.

## Layout
- `flake.nix`, `flake.lock`: the dev shell.
- `docs/`: documentation.

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
3. Run `nix develop` in this directory.
4. Run your agent, for example `claude`.

The flake pins all inputs in `flake.lock`. Each teammate gets the same tools and skills.
Nix flakes in a git repository see only tracked files. Run `git add flake.nix flake.lock` before `nix develop`.

## What the shell gives you
- Tools: `git`, `gh`, `jq`, `rg` (ripgrep), `curl`. The shell uses your system `ssh`, so macOS options such as `UseKeychain` keep working.
- `claude`: a wrapper. It runs your installed Claude Code and loads two plugins from the Nix store. It finds Claude Code on `PATH` or in the standard install folders (`~/.npm-global/bin`, `~/.local/bin`, `~/.claude/local`). If Claude Code is not found, it prints an install hint and exits.
  - `the-architect` (Hainrixz): interviews you and writes a build blueprint. Commands: `/architect`, `/architect-quick`.
  - `ponytail` (DietrichGebert): "lazy senior dev" mode. It makes the smallest complete change.
- Project skills: the `shellHook` links these into `.claude/skills` (Claude Code) and `.agents/skills` (Codex and other agents), at the git repo root. It links only when that folder holds this flake:
  - `interview` (23jmo/jmo-skills): interviews you and writes a spec to `.plans/`.
  - `impeccable` (pbakaus/impeccable): frontend design: shape, critique, audit, polish, animate. On first use, its launcher downloads its engine binary to `~/.impeccable/` (network needed once; Nix does not pin that binary).
- `.gitignore` keeps `.claude/settings.local.json` and `docs/pc.md` out of git. It does not ignore the skill links in `.claude/skills` and `.agents/skills`.

There is no language stack yet. Add packages to `packages` in `flake.nix` when the team picks the app stack.

## Update or add
- Update one input: `nix flake update <input>`, for example `nix flake update ponytail`.
- Add a skill: add the repo as a `flake = false` input, then add a `ln -sfn` line to the loop in `shellHook`.
- Add a plugin: add the repo as an input, then add `--plugin-dir ${input}` to the wrapper.
