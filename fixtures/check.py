"""Check the mock fixtures: homes against data/home-profile.schema.json, expected_risk_ids against the reference matcher, partners against the coverage rules, half-lives against the catalogue. Run from the repo root with a Python that has jsonschema."""
import json, sys, glob
sys.path.insert(0, "scripts/catalogue")
from jsonschema import Draft202012Validator, FormatChecker
from validate import matches

schema = json.load(open("data/home-profile.schema.json"))
cat = json.load(open("data/catalogue.json"))["entries"]
v = Draft202012Validator(schema, format_checker=FormatChecker())
ok = True
for f in sorted(glob.glob("fixtures/homes/*.json")):
    h = json.load(open(f))
    errs = sorted(v.iter_errors(h["profile"]), key=lambda e: list(e.path))
    for e in errs:
        ok = False
        print(f, "/" + "/".join(map(str, e.path)), e.message)
    got = [e["id"] for e in cat if matches(e["applies_when"], h["profile"])]
    exp = h["expected_risk_ids"]
    ok &= got == exp
    print(f, "schema:", "OK" if not errs else "FAIL", "| matcher:", "OK" if got == exp else f"MISMATCH got={got}")
    for fld, val in h["profile"].items():
        if val["value"] == "unknown" and (val["confidence"] != 0 or val["source"] != "none"):
            ok = False
            print("  unknown field with nonzero confidence:", fld)
        if val["confidence"] < 0.5 and val["value"] != "unknown" and not val["doubt"]:
            ok = False
            print("  doubt flag missing:", fld)

p = json.load(open("fixtures/partners.json"))["partners"]
cats = json.load(open("data/partner-categories.json"))
from collections import Counter
c = Counter(x for q in p for x in q["categories"])
print("partners:", len(p), "vetted:", sum(q["if_vetted"] for q in p))
print("category counts:", dict(c))
print("bad categories:", [x for x in c if x not in cats], "| cats <2:", [x for x in cats if c[x] < 2])
need = {e["mitigation"]["partner_category"] for e in cat}
print("catalogue cats missing vetted Turku:", [x for x in need if not any(q["if_vetted"] and q["area"] == "Turku" and x in q["categories"] for q in p)])
print("ratings out of range:", [q["partner_id"] for q in p if not 3.8 <= q["rating"] <= 4.9])
print("bad discount:", [q["partner_id"] for q in p if q["tier_discount_percent"] not in (0, 5, 10)])
print("bad area:", [q["partner_id"] for q in p if q["area"] not in ("Turku", "Kaarina", "Raisio", "Naantali", "Lieto")])
hl = json.load(open("fixtures/half-lives.json"))["entries"]
print("half-life diffs:", [e["id"] for e in cat if hl.get(e["id"]) != e["half_life_years"]])
bad = [x for x in c if x not in cats] + [x for x in cats if c[x] < 2] + [q["partner_id"] for q in p if not 3.8 <= q["rating"] <= 4.9 or q["tier_discount_percent"] not in (0, 5, 10) or q["area"] not in ("Turku", "Kaarina", "Raisio", "Naantali", "Lieto")]
bad += [x for x in need if not any(q["if_vetted"] and q["area"] == "Turku" and x in q["categories"] for q in p)]
bad += [e["id"] for e in cat if hl.get(e["id"]) != e["half_life_years"]]
sys.exit(0 if ok and not bad else 1)
