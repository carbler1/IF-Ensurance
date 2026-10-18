"""The endpoints, the bearer token check, CORS, the upload. Shapes: docs/API.md."""

import json
import os
import re
import secrets

from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select

from backend import admin, app_api, db, engine, insurance, maintenance
from backend.auth import Who, client_ip, rate_limit, require_token, sha
from backend.models import Customer, Document, Home, InsuredObject, Job, Profile, RiskText

app = FastAPI(title="If Life Partner")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()],
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Authorization", "Content-Type"],
)


def _err(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse({"error": {"code": code, "message": message}}, status_code=status)


_CODES = {400: "bad_request", 401: "unauthorized", 404: "not_found", 405: "method_not_allowed", 409: "conflict", 429: "too_many_attempts"}


@app.exception_handler(StarletteHTTPException)
async def _http_error(request, exc: StarletteHTTPException):
    # A dict detail carries its own code, for example unsupported_document.
    if isinstance(exc.detail, dict):
        return _err(exc.status_code, exc.detail.get("code", _CODES.get(exc.status_code, "error")), exc.detail.get("message", ""))
    return _err(exc.status_code, _CODES.get(exc.status_code, "error"), str(exc.detail))


@app.exception_handler(RequestValidationError)
async def _bad_request(request, exc):
    first = (exc.errors() or [{}])[0]
    field = ".".join(str(p) for p in first.get("loc", ())[1:])
    detail = f" {field}: {first['msg']}." if field and first.get("msg") else ""
    return _err(400, "bad_request", "The request is not valid." + detail)


@app.exception_handler(Exception)
async def _server_error(request, exc):
    return _err(500, "internal_error", "Unexpected server error.")


v1 = APIRouter(prefix="/v1", dependencies=[Depends(require_token)])


_KEYS = {"boat": "reg_no", "car": "plate", "dog": "chip_id", "cottage": "property_id"}


def _norm(x: str) -> str:
    return re.sub(r"[\s-]", "", x or "").lower()


def _mask(key: str) -> str:
    """Keep the first 3 and the last character, star the letters and digits between."""
    k = key.strip()
    return k if len(k) <= 4 else k[:3] + re.sub(r"[^\W_]", "*", k[3:-1]) + k[-1]


@app.get("/v1/profiles/search")
def profiles_search(request: Request, cls: str = Query(alias="class"), q: str = ""):
    """Find a customer by a register key, for the sign-in. No auth; masked labels, at most 5 hits.
    A q shorter than 4 characters (after dropping case, spaces and dashes) is a 400."""
    rate_limit(request, "search")
    if cls != "house" and cls not in _KEYS:
        raise HTTPException(400, "Unknown class.")
    nq = _norm(q)
    if len(nq) < 4:
        raise HTTPException(400, "Type at least 4 characters.")
    hits = []  # (customer_id, label)
    with db.connect() as s:
        if cls == "house":
            for h in s.scalars(select(Home).where(Home.customer_id.is_not(None)).order_by(Home.home_id)):
                if nq in _norm(h.street + h.postal_code) or _norm(f"{h.street}{h.postal_code}").startswith(nq):
                    name, _, num = h.street.partition(" ")
                    hits.append((h.customer_id, f"{name[:3]}*** {num}, {h.city}" if len(name) > 3 else f"{h.street}, {h.city}"))
        else:
            for o in s.scalars(select(InsuredObject).where(InsuredObject.class_id == cls).order_by(InsuredObject.object_id)):
                key = (json.loads(o.profile) if o.profile else {}).get(_KEYS[cls])
                if isinstance(key, str) and _norm(key) == nq:
                    hits.append((o.customer_id, _mask(key)))
        taken = set(s.scalars(select(Customer.customer_id).where(Customer.password_hash.is_not(None))))
    return {"hits": [{"customer_id": c, "label": l, "taken": c in taken} for c, l in hits[:5]]}


class ClaimBody(BaseModel):
    customer_id: str
    password: str = Field(min_length=8, max_length=200)


@app.post("/v1/claim")
def claim(body: ClaimBody, request: Request):
    """First claim sets the password, later calls verify it. Answers with a new bearer token.
    shortcut: one token per customer, so a sign-in on a second device signs the first one out."""
    rate_limit(request, "claim")
    with db.connect() as s:
        c = s.get(Customer, body.customer_id)
        if c is None:
            raise HTTPException(404, "Unknown customer.")
        admin.claim_or_verify(s, c, f"cust:{c.customer_id}:{client_ip(request)}", Customer.customer_id == c.customer_id, body.password)
        token = secrets.token_urlsafe(32)
        c.token_hash = sha(token)
        s.commit()
    return {"token": token}


@v1.get("/homes/me")
def get_home(who: Who = Depends(require_token)):
    HOME_ID = who.home_id
    if HOME_ID is None:
        raise HTTPException(404, "Home not found.")
    with db.connect() as s:
        home = s.get(Home, HOME_ID)
        prof = s.get(Profile, HOME_ID)
        docs = s.scalars(select(Document).where(Document.home_id == HOME_ID)
                         .order_by(Document.uploaded_at, Document.document_id)).all()
        if home is None or prof is None:
            raise HTTPException(404, "Home not found.")
        return {
            "home_id": home.home_id,
            "address": {"street": home.street, "postal_code": home.postal_code, "city": home.city},
            "profile": json.loads(prof.profile),
            "documents": [{"document_id": d.document_id, "type": d.type, "uploaded_at": d.uploaded_at,
                           "status": d.status} for d in docs],
        }


@v1.get("/jobs/{job_id}")
def get_job(job_id: str, who: Who = Depends(require_token)):
    with db.connect() as s:
        job = s.get(Job, job_id)
        doc = s.get(Document, job.document_id) if job else None
    if job is None or doc is None or doc.home_id != who.home_id:
        raise HTTPException(404, f"Job {job_id} not found.")
    error = None
    if job.error:
        try:
            error = json.loads(job.error)
        except ValueError:
            error = None
        if not isinstance(error, dict):
            error = {"code": "failed", "message": job.error}
    return {
        "job_id": job.job_id,
        "status": job.status,
        "stage": job.stage if job.status == "running" else None,
        "started_at": job.started_at,
        "finished_at": job.finished_at,
        "error": error,
    }


def _read(who, fn, *args):
    if who.home_id is None:
        raise HTTPException(404, "Home not found.")
    with db.connect() as s:
        return fn(s, who.home_id, *args)


@v1.get("/homes/me/risks")
def get_risks(who: Who = Depends(require_token)):
    return _read(who, engine.risk_list)


@v1.get("/homes/me/risks/{risk_id}")
def get_risk(risk_id: str, who: Who = Depends(require_token)):
    try:
        return _read(who, engine.risk_detail, risk_id)
    except LookupError:
        raise HTTPException(404, f"Risk {risk_id} not found.")


@v1.get("/me/insurances")
def get_insurances(who: Who = Depends(require_token)):
    """Every insured object of the customer with the fixes that apply, their points and premium cuts."""
    with db.connect() as s:
        objects = insurance.customer_objects(s, who.customer_id)
        result = insurance.simulate(s, objects)
        texts = {t.risk_id: t for t in s.scalars(select(RiskText).where(RiskText.home_id == who.home_id))}
        assigned = {r["id"]: r for r in insurance.assigned_risks(s, [o["object_id"] for o in objects])}
    hints = {r["id"]: r for d in insurance.definitions() for r in d["risks"]}
    for o in result["objects"]:
        for f in o["fixes"]:
            t, h, a = texts.get(f["risk_id"]), hints.get(f["risk_id"]), assigned.get(f["risk_id"])
            if a:  # the app's own texts
                f["why"], f["benefit"] = a["why"], a["explain"]
            else:
                f["why"] = t.why if t else engine._strip(h["why_hint"])
                f["benefit"] = t.benefit if t else engine._strip(h["benefit_hint"])
            for k in ("rule_id", "rule_label", "rule_context"):
                f.pop(k, None)
    return result


@v1.get("/homes/me/maintenance")
def get_maintenance(who: Who = Depends(require_token)):
    return _read(who, maintenance.maintenance)


try:
    from backend.upload import router as _upload_router

    v1.include_router(_upload_router)
except ImportError:
    pass

v1.include_router(app_api.router)  # the mobile app: /v1/me/app, bookings, reminders
app.include_router(v1)
# The staff dashboard's routes have their own token (X-Admin-Token), not the customer bearer token.
app.include_router(admin.router, prefix="/v1")


@app.get("/health")
def health():
    """Liveness check for docker compose. No auth, no data."""
    return {"status": "ok"}


@app.on_event("startup")
def _seed():
    with db.connect() as s:
        db.seed(s)
