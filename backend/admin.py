"""The If staff dashboard API (frontend/). The dashboard calls these from its server, never from
the browser, and never touches the database itself. Auth: header X-Admin-Token = ADMIN_TOKEN.
Shapes: docs/systemdesign/api-contract.md, section "Admin"."""

import hmac
import json
import os
import secrets
from typing import Any, Literal

from fastapi import APIRouter, Depends, Header, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend import db, insurance
from backend.models import (Customer, Document, FixRule, Home, InsuranceClass, InsuranceSettings, Partner,
                            Tier, WorkOrder)


def require_admin(x_admin_token: str = Header(default="")):
    token = os.environ.get("ADMIN_TOKEN", "")
    if not token or not hmac.compare_digest(x_admin_token, token):
        raise HTTPException(401, "Missing or wrong admin token.")


router = APIRouter(prefix="/admin", dependencies=[Depends(require_admin)])


def _session():
    with db.connect() as s:
        yield s


def _rule_dict(r: FixRule) -> dict:
    return {"rule_id": r.rule_id, "risk_id": r.risk_id, "class_id": insurance.risk_class(r.risk_id), "label": r.label,
            "context": json.loads(r.context) if r.context else None, "priority": r.priority, "points": r.points,
            "half_life_years": r.half_life_years, "premium_reduction_eur": r.premium_reduction_eur,
            "active": bool(r.active), "is_default": r.rule_id.startswith("default.")}


def _class_dict(c: InsuranceClass) -> dict:
    return {"base_annual_premium_eur": c.base_annual_premium_eur, "max_reduction_percent": c.max_reduction_percent}


# --- Overview and customers -------------------------------------------------------------------

@router.get("/overview")
def overview(s: Session = Depends(_session)):
    def by_status(model) -> dict:
        return dict(s.execute(select(model.status, func.count()).group_by(model.status)).all())

    return {
        "customers": s.scalar(select(func.count()).select_from(Customer)),
        "homes": s.scalar(select(func.count()).select_from(Home)),
        "documents": by_status(Document),
        "work_orders": by_status(WorkOrder),
        "active_rules": s.scalar(select(func.count()).select_from(FixRule).where(FixRule.active == 1)),
        "classes": len(insurance.definitions()),
    }


@router.get("/customers")
def customers(s: Session = Depends(_session)):
    out = []
    for c in s.scalars(select(Customer).order_by(Customer.created_at, Customer.customer_id)).all():
        objects = insurance.customer_objects(s, c.customer_id)
        sim = insurance.simulate(s, objects)
        for o, so in zip(objects, sim["objects"]):
            fields = insurance.definition(o["class_id"])["fields"]
            so["profile"] = o["profile"]
            so["profile_known"] = sum(1 for f in fields if o["profile"].get(f["name"], insurance.UNKNOWN) != insurance.UNKNOWN)
            so["profile_total"] = len(fields)
        out.append({"customer_id": c.customer_id, "name": c.name, "created_at": c.created_at, **sim})
    return {"customers": out}


# --- Insurance classes, settings, rules -------------------------------------------------------

@router.get("/classes")
def classes(s: Session = Depends(_session)):
    rows = {c.class_id: c for c in s.scalars(select(InsuranceClass))}
    return {"classes": [{**d, **_class_dict(rows[d["class_id"]])} for d in insurance.definitions() if d["class_id"] in rows]}


class ClassPatch(BaseModel):
    base_annual_premium_eur: int = Field(ge=0, le=1_000_000)
    max_reduction_percent: int = Field(ge=0, le=100)


@router.patch("/classes/{class_id}")
def patch_class(class_id: str, body: ClassPatch, s: Session = Depends(_session)):
    c = s.get(InsuranceClass, class_id)
    if c is None:
        raise HTTPException(404, f"Insurance class {class_id} not found.")
    c.base_annual_premium_eur, c.max_reduction_percent = body.base_annual_premium_eur, body.max_reduction_percent
    c.updated_at = db.now_iso()
    s.commit()
    return _class_dict(c)


@router.get("/settings")
def get_settings(s: Session = Depends(_session)):
    return {"score_start": db.settings(s).score_start}


class SettingsPatch(BaseModel):
    score_start: int = Field(ge=0, le=1_000_000)


@router.patch("/settings")
def patch_settings(body: SettingsPatch, s: Session = Depends(_session)):
    st = s.get(InsuranceSettings, 1)
    st.score_start, st.updated_at = body.score_start, db.now_iso()
    s.commit()
    return {"score_start": st.score_start}


@router.get("/rules")
def rules(s: Session = Depends(_session)):
    rows = s.scalars(select(FixRule).order_by(FixRule.risk_id, FixRule.priority.desc(), FixRule.rule_id))
    return {"rules": [_rule_dict(r) for r in rows]}


class RuleNumbers(BaseModel):
    points: int = Field(ge=0, le=10_000)
    half_life_years: int = Field(ge=1, le=100)
    premium_reduction_eur: int = Field(ge=0, le=100_000)


class RulePatch(RuleNumbers):
    priority: int | None = Field(default=None, ge=1, le=1000)
    active: bool


class RuleCreate(RuleNumbers):
    risk_id: str
    label: str = Field(min_length=1, max_length=80)
    context: dict[str, Any]
    priority: int = Field(ge=1, le=1000)


@router.post("/rules", status_code=201)
def create_rule(body: RuleCreate, s: Session = Depends(_session)):
    class_id = insurance.risk_class(body.risk_id)
    if class_id is None:
        raise HTTPException(404, f"Risk {body.risk_id} not found.")
    try:
        insurance.validate_context(body.context, class_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    r = FixRule(rule_id=f"rule_{secrets.token_hex(4)}", risk_id=body.risk_id, label=body.label.strip(),
                context=json.dumps(body.context), priority=body.priority, points=body.points,
                half_life_years=body.half_life_years, premium_reduction_eur=body.premium_reduction_eur, active=1,
                updated_at=db.now_iso())
    s.add(r)
    s.commit()
    return _rule_dict(r)


@router.patch("/rules/{rule_id}")
def patch_rule(rule_id: str, body: RulePatch, s: Session = Depends(_session)):
    r = s.get(FixRule, rule_id)
    if r is None:
        raise HTTPException(404, f"Rule {rule_id} not found.")
    r.points, r.half_life_years, r.premium_reduction_eur = body.points, body.half_life_years, body.premium_reduction_eur
    r.active = int(body.active)
    # The default rule is the fallback, so its priority stays 0.
    if body.priority is not None and not rule_id.startswith("default."):
        r.priority = body.priority
    r.updated_at = db.now_iso()
    s.commit()
    return _rule_dict(r)


@router.delete("/rules/{rule_id}", status_code=204)
def delete_rule(rule_id: str, s: Session = Depends(_session)):
    r = s.get(FixRule, rule_id)
    if r is None:
        raise HTTPException(404, f"Rule {rule_id} not found.")
    if rule_id.startswith("default."):
        raise HTTPException(409, "A default rule can be switched off but not deleted.")
    s.delete(r)
    s.commit()
    return Response(status_code=204)


class SimObject(BaseModel):
    object_id: str | None = None
    class_id: str
    name: str | None = None
    profile: dict[str, int | str] = {}


class SimRequest(BaseModel):
    objects: list[SimObject] = Field(min_length=1, max_length=20)


@router.post("/simulate")
def simulate(body: SimRequest, s: Session = Depends(_session)):
    valid = {d["class_id"] for d in insurance.definitions()}
    if any(o.class_id not in valid for o in body.objects):
        raise HTTPException(400, "Unknown insurance class.")
    return insurance.simulate(s, [o.model_dump() for o in body.objects])


# --- Partners and tiers -----------------------------------------------------------------------

@router.get("/partners")
def list_partners(s: Session = Depends(_session)):
    return {"partners": db.partners(s)}


class PartnerPatch(BaseModel):
    price_min: int = Field(ge=0)
    price_max: int = Field(ge=0)
    tier_discount_percent: int = Field(ge=0, le=100)
    if_vetted: bool
    listing_fee_tier: Literal["basic", "plus"]


@router.patch("/partners/{partner_id}")
def patch_partner(partner_id: str, body: PartnerPatch, s: Session = Depends(_session)):
    p = s.get(Partner, partner_id)
    if p is None:
        raise HTTPException(404, f"Partner {partner_id} not found.")
    if body.price_min > body.price_max:
        raise HTTPException(400, "The minimum price is above the maximum price.")
    p.price_min, p.price_max, p.tier_discount_percent = body.price_min, body.price_max, body.tier_discount_percent
    p.if_vetted, p.listing_fee_tier, p.updated_at = int(body.if_vetted), body.listing_fee_tier, db.now_iso()
    s.commit()
    return db.partner_dict(p)


@router.get("/tiers")
def list_tiers(s: Session = Depends(_session)):
    return {"tiers": db.tiers(s)}


class TierPatch(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    min_score: int = Field(ge=0)
    deductible_reduction_eur: int = Field(ge=0)
    partner_discount_percent: int = Field(ge=0, le=100)
    free_checkups: list[str] = []


@router.patch("/tiers/{tier_index}")
def patch_tier(tier_index: int, body: TierPatch, s: Session = Depends(_session)):
    tiers = list(s.scalars(select(Tier)))
    t = next((x for x in tiers if x.tier_index == tier_index), None)
    if t is None:
        raise HTTPException(404, f"Tier {tier_index} not found.")
    # Tiers are a ladder: each one starts above the tier below it.
    below = [x.min_score for x in tiers if x.tier_index < tier_index]
    above = [x.min_score for x in tiers if x.tier_index > tier_index]
    if (below and body.min_score <= max(below)) or (above and body.min_score >= min(above)):
        raise HTTPException(400, "The minimum score must sit between the tiers below and above.")
    t.name, t.min_score = body.name.strip(), body.min_score
    t.deductible_reduction_eur, t.partner_discount_percent = body.deductible_reduction_eur, body.partner_discount_percent
    t.free_checkups = json.dumps([c.strip() for c in body.free_checkups if c.strip()])
    t.updated_at = db.now_iso()
    s.commit()
    return db.tier_dict(t)
