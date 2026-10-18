#!/usr/bin/env bash
# Full demo reset against the running docker compose stack. Run from the repo directory.
set -euo pipefail
docker compose exec -T backend python -c '
import os, urllib.request
for path in ("demo/reset",):
    r = urllib.request.Request("http://localhost:8000/v1/admin/" + path, method="POST",
                               headers={"X-Admin-Token": os.environ["ADMIN_TOKEN"]})
    print(urllib.request.urlopen(r).read().decode())'
