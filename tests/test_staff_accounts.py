from fastapi.testclient import TestClient

A = {"X-Admin-Token": "a"}
BASE = "/v1/admin"


def test_accounts(tmp_path, monkeypatch):
    from backend import admin, db
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "t.sqlite")
    monkeypatch.setattr(db, "UPLOADS", tmp_path / "up")
    monkeypatch.setenv("CUSTOMER_TOKEN", "t")
    monkeypatch.setenv("ADMIN_TOKEN", "a")
    admin._FAILS.clear()
    from backend.api import app
    with TestClient(app) as c:
        assert c.get(f"{BASE}/accounts").status_code == 401
        accs = c.get(f"{BASE}/accounts", headers=A).json()["accounts"]
        assert len(accs) == 6 and all(set(a) == {"name", "claimed"} and not a["claimed"] for a in accs)
        n = accs[0]["name"]

        def login(pw, name=n):
            return c.post(f"{BASE}/login", headers=A, json={"name": name, "password": pw})

        assert login("firstpass1").status_code == 200  # claims
        assert {a["name"]: a["claimed"] for a in c.get(f"{BASE}/accounts", headers=A).json()["accounts"]}[n]
        assert login("otherpass2").status_code == 401  # a wrong password does not re-claim
        assert login("firstpass1").status_code == 200
        assert login("firstpass1", "Nobody Oy").status_code == 404
        for _ in range(5):
            login("badbadbad")
        assert login("firstpass1").status_code == 429  # locked
        with db.connect() as s:
            h = s.query(db.StaffAccount).filter_by(name=n).one().password_hash
            assert "firstpass1" not in h and h.startswith("scrypt$")
            db.seed(s)
            db.reset_demo(s)
            assert s.query(db.StaffAccount).filter_by(name=n).one().password_hash == h
