"""Ollama chat call. See docs/DESIGN.md §4."""
import json
import logging
import os
from pathlib import Path

import httpx

log = logging.getLogger("backend.llm")
NUM_CTX = 16384
_VERSION = Path(__file__).resolve().parent.parent / "prompts" / "VERSION"


class LlmError(RuntimeError):
    def __init__(self, code: str, message: str = ""):
        super().__init__(message or code)
        self.code = code


def chat(system: str, user: str, schema: dict) -> dict:
    model = os.environ.get("OLLAMA_MODEL", "qwen3.5:9b")
    url = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
    body = {
        "model": model,
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
        "stream": False,
        "think": False,
        "format": schema,
        "options": {"temperature": 0, "num_ctx": NUM_CTX},
    }
    try:
        r = httpx.post(f"{url}/api/chat", json=body, timeout=170)
        r.raise_for_status()
        resp = r.json()
    except (httpx.HTTPError, ValueError) as e:
        raise LlmError("llm_unreachable", str(e)) from e
    content = resp.get("message", {}).get("content", "")
    count = resp.get("prompt_eval_count") or 0
    version = _VERSION.read_text().splitlines()[0].strip() if _VERSION.exists() else "?"
    log.info("prompt_version=%s model=%s prompt_eval_count=%s content=%s", version, model, count, content)
    if resp.get("done_reason") == "length" or count >= NUM_CTX:
        raise LlmError("llm_truncated")
    try:
        return json.loads(content)
    except ValueError as e:
        raise LlmError("llm_bad_json", str(e)) from e
