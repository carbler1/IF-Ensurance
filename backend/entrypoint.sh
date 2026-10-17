#!/bin/sh
# Start the API and the worker. Both use var/ilp.sqlite in this container.
set -eu

cd /app
mkdir -p /app/var/uploads

# Migrate once, before both processes open the database.
python -m backend.migrate

python -m backend.worker &
worker_pid=$!

uvicorn backend.api:app --host 0.0.0.0 --port 8000 &
api_pid=$!

exiting=0

stop() {
    exiting=1
    kill "$worker_pid" "$api_pid" 2>/dev/null || true
    wait "$worker_pid" "$api_pid" 2>/dev/null || true
}

trap 'stop; exit 0' INT TERM

while kill -0 "$worker_pid" 2>/dev/null && kill -0 "$api_pid" 2>/dev/null; do
    sleep 1
done

if [ "$exiting" -eq 0 ]; then
    stop
    exit 1
fi
exit 0
