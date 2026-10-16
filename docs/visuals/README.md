# If Life Partner: explainer visuals

Three sheets that explain the plan (`docs/iflifepartner.md`) to If. Each sheet exists in English (`en/`) and Finnish (`fi/`), as HTML and as PNG (3200x2000, a 1600x1000 laptop frame at 2x).

| Sheet | Shows |
|---|---|
| `subsystems` | The nine parts of the service and the loop each risk runs through. |
| `stakeholders` | Customer groups, If staff, partners, outside sources, and what each pair shares. |
| `benefits` | What If, customers and partners each gain, and what each gives. |

Colours: blue = If, green = customers, yellow = partners. Where colours overlap, the parties share that part.

## Open in a browser
Open `en/subsystems.html`. The foot links to the other sheets and to the other language.

## Change the content
1. Edit the text in `build.py` (the `T` dictionary holds both languages).
2. Run `python3 docs/visuals/build.py`.
3. Run `nix shell nixpkgs#chromium -c docs/visuals/export.sh` to refresh the PNG files.
