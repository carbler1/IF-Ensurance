# Pipeline prompts

Prompts for the two model steps of the pipeline (`docs/DESIGN.md`). The extract step reads profile facts from a condition report. The write step writes the risk texts, flags doubts and may propose catalogue ids. Code does every other step.

## Files

| File | What it is |
|---|---|
| `VERSION` | The prompt version, now `3`. `backend/llm.py` logs it with every call. Raise it when a prompt, schema or rule changes. |
| `extract.md`, `write.md` | Per step: call parameters, system prompt, user prompt template, what the backend does after the call. `backend/extract.py` and `backend/write.py` read the ` ```text ` blocks at run time. |
| `extract.schema.json`, `write.schema.json` | Output schemas, sent to Ollama as `format`. The write schema is a base: the backend sets the id `enum`s and the item count per call. |
| `examples/` | Input and expected output per step (`extract-N`, `write-N`). Expected outputs are hand-written. The extract inputs are single report sections; the backend sends the whole report. `build_write_inputs.py` rebuilds the write inputs from `data/catalogue.json`. |

Examples use the synthetic reports in `samples/synthetic/`: 1975 house (extract 1, write 1), 2010 row house (extract 2), 1992 flat (write 2).

## How the backend uses a prompt

1. Read the system prompt and user template from the `.md` file and fill the `{{placeholders}}`.
2. Call Ollama `/api/chat` (`backend/llm.py`): model from `OLLAMA_MODEL` (default `qwen3.5:9b`), `stream` false, `think` false, `temperature` 0, `num_ctx` 16384, `format` set to the schema.
3. Extract: one call per job with the whole report text. The output is validated against the schema, then each value against its profile field type. Invalid candidates are dropped and logged.
4. Write: one call, plus a second call when proposed additions survive the id check. The backend does not validate the output against the schema; it checks the ids.
5. Log the prompt version, model, raw text and `prompt_eval_count`.
6. Fail the job with `llm_truncated` when `done_reason` is `length` or `prompt_eval_count` reaches `num_ctx`.

Both steps use `num_ctx` 16384, measured on pc-btw (2026-10-17; figure taken from the prompt files, not re-measured). One value keeps the model loaded.

## Status

The expected outputs are targets. No one has compared them with a real model run.
