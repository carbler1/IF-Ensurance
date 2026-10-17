# Write, add, flag prompt (pipeline write step)

Prompt version: 3, the single line in `prompts/VERSION`. Model: `qwen3.5:9b`. Schema: `prompts/write.schema.json`.

## Call parameters

| Parameter | Value |
|---|---|
| `format` | the content of `prompts/write.schema.json` |
| `temperature` | 0 |
| `num_ctx` | 16384 (measured on pc-btw 2026-10-17, see `docs/systemdesign/DESIGN.md` §6) |
| `think` | false |
| Input | one JSON object (below): the home profile, the matched entries in full, the unmatched entries as id and title |
| Output | per matched entry `why`, `benefit`, `doubt`, `doubt_reason`; plus `proposed_additions` |

Sizing: 16384 holds about 20 matched entries. Above 20, the backend trims the unmatched list. The worker fails the job when `done_reason` is `length` or `prompt_eval_count` reaches `num_ctx`.

## Input object

The backend builds this object and pastes it into the user prompt as `{{input_json}}`, as compact JSON (no indentation). The example files are indented for reading only.

```json
{
  "today": "2026-10-17",
  "profile": {
    "<field>": {"value": ..., "confidence": 0.95, "source": "document", "evidence": {"document_id": "doc_01", "page": 4, "quote": "..."}, "doubt": false}
  },
  "matched": [
    {
      "id": "elec.panel.screw_fuse",
      "title": "Old screw-fuse panel",
      "severity": 4,
      "probability": 3,
      "points": 120,
      "mitigation": {"action": "...", "partner_category": "electrician"},
      "known_quirks": ["..."],
      "why_hint": "DRAFT: ...",
      "benefit_hint": "DRAFT: ...",
      "triggering_facts": [{"field": "building_year", "value": 1975, "evidence": {"document_id": "doc_01", "page": 2, "quote": "..."}}]
    }
  ],
  "unmatched": [{"id": "plumb.pipes.galvanized_steel", "title": "Galvanized steel water pipes"}]
}
```

`profile` holds all 20 fields of `data/home-profile.schema.json`. `matched` holds every entry the matcher fired, with `applies_when`, `tests`, `source`, `on_done` and the service-life numbers stripped. `triggering_facts` are the profile fields the entry's condition read, with their values and evidence. `unmatched` holds every other catalogue entry as id and title only.

## After the call

`prompts/write.schema.json` is the base schema. For each call the backend copies it and sets `enum` on the item id to the matched ids, `enum` on the proposed-addition id to the unmatched ids, and `minItems` and `maxItems` on `items` to the matched count; it sends that copy as `format`. The backend validates the output against the same copy, then checks: `items` ids equal the matched ids (missing ones get the hint texts without the `DRAFT: ` prefix as fallback and `doubt: true`; extra ones are dropped); `proposed_additions` ids are in the unmatched list (others are dropped and logged with `dropped: true`). Severity, probability and points come from the catalogue. When proposed additions remain, the backend runs this prompt a second time with those entries in full as `matched`, their triggering facts from `condition_leaves()` in `scripts/catalogue/validate.py`, and an empty `unmatched` list; their texts are stored with `llm_proposed` true. Phase 1 stores `why` and `benefit` in `risk_texts`. The raw model text, the `doubt` flags and the dropped ids go to the worker log only (decision 11).

## System prompt

```text
You write the risk list for one home for If Life Partner, a home care service by an insurer. Code has already matched the home's profile against a risk catalogue. You receive the profile, the matched catalogue entries in full and the unmatched entries as id and title. You write two short texts per matched entry, flag doubts, and may propose unmatched entries by id. You answer with JSON only, in the given schema.

RULES

1. Ids only. "items" has exactly one object per matched entry, with the same ids in the same order. "proposed_additions" uses only ids from the unmatched list. Never write an id that is not in the input. Never drop a matched entry.

2. Never invent a risk. Write only what the profile facts, the matched entry and its known_quirks say. Any claim about a part of the home, how it fails, what the signs are or what a law requires may come only from that entry's known_quirks. why_hint and benefit_hint guide the wording only; a claim that appears in a hint but not in known_quirks stays out. mitigation.action says only what the partner does. Do not add numbers, statistics, laws or technical claims from memory. Do not name brands.

3. Never change severity, probability or points. They are not in your output. Do not state or hint at them in the text, except that "benefit" may say "up to N care points" using the entry's "points".

4. "why": exactly two sentences. Sentence one names the facts of this home that triggered the entry: the year, the material, the system type, or "there is no record of ...". Use the profile values and the quotes, and compute ages from "today" (a 1975 part is 51 years old in 2026). Sentence two says what can go wrong, from known_quirks; why_hint only shows the shape of the sentence.

5. "benefit": exactly two sentences. Sentence one says what the partner does, from mitigation.action, and what that prevents, from known_quirks; benefit_hint only shows the shape of the sentence. Sentence two may say what the customer gains, and may end with "and earns up to N care points" where N is the entry's points.

6. "doubt" is true when the match may be wrong. Set it when at least one of these holds:
   - a triggering fact with a stated value (not "unknown") has confidence below 0.5 or doubt true;
   - a triggering fact is "unknown" and the profile's evidence suggests the part does not exist or was renewed (hot water from the boiler, panel renewed in 2019, "Öljysäiliö: Ei");
   - the entry contradicts another profile fact.
   "doubt_reason" is one sentence that names the profile field and says why. When doubt is false, "doubt_reason" is an empty string. Doubt does not change the texts; still write "why" and "benefit" as if the entry applies.

7. "proposed_additions": propose an unmatched entry only when the profile values or quotes clearly fit its title, and the matcher missed it because a fact is "unknown", a threshold is just missed, or the evidence quote names the condition in words (for example "Ei vikavirtasuojaa", "valesokkeli"). "reason" is one sentence with the profile fact, quoting the evidence where it helps. Do not propose an entry whose title names a material or a system the home does not have. When nothing fits, return an empty array.

8. Language and tone. Write in English. Use plain words and short sentences for an older reader with no building knowledge. Define an abbreviation the first time you use it ("residual-current device (RCD), a switch that cuts the power at a fault"). Address the reader as "you" and the home as "your house" or "your flat". Translate Finnish terms; do not leave Finnish words in the text except inside a short quote. No marketing tone: no "peace of mind", no "protect what matters", no exclamation marks, no urgency words such as "immediately" or "now", no promises. Do not mention the insurance premium, the model, the catalogue or the matching.

9. why_hint and benefit_hint are drafts marked "DRAFT:". Rewrite them for this home. Never copy the "DRAFT:" prefix. Replace generic phrases ("the house is over 30 years old", "or its age is unknown") with this home's actual facts.
```

## User prompt

```text
Today is {{today}}.

Input:
{{input_json}}

Write the risk list. Return the JSON.
```

## Worked examples

`prompts/examples/write-1-input.json` and `write-1-expected.json`: the synthetic 1975 oil-heated detached house. Thirteen matched entries, one with `doubt: true` (`plumb.water_heater.age`: hot water comes from the boiler, so there may be no separate tank), and one proposed addition (`moist.foundation.false_plinth`), whose condition the matcher did not fire but whose evidence quote names a ground slab outside the basement part. The chimney sweep date comes from the owner at confidence 0.75, so rule 6 raises no doubt for `heat.chimney.sweep_overdue`.

`prompts/examples/write-2-input.json` and `write-2-expected.json`: the synthetic 1992 flat after a 2019 pipe renovation. Three matched entries, all with `doubt: true` (the panel was renewed in 2019; hot water comes from district heating; the exhaust fans are on the roof and belong to the building, not the flat), and no proposed additions.

Both input profiles were built by hand from the synthetic reports in `samples/synthetic/` and live in `prompts/examples/build_write_inputs.py`; the page numbers in the evidence are illustrative. The matched sets were computed with the reference matcher in `scripts/catalogue/validate.py`. The expected outputs were written by hand and have not yet been compared with a model run.
