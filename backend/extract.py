"""Extract step: PDF -> field candidates, then merge into the profile. DESIGN.md section 6."""
import copy, json, logging, re
from pathlib import Path

import jsonschema
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parent.parent
log = logging.getLogger(__name__)


class NoTextLayer(Exception):
    code = "no_text_layer"


def _norm(s):
    return re.sub(r"\s+", " ", s)


def run(pdf_path, document_id):
    from backend import llm  # lazy: written by another module

    pdf = pdfium.PdfDocument(str(pdf_path))
    pages = [p.get_textpage().get_text_range() for p in pdf]
    text = "\n".join(pages)
    if not text.strip():
        raise NoTextLayer("PDF has no text layer")
    system, template = re.findall(r"```text\n(.*?)\n```", (ROOT / "prompts/extract.md").read_text(), re.S)[:2]
    user = (template.replace("{{document_id}}", document_id).replace("{{page}}", "null")
            .replace("{{section_heading}}", "Report").replace("{{section_text}}", text))
    schema = json.loads((ROOT / "prompts/extract.schema.json").read_text())
    out = llm.chat(system, user, schema)
    jsonschema.validate(out, schema)
    profile_schema = json.loads((ROOT / "data/home-profile.schema.json").read_text())
    defs = profile_schema["$defs"]
    keep = []
    for c in out["fields"]:
        vs = {"$defs": defs, **profile_schema["properties"][c["field"]]["properties"]["value"]}
        try:
            jsonschema.validate(c["value"], vs, format_checker=jsonschema.FormatChecker())
            keep.append(c)
        except jsonschema.ValidationError:
            log.warning("dropped candidate %s: bad value %r", c["field"], c["value"])
    return keep, pages


def merge(profile, candidates, pages, document_id):
    profile = copy.deepcopy(profile)
    for c in candidates:
        if c["value"] == "unknown":
            continue
        ev = {"document_id": document_id, "quote": c["quote"]}
        page = next((i + 1 for i, t in enumerate(pages) if _norm(c["quote"]) in _norm(t)), None)
        if page:
            ev["page"] = page
        profile[c["field"]] = {"value": c["value"], "confidence": c["confidence"],
                               "source": "document", "evidence": ev, "doubt": False}
    return profile
