"""Glue for the steps extract -> merge -> match -> write. DESIGN.md §6."""

import json
from datetime import datetime, timezone

from ilp.db import UPLOADS


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def run(conn, document_id: str, stage, check) -> None:
    """stage(name) records the stage; check() raises when the job is over time."""
    from ilp import extract, write  # lazy: written by other modules

    home_id = conn.execute("SELECT home_id FROM documents WHERE document_id=?", (document_id,)).fetchone()[0]
    stage("extracting")
    candidates, pages = extract.run(UPLOADS / f"{document_id}.pdf", document_id)
    check()
    profile = json.loads(conn.execute("SELECT profile FROM profiles WHERE home_id=?", (home_id,)).fetchone()[0])
    profile = extract.merge(profile, candidates, pages, document_id)
    conn.execute("UPDATE profiles SET profile=?, updated_at=? WHERE home_id=?", (json.dumps(profile), now(), home_id))
    conn.commit()
    check()
    stage("matching")
    matched = write.match(profile)
    check()
    if not matched:
        return
    stage("writing")
    texts = write.texts(profile, matched)
    check()
    for risk_id, t in texts.items():
        conn.execute(
            "INSERT INTO risk_texts (home_id, risk_id, why, benefit, llm_proposed, generated_at) VALUES (?,?,?,?,?,?) "
            "ON CONFLICT(home_id, risk_id) DO UPDATE SET why=excluded.why, benefit=excluded.benefit, "
            "llm_proposed=excluded.llm_proposed, generated_at=excluded.generated_at",
            (home_id, risk_id, t["why"], t["benefit"], 1 if t.get("llm_proposed") else 0, now()),
        )
    conn.commit()
