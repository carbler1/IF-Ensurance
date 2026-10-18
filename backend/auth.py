"""The customer caller: the app has no sign-in, so every call resolves to the demo customer and home."""

import time
from typing import NamedTuple

from fastapi import HTTPException, Request

DEMO_CUSTOMER, DEMO_HOME = "cust_01", "home_01"  # the one customer the app shows (cottage, boat, car and dog too)


class Who(NamedTuple):
    customer_id: str
    home_id: str


def client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    return fwd or (request.client.host if request.client else "unknown")


# shortcut: per-process memory, resets on restart and is not shared between workers; use a shared store with many workers.
_HITS: dict[str, list[float]] = {}
MAX_HITS, WINDOW = 20, 60.0


def rate_limit(request: Request, bucket: str) -> None:
    """Allow MAX_HITS calls per minute per client IP and bucket, else 429."""
    key, now = f"{bucket}:{client_ip(request)}", time.monotonic()
    hits = [t for t in _HITS.get(key, []) if now - t < WINDOW]
    if len(hits) >= MAX_HITS:
        _HITS[key] = hits
        raise HTTPException(429, "Too many attempts. Try again in a minute.")
    _HITS[key] = hits + [now]


def require_token() -> Who:
    """The customer app has no sign-in for now: every call is the demo customer (CUSTOMER_TOKEN is not read)."""
    return Who(DEMO_CUSTOMER, DEMO_HOME)
