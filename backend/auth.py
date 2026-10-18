"""The customer bearer token: resolves the caller's customer and home."""

import hashlib
import hmac
import os
import time
from typing import NamedTuple

from fastapi import Header, HTTPException, Request
from sqlalchemy import select

from backend import db
from backend.models import Customer, Home

DEMO_CUSTOMER, DEMO_HOME = "cust_01", "home_01"  # CUSTOMER_TOKEN opens this one (cottage, boat, car and dog too)


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


def sha(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def require_token(authorization: str = Header(default="")) -> Who:
    """The caller's customer and home, from the bearer token. CUSTOMER_TOKEN is the demo customer."""
    scheme, _, given = authorization.partition(" ")
    demo = os.environ.get("CUSTOMER_TOKEN", "")
    if scheme.lower() == "bearer" and given:
        if demo and hmac.compare_digest(given.encode(), demo.encode()):
            return Who(DEMO_CUSTOMER, DEMO_HOME)
        with db.connect() as s:
            home = s.scalar(select(Home).join(Customer, Customer.customer_id == Home.customer_id)
                            .where(Customer.token_hash == sha(given)))
            if home is not None:
                return Who(home.customer_id, home.home_id)
    raise HTTPException(401, "Missing or wrong bearer token.")
