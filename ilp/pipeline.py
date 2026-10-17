"""Ollama calls and the steps extract -> merge -> match -> write. DESIGN.md §6."""

import sys
from pathlib import Path

# scripts/ is not a package; the matcher lives in scripts/catalogue/validate.py.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts" / "catalogue"))
from validate import matches  # noqa: E402


def extract(pdf_path) -> list[dict]:
    raise NotImplementedError


def merge(profile: dict, candidates: list[dict]) -> dict:
    raise NotImplementedError


def match(profile: dict) -> list[dict]:
    raise NotImplementedError


def write(profile: dict, matched: list[dict]) -> list[dict]:
    raise NotImplementedError
