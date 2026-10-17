"""The endpoints, the bearer token check, CORS, the upload. Shapes: docs/systemdesign/api-contract.md."""

import hmac
import json
import os

from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend import admin, db, engine, maintenance

HOME_ID = "home_01"  # the single demo home

app = FastAPI(title="If Life Partner")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()],
    allow_methods=["GET", "POST"],
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
    return _err(400, "bad_request", "The request is not valid.")


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
    conn = db.connect()
    try:
        home = conn.execute("SELECT * FROM homes WHERE home_id=?", (HOME_ID,)).fetchone()
        prof = conn.execute("SELECT profile FROM profiles WHERE home_id=?", (HOME_ID,)).fetchone()
        docs = conn.execute(
            "SELECT document_id, type, uploaded_at, status FROM documents WHERE home_id=? ORDER BY uploaded_at, document_id",
            (HOME_ID,),
        ).fetchall()
    finally:
        conn.close()
    if home is None or prof is None:
        raise HTTPException(404, "Home not found.")
    return {
        "home_id": home["home_id"],
        "address": {"street": home["street"], "postal_code": home["postal_code"], "city": home["city"]},
        "profile": json.loads(prof["profile"]),
        "documents": [dict(d) for d in docs],
    }


@v1.get("/jobs/{job_id}")
def get_job(job_id: str):
    conn = db.connect()
    try:
        job = conn.execute("SELECT * FROM jobs WHERE job_id=?", (job_id,)).fetchone()
    finally:
        conn.close()
    if job is None:
        raise HTTPException(404, f"Job {job_id} not found.")
    error = None
    if job["error"]:
        try:
            error = json.loads(job["error"])
        except ValueError:
            error = None
        if not isinstance(error, dict):
            error = {"code": "failed", "message": job["error"]}
    return {
        "job_id": job["job_id"],
        "status": job["status"],
        "stage": job["stage"] if job["status"] == "running" else None,
        "started_at": job["started_at"],
        "finished_at": job["finished_at"],
        "error": error,
    }


def _read(fn, *args):
    conn = db.connect()
    try:
        return fn(conn, HOME_ID, *args)
    finally:
        conn.close()


@v1.get("/homes/me/risks")
def get_risks():
    return _read(engine.risk_list)


@v1.get("/homes/me/risks/{risk_id}")
def get_risk(risk_id: str):
    try:
        return _read(engine.risk_detail, risk_id)
    except LookupError:
        raise HTTPException(404, f"Risk {risk_id} not found.")


@v1.get("/homes/me/maintenance")
def get_maintenance():
    return _read(maintenance.maintenance)


try:
    from backend.upload import router as _upload_router

    v1.include_router(_upload_router)
except ImportError:  # upload.py not written yet
    pass

app.include_router(v1)
# Admin routes have their own token (X-Admin-Token), not the customer bearer token.
app.include_router(admin.router, prefix="/v1")


@app.get("/health")
def health():
    """Liveness check for docker compose. No auth, no data."""
    return {"status": "ok"}


@app.on_event("startup")
def _seed():
    conn = db.connect()
    db.seed(conn)
    conn.close()
