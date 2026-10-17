#!/usr/bin/env python3
"""Validate the risk catalogue and build data/catalogue.json.

Usage:
    python3 scripts/catalogue/validate.py [data/catalogue]

Checks for every data/catalogue/<category>/<name>.json:
- the file parses as JSON and validates against data/catalogue.schema.json
- the category directory has a prefix in data/catalogue/id-prefixes.json
- the file name gives a valid id; ids are unique
- half_life_years <= service_life_years
- mitigation.partner_category is in data/partner-categories.json
- every field in applies_when, on_done and the tests exists in
  data/home-profile.schema.json
- on_done.value fits the field (a listed enum value, a year, or a sentinel)
- every value in an eq or in leaf of applies_when, and every value in a
  test profile, is allowed for its field (enum value, year or ISO date,
  or "unknown")
- every tests.match profile matches and every tests.reject profile does not

Also checks that the partner_category enum in the catalogue schema equals
data/partner-categories.json.

Error line format: "<file>  [<id>]  <field path>: <message>" (two spaces
between the parts). Exit code 1 when any error exists.

Needs: Python 3 standard library and the jsonschema package.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import jsonschema

NAME_RE = re.compile(r"^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$")
DATE_RE = re.compile(r"^[0-9]{4}-[0-9]{2}-[0-9]{2}$")
SENTINELS = {"confirmation_date", "confirmation_year"}
UNKNOWN = "unknown"


# ---------------------------------------------------------------------------
# Reference matcher (decision 37 semantics)
# ---------------------------------------------------------------------------

def profile_value(profile: dict, field: str):
    """Read profile[field].value. A missing field or a plain value is accepted.

    A missing field counts as "unknown".
    """
    if field not in profile:
        return UNKNOWN
    raw = profile[field]
    if isinstance(raw, dict):
        return raw.get("value", UNKNOWN)
    return raw


def _is_number(x) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def _is_date(x) -> bool:
    return isinstance(x, str) and DATE_RE.match(x) is not None


def _compare(op: str, actual, expected) -> bool:
    """lt / gt on numbers or ISO dates. Any other pairing is false."""
    if actual == UNKNOWN:
        return False
    if _is_number(actual) and _is_number(expected):
        pass
    elif _is_date(actual) and _is_date(expected):
        pass
    else:
        return False
    if op == "lt":
        return actual < expected
    return actual > expected


def matches(condition: dict, profile: dict) -> bool:
    """Evaluate an applies_when condition against a profile-like object."""
    op = condition["op"]
    if op in ("lt", "gt"):
        return _compare(op, profile_value(profile, condition["field"]), condition["value"])
    if op == "eq":
        actual = profile_value(profile, condition["field"])
        if actual == UNKNOWN:
            return False
        return actual == condition["value"]
    if op == "in":
        # "unknown" matches only when the list contains it.
        return profile_value(profile, condition["field"]) in condition["value"]
    if op == "exists":
        return profile_value(profile, condition["field"]) != UNKNOWN
    if op == "and":
        return all(matches(c, profile) for c in condition["args"])
    if op == "or":
        return any(matches(c, profile) for c in condition["args"])
    if op == "not":
        return not matches(condition["args"][0], profile)
    raise ValueError(f"unknown op {op!r}")


def condition_leaves(condition: dict):
    """Yield (json pointer, node) pairs for every leaf in a condition."""
    stack = [("/applies_when", condition)]
    while stack:
        path, node = stack.pop()
        if "field" in node:
            yield path, node
        for i, child in enumerate(node.get("args", [])):
            stack.append((f"{path}/args/{i}", child))


def condition_fields(condition: dict):
    """Yield (json pointer, field name) pairs for every leaf in a condition."""
    for path, node in condition_leaves(condition):
        yield f"{path}/field", node["field"]


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

class Context:
    """Paths and loaded reference data."""

    def __init__(self, root: Path):
        self.root = root.resolve()
        self.data_dir = self.root.parent
        self.repo = self.data_dir.parent
        self.schema_path = self.data_dir / "catalogue.schema.json"
        self.profile_schema_path = self.data_dir / "home-profile.schema.json"
        self.prefixes_path = self.root / "id-prefixes.json"
        self.partners_path = self.data_dir / "partner-categories.json"
        self.output_path = self.data_dir / "catalogue.json"

        self.schema = _load(self.schema_path)
        self.profile_schema = _load(self.profile_schema_path)
        self.prefixes = _load(self.prefixes_path)
        self.partners = _load(self.partners_path)
        self.validator = jsonschema.Draft202012Validator(self.schema)
        self.profile_fields = self.profile_schema["properties"]

    def rel(self, path: Path) -> str:
        try:
            return str(path.resolve().relative_to(self.repo))
        except ValueError:
            return str(path)


def _load(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def _err(file: str, entry_id: str, path: str, message: str) -> str:
    return f"{file}  [{entry_id}]  {path}: {message}"


def _pointer(parts) -> str:
    parts = list(parts)
    if not parts:
        return "/"
    return "/" + "/".join(str(p) for p in parts)


def _profile_value_schema(ctx: Context, field: str) -> dict:
    """Resolve the value subschema of a profile field (one $ref level)."""
    sub = ctx.profile_fields[field]["properties"]["value"]
    if "$ref" in sub:
        name = sub["$ref"].rsplit("/", 1)[-1]
        sub = ctx.profile_schema["$defs"][name]
    return sub


def _allowed_values(ctx: Context, field: str):
    """Return (enum list or None, kind) for a profile field."""
    sub = _profile_value_schema(ctx, field)
    if "enum" in sub:
        return sub["enum"], "enum"
    for alt in sub.get("anyOf", []):
        if alt.get("type") == "integer":
            return None, "year"
        if alt.get("format") == "date":
            return None, "date"
    return None, "other"


def _value_error(ctx: Context, field: str, value) -> str | None:
    """Return a message when value is not allowed for the profile field.

    "unknown" is allowed for every field. An enum field takes a listed
    value, a year field an integer, a date field an ISO date string.
    """
    if value == UNKNOWN:
        return None
    enum, kind = _allowed_values(ctx, field)
    if kind == "enum" and value not in enum:
        return f"{value!r} is not an allowed value of {field!r}: {enum}"
    if kind == "year" and not (isinstance(value, int) and not isinstance(value, bool)):
        return f"{field!r} takes an integer year or 'unknown', got {value!r}"
    if kind == "date" and not _is_date(value):
        return f"{field!r} takes an ISO date or 'unknown', got {value!r}"
    return None


def _check_condition_values(ctx: Context, file: str, entry_id: str, condition: dict) -> list[str]:
    """Check the values of eq and in leaves against the profile field."""
    errors = []
    for pointer, node in condition_leaves(condition):
        field = node["field"]
        if field not in ctx.profile_fields:
            continue
        if node["op"] == "eq":
            msg = _value_error(ctx, field, node["value"])
            if msg:
                errors.append(_err(file, entry_id, f"{pointer}/value", msg))
        elif node["op"] == "in":
            for i, value in enumerate(node["value"]):
                msg = _value_error(ctx, field, value)
                if msg:
                    errors.append(_err(file, entry_id, f"{pointer}/value/{i}", msg))
    return errors


def _check_on_done(ctx: Context, file: str, entry_id: str, on_done: dict) -> list[str]:
    errors = []
    field = on_done["field"]
    value = on_done["value"]
    if field not in ctx.profile_fields:
        return [_err(file, entry_id, "/on_done/field", f"unknown profile field {field!r}")]
    enum, kind = _allowed_values(ctx, field)
    if value == UNKNOWN:
        errors.append(_err(file, entry_id, "/on_done/value", "a confirmed job cannot write 'unknown'"))
    elif kind == "enum":
        if value not in enum:
            errors.append(_err(file, entry_id, "/on_done/value",
                               f"{value!r} is not an allowed value of {field!r}: {enum}"))
    elif kind == "year":
        if not (value == "confirmation_year" or (isinstance(value, int) and not isinstance(value, bool))):
            errors.append(_err(file, entry_id, "/on_done/value",
                               f"{field!r} takes an integer year or 'confirmation_year'"))
    elif kind == "date":
        if not (value == "confirmation_date" or _is_date(value)):
            errors.append(_err(file, entry_id, "/on_done/value",
                               f"{field!r} takes an ISO date or 'confirmation_date'"))
    return errors


def _check_test_profiles(ctx: Context, file: str, entry_id: str, entry: dict) -> list[str]:
    errors = []
    for kind in ("match", "reject"):
        for i, profile in enumerate(entry["tests"][kind]):
            base = f"/tests/{kind}/{i}"
            bad = False
            for field, raw in profile.items():
                if field not in ctx.profile_fields:
                    errors.append(_err(file, entry_id, f"{base}/{field}", f"unknown profile field {field!r}"))
                    bad = True
                    continue
                pointer = f"{base}/{field}/value" if isinstance(raw, dict) else f"{base}/{field}"
                msg = _value_error(ctx, field, profile_value(profile, field))
                if msg:
                    errors.append(_err(file, entry_id, pointer, msg))
                    bad = True
            if bad:
                continue
            result = matches(entry["applies_when"], profile)
            if kind == "match" and not result:
                errors.append(_err(file, entry_id, base, f"expected a match, got no match for {json.dumps(profile)}"))
            if kind == "reject" and result:
                errors.append(_err(file, entry_id, base, f"expected no match, got a match for {json.dumps(profile)}"))
    return errors


def validate_entry(ctx: Context, path: Path) -> tuple[list[str], dict | None]:
    """Validate one entry file. Return (errors, entry with id and category)."""
    file = ctx.rel(path)
    category = path.parent.name
    name = path.stem
    prefix = ctx.prefixes.get(category)
    entry_id = f"{prefix}.{name}" if prefix else f"?.{name}"
    errors = []

    if prefix is None:
        errors.append(_err(file, entry_id, "/", f"category directory {category!r} has no prefix in id-prefixes.json"))
    if not NAME_RE.match(name):
        errors.append(_err(file, entry_id, "/", f"file name {name!r} must match {NAME_RE.pattern}"))

    try:
        entry = _load(path)
    except json.JSONDecodeError as e:
        errors.append(_err(file, entry_id, "/", f"invalid JSON: {e}"))
        return errors, None

    schema_errors = sorted(ctx.validator.iter_errors(entry), key=lambda e: list(e.absolute_path))
    for e in schema_errors:
        errors.append(_err(file, entry_id, _pointer(e.absolute_path), e.message))
    if schema_errors:
        return errors, None

    if entry["half_life_years"] > entry["service_life_years"]:
        errors.append(_err(file, entry_id, "/half_life_years",
                           f"{entry['half_life_years']} is greater than service_life_years {entry['service_life_years']}"))

    pc = entry["mitigation"]["partner_category"]
    if pc not in ctx.partners:
        errors.append(_err(file, entry_id, "/mitigation/partner_category",
                           f"{pc!r} is not in data/partner-categories.json"))

    for pointer, field in condition_fields(entry["applies_when"]):
        if field not in ctx.profile_fields:
            errors.append(_err(file, entry_id, pointer, f"unknown profile field {field!r}"))
    errors.extend(_check_condition_values(ctx, file, entry_id, entry["applies_when"]))

    errors.extend(_check_on_done(ctx, file, entry_id, entry["on_done"]))
    errors.extend(_check_test_profiles(ctx, file, entry_id, entry))

    merged = {"id": entry_id, "category": category}
    merged.update(entry)
    return errors, merged


def validate_tree(root) -> list[str]:
    """Validate every entry under root (the data/catalogue directory).

    Returns the error lines. An empty list means the catalogue is clean.
    """
    errors, _ = validate_tree_with_entries(Path(root))
    return errors


def validate_tree_with_entries(root: Path) -> tuple[list[str], list[dict]]:
    ctx = Context(root)
    errors: list[str] = []

    schema_enum = ctx.schema["properties"]["mitigation"]["properties"]["partner_category"]["enum"]
    if schema_enum != ctx.partners:
        errors.append(_err(ctx.rel(ctx.schema_path), "-", "/properties/mitigation/properties/partner_category/enum",
                           f"differs from {ctx.rel(ctx.partners_path)}"))

    seen: dict[str, str] = {}
    entries: list[dict] = []
    for path in sorted(ctx.root.glob("*/*.json")):
        entry_errors, entry = validate_entry(ctx, path)
        errors.extend(entry_errors)
        if entry is None:
            continue
        if entry["id"] in seen:
            errors.append(_err(ctx.rel(path), entry["id"], "/", f"duplicate id, also in {seen[entry['id']]}"))
            continue
        seen[entry["id"]] = ctx.rel(path)
        entries.append(entry)

    entries.sort(key=lambda e: e["id"])
    return errors, entries


def write_catalogue(root, output=None) -> Path:
    """Build data/catalogue.json from a clean tree. Raises on errors."""
    root = Path(root)
    errors, entries = validate_tree_with_entries(root)
    if errors:
        raise ValueError("catalogue has errors:\n" + "\n".join(errors))
    output = Path(output) if output else root.parent / "catalogue.json"
    _dump(entries, output)
    return output


def _dump(entries: list[dict], output: Path) -> None:
    with output.open("w", encoding="utf-8") as f:
        json.dump({"version": 1, "entries": entries}, f, indent=2, ensure_ascii=False)
        f.write("\n")


def main(argv: list[str]) -> int:
    root = Path(argv[1]) if len(argv) > 1 else Path(__file__).resolve().parents[2] / "data" / "catalogue"
    errors, entries = validate_tree_with_entries(root)
    for line in errors:
        print(line)
    if errors:
        print(f"{len(errors)} error(s) in {root}", file=sys.stderr)
        return 1
    output = root.parent / "catalogue.json"
    _dump(entries, output)
    print(f"ok: {len(entries)} entries, wrote {output}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
