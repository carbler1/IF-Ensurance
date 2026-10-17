"""Pipeline steps match and write. DESIGN.md section 6, steps 5 and 6."""

import copy
import json
import logging
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts" / "catalogue"))
from validate import condition_leaves, matches  # noqa: E402

log = logging.getLogger("backend.write")
STRIP = {"applies_when", "tests", "source", "on_done", "service_life_years", "check_interval_years", "half_life_years"}


def _catalogue() -> list[dict]:
    return json.loads((ROOT / "data" / "catalogue.json").read_text())["entries"]


def match(profile: dict) -> list[dict]:
    return [e for e in _catalogue() if matches(e["applies_when"], profile)]


def _full(e: dict, profile: dict) -> dict:
    d = {k: v for k, v in e.items() if k not in STRIP}
    fields = sorted({n["field"] for _, n in condition_leaves(e["applies_when"])})
    d["triggering_facts"] = [
        {"field": f, "value": profile[f]["value"], "evidence": profile[f]["evidence"]} for f in fields
    ]
    return d


def _call(profile: dict, matched: list[dict], unmatched: list[dict]) -> dict:
    from backend import llm  # lazy: tests patch llm.chat

    blocks = re.findall(r"```text\n(.*?)\n```", (ROOT / "prompts" / "write.md").read_text(), re.S)
    system, user = blocks[0], blocks[1]
    today = date.today().isoformat()
    inp = {"today": today, "profile": profile, "matched": [_full(e, profile) for e in matched], "unmatched": unmatched}
    schema = copy.deepcopy(json.loads((ROOT / "prompts" / "write.schema.json").read_text()))
    schema["properties"]["items"]["items"]["properties"]["id"]["enum"] = [e["id"] for e in matched]
    schema["properties"]["proposed_additions"]["items"]["properties"]["id"]["enum"] = [u["id"] for u in unmatched]
    schema["properties"]["items"]["minItems"] = schema["properties"]["items"]["maxItems"] = len(matched)
    prompt = user.replace("{{today}}", today).replace("{{input_json}}", json.dumps(inp, separators=(",", ":")))
    out = llm.chat(system, prompt, schema)
    log.info("raw output: %s", json.dumps(out))
    return out


def texts(profile: dict, matched: list[dict]) -> dict:
    if not matched:
        return {}
    ids = {e["id"] for e in matched}
    unmatched = [{"id": e["id"], "title": e["title"]} for e in _catalogue() if e["id"] not in ids]
    out = _call(profile, matched, unmatched)
    got = {i["id"]: i for i in out.get("items", []) if i["id"] in ids}
    for i in got.values():
        if i["doubt"]:
            log.info("doubt %s: %s", i["id"], i["doubt_reason"])
    result = {}
    for e in matched:
        i = got.get(e["id"])
        result[e["id"]] = {
            "why": i["why"] if i else e["why_hint"].removeprefix("DRAFT: "),
            "benefit": i["benefit"] if i else e["benefit_hint"].removeprefix("DRAFT: "),
            "llm_proposed": 0,
        }
    um_ids = {u["id"] for u in unmatched}
    keep = []
    for p in out.get("proposed_additions", []):
        if p["id"] in um_ids:
            keep.append(p["id"])
        else:
            log.info("dropped proposed %s", p["id"])
    extra = [e for e in _catalogue() if e["id"] in keep]
    if extra:
        for i in _call(profile, extra, []).get("items", []):
            if i["id"] in keep:
                result[i["id"]] = {"why": i["why"], "benefit": i["benefit"], "llm_proposed": 1}
    return result
