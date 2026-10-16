# Design

Scope: the If Life Partner explainer sheets in `docs/visuals/`. Source of truth for tokens: `docs/visuals/visuals.css`.

## World
Finnish silkscreen print. Flat, opaque spot inks on a cool paper ground. Inks overprint with `mix-blend-mode: multiply`. Every overlap carries meaning: a step, group or gain that two or three parties share.

## Colour
| Token | Value | Meaning |
|---|---|---|
| `--paper` | `#edefea` | Ground |
| `--paper-deep` | `#e1e4dc` | Recessed band |
| `--ink` | `#15171c` | All type, rules, marks |
| `--ink-soft` | `#3d4148` | Secondary type |
| `--blue` | `#1d40b5` | If |
| `--spruce` | `#1f6b4f` | Customers |
| `--sun` | `#f2b31d` | Partners |
| `--rule` | `rgba(21,23,28,.22)` | Hairlines |

Rules:
- The three inks keep their party meanings on every sheet.
- Colour lives in shapes, never in running text.
- On blue, spruce and overprint shapes, text is white. On sun, text is ink.

## Type
- One family: Familjen Grotesk (self-hosted, `docs/visuals/fonts/`), weights 400 to 700.
- Titles: 700, `clamp(40px, 4vw, 64px)`, tracking -0.03em, line height 0.98.
- Body: 18px / 1.45. Legend rows: 15 to 15.5px.
- Tabular numerals throughout.

## Marks
- Solid dot: verified source.
- Open ring: unverified.
- Dashed ring: outside the service.
- Numbered ring: a subsystem; the number keys the figure to the legend.

## Layout
- 1600x1000 laptop sheet: running head (service name, ink key), body, running foot (sheet navigation, EN/FI switch).
- Figure sheets: legend column (4fr) beside the figure (7fr).
- Benefits sheet: full-width matrix. Columns are the parties, in the order If, customers, partners. Ink bands head the columns.
- Below 900px, everything stacks into one column.
