# Re-check intervals for the maintenance list

Status: draft, 2026-10-17. Task 6 of `docs/rasitasks.md`. Author: Rasi (analyst).

## Summary

This document gives each risk a re-check interval in years. The app uses the interval for the maintenance list. The list reminds the customer to check or redo the work after the interval.

I looked for each interval in the If home insurance terms (OMA 200.27) and on the internet. Where I found a source, I name it. Where I found none, I made up a probable value and marked it "Made up".

Results:

- 12 intervals have a source: 4 from the If terms or the law, 1 from a manufacturer guide and 7 from named web sources.
- 17 existing intervals are kept as they are. They have no source.
- 30 intervals are made up. I found no source for them.
- 1 existing interval changes: the hot-water tank goes from 10 to 5 years.

The interval is the time between two checks. A value of 0.5 means twice a year. A dash (–) means the risk is not re-checked.

## 1. How to read the tables

| Basis | Meaning |
|---|---|
| Terms | The If terms name this interval. |
| Law | A Finnish law sets this interval. I read it in news sources. I did not read the law itself. |
| Source | A named web source gives the value. The source is in section 7. |
| Manufacturer | A maker guide gives the value. The maker's own manual wins for a given product. |
| Kept | The catalogue has a value now. It has no source. I keep it. |
| Made up | I found no source. The value is my probable estimate. |

- **Interval:** how often the maintenance list reminds the customer. For a check that a partner does, the interval is the time between partner visits.
- Where the customer should check more often than the partner, the note says so. The customer check is not a partner job.
- Re-check intervals are not service lives. The service life is how long the part lasts. A different task and the catalogue field `service_life_years` cover that.
- Score decay (half-life) is Antton's work. It is not part of this task.

## 2. Electricity and fire safety

| Risk | Interval | Basis | Note |
|---|---|---|---|
| Electrical installation not checked in 15 years | 15 | Kept | I found no fixed legal interval. Tukes (the Finnish Safety and Chemicals Agency) says that age alone is not a defect. A broader condition survey is advised for old installations. |
| Old screw-fuse panel | 15 | Kept | After the panel is replaced, the next check follows the electrical check. |
| Electric sauna stove wiring not checked in 10 years | 10 | Kept | |
| Wet-room sockets without a residual-current device | 15 | Kept | The customer presses the RCD test button regularly. The partner check follows the electrical check. |
| No surge protection | 10 | Made up | Check the surge protector at the electrical check. A protector often has a wear indicator. |
| EV charger or e-bike charging not checked | 5 | Made up | Check again after a change to the charger, the circuit or the charging place. |
| Too few or old smoke alarms | 5 | Made up | The customer tests each alarm every month and replaces each alarm about every 10 years (Source: Taloustaito, manufacturer values). The partner visit every 5 years checks count, age and placement. |
| No stove guard (liesivahti) | 10 | Made up | Stove guards are electronics. Follow the maker's guide. |
| No extinguisher or fire blanket | 5 | Made up | Household extinguishers are outside the mandatory service rules in the draft law on fire safety equipment. The maker's label is the baseline. The customer checks the pressure gauge every year. |
| Gas or fuel stored in a basement or living space | 5 | Made up | Part of the fire-safety visit. The customer reviews storage every year. |
| Fire barrier between row house units | 10 | Made up | Reminder only. The housing company acts. |

## 3. Heating

| Risk | Interval | Basis | Note |
|---|---|---|---|
| Chimney not swept in the last year | 1 | Terms, Law | Terms 5.2.4 and the rescue law (Pelastuslaki) ask for a sweep once a year in a permanent home. A holiday home needs a sweep at least every 3 years. The sweep depends on actual use. An unused fireplace needs no sweep. |
| Steel oil tank over 30 years old | 10 | Terms | Terms 5.5.10: inspect at least every 10 years. In a groundwater area, an expert inspects at least every 5 years. |
| Oil boiler near the end of its service life | 1 | Manufacturer | Burner maintenance and the nozzle change are yearly (Danfoss guide). A yearly service shows if the boiler is near the end of its life. |
| Old radiators with surface rust | 10 | Made up | Check radiators at the boiler or heating service. |
| Oil tank room without a fire door or protection basin | 10 | Terms | Follow the 10-year tank inspection (terms 5.5.10). |
| Heat pump or ground system not serviced | 2 | Source | Interview default of 2 years. Bosch advises 1 to 3 years for a ground heat pump. An air heat pump needs a partner service about every 5 years (Daikin, in Taloustaito). The maker's guide for the installed system can extend the interval. |
| No backup heat in a winter power cut | 1 | Made up | Advice only. A reminder in autumn before winter. |
| Water pipes in unheated rooms | 5 | Made up | The customer checks the insulation or the heat cable every autumn. |

## 4. Moisture and indoor air

| Risk | Interval | Basis | Note |
|---|---|---|---|
| Wet room without modern waterproofing | 10 | Kept | After renewal, check again at the next wet-room inspection. |
| False plinth risk structure not inspected | 5 | Kept | |
| Crawl space or basement not inspected for moisture | 5 | Kept | |
| No subsoil drains around the house | 5 | Kept | The terms (5.4.2) ask the owner to check ditches, drains and storm wells every year. The partner check every 5 years adds to that. |
| Blocked wall ventilation gaps in a brick-clad wall | 5 | Made up | Do it with the foundation inspection. |
| Poor surface drainage next to the house | 1 | Terms | Terms 5.4.2: check the drainage at least once a year. The partner check is every 5 years. |
| Worn sealant in the wet room | 3 | Made up | Interview decision. I found no source for the sealant life. |
| Wet-room waterproofing past its service life | 5 | Made up | A grade by the independent inspector gives the next check date. |
| Cracked sealant at a balcony or terrace door | 3 | Made up | Interview decision. |
| Sewer backflow protection | 1 | Source | A pump pit needs a yearly inspection, and a backflow valve needs a yearly check (a plumbing guide, not Finnish). The terms (5.4.4, 5.5.9) ask the owner to keep sewer pumps in working order. |
| Radon not measured | 10 | Made up | I found no repeat interval for radon. The Finnish radiation authority (STUK) gives a limit of 300 Bq/m3 and a measurement season from September to May. Measure again after a renovation or a change in ventilation. |
| Asbestos and PAH survey missing before a renovation | – | Made up | One survey for each renovation. No repeat unless a new renovation starts. |

## 5. Plumbing

| Risk | Interval | Basis | Note |
|---|---|---|---|
| Cast-iron floor drain in the wet room | 5 | Kept | The terms (5.5.7) ask the owner to clean floor drains and water traps often. |
| Pipe renovation overdue in a 1960s to 1980s flat | 10 | Kept | A rule of thumb is a full renovation at about 50 years (Source: MTV Uutiset). |
| Copper water pipes over 40 years old | 10 | Kept | The terms (6.2.1.3) cut the payment at pipe age 30 and 50 years. Order a pipe survey when the pipes reach these ages. |
| Galvanized steel water pipes | 10 | Kept | Same as copper pipes. |
| Hot-water tank past its service life | 5 | Source | **Changed from 10.** A hot-water tank lasts 15 to 20 years. Tukes names ageing tanks as a cause of accidents. The customer tests the safety valve 4 times a year. A partner checks the tank every 5 years, and then every year after year 15. |
| Cast-iron sewer pipes over 50 years old | 10 | Source | A condition report advises a pressure flush of the yard and floor drains every 10 years, and a camera check of vertical stacks that show rust. |
| No leak tray under the dishwasher or washing machine | 5 | Made up | Check the tray when the machine or the hoses change. |
| Old washing machine hoses or no own shut-off valve | 10 | Made up | I found no interval for hoses. The customer checks the hoses every year. |
| No leak detector or automatic shut-off valve | 1 | Made up | I found no interval. Test the detector and replace the batteries every year. The maker's manual wins. |
| Water not shut off during long absences | 1 | Made up | A habit that the app reminds before each long absence. The terms (5.5.3) ask to close the main valve after an empty week. |

## 6. Roof, building envelope and other risks

| Risk | Interval | Basis | Note |
|---|---|---|---|
| Bitumen felt roof over 25 years old | 5 | Kept | If advises a roof check at least once a year. The customer does that. A roofer checks every 5 years. |
| Steel sheet roof over 40 years old | 5 | Kept | Same as bitumen felt. |
| Tile roof underlay over 30 years old | 5 | Kept | Same as bitumen felt. |
| Roof drains and gutters not cleaned each year | 0.5 | Source | Clean in spring and in autumn. A year is enough away from pine trees. Advice only. |
| Low-pitch roof without a snow-load plan | 1 | Made up | Advice only. A reminder before winter. |
| Tall trees that can fall on the house | 5 | Made up | Check after each large storm. |
| Windows at the end of their service life | 5 | Made up | I could not read the technical life card RT 18-103765 (it is behind a login). Check the seals every 5 years. |
| Wood cladding needs maintenance | 10 | Source | Repaint every 10 to 15 years (K-Rauta). The industry guide says 10 to 20 years (Teknos). Look for fine cracks in the paint every year. |
| Terrace needs maintenance | 3 | Source | Do not leave the oil treatment longer than 3 years (K-Rauta). **The interview spec says 5 years. Change the trigger to 3 years.** |
| Wild animals in the roof or walls | 1 | Made up | Check the mesh each autumn. |
| Mechanical ventilation unit not serviced in 2 years | 2 | Kept | The customer changes the filters 2 times a year, in spring and autumn (K-Rauta, Swegon). A technician services the unit every 2 years. |
| Natural ventilation in a house from before 2000 | 5 | Kept | |
| Supply-air valve blocked | 1 | Made up | Clean the valves with the autumn filter change. |
| Building or extension without a permit | – | Made up | A one-time document check. |
| Wet-room or electrical work without documents | – | Made up | A one-time inspection. The electrical check or the wet-room check repeats later. |
| Weak locks and no alarm | 5 | Made up | Check locks and the alarm every 5 years. Check again after a break-in or a lock change. |

## 7. Housing company items

| Item | Interval | Basis | Note |
|---|---|---|---|
| Housing company renovation costs | 1 | Made up | Reminder when the housing company sends its yearly plan. |
| Shared heat pump near the end of its service life | 5 | Made up | Reminder to ask for the maintenance plan. |

## 8. Changes to existing values

| Entry | Old interval | New interval | Reason |
|---|---|---|---|
| Hot-water tank past its service life | 10 | 5 | A tank lasts 15 to 20 years. A 10-year interval is too long near the end of life. |
| Steel oil tank over 30 years old | 10 | 10 | Now sourced from terms 5.5.10. Add a rule: 5 years in a groundwater area. |
| Chimney not swept in the last year | 1 | 1 | Now sourced from terms 5.2.4 and the rescue law. Holiday homes: 3 years. |

All other existing intervals stay as they are.

## 9. Notes for Antton

1. **Two intervals for some risks.** The customer checks drainage, roof and heat pump items more often than the partner. The catalogue has one `check_interval_years`. Use the partner interval there. The customer reminder is a separate tip.
2. **Holiday homes.** The chimney sweep interval is 3 years for a holiday home. The oil tank interval stays 10 years.
3. **Groundwater area.** The oil tank interval is 5 years in a groundwater area. The app needs the address to know this.
4. **Terrace trigger.** The interview spec asks for a trigger at 5 years. The source says 3. Change the trigger to 3 years.
5. **No repeat.** Three risks have no repeat (asbestos survey, permit, undocumented work). The entry needs a way to say "no re-check".

## 10. Facts, assumptions and unknowns

### Facts
- The terms say: sweep a chimney once a year (5.2.4), inspect an oil tank every 10 years or every 5 years in a groundwater area (5.5.10), check drains every year (5.4.2).
- The rescue law asks for a yearly sweep in a permanent home and a sweep every 3 years in a holiday home. I read this in news sources.

### Assumptions
- A made-up value is a probable value, not a measured one.
- A manufacturer's guide is close enough to a general interval. The manual of the installed product wins.
- The customer can do the more frequent checks. The partner does the long-interval checks.

### Unknowns
- The true intervals for wet-room waterproofing, windows and roof coverings. The technical life card RT 18-103765 holds them. The card is behind a login.
- The Finnish interval for a radon re-measurement.
- The interval for an electrical condition survey. I found no fixed rule.
- Whether the terms have a rule on the age of washing machine hoses. The terms ask only that hoses are "pressure-proof".

## 11. Sources

- If Kodin Omaisuusvakuutusehdot OMA 200.27, clauses 5.2.4, 5.4.2, 5.4.4, 5.5.3, 5.5.7, 5.5.9, 5.5.10, 6.2.1.3. File `kotivakuutusehdot.pdf`.
- [Taloustaito: smoke alarm test and replacement](https://www.taloustaito.fi/koti/palovaroitin-on-halpa-henkivakuutus--muista-nama-nelja-asiaa/)
- [Taloustaito: air heat pump maintenance](https://www.taloustaito.fi/koti/huolla-ilmalampopumppuasi-oikein--vahennat-kalliita-vikoja/)
- [Bosch: ground heat pump service](https://www.bosch-homecomfort.com/fi/fi/huolto-tuki/lampopumpun-huolto/maalampopumpun-huolto/)
- [Taloustaito: chimney sweeping rules](https://www.taloustaito.fi/koti/Jata-nuohous-ammattilaiselle/)
- [Kaleva: chimney sweeping](https://www.kaleva.fi/nuohoussesonki-taydessa-vauhdissa-piirinuohousjarj/3992402)
- [Taloustaito (If advice): roof, gutters and rainwater](https://www.taloustaito.fi/koti/sade-ja-myrskyt-piinaavat-omakotitaloja--tarkista-sadevesien-ohjaus-ja-katon-kunto/)
- [K-Rauta: filter change twice a year](https://www.k-rauta.fi/uutiset/ilmanvaihtokoneen-suodattimet-tulisi-vaihtaa-nyt-suurelta-osalta-suomalaisista-tyo-jaa-kuitenkin-tekematta-mika-tuo-mukanaan-riskeja/1D8C2A5EFD3E1E8A)
- [K-Rauta: repainting wood cladding](https://www.k-rauta.fi/inspiraatio-ja-ohjeet/maalaaminen/mokin-maalaus-ja-mokin-huoltomaalaus)
- [Teknos: cladding maintenance guide](https://www.teknos.com/globalassets/teknos.fi/teollisuuteen/aineisto/esitteet-ja-dokumentit-iw/peittavan-ulkoverhouksen-huolto-2021.pdf)
- [K-Rauta: terrace oil maintenance](https://www.k-rauta.fi/uutiset/suomalaiset-ovat-santillisia-terassin-huoltajia-k-raudan-asiantuntija-kertoo-kuinka-pitkaksi-huoltovalia-ei-saisi-paastaa-venahtamaan/D3F5D23430FC6235)
- [MTV Uutiset: hot-water tank risks (Tukes)](https://www.mtvuutiset.fi/artikkeli/lamminvesivaraaja-voi-rajahtaa-jos-et-huomioi-naita-riskeja-tukes-julkaisi-kuvia-hurjista-tuhoista/8552644)
- [MTV Uutiset: pipe survey and 50-year rule](https://www.mtvuutiset.fi/artikkeli/putkiremontin-tarve-ja-kuntotutkimus/3225090)
- [Rakennustieto RT 18-103765: technical lives and maintenance periods (login needed)](https://kortistot.rakennustieto.fi/kortit/RT%20103765)
- [Danfoss: oil nozzles (yearly change)](https://www.danfoss.com/fi-fi/products/dhs/burner-components/oil-nozzles/)
