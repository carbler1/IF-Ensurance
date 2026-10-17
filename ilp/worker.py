"""Takes the next queued job, runs the pipeline, sets status and stage. DESIGN.md §6."""

import json
import time

from ilp import db, pipeline

LIMIT = 180  # seconds


class Timeout(Exception):
    code = "timeout"


def _fail(conn, job_id, document_id, code, message) -> None:
    err = json.dumps({"code": code, "message": message})
    conn.execute("UPDATE jobs SET status='failed', stage=NULL, finished_at=?, error=? WHERE job_id=?",
                 (pipeline.now(), err, job_id))
    conn.execute("UPDATE documents SET status='failed' WHERE document_id=?", (document_id,))
    conn.commit()


def run_once(conn) -> bool:
    row = conn.execute("SELECT job_id, document_id FROM jobs WHERE status='queued' ORDER BY rowid LIMIT 1").fetchone()
    if row is None:
        return False
    job_id, document_id = row[0], row[1]
    conn.execute("UPDATE jobs SET status='running', started_at=? WHERE job_id=?", (pipeline.now(), job_id))
    conn.commit()
    t0 = time.monotonic()

    def stage(name):
        conn.execute("UPDATE jobs SET stage=? WHERE job_id=?", (name, job_id))
        conn.commit()

    def check():
        if time.monotonic() - t0 > LIMIT:
            raise Timeout(f"job ran over {LIMIT} s")

    try:
        pipeline.run(conn, document_id, stage, check)
    except Exception as e:
        _fail(conn, job_id, document_id, getattr(e, "code", "pipeline_error"), str(e))
        return True
    conn.execute("UPDATE jobs SET status='done', stage=NULL, finished_at=? WHERE job_id=?", (pipeline.now(), job_id))
    conn.execute("UPDATE documents SET status='processed' WHERE document_id=?", (document_id,))
    conn.commit()
    return True


def main() -> None:
    conn = db.connect()
    for r in conn.execute("SELECT job_id, document_id FROM jobs WHERE status='running'").fetchall():
        _fail(conn, r[0], r[1], "worker_restart", "worker restarted while the job ran")
    while True:
        if not run_once(conn):
            time.sleep(1)


if __name__ == "__main__":
    main()
