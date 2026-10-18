# Sample documents

Test documents for the kuntotarkastus intake pipeline. A kuntotarkastus is a condition inspection report for a Finnish home sale, written to guideline KH 90-00394 (2007).

Rules:

- No personal data in git. A file with a real person name or private address is not kept; we record its URL only.
- `downloads/` is ignored by git (`samples/.gitignore`). It holds third-party files.
- Synthetic reports have "SYNTHETIC" in the title and fictional addresses ("Esimerkkikatu", Turku).

## Files

| File | Pages | Good for |
|---|---|---|
| `kh-90-00394-section-list.md` | n/a (Markdown) | Our summary of the KH 90-00394 sections: report order, mapping "not inspected" to `"unknown"`. |
| `downloads/kh-90-00394-2007.pdf`, `.txt` (not in git) | 12 | The guideline (copyright RTS and LVI-Keskusliitto 2007). Not a report. |
| `synthetic/1975-omakotitalo-oljylammitys` (`.md`, `.pdf`) | 8 | Old oil-heated house, many findings. |
| `synthetic/1992-kerrostalohuoneisto-putkiremontti-2019` | 6 | Flat after a 2019 pipe renovation. Company vs unit responsibility. |
| `synthetic/2010-rivitalo-maalampo` | 6 | Newer row house with a ground-source heat pump. The no-findings case. |

Each synthetic report has an English summary block and Finnish body text in KH section order. The `.md` files hold 1,800 to 2,350 words. Moisture readings, service-life years and device names are invented; do not use them as reference data.

## Rebuild

```
curl -fsSL -A "Mozilla/5.0" -o samples/downloads/kh-90-00394-2007.pdf https://muutoslkv.fi/wp-content/uploads/2023/07/kuntotarkastusasuntokaupanyhteydesskh90-00394.pdf
pdftotext -layout samples/downloads/kh-90-00394-2007.pdf samples/downloads/kh-90-00394-2007.txt
pandoc samples/synthetic/<name>.md --pdf-engine=typst -V mainfont="Libertinus Serif" -V papersize=a4 -o samples/synthetic/<name>.pdf
```

`head -c 4` of the download must print `%PDF`. Typst 0.14 needs `mainfont` set; Libertinus Serif ships with Typst.

## Public reports found, not kept (searched 2026-10-17)

- JEP Tarkastus Oy sample report (64 pages): names the real inspector. Deleted.
- 4TP "Mallitalo 90" sample report (10 pages): a personal e-mail address in every footer. Deleted.
- Serviz Oy sample report: download blocked by a cookie page. Not verified.
- Draft RTS 25:40 (the new guideline): the file forbids copying. Not downloaded.
