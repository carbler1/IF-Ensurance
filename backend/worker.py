"""Takes the next queued job, runs the pipeline, sets status and stage. DESIGN.md §6."""

import json
import time

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from backend import db, pipeline
from backend.models import Document, Job

LIMIT = 180  # seconds


class Timeout(Exception):
    code = "timeout"


def _finish(s: Session, job_id, document_id, job_values: dict, document_status: str) -> None:
    s.execute(update(Job).where(Job.job_id == job_id).values(stage=None, finished_at=pipeline.now(), **job_values))
    s.execute(update(Document).where(Document.document_id == document_id).values(status=document_status))
    s.commit()


def _fail(s: Session, job_id, document_id, code, message) -> None:
    err = json.dumps({"code": code, "message": message})
    _finish(s, job_id, document_id, {"status": "failed", "error": err}, "failed")


def run_once(s: Session) -> bool:
    # The oldest queued job runs first.
    row = s.execute(select(Job.job_id, Job.document_id).where(Job.status == "queued")
                    .order_by(Job.queued_at, Job.job_id).limit(1)).first()
    if row is None:
        s.rollback()  # end the read so the next poll sees new jobs
        return False
    job_id, document_id = row
    s.execute(update(Job).where(Job.job_id == job_id).values(status="running", started_at=pipeline.now()))
    s.commit()
    t0 = time.monotonic()

    def stage(name):
        s.execute(update(Job).where(Job.job_id == job_id).values(stage=name))
        s.commit()

    def check():
        if time.monotonic() - t0 > LIMIT:
            raise Timeout(f"job ran over {LIMIT} s")

    try:
        pipeline.run(s, document_id, stage, check)
    except Exception as e:
        s.rollback()
        _fail(s, job_id, document_id, getattr(e, "code", "pipeline_error"), str(e))
        return True
    _finish(s, job_id, document_id, {"status": "done"}, "processed")
    return True


def main() -> None:
    s = db.connect()
    for job_id, document_id in s.execute(select(Job.job_id, Job.document_id).where(Job.status == "running")).all():
        _fail(s, job_id, document_id, "worker_restart", "worker restarted while the job ran")
    while True:
        if not run_once(s):
            time.sleep(1)


if __name__ == "__main__":
    main()
