# Risk catalogue

The catalogue holds 20 risks. Each risk is one file: `data/catalogue/<category>/<name>.json`. The id is `<prefix>.<name>`, where the prefix is the short category code in `data/catalogue/id-prefixes.json` (for example `elec` for electricity). The script `scripts/catalogue/validate.py` checks the files and builds `data/catalogue.json`.

An unknown profile value (see "Profile fields") counts as "not recorded". Most triggers below match a house when the value is unknown and the building year fits.

## Risks

Severity and probability use a scale from 1 (low) to 5 (high). The re-check interval is the number of years between checks. Points are set by hand for each risk. Dates in a trigger are fixed in the JSON file.

| id | Title | Trigger | Sev | Prob | Partner category | Re-check (years) | Points |
|---|---|---|---|---|---|---|---|
| elec.check.overdue | Electrical installation not checked in 15 years | Built before 1996, and no electrical check on record or the last check before 2011-01-01 | 3 | 3 | electrician | 15 | 80 |
| elec.panel.screw_fuse | Old screw-fuse panel | Built before 1985, and the panel has screw fuses or the type is unknown | 4 | 3 | electrician | 15 | 120 |
| elec.sauna.electric_stove_wiring | Electric sauna stove wiring not checked in 10 years | Electric sauna stove, built before 2006, and no electrical check after 2016-10-17 | 4 | 3 | electrician | 10 | 70 |
| elec.wet_room.no_rcd | Wet-room sockets without a residual-current device | Built before 1997, waterproofing not installed after 1996, and no electrical check on record | 4 | 2 | electrician | 15 | 60 |
| heat.chimney.sweep_overdue | Chimney not swept in the last year | Wood sauna stove, or wood, pellet or oil heating, and no sweep on record or the last sweep before 2025-10-17 | 4 | 3 | chimney_sweep | 1 | 30 |
| heat.oil_tank.age | Steel oil tank over 30 years old | Oil heating, and the tank was installed before 1996 (or the tank year is unknown and the house was built before 1996) | 5 | 3 | heating_technician | 10 | 110 |
| moist.bathroom.waterproofing_missing | Wet room without modern waterproofing | Waterproofing installed before 1999 (or the year is unknown and the house was built before 1999) | 4 | 4 | bathroom_renovation | 10 | 140 |
| moist.foundation.false_plinth | False plinth risk structure not inspected | Not a flat, slab-on-ground or unknown foundation, built 1960 to 1989, and no moisture inspection after 2021-10-17 | 5 | 3 | moisture_inspector | 5 | 100 |
| moist.foundation.inspection_overdue | Crawl space or basement not inspected for moisture | Crawl space or basement, built before 1990, and no moisture inspection on record or the last one before 2021-01-01 | 4 | 3 | moisture_inspector | 5 | 90 |
| moist.subsoil_drains.missing | No subsoil drains around the house | No subsoil drains, or the drains are unknown and the house was built before 1980 | 4 | 3 | moisture_inspector | 5 | 120 |
| plumb.floor_drain.cast_iron | Cast-iron floor drain in the wet room | The floor drain is cast iron | 3 | 4 | plumber | 5 | 70 |
| plumb.pipe_renovation.flat_overdue | Pipe renovation overdue in a 1960s to 1980s flat | Flat or row house, built 1960 to 1989, and no pipe renovation after 1995 | 4 | 4 | plumber | 10 | 150 |
| plumb.pipes.copper_age | Copper water pipes over 40 years old | Copper pipes, renovated before 1986 (or never renovated and the house was built before 1986) | 4 | 3 | plumber | 10 | 140 |
| plumb.pipes.galvanized_steel | Galvanized steel water pipes | Galvanized steel pipes, and no pipe renovation after 1990 | 4 | 4 | plumber | 10 | 150 |
| plumb.water_heater.age | Hot-water tank past its service life | Tank installed before 2006 (or the year is unknown and the house was built before 2006) | 3 | 4 | plumber | 10 | 60 |
| roof.bitumen_felt.age | Bitumen felt roof over 25 years old | Bitumen felt roof, last renewed before 2001 (or never renewed and the house was built before 2001) | 4 | 4 | roofer | 5 | 130 |
| roof.sheet_metal.seams_age | Steel sheet roof over 40 years old | Sheet metal roof, last renewed before 1986 (or never renewed and the house was built before 1986) | 3 | 3 | roofer | 5 | 100 |
| roof.tile.underlay_age | Tile roof underlay over 30 years old | Tile roof, last renewed before 1996 (or never renewed and the house was built before 1996) | 4 | 3 | roofer | 5 | 120 |
| vent.mechanical.service_overdue | Mechanical ventilation unit not serviced in 2 years | Mechanical exhaust or supply-and-exhaust ventilation, and no service after 2024-10-17 | 2 | 4 | ventilation_technician | 2 | 40 |
| vent.natural.old_house | Natural ventilation in a house from before 2000 | Natural ventilation, built before 2000 | 3 | 3 | ventilation_technician | 5 | 80 |

## How a risk is matched

Each risk has an `applies_when` condition. The matcher tests the condition against the home profile. The risk applies to the home when the condition is true.

A condition is built from these operators:

- `lt`, `gt`, `eq`: compare a field with a number or an ISO date (`YYYY-MM-DD`).
- `in`: true when the field value is in a list.
- `exists`: true when the field value is not "unknown".
- `and`, `or`, `not`: combine conditions.

A comparison against "unknown" is always false. The literal "unknown" is not allowed as a comparison value. An `in` test matches "unknown" only when the list contains "unknown".

Many triggers use `not gt` (for example, "no check after 2016"). This test is true when the value is unknown. A home with no record is therefore treated as overdue.

Each risk file also holds `tests.match` and `tests.reject` profiles. The validator runs them through the reference matcher (the `scripts/catalogue` code). It also checks that `half_life_years` is not larger than `service_life_years`, and that each partner category is in the list.

When a work order is confirmed, the `on_done` rule can write a field back to the profile. For example, a confirmed electrical check sets `last_electrical_check` to the confirmation date.

## Profile fields

`data/home-profile.schema.json` lists all profile fields. Every field exists in every profile. Each field holds `value`, `confidence` (0 to 1), `source`, `evidence` and `doubt`. A field that nothing filled has value "unknown", confidence 0 and source "none". When sources disagree, the rank is partner, then document, then register, then customer.

| Field | Values |
|---|---|
| house_type | detached, semi_detached, row_house, flat |
| building_year | year |
| heating | oil, electric, district, ground_heat, air_heat_pump, wood, pellet, gas |
| panel_type | screw_fuse, automatic_fuses |
| pipe_material | galvanized_steel, copper, plastic, pex |
| roof_material | sheet_metal, tile, bitumen_felt, fibre_cement |
| last_pipe_renovation | year |
| last_electrical_check | date |
| ventilation | natural, mechanical_exhaust, mechanical_supply_exhaust |
| sauna | none, electric_stove, wood_stove |
| bathroom_waterproofing_year | year |
| floor_drain_type | cast_iron, plastic |
| water_heater_year | year |
| foundation_type | slab_on_ground, crawl_space, basement |
| subsoil_drains | present, absent |
| last_roof_renovation | year |
| oil_tank_year | year (only meaningful with oil heating) |
| last_chimney_sweep | date |
| last_moisture_inspection | date |
| last_ventilation_service | date |

Every field also accepts "unknown". A year is an integer from 1800 to 2100. A date is an ISO date.

## Partner categories

A partner is a company that does the work for a risk. `data/partner-categories.json` lists 14 categories. Each risk names one in `mitigation.partner_category`. The validator checks that the list in the schema and the list in the file are the same.

- In use by the 20 risks: electrician, plumber, roofer, moisture_inspector, bathroom_renovation, heating_technician, chimney_sweep, ventilation_technician.
- Listed, with no risk yet: locksmith_alarm, hazmat_surveyor, tree_pest, facade_windows, independent_inspector, home_maintenance.

## Customer text rules

Each risk has two texts: `why_hint` (why it matters) and `benefit_hint` (what you gain). The reader is an average Finnish person, including an older person. The text speaks to the reader as "you".

- Use 2 to 4 short sentences. Put one idea in each sentence.
- Use plain words. Define a term in brackets the first time it appears.
- In the why text, say what can go wrong. Then say what it costs or harms. Do not blame the customer.
- In the benefit text, say what the customer gets. Do not promise a premium cut or a score. The app shows those.
- Keep the text true for every house that triggers the risk. Do not name a year or a material that only some houses have.
- Do not use fear words. Write "risk" where "danger" is not needed.
- Take claims about a specific appliance or structure only from `known_quirks` in the risk file.
