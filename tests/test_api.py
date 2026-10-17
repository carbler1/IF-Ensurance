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


def test_admin_and_insurances(tmp_path, monkeypatch):
    from backend import db
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "t.sqlite")
    monkeypatch.setattr(db, "UPLOADS", tmp_path / "up")
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("CUSTOMER_TOKEN", "t")
    monkeypatch.setenv("ADMIN_TOKEN", "a")
    from backend.api import app
    A = {"X-Admin-Token": "a"}
    with TestClient(app) as c:
        assert c.get("/v1/admin/classes").status_code == 401
        assert c.get("/v1/admin/classes", headers=H).status_code == 401  # the customer token is not enough

        classes = {k["class_id"]: k for k in c.get("/v1/admin/classes", headers=A).json()["classes"]}
        assert list(classes) == ["house", "cottage", "boat", "car", "dog"]
        assert all(len(classes[k]["risks"]) == 2 for k in ("cottage", "boat", "car", "dog"))

        cust = c.get("/v1/admin/customers", headers=A).json()["customers"]
        assert len(cust) == 1 and [o["class_id"] for o in cust[0]["objects"]] == ["house", "cottage", "boat", "car", "dog"]
        dog = next(o for o in cust[0]["objects"] if o["class_id"] == "dog")
        assert {f["risk_id"] for f in dog["fixes"]} == {"dog.vaccination.expired", "dog.joints.large_breed_check"}

        # A context rule for young dogs does not apply to Ruska (born 2018); one for large dogs does.
        bad = {"risk_id": "dog.vaccination.expired", "label": "x", "priority": 5, "points": 1,
               "half_life_years": 1, "premium_reduction_eur": 1, "context": {"op": "lt", "field": "building_year", "value": 1}}
        assert c.post("/v1/admin/rules", headers=A, json=bad).status_code == 400  # a house field on a dog risk
        good = {**bad, "label": "Large dogs", "points": 70, "premium_reduction_eur": 45,
                "context": {"op": "eq", "field": "breed_size", "value": "large"}}
        rule = c.post("/v1/admin/rules", headers=A, json=good).json()
        sim = c.post("/v1/admin/simulate", headers=A, json={"objects": [
            {"class_id": "dog", "profile": {"breed_size": "large", "birth_year": 2018, "vaccinations_valid": "no"}}]}).json()
        vacc = next(f for f in sim["objects"][0]["fixes"] if f["risk_id"] == "dog.vaccination.expired")
        assert (vacc["points"], vacc["premium_reduction_eur"], vacc["rule_id"]) == (70, 45, rule["rule_id"])
        assert c.delete(f"/v1/admin/rules/{rule['rule_id']}", headers=A).status_code == 204
        assert c.delete("/v1/admin/rules/default.dog.vaccination.expired", headers=A).status_code == 409

        # The premium cut of a class stops at its cap.
        c.patch("/v1/admin/classes/dog", headers=A, json={"base_annual_premium_eur": 100, "max_reduction_percent": 10})
        sim = c.post("/v1/admin/simulate", headers=A, json={"objects": [
            {"class_id": "dog", "profile": {"breed_size": "large", "birth_year": 2018, "vaccinations_valid": "no"}}]}).json()
        assert sim["objects"][0]["premium"]["cut"] == 10 and sim["objects"][0]["premium"]["capped"]

        mine = c.get("/v1/me/insurances", headers=H).json()
        assert len(mine["objects"]) == 5 and mine["score"]["start"] == 1000
        assert all({"why", "benefit", "points", "premium_reduction_eur"} <= set(f) for o in mine["objects"] for f in o["fixes"])
