{
  description = "If Life Partner dev shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    jmo-skills = { url = "github:23jmo/jmo-skills"; flake = false; };
    impeccable = { url = "github:pbakaus/impeccable"; flake = false; };
    ponytail = { url = "github:DietrichGebert/ponytail"; flake = false; };
    mermaid-skill = { url = "github:WH-2099/mermaid-skill"; flake = false; };
  };

  outputs = { nixpkgs, jmo-skills, impeccable, ponytail, mermaid-skill, ... }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAll = f: nixpkgs.lib.genAttrs systems (s: f nixpkgs.legacyPackages.${s});
    in {
      devShells = forAll (pkgs:
        let
          # Runs the user's own claude with the pinned plugins. Other agents (Codex, ...) need no wrapper.
          claude = pkgs.writeShellScriptBin "claude" ''
            self="$(dirname "$0")"
            # The extra dirs are the standard install places (npm global, native installer), for shells whose PATH misses them.
            real="$(PATH="$(printf %s "$PATH" | tr : '\n' | grep -vxF "$self" | paste -sd: -):$HOME/.npm-global/bin:$HOME/.local/bin:$HOME/.claude/local" command -v claude)" \
              || { echo "claude: not installed. Install Claude Code first: https://claude.com/claude-code" >&2; exit 1; }
            exec "$real" --plugin-dir ${ponytail} "$@"
          '';
          # Runs the customer app on a USB-connected Android phone in Expo Go (mobile-app/README.md).
          phone = pkgs.writeShellScriptBin "phone" ''
            port="''${1:-8083}"
            adb wait-for-device
            adb reverse tcp:"$port" tcp:"$port"
            adb reverse tcp:8000 tcp:8000
            cd "$(git rev-parse --show-toplevel)/mobile-app"
            [ -d node_modules ] || npm install
            exec npx expo start --localhost --port "$port" --android
          '';
        in {
          default = pkgs.mkShell {
            # No openssh: the system ssh keeps macOS options such as UseKeychain working.
            packages = [ claude phone ] ++ (with pkgs; [ git gh jq ripgrep curl nodejs_24 android-tools ]);
            # Link skills at the repo root, also when nix develop runs in a subfolder.
            shellHook = ''
              (
                cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
                # Only link into this project; `nix develop <path>` from elsewhere (e.g. ~) must not touch that dir.
                grep -qs "If Life Partner dev shell" flake.nix || exit 0
                for d in .claude/skills .agents/skills; do
                  mkdir -p $d
                  ln -sfn ${jmo-skills}/skills/interview $d/interview
                  ln -sfn ${impeccable}/.claude/skills/impeccable $d/impeccable
                  ln -sfn ${mermaid-skill}/.claude/skills/mermaid $d/mermaid
                done
              )
            '';
          };
          # Backend, DESIGN.md §4. Run: nix develop .#backend
          backend = pkgs.mkShell {
            packages = [
              (pkgs.python313.withPackages (p: with p; [ fastapi uvicorn python-multipart pypdfium2 httpx jsonschema sqlalchemy psycopg alembic ]))
              pkgs.cloudflared
            ];
          };
        });
    };
}
