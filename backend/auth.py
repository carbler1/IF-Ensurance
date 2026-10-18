"""The customer bearer token: resolves the caller's customer and home."""

import hashlib
import hmac
import os
from typing import NamedTuple

from fastapi import Header, HTTPException
from sqlalchemy import select

from backend import db
from backend.models import Customer, Home

DEMO_CUSTOMER, DEMO_HOME = "cust_01", "home_01"  # CUSTOMER_TOKEN opens this one (cottage, boat, car and dog too)


class Who(NamedTuple):
    customer_id: str
    home_id: str


def sha(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def require_token(authorization: str = Header(default="")) -> Who:
    """The caller's customer and home, from the bearer token. CUSTOMER_TOKEN is the demo customer."""
    scheme, _, given = authorization.partition(" ")
    demo = os.environ.get("CUSTOMER_TOKEN", "")
    if scheme.lower() == "bearer" and given:
        if demo and hmac.compare_digest(given, demo):
            return Who(DEMO_CUSTOMER, DEMO_HOME)
        with db.connect() as s:
            home = s.scalar(select(Home).join(Customer, Customer.customer_id == Home.customer_id)
                            .where(Customer.token_hash == sha(given)))
            if home is not None:
                return Who(home.customer_id, home.home_id)
    raise HTTPException(401, "Missing or wrong bearer token.")
