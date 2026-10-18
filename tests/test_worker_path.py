import json

import httpx
import pytest

from backend import extract, llm, worker


class R:
    def __init__(self, d): self.d = d
    def raise_for_status(self): pass
    def json(self): return self.d


def _post(d):
    return lambda *a, **k: R({"message": {"content": "{}"}, **d})


def test_llm_guards(monkeypatch):
    for d in ({"prompt_eval_count": 16000}, {"prompt_eval_count": 10}):
        monkeypatch.setattr(httpx, "post", _post(d))
        with pytest.raises(llm.LlmError) as e:
            llm.chat("s", "u" * 4000, {})
        assert e.value.code == "llm_truncated"

    def slow(*a, **k): raise httpx.ReadTimeout("x")
    monkeypatch.setattr(httpx, "post", slow)
    with pytest.raises(llm.LlmError) as e:
        llm.chat("s", "u", {})
    assert e.value.code == "timeout"


def test_extract_bad_input(tmp_path):
    p = tmp_path / "a.pdf"
    p.write_bytes(b"%PDF-1.4 junk")
    with pytest.raises(llm.LlmError) as e:
        extract.run(p, "doc_x")
    assert e.value.code == "unreadable_pdf"


def test_fail_truncates():
    class S:
        def execute(self, *a, **k): self.v = getattr(self, "v", None) or a[0].compile().params
        def commit(self): pass
    s = S()
    worker._fail(s, "j", "d", "c", "x" * 1000)
    assert len(json.loads(s.v["error"])["message"]) == 300
