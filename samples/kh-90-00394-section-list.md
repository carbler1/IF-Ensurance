# KH 90-00394: section list of a kuntotarkastus report

This file is our own summary of section 11.1 ("Kuntotarkastusraportin sisältö") of the Finnish guideline KH 90-00394 / LVI 01-10414, "Kuntotarkastus asuntokaupan yhteydessä, suoritusohje" (May 2007). A kuntotarkastus is a condition inspection made for a home sale. The guideline was replaced by RT 103996 in 2026. The 2007 text is copyright Rakennustietosäätiö RTS and LVI-Keskusliitto ry. We keep the PDF out of git (see `.gitignore`). This summary is our own wording.

The guideline says the report must show "at least" the items below, in this order. Finnish headings are in brackets.

## Ordered section list

1. Parties and attendees [Osapuolet ja läsnä olleet]
   - Client, owner or holder, housing company (for a flat), inspector with qualification, persons present.
2. Basic data and sources [Lähtötiedot ja tietojen lähteet]
   - Object and purpose of the inspection [Tarkastuksen kohde ja tarkoitus]: address, building type (okt = detached house, et = semi-detached, pt = terraced, rt = row house, kr = block of flats), use, build year and extensions with source, floor areas (hum2, brm2, kem2) with source, number of floors, length of current ownership, date of inspection, purpose (home sale, repair need, other), scope.
   - Documents and interviews [Asiakirjat ja haastattelut]: documents available to the inspector (section 5.1), interviews (section 5.2).
   - Essential deviations from the documents [Oleelliset poikkeamat asiakirjoihin].
   - Inspection conditions [Tarkastusolosuhteet]: outdoor temperature, one room's temperature, relative humidity and water vapour content (g/m3), long dry or wet period.
3. Limitations and uncertainties [Rajaukset ja epävarmuustekijät]
   - What limited the inspection below the scope of the guideline, and why (full rooms, snow, no access, no interview).
4. Instruments used [Tarkastuksessa käytetyt apuvälineet / Mittausvälineet]
   - List of instruments, their uncertainty, calibration.
5. Building-technical data [Rakennusteknisiä tietoja kohteesta]
   - Construction method (site-built, prefabricated).
   - Main materials: foundations, base floor, frame and external walls, internal walls, roof structure (yläpohja), intermediate floor, roofing and roof shape.
   - Wet-room frame and surface materials.
   - Building services (LVISA): heating system, heat distribution, oil tank (also one taken out of use), water and sewer systems, ventilation, electrical systems, special systems (alarms).
   - Fireplaces and their condition as told to the inspector.
   - Special rooms (for example cold rooms).
   - Repairs and alterations made, when and by whom.
   - Planned repairs.
6. Summary of findings and essential defects and risks [Yhteenveto havainnoista ja olennaiset epäkohdat ja riskit]
   - Essential faults, defects, damage and risk findings; risks to structural safety, use safety and health; repair needs and their meaning.
   - Typical risk structures of the object (section 8).
   - Conclusions and summary.
   - Recommended actions and repairs with reasons.
   - A plain-language summary by topic: general description of the building; environment, plot and ground conditions; repairs made; causes of damage found; items that need action; overall repair need stated as "in order / little to repair / much to repair / to be demolished" (no adjectives such as good or poor); a table of essential findings and further-study, maintenance, repair and renewal needs, with references to the findings section.
7. Findings by building part, room, structure and system [Havainnot rakennusosittain, tiloittain, rakenteittain ja järjestelmittäin]
   - For each item: condition, all measurement results, meaning of the findings, repair need, conclusions, recommended actions and their reasons. Conclusions and actions must stand out from the other text.
   - Risk structures [Riskirakenteet], their meaning and further-study needs (sections 7.3 and 7.4).
   - Fire safety [Paloturvallisuusasiat].
   - Use-safety and health risks [Käyttöturvallisuus- ja terveysriskit].
   - Harmful substances [Haitalliset aineet].
   - Recommendations for further studies [Suositukset lisäselvitysten ja -tutkimusten teettämiseksi].
   - Measurement results in a clear form, for example a table, with their meaning.
   - The inspection order of section 8 of the guideline is the usual order of this section:
     1. Building surroundings, subsoil drains and rainwater systems [Rakennuksen vierusta, salaoja- ja sadevesijärjestelmät]
     2. Foundations and base floor [Perustukset ja alapohjarakenteet]
     3. External walls and facades [Ulkoseinät ja julkisivut]
     4. Internal walls and intermediate floors [Väliseinät ja välipohjat]
     5. Windows, external doors and balcony doors [Ikkunat, ulko-ovet ja parvekeovet]
     6. Canopies, balconies and terraces [Katokset, parvekkeet, terassit]
     7. Roof structure, attic and roofing [Yläpohja, ullakko ja vesikatto]
     8. Wet rooms and damp rooms [Märkätilat ja kosteat tilat]
     9. Other interior rooms [Muut sisätilat]
     10. Other rooms: garage, technical room, boiler room, oil tank room, main switchboard [Muut tilat]
     11. Heating [Lämmitys]
     12. Water and sewer fittings [Vesi- ja viemärilaitteet]
     13. Ventilation [Ilmanvaihto]
     14. Electrical installations [Sähköistys]
8. Repair of damage and the risks of not repairing [Vaurioiden korjaaminen ja korjaamatta jättämisen riskit]
   - A general statement of what repair means and what happens if the damage is left as it is.
9. Harmful substances [Haitallisten aineiden esiintyminen]
   - Asbestos, microbial damage, radon: what was found, what is typical for the building age, and the risks (section 7.5).
10. Inspection procedure [Tarkastusmenettelystä]
    - A short description of the method and responsibilities, or the client guide KH 90-00393 as an attachment.
11. Signature and date [Allekirjoitus ja päiväys]
12. Attachments [Liitteet]
    - Colour photos (section 11.2): facades (1 to 2 photos), damp and wet rooms with their materials, damage and risk points, unusual structures, and any room or structure that could not be inspected.
    - The initial interview forms, always.
    - Optional tables, drawings and other documents with their source.

## Notes for the extraction schema

- Section 5 (building-technical data) holds most of the home-profile facts: build year, heating, pipes, ventilation, electrical, roofing, repairs made.
- Section 6 (summary) and section 7 (findings) hold the risk findings. The guideline requires each finding to state its meaning, the repair need and the risk of not repairing.
- Section 3 (limitations) tells which parts were not inspected. The extraction must map these to `"unknown"` rather than to "no finding".
- The guideline forbids grading words such as "good" or "poor". Reports use "in order", "little to repair", "much to repair".
- Each report also records what the inspection does not cover (section 9 of the guideline): no destructive tests, no waterproofing check under surfaces, no electrical inspection as such, no asbestos survey, no radon measurement.
