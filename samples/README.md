# Sample document corpus

This folder holds the documents we use to test the kuntotarkastus intake pipeline. A kuntotarkastus is a condition inspection report made for a Finnish home sale. The report format follows the guideline KH 90-00394 (2007), replaced by RT 103996 in 2026.

Rules for this folder:

- No personal data enters git. A file with a real person name or a real private address is not kept. We record its URL only.
- `downloads/` is in `.gitignore`. It holds third-party files whose licence is unclear. Each teammate downloads them again with the commands below.
- Synthetic reports are marked "SYNTHETIC" in their title. Their addresses are fictional ("Esimerkkikatu", Turku). They contain no person names.

## Files

| File | Source | Licence | Pages | Good for |
|---|---|---|---|---|
| `kh-90-00394-section-list.md` | Our own summary of section 11.1 of KH 90-00394 | Our text, repo licence | 1 | Design of the extraction schema. Order of report sections. Mapping of "not inspected" to `"unknown"`. |
| `downloads/kh-90-00394-2007.pdf` (not in git) | Rakennustieto guideline KH 90-00394 / LVI 01-10414, May 2007. Mirror: https://muutoslkv.fi/wp-content/uploads/2023/07/kuntotarkastusasuntokaupanyhteydesskh90-00394.pdf | Copyright Rakennustietosäätiö RTS and LVI-Keskusliitto ry 2007. The mirror's right to publish is unverified. Kept out of git. | 12 | Ollama probe: 2 pages as text. Source of the section list. Not a report. |
| `downloads/kh-90-00394-2007.txt` (not in git) | Text of the file above, `pdftotext -layout` | As above | 12 | Same |
| `synthetic/1975-omakotitalo-oljylammitys.md` and `.pdf` | Synthetic | Our text, repo licence | 8 (PDF) | Old detached house with many findings: oil tank past service life, original copper pipes and cast-iron sewer, screw-fuse panel without RCD, unknown subsoil drains, valesokkeli risk structure, low-pitch roof renewed 2004. Tests: profile facts from section 5, risk findings from sections 6 and 7, "unknown" from section 3, "much to repair" verdict. |
| `synthetic/1992-kerrostalohuoneisto-putkiremontti-2019.md` and `.pdf` | Synthetic | Our text, repo licence | 6 (PDF) | Flat in a housing company: pipe renovation 2019, automatic fuses with RCD, mechanical exhaust ventilation, district heating. Tests: housing-company responsibility vs unit responsibility, "done" facts from a renovation (on_done), small maintenance findings, planned company repairs. |
| `synthetic/2010-rivitalo-maalampo.md` and `.pdf` | Synthetic | Our text, repo licence | 6 (PDF) | Newer row house with ground-source heat pump and one note only (floor drain seal). Tests: the no-findings case, "in order" verdict, heat pump compressor nearing service life as a future cost without a finding. |

Each synthetic report has an English summary block at the top and Finnish body text in the KH 90-00394 section order (sections 1 to 12 of `kh-90-00394-section-list.md`). The Markdown files are 1,800 to 2,300 words each. The PDFs are 6 to 8 pages at 9.5 pt with 1.8 cm margins; this is above the 2 to 4 page target of the task but still short for a real report (real ones run 10 to 64 pages).

## Public reports found but not kept

We searched for public kuntotarkastus examples on 17.10.2026 with the terms "kuntotarkastusraportti esimerkki pdf", "kuntotarkastus malliraportti pdf" and "asuntokaupan kuntotarkastus raportti malli". None of the files below is in this folder.

| URL | Publisher | Licence | Pages | Why not kept |
|---|---|---|---|---|
| https://jeptarkastus.fi/wp-content/uploads/2026/09/Malliraportti_Asuntokaupan-kuntotarkastus_JEP-Tarkastus-Oy.pdf | JEP Tarkastus Oy, company sample report, fictional address "Mallitie 1, Esimerkkikaupunki", 1986 semi-detached unit | Company copyright, no licence stated | 64 | Downloaded and read. It names the real inspector. Deleted per the no-person-names rule. The older URL `www.jeptarkastus.fi/pdf/malliraportti_kuntotarkastus.pdf` returns 404. |
| http://www.4tp.fi/wp-content/uploads/90-luvun_malliraportti.pdf | Insinööritoimisto 4TP, company sample report "Mallitalo 90", 1998 detached house, owner and inspector masked as XXXX | Company copyright, no licence stated | 10 | Downloaded and read. The page footer holds a personal e-mail address of the company owner on every page. Deleted per the rule. |
| https://serviz.fi/wp-content/uploads/Kuntotarkastusraportti_Esimerkkitie_1_Esimerkkikunta-2.pdf | Serviz Oy, company sample report, fictional address "Esimerkkitie 1, Esimerkkikunta", 2023 | Company copyright, no licence stated | Unknown | Download blocked: the server returns a cookie-consent HTML page to curl. Search snippets show a placeholder client name and a named inspector. Not verified. |
| https://isokyro.fi/tiedostopankki/3490/kuntotarkastusasuntokaupanyhteydesskh90-00394.pdf | Municipality of Isokyrö, second mirror of KH 90-00394 | Copyright RTS 2007 | 12 | Same document as `downloads/kh-90-00394-2007.pdf`. |
| https://uutiset.rakennustieto.fi/wp-content/uploads/2025/12/RTS-25-40-Kuntotarkastus-Suoritus-ohje.pdf | Rakennustieto, draft RTS 25:40 of the new guideline (became RT 103996) | The file header forbids copying | Unknown | Not downloaded. Useful to compare the 2026 section list with the 2007 one. |

## How to rebuild

Download the third-party PDF:

```
curl -fsSL -A "Mozilla/5.0" -o samples/downloads/kh-90-00394-2007.pdf https://muutoslkv.fi/wp-content/uploads/2023/07/kuntotarkastusasuntokaupanyhteydesskh90-00394.pdf
pdftotext -layout samples/downloads/kh-90-00394-2007.pdf samples/downloads/kh-90-00394-2007.txt
```

Check the magic bytes with `head -c 4 <file>`; it must print `%PDF`.

Convert a synthetic report to PDF. `pdftotext` comes from `poppler-utils`. The pandoc 3.7 Typst template fails with Typst 0.14 unless `mainfont` is set; Libertinus Serif ships with Typst.

```
nix shell nixpkgs#pandoc nixpkgs#typst -c pandoc samples/synthetic/<name>.md --pdf-engine=typst -V mainfont="Libertinus Serif" -V papersize=a4 -o samples/synthetic/<name>.pdf
```

## Known gaps

- The three synthetic reports are the only KH-format documents in git.
- The synthetic reports have no photos and no attachments. The pipeline cannot test image intake with them.
- Moisture reading values, service-life years and device names in the synthetic reports are plausible but invented. Do not use them as reference data.
