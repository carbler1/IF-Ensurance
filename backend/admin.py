"""If staff endpoints for the dashboard in frontend/: customers, partner prices, tiers.
Auth: header X-Admin-Token, compared with ADMIN_TOKEN from .env. Shapes: api-contract.md "Admin"."""

import hmac
import json
import os
from typing import Literal

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend import db, engine
from backend.models import Document, Home, Job, Partner, Profile, Tier, WorkOrder


def require_admin(x_admin_token: str = Header(default="")):
    token = os.environ.get("ADMIN_TOKEN", "")
    if not token or not hmac.compare_digest(x_admin_token, token):
        raise HTTPException(401, "Missing or wrong admin token.")


router = APIRouter(prefix="/admin", dependencies=[Depends(require_admin)])


def _session():
    with db.connect() as s:
        yield s


@router.get("/overview")
def overview(s: Session = Depends(_session)):
    def count(model) -> dict:
        return dict(s.execute(select(model.status, func.count()).group_by(model.status)).all())

    partners = db.partners(s)
    return {
        "customers": s.scalar(select(func.count()).select_from(Home)),
        "documents": count(Document),
        "jobs": count(Job),
        "work_orders": count(WorkOrder),
        "partners": {"total": len(partners), "vetted": sum(p["if_vetted"] for p in partners)},
    }


@router.get("/customers")
def customers(s: Session = Depends(_session)):
    out = []
    for h in s.scalars(select(Home).order_by(Home.created_at, Home.home_id)).all():
        hid = h.home_id
        prof = s.get(Profile, hid)
        fields = json.loads(prof.profile).values() if prof else []
        docs = s.execute(select(func.count(), func.max(Document.uploaded_at)).where(Document.home_id == hid)).one()
        orders = dict(s.execute(select(WorkOrder.status, func.count()).where(WorkOrder.home_id == hid)
                                .group_by(WorkOrder.status)).all())
        out.append({
            "home_id": hid,
            "address": {"street": h.street, "postal_code": h.postal_code, "city": h.city},
            "created_at": h.created_at,
            "profile_known": sum(1 for f in fields if f.get("value") != "unknown"),
            "profile_total": len(fields),
            "documents": docs[0],
            "last_upload_at": docs[1],
            "open_risks": len(engine.risk_list(s, hid)["risks"]),
            "work_orders": {"booked": orders.get("booked", 0), "confirmed": orders.get("confirmed", 0)},
        })
    return {"customers": out}


@router.get("/partners")
def list_partners(s: Session = Depends(_session)):
    return {"partners": db.partners(s)}


class PartnerPatch(BaseModel):
    price_min: int | None = Field(default=None, ge=0)
    price_max: int | None = Field(default=None, ge=0)
    tier_discount_percent: int | None = Field(default=None, ge=0, le=100)
    if_vetted: bool | None = None
    listing_fee_tier: Literal["basic", "plus"] | None = None


@router.patch("/partners/{partner_id}")
def patch_partner(partner_id: str, body: PartnerPatch, s: Session = Depends(_session)):
    p = s.get(Partner, partner_id)
    if p is None:
        raise HTTPException(404, f"Partner {partner_id} not found.")
    lo = p.price_min if body.price_min is None else body.price_min
    hi = p.price_max if body.price_max is None else body.price_max
    if lo > hi:
        raise HTTPException(400, "The minimum price is above the maximum price.")
    p.price_min, p.price_max = lo, hi
    if body.tier_discount_percent is not None:
        p.tier_discount_percent = body.tier_discount_percent
    if body.if_vetted is not None:
        p.if_vetted = int(body.if_vetted)
    if body.listing_fee_tier is not None:
        p.listing_fee_tier = body.listing_fee_tier
    p.updated_at = db.now_iso()
    s.commit()
    return db.partner_dict(p)


@router.get("/tiers")
def list_tiers(s: Session = Depends(_session)):
    return {"tiers": db.tiers(s)}


class TierPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=40)
    min_score: int | None = Field(default=None, ge=0)
    deductible_reduction_eur: int | None = Field(default=None, ge=0)
    partner_discount_percent: int | None = Field(default=None, ge=0, le=100)
    free_checkups: list[str] | None = None


@router.patch("/tiers/{tier_index}")
def patch_tier(tier_index: int, body: TierPatch, s: Session = Depends(_session)):
    tiers = db.tiers(s)
    current = next((t for t in tiers if t["index"] == tier_index), None)
    if current is None:
        raise HTTPException(404, f"Tier {tier_index} not found.")
    new = {**current, **body.model_dump(exclude_none=True)}
    # Tiers are a ladder: each one starts above the tier below it.
    below = [t["min_score"] for t in tiers if t["index"] < tier_index]
    above = [t["min_score"] for t in tiers if t["index"] > tier_index]
    if (below and new["min_score"] <= max(below)) or (above and new["min_score"] >= min(above)):
        raise HTTPException(400, "The minimum score must sit between the tiers below and above.")
    t = s.get(Tier, tier_index)
    t.name, t.min_score = new["name"], new["min_score"]
    t.deductible_reduction_eur = new["deductible_reduction_eur"]
    t.partner_discount_percent = new["partner_discount_percent"]
    t.free_checkups = json.dumps([c.strip() for c in new["free_checkups"] if c.strip()])
    t.updated_at = db.now_iso()
    s.commit()
    return db.tier_dict(t)
