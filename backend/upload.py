"""POST /homes/me/documents. DESIGN.md §6 step 1."""

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import JSONResponse

from backend import db

router = APIRouter()
MAX_BYTES = 20 * 1024 * 1024


def _err(code: str, message: str) -> JSONResponse:
    return JSONResponse({"error": {"code": code, "message": message}}, status_code=400)


@router.post("/homes/me/documents", status_code=202)
async def post_document(file: UploadFile = File(...), type: str = Form(...)):
    if type != "kuntotarkastus":
        return _err("unsupported_document", "type must be kuntotarkastus")
    data = await file.read(MAX_BYTES + 1)  # bounded read
    if len(data) > MAX_BYTES:
        return _err("too_large", "File is larger than 20 MB")
    if not data.startswith(b"%PDF-"):
        return _err("unsupported_document", "File is not a PDF")
    doc_id = "doc_" + secrets.token_hex(4)
    job_id = "job_" + secrets.token_hex(4)
    conn = db.connect()  # also creates db.UPLOADS
    (db.UPLOADS / f"{doc_id}.pdf").write_bytes(data)
    now = datetime.now(timezone.utc).isoformat()
    with conn:
        conn.execute(
            "INSERT INTO documents VALUES (?, 'home_01', ?, ?, 'queued')",
            (doc_id, type, now),
        )
        conn.execute(
            "INSERT INTO jobs (job_id, document_id, status) VALUES (?, ?, 'queued')",
            (job_id, doc_id),
        )
    conn.close()
    return {"document_id": doc_id, "job_id": job_id}
