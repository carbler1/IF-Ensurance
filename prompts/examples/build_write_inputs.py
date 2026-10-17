"""Build write-1-input.json and write-2-input.json from hand-written profiles.

Run from the repo root with any Python 3 that has jsonschema (the reference
matcher imports it):

  nix shell --impure --expr '(import <nixpkgs> {}).python3.withPackages (p: [p.jsonschema])' \
    -c python3 prompts/examples/build_write_inputs.py

The matched set and the triggering facts come from the reference matcher in
scripts/catalogue/validate.py and from data/catalogue.json, so re-run this
when the catalogue changes. The expected outputs are written by hand.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "catalogue"))
from validate import condition_fields, matches  # noqa: E402

TODAY = "2026-10-17"
STRIP = {"applies_when", "tests", "source", "on_done", "service_life_years",
         "check_interval_years", "half_life_years", "category"}


def field(value, confidence, source, evidence, doubt=False):
    return {"value": value, "confidence": confidence, "source": source,
            "evidence": evidence, "doubt": doubt}


def doc(document_id, page, quote):
    return {"document_id": document_id, "page": page, "quote": quote}


def none():
    """A field the document did not state (spec section 3.2, decision 36).

    The merge step fills it with value "unknown", confidence 0, source "none",
    evidence null and doubt false. Never give such a field source "document".
    """
    return field("unknown", 0, "none", None)


def stated_unknown(document_id, page, quote):
    """A field the document states as not known, absent or never renewed.

    This is the explicit "unknown" candidate of prompts/extract.md rule 2. The
    extraction call returns it with a quote, and the merge step keeps the
    quote with source "document" so that the write step can read it (rule 6
    of prompts/write.md). The value is still "unknown" and the confidence 0.
    """
    return field("unknown", 0, "document", doc(document_id, page, quote))


def check_profile(name: str, profile: dict) -> None:
    """Fail when a field breaks the profile rules of spec section 3.2."""
    for key, f in profile.items():
        if f["source"] == "none":
            assert f["value"] == "unknown" and f["confidence"] == 0 and f["evidence"] is None, \
                f"{name}: {key}: a source 'none' field must be unknown, 0, evidence null"
        if f["value"] == "unknown":
            assert f["confidence"] == 0, f"{name}: {key}: 'unknown' must have confidence 0"
            assert f["source"] == "none" or f["evidence"]["quote"], \
                f"{name}: {key}: a stated 'unknown' must carry the quote that states it"
        assert f["doubt"] is False, f"{name}: {key}: the hand-written profiles carry no doubt"


D1 = "doc_synth_1975"
PROFILE_1975 = {
    "house_type": field("detached", 0.95, "document", doc(D1, 1, "Omakotitalo (okt), asuinrakennus, 1 asunto")),
    "building_year": field(1975, 0.95, "document", doc(D1, 1, "Rakennusvuosi | 1975 (rakennuslupa-asiakirjat). Autotallilaajennus 1986 (omistajan tieto)")),
    "heating": field("oil", 0.95, "document", doc(D1, 2, "Öljylämmitys. Kattila uusittu 1998 (Jäspi-tyyppinen teräskattila), poltin samalta ajalta")),
    "panel_type": field("screw_fuse", 0.95, "document", doc(D1, 2, "Pääkeskus kellarissa, alkuperäinen 1975, tulppasulakkeet (25 A pääsulakkeet). Ei vikavirtasuojaa")),
    "pipe_material": field("copper", 0.95, "document", doc(D1, 2, "Kupariputket, alkuperäiset 1975. Kylmävesijohto kellarin katossa näkyvissä")),
    "roof_material": field("bitumen_felt", 0.95, "document", doc(D1, 2, "Loiva pulpettikatto, kaltevuus noin 1:16. Bitumikermikate uusittu 2004")),
    "last_pipe_renovation": stated_unknown(D1, 2, "Kupariputket, alkuperäiset 1975"),
    "last_electrical_check": stated_unknown(D1, 1, "Sähköasennuksista ei ollut asiakirjoja"),
    "ventilation": field("natural", 0.95, "document", doc(D1, 2, "Painovoimainen. Poistoventtiilit keittiössä, pesuhuoneessa ja WC:ssä. Liesituuletin hormiin")),
    "sauna": field("electric_stove", 0.9, "document", doc(D1, 6, "Saunan kiuas on sähkökiuas vuodelta 2001")),
    "bathroom_waterproofing_year": field(1994, 0.95, "document", doc(D1, 2, "Seinät kiviaineiset, laatoitus, kosteussulkumaali (remontti 1994), ei vedeneristettä")),
    "floor_drain_type": field("cast_iron", 0.9, "document", doc(D1, 5, "Pesuhuoneen lattiakaivo on valurautainen, alkuperäinen 1975")),
    "water_heater_year": stated_unknown(D1, 2, "Lämmin käyttövesi | Kattilan yhteydessä, mittauksessa 57 °C"),
    "foundation_type": field("basement", 0.9, "document", doc(D1, 2, "Maanvarainen betonilaatta, kellarin kohdalla kellarin laatta")),
    "subsoil_drains": stated_unknown(D1, 1, "Salaojien tarkastuskaivoja ei löytynyt. Salaojien olemassaoloa ja toimintaa ei voitu todeta."),
    "last_roof_renovation": field(2004, 0.95, "document", doc(D1, 2, "Bitumikermikate uusittu 2004")),
    "oil_tank_year": field(1975, 0.8, "document", doc(D1, 2, "Teräksinen 3 000 l säiliö kellarin säiliöhuoneessa, alkuperäinen 1975. Suoja-allas on. Tarkastuspöytäkirjaa ei ole")),
    "last_chimney_sweep": field("2024-11-03", 0.75, "document", doc(D1, 2, "Takka olohuoneessa, tiilihormi. Nuohottu 3.11.2024 (omistaja)")),
    "last_moisture_inspection": none(),
    "last_ventilation_service": none(),
}

D2 = "doc_synth_1992"
PROFILE_1992 = {
    "house_type": field("flat", 0.95, "document", doc(D2, 1, "Kerrostalohuoneisto (kr), 3 h + k + kph + parveke")),
    "building_year": field(1992, 0.9, "document", doc(D2, 1, "Rakennusvuosi | 1992 (isännöitsijäntodistus)")),
    "heating": field("district", 0.95, "document", doc(D2, 2, "Kaukolämpö, lämmönjakokeskus uusittu 2019")),
    "panel_type": field("automatic_fuses", 0.95, "document", doc(D2, 2, "Huoneiston ryhmäkeskus uusittu 2019. Automaattisulakkeet, vikavirtasuojat. Keittiön ja kylpyhuoneen sähköt uusittu 2019. Muut huoneet alkuperäiset 1992, maadoitetut pistorasiat")),
    "pipe_material": field("plastic", 0.7, "document", doc(D2, 2, "Käyttövesinousut ja huoneiston kytkentäjohdot uusittu 2019, komposiittiputki suojaputkessa")),
    "roof_material": field("bitumen_felt", 0.8, "document", doc(D2, 2, "Vesikate bitumikermi, uusittu 2015 (yhtiön tieto)")),
    "last_pipe_renovation": field(2019, 0.95, "document", doc(D2, 2, "Käyttövesinousut ja huoneiston kytkentäjohdot uusittu 2019")),
    "last_electrical_check": none(),
    "ventilation": field("mechanical_exhaust", 0.95, "document", doc(D2, 2, "Koneellinen poisto, huippuimurit katolla")),
    "sauna": field("none", 0.6, "document", doc(D2, 1, "Kerrostalohuoneisto (kr), 3 h + k + kph + parveke")),
    "bathroom_waterproofing_year": field(2019, 0.95, "document", doc(D2, 2, "Kylpyhuone uusittu linjasaneerauksessa 2019. Seinät ja lattia laatoitettu, siveltävä vedeneriste, muovinen lattiakaivo")),
    "floor_drain_type": field("plastic", 0.95, "document", doc(D2, 2, "siveltävä vedeneriste, muovinen lattiakaivo")),
    "water_heater_year": stated_unknown(D2, 2, "Lämmin käyttövesi | Yhtiön kaukolämpö, mittauksessa 56 °C"),
    "foundation_type": stated_unknown(D2, 2, "Alapohja | Ei koske huoneistoa (3. kerros)"),
    "subsoil_drains": field("present", 0.8, "document", doc(D2, 4, "Isännöitsijäntodistuksen mukaan salaojat on kuvattu 2019 ja todettu toimiviksi")),
    "last_roof_renovation": field(2015, 0.8, "document", doc(D2, 2, "Vesikate bitumikermi, uusittu 2015 (yhtiön tieto)")),
    "oil_tank_year": stated_unknown(D2, 2, "Öljysäiliö | Ei"),
    "last_chimney_sweep": none(),
    "last_moisture_inspection": none(),
    "last_ventilation_service": none(),
}


def build(profile: dict, catalogue: dict) -> dict:
    matched, unmatched = [], []
    for entry in catalogue["entries"]:
        if matches(entry["applies_when"], profile):
            facts = []
            # condition_fields yields (json pointer, field name) pairs.
            for f in sorted({pair[1] for pair in condition_fields(entry["applies_when"])}):
                facts.append({"field": f, "value": profile[f]["value"],
                              "evidence": profile[f]["evidence"]})
            slim = {k: v for k, v in entry.items() if k not in STRIP}
            slim["triggering_facts"] = facts
            matched.append(slim)
        else:
            unmatched.append({"id": entry["id"], "title": entry["title"]})
    return {"today": TODAY, "profile": profile, "matched": matched, "unmatched": unmatched}


def main() -> None:
    catalogue = json.loads((ROOT / "data" / "catalogue.json").read_text())
    here = Path(__file__).resolve().parent
    for name, profile in (("write-1-input.json", PROFILE_1975), ("write-2-input.json", PROFILE_1992)):
        check_profile(name, profile)
        out = build(profile, catalogue)
        (here / name).write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
        print(name, "matched:", [m["id"] for m in out["matched"]])


if __name__ == "__main__":
    main()
