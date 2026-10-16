#!/usr/bin/env bash
# Export every sheet to PNG (1600x1000 laptop frame, 2x pixel density).
# Needs Chromium; on NixOS: nix shell nixpkgs#chromium -c docs/visuals/export.sh
set -euo pipefail
cd "$(dirname "$0")"
for lang in en fi; do
  for page in overview subsystems stakeholders benefits; do
    chromium --headless --disable-gpu --hide-scrollbars \
      --force-device-scale-factor=2 --window-size=1600,1000 \
      --virtual-time-budget=3000 \
      --screenshot="$PWD/$lang/$page.png" "file://$PWD/$lang/$page.html" 2>/dev/null
    echo "$lang/$page.png"
  done
done
