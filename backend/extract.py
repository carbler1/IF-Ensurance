"""Extract step: PDF -> field candidates, then merge into the profile. docs/DESIGN.md §4."""
import copy, json, logging, re
from pathlib import Path

import jsonschema
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parent.parent
MAX_PAGES, MAX_CHARS, MAX_TOKENS = 150, 45000, 14000
log = logging.getLogger(__name__)


class NoTextLayer(Exception):
    code = "no_text_layer"


def _norm(s):
    return re.sub(r"\s+", " ", s)


def run(pdf_path, document_id, check=lambda: 170):
    from backend import llm

    try:
        pdf = pdfium.PdfDocument(str(pdf_path))
        if len(pdf) > MAX_PAGES:
            raise llm.LlmError("document_too_long", "The document has too many pages")
        pages = [p.get_textpage().get_text_range() for p in pdf]
    except pdfium.PdfiumError as e:
        raise llm.LlmError("encrypted_pdf" if "password" in str(e).lower() else "unreadable_pdf",
                           "The PDF cannot be read") from e
    text = "\n".join(pages)
    if len(text) > MAX_CHARS:
        raise llm.LlmError("document_too_long", "The document text is too long")
    if not text.strip():
        raise NoTextLayer("PDF has no text layer")
    system, template = re.findall(r"```text\n(.*?)\n```", (ROOT / "prompts/extract.md").read_text(), re.S)[:2]
    user = (template.replace("{{document_id}}", document_id).replace("{{page}}", "null")
            .replace("{{section_heading}}", "Report").replace("{{section_text}}", text))
    schema = json.loads((ROOT / "prompts/extract.schema.json").read_text())
    if (len(system) + len(user)) / 2.5 > MAX_TOKENS:
        raise llm.LlmError("document_too_long", "The document is too long for the model")
    try:
        out = llm.chat(system, user, schema, check())
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
    except (jsonschema.ValidationError, KeyError) as e:
        raise llm.LlmError("llm_bad_json", "Model output did not match the schema") from e
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
