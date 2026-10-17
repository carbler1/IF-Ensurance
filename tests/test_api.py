import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parent.parent
H = {"Authorization": "Bearer t"}


def fx(n):
    return json.loads((ROOT / "fixtures" / "api" / n).read_text())


def test_routes(tmp_path, monkeypatch):
    from ilp import db
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "t.sqlite")
    monkeypatch.setattr(db, "UPLOADS", tmp_path / "up")
    monkeypatch.setenv("CUSTOMER_TOKEN", "t")
    from ilp.api import app
    with TestClient(app) as c:  # runs the startup seed
        conn = db.connect()
        prof = json.loads((ROOT / "prompts/examples/write-1-input.json").read_text())["profile"]
        now = datetime.now(timezone.utc).isoformat()
        with conn:
            conn.execute("UPDATE profiles SET profile=? WHERE home_id='home_01'", (json.dumps(prof),))
            conn.execute("INSERT INTO risk_texts VALUES ('home_01','elec.check.overdue','w','b',0,?)", (now,))
        conn.close()
        for p in ("/v1/homes/me/risks", "/v1/homes/me/risks/x", "/v1/homes/me/maintenance"):
            assert c.get(p).status_code == 401
        r = c.get("/v1/homes/me/risks", headers=H).json()
        assert set(r) == set(fx("risks.json")) and r["risks"]
        assert set(r["risks"][0]) == set(fx("risks.json")["risks"][0])
        rid = r["risks"][0]["risk_id"]
        d = c.get(f"/v1/homes/me/risks/{rid}", headers=H).json()
        assert set(d) == set(fx("risk-detail.json"))
        n = c.get("/v1/homes/me/risks/nope", headers=H)
        assert n.status_code == 404 and n.json()["error"]["code"] == "not_found"
        m = c.get("/v1/homes/me/maintenance", headers=H).json()
        assert set(m) == set(fx("maintenance.json"))
        up = c.post("/v1/homes/me/documents", headers=H, data={"type": "kuntotarkastus"},
                    files={"file": ("a.pdf", b"%PDF-1.4 x", "application/pdf")})
        assert up.status_code == 202 and set(up.json()) == set(fx("documents-post.json"))
        assert c.post("/v1/homes/me/documents", data={"type": "kuntotarkastus"},
                      files={"file": ("a.pdf", b"%PDF-")}).status_code == 401

if __name__ == "__main__":
    import tempfile

    class MP:
        def setattr(self, o, n, v):
            setattr(o, n, v)

        def setenv(self, k, v):
            import os
            os.environ[k] = v

    test_routes(Path(tempfile.mkdtemp()), MP())
    print("ok")
