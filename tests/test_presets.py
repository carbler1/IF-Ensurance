import json

from backend import presets

DEMO = json.loads((presets.ROOT / "data" / "demo-person.json").read_text())


def test_preset_rules():
    ps = presets.all_presets(DEMO)
    assert len(ps) == 50
    assert ps == presets.all_presets(DEMO)  # deterministic
    streets = [(p["home"]["street"]) for p in ps]
    assert len(set(streets)) == 50
    for p in ps:
        d, prof = p["details"], p["profile"]
        year, flat = d["year"], d["type"] == "Flat"
        ids = {r["risk_id"].split("@")[0]: r for r in p["risks"]}
        assert 3 <= len(ids) <= 5
        if "pipes" in ids:
            assert year < 1980 and str(year) in ids["pipes"]["explain"] and "1970s" not in ids["pipes"]["explain"]
        if "panel" in ids:
            assert year < 2005 and str(year) in ids["panel"]["title"]
        if "roof" in ids:
            assert not flat and year <= 2012
        if "attic" in ids:
            assert not flat and str(year) in ids["attic"]["explain"]
        titles = [t["title"] for t in p["tasks"]]
        if flat:
            assert "Inspect drainage well" not in titles
        if "Change heat pump filter" in titles:
            assert prof["heating"]["value"] in ("air_heat_pump", "ground_heat")
        names = [b["name"] for b in p["bids"]]
        assert len(set(names)) == len(names)  # each firm once per home


def test_generic_risks_have_points():
    assert all(r["points"] > 0 for r in presets.EXTRA_RISKS.values())
