"""Glue for the steps extract -> merge -> match -> write. docs/DESIGN.md §4."""

import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from backend.db import UPLOADS
from backend.models import Document, Profile, RiskText


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def run(s: Session, document_id: str, stage, check) -> None:
    """stage(name) records the stage; check() raises when the job is over time."""
    from backend import extract, write

    home_id = s.get(Document, document_id).home_id
    stage("extracting")
    candidates, pages = extract.run(UPLOADS / f"{document_id}.pdf", document_id, check)
    check()
    row = s.get(Profile, home_id)
    profile = extract.merge(json.loads(row.profile), candidates, pages, document_id)
    row.profile, row.updated_at = json.dumps(profile), now()
    s.commit()
    check()
    stage("matching")
    matched = write.match(profile)
    check()
    if not matched:
        return
    stage("writing")
    texts = write.texts(profile, matched, check)
    check()
    for risk_id, t in texts.items():
        # merge() inserts the text, or replaces the one already stored for this home and risk.
        s.merge(RiskText(home_id=home_id, risk_id=risk_id, why=t["why"], benefit=t["benefit"],
                         llm_proposed=1 if t.get("llm_proposed") else 0, generated_at=now()))
    s.commit()
