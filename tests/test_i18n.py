import json

from fastapi.testclient import TestClient

from backend import presets
from backend.i18n_data import TABLE, localize

DEMO = json.loads((presets.ROOT / "data" / "demo-person.json").read_text())
MODEL = json.loads((presets.ROOT / "data" / "score-model.json").read_text())
# Names, places and numbers that stay the same in every language ("Silver" and "Gas" are also Swedish).
ALLOW = {"Puutarhakatu 12, Turku", "Škoda Octavia 2016", "Ruska, Labrador"}
ALLOW_SV = {"Silver", "Gas"}


def app_shape(h: dict, risks, history, bids, tasks, objects=()) -> dict:
    """The parts of an app-data response that carry seed text."""
    return {"home": {"type": h["type"], "heating": h["heating"]}, "insurances": [{"object": n} for n in objects],
            "risks": [{k: r[k] for k in ("title", "why", "explain", "fix", "diy")} for r in risks],
            "history": [{"label": x["label"]} for x in history], "bids": [{"date": b["earliest"]} for b in bids],
            "tasks": [{"title": t["title"], "due": t["due"], "reasonText": t["reason_text"]} for t in tasks],
            "tiers": [{"name": t["name"], "rewards": t["bonuses"]} for t in MODEL["tiers"]]}


def strings(d) -> list[str]:
    return [d] if isinstance(d, str) else [x for v in (d.values() if isinstance(d, dict) else d) for x in strings(v)]


def shapes():
    demo_hist = [h for o in DEMO["objects"] for h in o["history"]]
    yield app_shape(DEMO["home"], DEMO["risks"], demo_hist, DEMO["bids"], DEMO["tasks"], [o["name"] for o in DEMO["objects"]])
    for p in presets.all_presets(DEMO):
        yield app_shape(p["details"], p["risks"], p["history"], p["bids"], p["tasks"])
    # Every label the presets can pick, not only the ones the 50 homes drew.
    flat = {"type": "Flat", "heating": "Oil"}
    yield app_shape(flat, list(presets.EXTRA_RISKS.values()), [{"label": l} for l, _ in presets.HISTORY], [], [])
    for t in presets.TYPES.values():
        for h in presets.HEATING.values():
            yield app_shape({"type": t, "heating": h}, [], [], [], [])


def test_every_seed_string_is_translated():
    seen = set()
    for lang in ("fi", "sv"):
        for en in shapes():
            for a, b in zip(strings(en), strings(localize(en, lang))):
                seen.add(a)
                if a == b and a not in ALLOW and not (lang == "sv" and a in ALLOW_SV):
                    raise AssertionError(f"{lang}: no translation for {a!r}")
    assert len(seen) > 150 and len(TABLE) > 100
    one = next(shapes())
    assert localize(one, "en") == one


def test_dates_and_year_texts():
    d = {"bids": [{"date": "Tue 20 Oct"}], "tasks": [{"title": "x", "due": "23 Oct", "reasonText": "Frost forecast in Oulu"}]}
    assert localize(d, "fi")["bids"][0]["date"] == "ti 20. lokak."
    assert localize(d, "sv")["bids"][0]["date"] == "tis 20 okt"
    assert localize(d, "fi")["tasks"][0]["due"] == "23. lokak." and "Oulu" in localize(d, "fi")["tasks"][0]["reasonText"]
    r = {"risks": [{"title": "Electrical panel from 1962"}]}
    assert localize(r, "fi")["risks"][0]["title"] == "Sähkökeskus vuodelta 1962"


def test_lang_query(tmp_path, monkeypatch):
    from backend import db
    monkeypatch.setattr(db, "DB_PATH", tmp_path / "t.sqlite")
    monkeypatch.setattr(db, "UPLOADS", tmp_path / "up")
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("CUSTOMER_TOKEN", "t")
    from backend.api import app
    H = {"Authorization": "Bearer t"}
    with TestClient(app) as c:
        en = c.get("/v1/me/app", headers=H).json()
        fi = c.get("/v1/me/app?lang=fi", headers=H).json()
        sv = c.get("/v1/me/app?lang=sv", headers=H).json()
        assert en["tasks"][0]["title"] == "Shut off outdoor tap"
        assert fi["tasks"][0]["title"] == "Sulje ulkohana" and sv["tasks"][0]["title"] == "Stäng av utekranen"
        assert fi["tiers"][0]["name"] == "Pronssi" and fi["home"]["type"] == "Omakotitalo"
        assert c.get("/v1/me/app?lang=de", headers=H).status_code == 400  # the API maps validation errors to 400
        put = c.put("/v1/me/reminders/t3?lang=fi", headers=H, json={"on": True}).json()
        assert put["tasks"][0]["title"] == "Sulje ulkohana"
