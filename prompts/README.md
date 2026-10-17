# Pipeline prompts

The prompts for the two model steps of the phase 1 pipeline (`docs/systemdesign/DESIGN.md` §6). The extract step reads profile facts from one unit of a condition report. The write step writes the risk list texts, flags doubts and may propose catalogue entries by id. Code does every other step: merge, match, score, money, partners.

## Files

| File | What it is |
|---|---|
| `VERSION` | One line, the prompt version. Now `3`. The worker logs it with every call. Raise it when a system prompt, a schema or a rule changes. |
| `extract.md` | Extract step: call parameters, chunking rule, system prompt, user prompt template, what the backend does after the call. |
| `extract.schema.json` | Extract step output schema. Sent to Ollama as `format`. The `field` enum copies the property list of `data/home-profile.schema.json`. |
| `write.md` | Write step: call parameters, input object, system prompt, user prompt template, what the backend does after the call. |
| `write.schema.json` | Write step base output schema. The backend specialises it per call (below). |
| `examples/extract-N-input.json` | One extraction call input: `document_id`, `page`, `section_heading`, `section_text`. |
| `examples/extract-N-expected.json` | The output the model should return for that input. Hand-written. |
| `examples/write-N-input.json` | One write call input: `today`, `profile`, `matched`, `unmatched`. Generated. |
| `examples/write-N-expected.json` | The output the model should return for that input. Hand-written. |
| `examples/build_write_inputs.py` | Builds the two write inputs from hand-written profiles, `data/catalogue.json` and the reference matcher in `scripts/catalogue/validate.py`. Run it when the catalogue changes. |

Example 1 is the synthetic 1975 oil-heated detached house. Example 2 is the synthetic 1992 flat (write) and the synthetic 2010 row house (extract). The reports are in `samples/synthetic/`.

## How the backend uses a prompt

1. Read the system prompt and the user prompt template from the `.md` file. Fill the `{{placeholders}}` in the user prompt. JSON goes in compact (no indentation).
2. Call Ollama `/api/chat` with the model named in the file, `stream: false`, `think: false`, `format` set to the JSON schema object, `options.temperature` 0 and `options.num_ctx` 16384. Every call sets `num_ctx` (decision 35).
3. Extraction runs one call per unit: the whole report when it is under 20,000 characters, else top-level KH sections (`extract.md`, "Chunking rule"). The backend adds `document_id` and `page` to each returned candidate; the model does not return them.
4. The write call runs once per job, plus a second call when proposed additions survive the checks (`write.md`, "After the call"). `write.schema.json` is the base schema. Per call the backend copies it and sets `enum` on the item id to the matched ids, `enum` on the proposed-addition id to the unmatched ids, and `minItems` and `maxItems` on `items` to the matched count. It sends that copy as `format` and validates the output against it.
5. Validate the raw model text against the schema. Drop and log what fails the checks in the "After the call" section of each file. Log the prompt version, the model name, the raw text and `prompt_eval_count` to the worker log. Phase 1 stores no model text in the database.
6. Fail the job when `done_reason` is `length` or `prompt_eval_count` reaches `num_ctx`. Ollama cuts input silently.

## num_ctx policy

Both steps use 16384, measured on pc-btw (2026-10-17). One value for both steps keeps the model loaded: a `num_ctx` change reloads it (2.2 s).

## Validate the examples

Run from the repo root. The first line checks every expected output against its schema. The second checks every write input profile against the profile schema.

```sh
nix shell --impure --expr '(import <nixpkgs> {}).python3.withPackages (p: [p.jsonschema])' -c python3 -c "import json,glob,os,jsonschema as J; [J.validate(json.load(open(f)), json.load(open('prompts/'+os.path.basename(f).split('-')[0]+'.schema.json'))) or print('ok', f) for f in sorted(glob.glob('prompts/examples/*-expected.json'))]"
nix shell --impure --expr '(import <nixpkgs> {}).python3.withPackages (p: [p.jsonschema])' -c python3 -c "import json,glob,jsonschema as J; s=json.load(open('data/home-profile.schema.json')); [J.validate(json.load(open(f))['profile'], s) or print('ok', f) for f in sorted(glob.glob('prompts/examples/write-*-input.json'))]"
```

The schemas fix the shape only. The id checks of the write step (every item id in the matched list, every proposed id in the unmatched list) are backend checks; the examples were checked by hand and by an inline script when they were written.

## Status

The expected outputs are hand-written targets. They have not yet been compared with a real model run; they are compared once both prompts run through Ollama on the samples and return schema-valid output.
