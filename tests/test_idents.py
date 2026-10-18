import json
import re

from backend import presets

ROOT = presets.ROOT
DEMO = json.loads((ROOT / "data" / "demo-person.json").read_text())
PROFILES = json.loads((ROOT / "data" / "profiles.json").read_text())["profiles"]
KEY = {"cottage": "property_id", "boat": "reg_no", "car": "plate", "dog": "chip_id"}


def norm(s):
    return re.sub(r"[\s-]", "", s.lower())


def test_keys_present_and_unique():
    objs = DEMO["objects"] + [o for p in PROFILES for o in p["objects"]]
    keys = []
    for o in objs:
        if o["class_id"] != "house":
            k = o["profile"][KEY[o["class_id"]]]
            assert isinstance(k, str) and norm(k)
            keys.append(norm(k))
    assert len(keys) == 4 + 17  # demo 4, profiles 17
    assert len(set(keys)) == len(keys)


def test_house_addresses_unique():
    homes = [p["home"] for p in presets.all_presets(DEMO)] + [p["home"] for p in PROFILES if p["home"]] + [DEMO["home"]]
    addr = [(norm(h["street"]), h["postal_code"]) for h in homes]
    assert len(addr) == 50 + 6 + 1
    assert len(set(addr)) == len(addr)
