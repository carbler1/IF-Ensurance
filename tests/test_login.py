import json
from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy import select

H = {"Authorization": "Bearer t"}


def _client(tmp_path, monkeypatch):
    from backend import admin, auth, db
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "t.sqlite")
    monkeypatch.setattr(db, "UPLOADS", tmp_path / "up")
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("CUSTOMER_TOKEN", "t")
    admin._FAILS.clear()
    auth._HITS.clear()
    from backend.api import app
    return TestClient(app), db


def _add(s, cid, cls=None, key=None, home=None):
    from backend.models import Customer, Home, InsuredObject
    now = datetime.now(timezone.utc).isoformat()
    s.add(Customer(customer_id=cid, name="N " + cid, created_at=now))
    s.flush()
    if home:
        s.add(Home(home_id="h_" + cid, street=home[0], postal_code=home[1], city=home[2], created_at=now, customer_id=cid))
    if cls:
        s.add(InsuredObject(object_id=f"{cid}_{cls}", customer_id=cid, class_id=cls, name=cls, profile=json.dumps(key),
                            history="[]", details="{}", created_at=now))
    s.commit()


def test_search_and_claim(tmp_path, monkeypatch):
    c, db = _client(tmp_path, monkeypatch)
    from backend import auth
    with c:
        with db.connect() as s:
            _add(s, "x_boat", "boat", {"reg_no": "FIN-1234-K"})
            _add(s, "x_car", "car", {"plate": "qzx-123"})
            _add(s, "x_dog", "dog", {"chip_id": "9500 0000 1111"})
            _add(s, "x_cot", "cottage", {"property_id": "123-456-7-8"})
            _add(s, "x_house", home=("Testikuja 12", "99990", "Turku"))
            for i in range(7):
                _add(s, f"z{i}", home=("Samakatu 1", "00100", "Espoo"))

        def g(cls, q):
            auth._HITS.clear()
            return c.get("/v1/profiles/search", params={"class": cls, "q": q})

        assert g("boat", "fin 1234k").json() == {"hits": [{"customer_id": "x_boat", "label": "FIN-****-K", "taken": False}]}
        assert g("car", "QZX123").json()["hits"][0]["label"] == "qzx-**3"
        assert g("dog", "950000001111").json()["hits"][0]["customer_id"] == "x_dog"
        assert g("cottage", "123-456-7-8").json()["hits"][0]["customer_id"] == "x_cot"
        assert g("boat", "FIN-12").json()["hits"] == []  # exact match only
        assert g("house", "testiku").json()["hits"] == [{"customer_id": "x_house", "label": "Tes*** 12, Turku", "taken": False}]
        assert g("house", "testikuja 12 99990").json()["hits"][0]["customer_id"] == "x_house"
        assert g("house", "99990").json()["hits"][0]["customer_id"] == "x_house"
        assert len(g("house", "samakatu").json()["hits"]) == 5  # cap
        assert g("boat", "fin").status_code == 400 and g("boat", "a-b c").status_code == 400  # min 4 after normalising
        assert g("plane", "abcdef").status_code == 400
        assert "N x_" not in json.dumps(g("house", "testiku").json())

        def cl(pw, cid="x_boat"):
            auth._HITS.clear()
            return c.post("/v1/claim", json={"customer_id": cid, "password": pw})

        assert cl("short").status_code == 400
        r = cl("password1")  # first claim sets the password
        assert r.status_code == 200 and set(r.json()) == {"token"}
        assert cl("wrongpass1").status_code == 401
        assert g("boat", "fin1234k").json()["hits"][0]["taken"] is True
        assert cl("password1", "nope").status_code == 404
        h = {"Authorization": "Bearer " + r.json()["token"]}
        d = c.get("/v1/me/app", headers=h).json()
        assert d["customer"]["id"] == "x_boat" and d["home"] == {}  # no house: still works
        assert c.get("/v1/homes/me", headers=h).status_code == 404
        assert c.get("/v1/homes/me/risks", headers=h).status_code == 404
        assert c.get("/v1/me/insurances", headers=h).status_code == 200
        up = c.post("/v1/homes/me/documents", headers=h, data={"type": "kuntotarkastus"},
                    files={"file": ("a.pdf", b"%PDF-1.4 x", "application/pdf")})
        assert up.status_code == 409
        r2 = cl("password1")  # a second sign-in replaces the token
        assert c.get("/v1/me/app", headers=h).status_code == 401
        assert c.get("/v1/me/app", headers={"Authorization": "Bearer " + r2.json()["token"]}).status_code == 200

        tok = cl("password1", "x_house").json()["token"]  # a customer with a house gets the home route
        assert c.get("/v1/homes/me", headers={"Authorization": "Bearer " + tok}).status_code == 404  # house has no profile row

        assert c.get("/v1/me/app").status_code == 401
        assert c.get("/v1/me/app", headers={"Authorization": "Bearer bad"}).status_code == 401
        assert c.get("/v1/me/app", headers=H).json()["customer"]["id"] == "cust_01"


def test_lockout_and_rate_limit(tmp_path, monkeypatch):
    c, db = _client(tmp_path, monkeypatch)
    from backend import auth
    with c:
        with db.connect() as s:
            _add(s, "x_boat", "boat", {"reg_no": "FIN-1234-K"})
        body = {"customer_id": "x_boat", "password": "password1"}
        assert c.post("/v1/claim", json=body).status_code == 200
        for _ in range(5):
            c.post("/v1/claim", json={**body, "password": "badbadbad"})
        assert c.post("/v1/claim", json=body).status_code == 429
        auth._HITS.clear()
        for _ in range(20):
            c.get("/v1/profiles/search", params={"class": "boat", "q": "abcd"})
        assert c.get("/v1/profiles/search", params={"class": "boat", "q": "abcd"}).status_code == 429
    auth._HITS.clear()


def test_reset_clears_hashes(tmp_path, monkeypatch):
    c, db = _client(tmp_path, monkeypatch)
    from backend.models import Customer
    with c:
        with db.connect() as s:
            for _ in range(2):
                db.reset_to_profiles(s)
                rows = s.scalars(select(Customer).where(Customer.customer_id != "cust_01")).all()
                assert len(rows) >= 12 and all(r.password_hash is None and r.token_hash is None for r in rows)
                for r in rows:
                    r.password_hash, r.token_hash = "x", "t" + r.customer_id
                s.commit()
