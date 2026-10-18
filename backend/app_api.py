"""The mobile app's API: everything the app shows about the demo customer, and the few things the
customer changes (bookings, reminders). Customer bearer token, like the rest of /v1.
Field names follow the app (mobile-app/src/lib/types.ts). Scores come from insurance.simulate."""

import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from backend import db, engine, insurance
from backend.auth import Who, require_token
from backend.models import AssignedRisk, Bid, Booking, Customer, InsuredObject, MaintenanceTask, Reminder

TIER_IDS = ["bronze", "silver", "gold", "platinum"]  # the app's tier colours, by tier index

router = APIRouter(prefix="/me")


def app_data(s, customer_id: str) -> dict:
    customer = s.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(404, "The customer is missing.")
    objects = insurance.customer_objects(s, customer_id)
    sim = insurance.simulate(s, objects)
    by_object = {o["object_id"]: o for o in objects}
    rows = {o.object_id: o for o in s.scalars(select(InsuredObject).where(InsuredObject.customer_id == customer_id))}
    house = next((rows[o["object_id"]] for o in objects if o["class_id"] == "house"), None)
    st = db.settings(s)
    rules = db.fix_rules(s)
    bookings = {b.risk_id: b for b in s.scalars(select(Booking).where(Booking.customer_id == customer_id))}

    risks = []
    for r in s.scalars(select(AssignedRisk).where(AssignedRisk.object_id.in_(list(by_object))).order_by(AssignedRisk.sort_order)):
        o = by_object[r.object_id]
        points = engine.fix_value(rules, {"id": r.risk_id, "points": 0}, o["profile"])["points"]
        b = bookings.get(r.risk_id)
        risks.append({"id": r.risk_id, "insurance": o["class_id"], "area": r.area, "title": r.title, "why": r.why,
                      "points": points, "explain": r.explain, "fix": r.fix, "diy": r.diy,
                      "job": {"bidId": b.bid_id, "mode": b.mode, "step": b.step} if b else None})

    return {
        "customer": {"id": customer.customer_id, "name": customer.name},
        "home": json.loads(house.details) if house else {},
        "model": {"insuranceStart": st.insurance_score_start, "maxScore": st.max_score,
                  "bands": [{"min": b["min_score"], "percent": b["percent"]} for b in sim["model"]["bands"]],
                  "inspectionPriceFactor": st.inspection_price_factor},
        "tiers": [{"id": TIER_IDS[t["index"]] if t["index"] < len(TIER_IDS) else f"tier{t['index']}", "name": t["name"],
                   "min": t["min_score"], "partnerDiscount": t["partner_discount_percent"], "rewards": t["bonuses"]}
                  for t in sim["model"]["tiers"]],
        "insurances": [{"id": o["class_id"], "objectId": o["object_id"], "object": o["name"], "premium": o["premium"]["base"],
                        "score": o["score"]["now"], "band": o["band"]["now"]} for o in sim["objects"]],
        "aggregate": sim["aggregate"]["now"],
        "risks": risks,
        "history": [{"insurance": o["class_id"], "label": h["label"], "points": h["points"]}
                    for o in objects for h in o["history"]],
        "bids": [{"id": b.bid_id, "name": b.name, "rating": b.rating, "reviews": b.reviews, "price": b.price, "date": b.earliest}
                 for b in s.scalars(select(Bid).where(Bid.customer_id == customer_id).order_by(Bid.sort_order))],
        "tasks": [{"id": t.task_id, "season": t.season, "title": t.title, "due": t.due, "reason": t.reason, "reasonText": t.reason_text}
                  for t in s.scalars(select(MaintenanceTask).where(MaintenanceTask.customer_id == customer_id)
                                     .order_by(MaintenanceTask.sort_order))],
        "reminders": list(s.scalars(select(Reminder.task_id).where(Reminder.customer_id == customer_id))),
    }


@router.get("/app")
def get_app(who: Who = Depends(require_token)):
    with db.connect() as s:
        return app_data(s, who.customer_id)


class BookingIn(BaseModel):
    risk_id: str
    bid_id: str
    mode: str


@router.post("/bookings", status_code=201)
def book(body: BookingIn, who: Who = Depends(require_token)):
    """Book a partner for a risk. Answers with the whole app data, so the app needs one call."""
    if body.mode not in ("hire", "diy"):
        raise HTTPException(400, "mode must be hire or diy.")
    with db.connect() as s:
        risk = s.get(AssignedRisk, body.risk_id)
        bid = s.get(Bid, body.bid_id)
        if risk is None or bid is None or bid.customer_id != who.customer_id or s.get(InsuredObject, risk.object_id).customer_id != who.customer_id:
            raise HTTPException(404, "Unknown risk or bid.")
        if s.get(Booking, body.risk_id) is not None:
            raise HTTPException(409, "This risk is already booked.")
        s.add(Booking(risk_id=body.risk_id, customer_id=who.customer_id, object_id=risk.object_id, bid_id=body.bid_id,
                      mode=body.mode, step=0, created_at=db.now_iso()))
        s.commit()
        return app_data(s, who.customer_id)


@router.post("/bookings/{risk_id}/advance")
def advance(risk_id: str, who: Who = Depends(require_token)):
    """Move a booking one step on (the demo's "simulate next step"). Step 2 confirms the fix."""
    with db.connect() as s:
        b = s.get(Booking, risk_id)
        if b is None or b.customer_id != who.customer_id:
            raise HTTPException(404, f"No booking for {risk_id}.")
        if b.step < 2:
            b.step += 1
            if b.step == 2:
                b.confirmed_at = db.now_iso()
        s.commit()
        return app_data(s, who.customer_id)


class ReminderIn(BaseModel):
    on: bool


@router.put("/reminders/{task_id}")
def set_reminder(task_id: str, body: ReminderIn, who: Who = Depends(require_token)):
    with db.connect() as s:
        task = s.get(MaintenanceTask, task_id)
        if task is None or task.customer_id != who.customer_id:
            raise HTTPException(404, f"Task {task_id} not found.")
        row = s.get(Reminder, (who.customer_id, task_id))
        if body.on and row is None:
            s.add(Reminder(customer_id=who.customer_id, task_id=task_id))
        elif not body.on and row is not None:
            s.delete(row)
        s.commit()
        return app_data(s, who.customer_id)
