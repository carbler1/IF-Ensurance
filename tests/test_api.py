import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parent.parent
H = {"Authorization": "Bearer t"}


def fx(n):
    return json.loads((ROOT / "fixtures" / "api" / n).read_text())


def test_routes(tmp_path, monkeypatch):
    from backend import db
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "t.sqlite")
    monkeypatch.setattr(db, "UPLOADS", tmp_path / "up")
    monkeypatch.setenv("CUSTOMER_TOKEN", "t")
    from backend.api import app
    with TestClient(app) as c:  # runs the startup seed
        from backend.models import Profile, RiskText
        prof = json.loads((ROOT / "prompts/examples/write-1-input.json").read_text())["profile"]
        now = datetime.now(timezone.utc).isoformat()
        with db.connect() as s:
            s.get(Profile, "home_01").profile = json.dumps(prof)
            s.add(RiskText(home_id="home_01", risk_id="elec.check.overdue", why="w", benefit="b",
                           llm_proposed=0, generated_at=now))
            s.commit()
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



def test_fix_rules(tmp_path, monkeypatch):
    from backend import db, engine
    from backend.models import FixRule, Profile
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "t.sqlite")
    monkeypatch.setattr(db, "UPLOADS", tmp_path / "up")
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with db.connect() as s:
        db.seed(s)
        prof = json.loads(s.get(Profile, "home_01").profile)

        entry = {e["id"]: e for e in json.loads((ROOT / "data/catalogue.json").read_text())["entries"]}["elec.check.overdue"]

        def check_value(year):
            prof["building_year"]["value"] = year
            v = engine.fix_value(db.fix_rules(s), entry, prof)
            return v["points"], v["premium_reduction_eur"]

        assert check_value(1965) == (110, 60)  # the "before 1970" context rule wins over the default
        assert check_value(1985) == (80, 40)   # outside that context the default rule applies
        s.get(FixRule, "example.elec_check_pre1970").active = 0
        s.commit()
        assert check_value(1965) == (80, 40)   # an inactive rule never applies
