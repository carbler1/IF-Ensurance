"""The 50 preset homes of the mobile demo (home_02 .. home_51, customers cust_02 .. cust_51).
Each has a random-looking Finnish address and its own mock data, built from data/demo-person.json
with a seeded RNG, so a restart gives the same homes. Visitors claim one (POST /v1/claim)."""

import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COUNT = 50

# city -> first digits of its postal codes
CITIES = {"Helsinki": "00", "Espoo": "02", "Vantaa": "01", "Tampere": "33", "Oulu": "90", "Turku": "20",
          "Jyväskylä": "40", "Kuopio": "70", "Lahti": "15", "Rovaniemi": "96", "Vaasa": "65", "Joensuu": "80",
          "Pori": "28", "Kotka": "48", "Mikkeli": "50", "Kajaani": "87", "Seinäjoki": "60", "Lappeenranta": "53",
          "Hämeenlinna": "13", "Porvoo": "06", "Kemi": "94", "Savonlinna": "57", "Salo": "24", "Rauma": "26"}
STREETS = ["Puutarhakatu", "Koivukuja", "Mäntytie", "Rantakatu", "Kirkkotie", "Tehtaankatu", "Asemantie", "Haapatie",
           "Kuusikatu", "Myllypolku", "Satamakatu", "Niittytie", "Pellonreuna", "Salmitie", "Harjukatu", "Lehtotie",
           "Metsäkuja", "Kallionkatu", "Tuulikuja", "Torikatu", "Vanha Postitie", "Rinnetie", "Käpykuja", "Linnankatu"]
NAMES = ["Aino", "Eero", "Helmi", "Onni", "Venla", "Väinö", "Siiri", "Elias", "Aada", "Leevi", "Ilona", "Oskari",
         "Tuuli", "Niilo", "Kerttu", "Aatos", "Lumi", "Eino", "Emma", "Toivo"]
HEATING = {"oil": "Oil", "electric": "Direct electric", "district": "District heating", "ground_heat": "Ground heat pump",
           "air_heat_pump": "Air heat pump", "wood": "Wood", "pellet": "Pellet", "gas": "Gas"}
TYPES = {"detached": "Detached house", "semi_detached": "Semi-detached house", "row_house": "Row house", "flat": "Flat"}
BID_NAMES = ["Sähkö & Huolto", "Talotekniikka", "Asennus Oy", "Putki ja Lämpö", "Kiinteistöpalvelu", "Kotikunto"]
HISTORY = [("Smoke alarms registered", 20), ("Roof check aged", -10), ("Missed gutter cleaning", -15),
           ("Electrical check done", 35), ("Water leak sensor installed", 25), ("Chimney swept", 15)]
RISK_IDS = ["panel", "pipes", "leak", "roof", "attic"]  # the house risks of demo-person.json
# Generic risks so that a young flat still gets 3: they exist only here, not in demo-person.json.
EXTRA_RISKS = {
    "vent": {"area": "ventilation", "title": "Ventilation filters not changed", "why": "Clogged filters raise damp and energy use.",
             "explain": "Ventilation filters need changing about once a year; clogged ones let damp build up.",
             "fix": "A partner cleans the ducts and changes the filters.", "diy": "Change the filters yourself, then book a duct check."},
    "alarm": {"area": "fire", "title": "Smoke alarms not tested", "why": "A dead battery gives no warning in a fire.",
              "explain": "Smoke alarms should be tested every few months and replaced after about ten years.",
              "fix": "A partner tests the alarms and replaces old ones.", "diy": "Press the test button on each alarm, then book a check if one fails."},
}


def allowed_risks(year: int, htype: str) -> list[str]:
    """Risk ids that are credible for this home (see build)."""
    ids = ["leak", "vent", "alarm"]
    if year < 2005:
        ids.append("panel")  # newer panels have RCD protection already
    if year < 1980:
        ids.append("pipes")
    if htype != "flat":
        ids.append("attic")
        if year <= 2012:
            ids.append("roof")
    return ids


def build(i: int, demo: dict, schema_fields: list[str]) -> dict:
    """Preset number i (2..51) as plain data. Same i, same result."""
    rng = random.Random(f"preset-{i}")
    city = rng.choice(list(CITIES))
    year = rng.randint(1950, 2018)
    htype = rng.choice(list(TYPES))
    heating = rng.choice(list(HEATING))
    size = rng.randint(45, 220)
    street = f"{rng.choice(STREETS)} {i * 7 % 60 + 1}"  # 7 is coprime to 60: no repeated number in 50 presets
    postal = CITIES[city] + f"{rng.randint(0, 999):03d}"
    hid = f"home_{i:02d}"
    ev = {"register": "preset"}
    field = lambda v: {"value": v, "confidence": 0.9, "source": "register", "evidence": ev, "doubt": False}  # noqa: E731
    values = {"house_type": htype, "building_year": year, "heating": heating,
              "panel_type": "screw_fuse" if year < 1980 else "automatic_fuses",
              "pipe_material": rng.choice(["galvanized_steel", "copper", "plastic", "pex"]),
              "roof_material": rng.choice(["sheet_metal", "tile", "bitumen_felt", "fibre_cement"]),
              "ventilation": rng.choice(["natural", "mechanical_exhaust", "mechanical_supply_exhaust"]),
              "sauna": rng.choice(["none", "electric_stove", "wood_stove"]),
              "foundation_type": rng.choice(["slab_on_ground", "crawl_space", "basement"])}
    unknown = {"value": "unknown", "confidence": 0, "source": "none", "evidence": None, "doubt": False}
    profile = {n: field(values[n]) if n in values else dict(unknown) for n in schema_fields}

    risks = []
    pool = allowed_risks(year, htype)
    for k, rid in enumerate(rng.sample(pool, rng.randint(3, min(5, len(pool))))):
        r = EXTRA_RISKS.get(rid) or next(r for r in demo["risks"] if r["risk_id"] == rid)
        # "@" ties the id to its fix rule: default.<template> (engine.fix_value).
        risks.append({**{k2: r[k2].replace("1975", str(year)) for k2 in ("area", "title", "why", "explain", "fix", "diy")},
                      "risk_id": f"{rid}@{hid}", "object_id": hid, "sort_order": k})
        if rid == "pipes":
            mat = values["pipe_material"].replace("_", " ")
            risks[-1].update(why=f"{mat.capitalize()} pipes from {year} are over {(2026 - year) // 10 * 10} years old.",
                             explain=f"Pipes from {year} ({mat}) are near the end of their life. Small leaks inside walls can go unnoticed for months.")
    bids = [{"bid_id": f"{hid}_b{k}", "name": f"{city[:4]} {rng.choice(BID_NAMES)}", "rating": round(rng.uniform(4.3, 5.0), 1),
             "reviews": rng.randint(20, 300), "price": rng.randint(110, 260),
             "earliest": rng.choice(["Mon 19 Oct", "Tue 20 Oct", "Thu 22 Oct", "Fri 23 Oct", "Mon 26 Oct"]), "sort_order": k}
            for k in range(3)]
    ok = [t for t in demo["tasks"] if not (t["title"] == "Inspect drainage well" and htype == "flat")
          and not (t["title"] == "Change heat pump filter" and heating not in ("air_heat_pump", "ground_heat"))]
    tasks = [{**t, "task_id": f"{hid}_{t['task_id']}", "reason_text": t["reason_text"].replace("Turku", city), "sort_order": k}
             for k, t in enumerate(rng.sample(ok, rng.randint(4, min(6, len(ok)))))]
    return {
        "customer": {"customer_id": f"cust_{i:02d}", "name": rng.choice(NAMES)},
        "home": {"home_id": hid, "street": street, "postal_code": postal, "city": city},
        "details": {"address": f"{street}, {postal} {city}", "type": TYPES[htype], "year": year, "size": size,
                    "heating": HEATING[heating]},
        "history": [{"label": l, "points": p} for l, p in rng.sample(HISTORY, rng.randint(1, 3))],
        "profile": profile, "risks": risks, "bids": bids, "tasks": tasks,
    }


def all_presets(demo: dict) -> list[dict]:
    props = list(json.loads((ROOT / "data" / "home-profile.schema.json").read_text())["properties"])
    return [build(i, demo, props) for i in range(2, COUNT + 2)]
