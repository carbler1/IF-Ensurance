"""The endpoints, the bearer token check, CORS, the upload. Shapes: docs/API.md."""

import hmac
import json
import os

from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select

from backend import admin, app_api, db, engine, insurance, maintenance
from backend.models import Document, Home, Job, Profile, RiskText

HOME_ID = "home_01"  # the single demo home
CUSTOMER_ID = "cust_01"  # the demo customer who owns it, with a cottage, a boat, a car and a dog

app = FastAPI(title="If Life Partner")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()],
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Authorization", "Content-Type"],
)


def _err(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse({"error": {"code": code, "message": message}}, status_code=status)


_CODES = {400: "bad_request", 401: "unauthorized", 404: "not_found", 409: "conflict"}


@app.exception_handler(HTTPException)
async def _http_error(request, exc: HTTPException):
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


def require_token(authorization: str = Header(default="")):
    token = os.environ.get("CUSTOMER_TOKEN", "")
    scheme, _, given = authorization.partition(" ")
    if not token or scheme.lower() != "bearer" or not hmac.compare_digest(given, token):
        raise HTTPException(401, "Missing or wrong bearer token.")


v1 = APIRouter(prefix="/v1", dependencies=[Depends(require_token)])


@v1.get("/homes/me")
def get_home():
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
def get_job(job_id: str):
    with db.connect() as s:
        job = s.get(Job, job_id)
    if job is None:
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


def _read(fn, *args):
    with db.connect() as s:
        return fn(s, HOME_ID, *args)


@v1.get("/homes/me/risks")
def get_risks():
    return _read(engine.risk_list)


@v1.get("/homes/me/risks/{risk_id}")
def get_risk(risk_id: str):
    try:
        return _read(engine.risk_detail, risk_id)
    except LookupError:
        raise HTTPException(404, f"Risk {risk_id} not found.")


@v1.get("/me/insurances")
def get_insurances():
    """Every insured object of the customer with the fixes that apply, their points and premium cuts."""
    with db.connect() as s:
        result = insurance.simulate(s, insurance.customer_objects(s, CUSTOMER_ID))
        texts = {t.risk_id: t for t in s.scalars(select(RiskText).where(RiskText.home_id == HOME_ID))}
        assigned = {r["id"]: r for r in insurance.assigned_risks(s)}
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
def get_maintenance():
    return _read(maintenance.maintenance)


try:
    from backend.upload import router as _upload_router

    v1.include_router(_upload_router)
except ImportError:  # upload.py not written yet
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
