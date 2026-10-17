# If Life Partner backend. The database is Postgres (DATABASE_URL); see docker-compose.yml.
# Uploads stay in this container at /app/var/uploads.
# Build from the repo root so the image can copy data, fixtures and prompts:
#   docker build -f backend/Dockerfile -t ilp .
# Run: docker compose up (or docker run with DATABASE_URL set)
FROM python:3.13-slim-bookworm

WORKDIR /app

RUN pip install --no-cache-dir \
    fastapi \
    "uvicorn[standard]" \
    python-multipart \
    pypdfium2 \
    httpx \
    sqlalchemy \
    alembic \
    "psycopg[binary]" \
    jsonschema

COPY backend ./backend
COPY data ./data
COPY fixtures ./fixtures
COPY prompts ./prompts
COPY scripts/catalogue/validate.py ./scripts/catalogue/validate.py
COPY backend/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh \
    && mkdir -p /app/var/uploads \
    && useradd --create-home --uid 1000 ilp \
    && chown -R ilp:ilp /app

USER ilp

ENV PYTHONUNBUFFERED=1 \
    OLLAMA_URL=http://127.0.0.1:11434 \
    OLLAMA_MODEL=qwen3.5:9b

EXPOSE 8000
VOLUME ["/app/var"]

ENTRYPOINT ["/entrypoint.sh"]
