"""If staff endpoints for the dashboard in frontend/: customers, partner prices, tiers.
Auth: header X-Admin-Token, compared with ADMIN_TOKEN from .env. Shapes: api-contract.md "Admin"."""

import hmac
import json
import os
from typing import Literal

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from backend import db, engine


def require_admin(x_admin_token: str = Header(default="")):
    token = os.environ.get("ADMIN_TOKEN", "")
    if not token or not hmac.compare_digest(x_admin_token, token):
        raise HTTPException(401, "Missing or wrong admin token.")


router = APIRouter(prefix="/admin", dependencies=[Depends(require_admin)])


def _conn():
    conn = db.connect()
    try:
        yield conn
    finally:
        conn.close()


@router.get("/overview")
def overview(conn=Depends(_conn)):
    def count(sql: str) -> dict:
        return {r[0]: r[1] for r in conn.execute(sql)}

    partners = db.partners(conn)
    return {
        "customers": conn.execute("SELECT COUNT(*) FROM homes").fetchone()[0],
        "documents": count("SELECT status, COUNT(*) FROM documents GROUP BY status"),
        "jobs": count("SELECT status, COUNT(*) FROM jobs GROUP BY status"),
        "work_orders": count("SELECT status, COUNT(*) FROM work_orders GROUP BY status"),
        "partners": {"total": len(partners), "vetted": sum(p["if_vetted"] for p in partners)},
    }


@router.get("/customers")
def customers(conn=Depends(_conn)):
    out = []
    for h in conn.execute("SELECT * FROM homes ORDER BY created_at, home_id").fetchall():
        hid = h["home_id"]
        prof = conn.execute("SELECT profile FROM profiles WHERE home_id=?", (hid,)).fetchone()
        fields = json.loads(prof["profile"]).values() if prof else []
        last = conn.execute("SELECT MAX(uploaded_at) FROM documents WHERE home_id=?", (hid,)).fetchone()[0]
        orders = {r[0]: r[1] for r in conn.execute(
            "SELECT status, COUNT(*) FROM work_orders WHERE home_id=? GROUP BY status", (hid,))}
        out.append({
            "home_id": hid,
            "address": {"street": h["street"], "postal_code": h["postal_code"], "city": h["city"]},
            "created_at": h["created_at"],
            "profile_known": sum(1 for f in fields if f.get("value") != "unknown"),
            "profile_total": len(fields),
            "documents": conn.execute("SELECT COUNT(*) FROM documents WHERE home_id=?", (hid,)).fetchone()[0],
            "last_upload_at": last,
            "open_risks": len(engine.risk_list(conn, hid)["risks"]),
            "work_orders": {"booked": orders.get("booked", 0), "confirmed": orders.get("confirmed", 0)},
        })
    return {"customers": out}


@router.get("/partners")
def list_partners(conn=Depends(_conn)):
    return {"partners": db.partners(conn)}


class PartnerPatch(BaseModel):
    price_min: int | None = Field(default=None, ge=0)
    price_max: int | None = Field(default=None, ge=0)
    tier_discount_percent: int | None = Field(default=None, ge=0, le=100)
    if_vetted: bool | None = None
    listing_fee_tier: Literal["basic", "plus"] | None = None


@router.patch("/partners/{partner_id}")
def patch_partner(partner_id: str, body: PartnerPatch, conn=Depends(_conn)):
    current = next((p for p in db.partners(conn) if p["partner_id"] == partner_id), None)
    if current is None:
        raise HTTPException(404, f"Partner {partner_id} not found.")
    lo = current["price_range"]["min"] if body.price_min is None else body.price_min
    hi = current["price_range"]["max"] if body.price_max is None else body.price_max
    if lo > hi:
        raise HTTPException(400, "The minimum price is above the maximum price.")
    vetted = current["if_vetted"] if body.if_vetted is None else body.if_vetted
    with conn:
        conn.execute(
            "UPDATE partners SET price_min=?, price_max=?, tier_discount_percent=?, if_vetted=?, "
            "listing_fee_tier=?, updated_at=? WHERE partner_id=?",
            (lo, hi,
             current["tier_discount_percent"] if body.tier_discount_percent is None else body.tier_discount_percent,
             int(vetted), body.listing_fee_tier or current["listing_fee_tier"], db.now_iso(), partner_id))
    return next(p for p in db.partners(conn) if p["partner_id"] == partner_id)


@router.get("/tiers")
def list_tiers(conn=Depends(_conn)):
    return {"tiers": db.tiers(conn)}


class TierPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=40)
    min_score: int | None = Field(default=None, ge=0)
    deductible_reduction_eur: int | None = Field(default=None, ge=0)
    partner_discount_percent: int | None = Field(default=None, ge=0, le=100)
    free_checkups: list[str] | None = None


@router.patch("/tiers/{tier_index}")
def patch_tier(tier_index: int, body: TierPatch, conn=Depends(_conn)):
    tiers = db.tiers(conn)
    current = next((t for t in tiers if t["index"] == tier_index), None)
    if current is None:
        raise HTTPException(404, f"Tier {tier_index} not found.")
    new = {**current, **body.model_dump(exclude_none=True)}
    # Tiers are a ladder: each one starts above the tier below it.
    below = [t["min_score"] for t in tiers if t["index"] < tier_index]
    above = [t["min_score"] for t in tiers if t["index"] > tier_index]
    if (below and new["min_score"] <= max(below)) or (above and new["min_score"] >= min(above)):
        raise HTTPException(400, "The minimum score must sit between the tiers below and above.")
    with conn:
        conn.execute(
            "UPDATE tiers SET name=?, min_score=?, deductible_reduction_eur=?, free_checkups=?, "
            "partner_discount_percent=?, updated_at=? WHERE tier_index=?",
            (new["name"], new["min_score"], new["deductible_reduction_eur"],
             json.dumps([c.strip() for c in new["free_checkups"] if c.strip()]),
             new["partner_discount_percent"], db.now_iso(), tier_index))
    return next(t for t in db.tiers(conn) if t["index"] == tier_index)
