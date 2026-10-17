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


def test_admin(tmp_path, monkeypatch):
    from backend import db
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "t.sqlite")
    monkeypatch.setattr(db, "UPLOADS", tmp_path / "up")
    monkeypatch.setenv("CUSTOMER_TOKEN", "t")
    monkeypatch.setenv("ADMIN_TOKEN", "a")
    from backend.api import app
    A = {"X-Admin-Token": "a"}
    with TestClient(app) as c:
        assert c.get("/health").json() == {"status": "ok"}
        assert c.get("/v1/admin/partners").status_code == 401
        assert c.get("/v1/admin/partners", headers=H).status_code == 401  # customer token is not enough
        assert c.get("/v1/admin/overview", headers=A).json()["customers"] == 1
        assert c.get("/v1/admin/customers", headers=A).json()["customers"][0]["home_id"] == "home_01"

        partners = c.get("/v1/admin/partners", headers=A).json()["partners"]
        assert len(partners) == len(json.loads((ROOT / "fixtures/partners.json").read_text())["partners"])
        pid = partners[0]["partner_id"]
        p = c.patch(f"/v1/admin/partners/{pid}", headers=A, json={"price_min": 300, "tier_discount_percent": 12}).json()
        assert p["price_range"]["min"] == 300 and p["tier_discount_percent"] == 12
        assert c.patch(f"/v1/admin/partners/{pid}", headers=A, json={"price_min": 10**6}).status_code == 400
        assert c.patch(f"/v1/admin/partners/{pid}", headers=A, json={"tier_discount_percent": 101}).status_code == 400
        assert c.patch("/v1/admin/partners/nope", headers=A, json={}).status_code == 404

        t = c.patch("/v1/admin/tiers/1", headers=A, json={"deductible_reduction_eur": 75, "free_checkups": ["roof"]}).json()
        assert t["deductible_reduction_eur"] == 75 and t["free_checkups"] == ["roof"]
        assert c.patch("/v1/admin/tiers/1", headers=A, json={"min_score": 5000}).status_code == 400
