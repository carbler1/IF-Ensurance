# Risk catalogue review and extension

Status: draft, 2026-10-17. Task 3 of `docs/rasitasks.md`. Author: Rasi (analyst).

## Summary

This document does two things:

1. It reviews the 20 risks in the catalogue (`data/catalogue/`). All 20 are real risks in Finnish houses. I changed no value.
2. It adds 38 new risks from `docs/riskassesment.md`. The catalogue then has 58 risks.

For each risk, this document gives the severity, the probability and the house facts that trigger the risk. Antton turns the tables into catalogue entries. Rasi writes no data structures.

All values are first estimates from expert judgement. I have not checked them against If claim data.

## 1. Scale

Severity and probability use a scale from 1 (low) to 5 (high). The app ranks risks by severity × probability, highest first.

| Value | Severity: harm when it happens | Probability: chance in a typical house that the risk applies to |
|---|---|---|
| 1 | Minor. A small cost. No danger to people. | Rare |
| 2 | Low. A cost of up to some hundreds of euros. | Unlikely |
| 3 | Medium. A damage of some thousands of euros. | Possible |
| 4 | High. A damage of tens of thousands of euros, or a serious health risk. | Likely |
| 5 | Critical. A threat to life, or a loss of the home. | Very likely |

I took the values for the new risks from the Likelihood and Severity columns in `docs/riskassesment.md`. The mapping is:

| `riskassesment.md` | Scale value |
|---|---|
| extremely low | 1 |
| low | 2 |
| medium | 3 |
| high | 4 |
| critical | 5 |

For likelihood, Low is 2, Medium is 3 and High is 4. I moved a value by 1 when the new risk is narrower than its category in `riskassesment.md`.

## 2. The 20 risks in the catalogue

I checked each risk. All 20 are real risks in Finnish houses. I kept the values.

| Category | Risk | Severity | Probability |
|---|---|---|---|
| Electricity | Electrical installation not checked in 15 years | 3 | 3 |
| Electricity | Old screw-fuse panel | 4 | 3 |
| Electricity | Electric sauna stove wiring not checked in 10 years | 4 | 3 |
| Electricity | Wet-room sockets without a residual-current device | 4 | 2 |
| Heating | Chimney not swept in the last year | 4 | 3 |
| Heating | Steel oil tank over 30 years old | 5 | 3 |
| Moisture | Wet room without modern waterproofing | 4 | 4 |
| Moisture | False plinth risk structure not inspected | 5 | 3 |
| Moisture | Crawl space or basement not inspected for moisture | 4 | 3 |
| Moisture | No subsoil drains around the house | 4 | 3 |
| Plumbing | Cast-iron floor drain in the wet room | 3 | 4 |
| Plumbing | Pipe renovation overdue in a 1960s to 1980s flat | 4 | 4 |
| Plumbing | Copper water pipes over 40 years old | 4 | 3 |
| Plumbing | Galvanized steel water pipes | 4 | 4 |
| Plumbing | Hot-water tank past its service life | 3 | 4 |
| Roof | Bitumen felt roof over 25 years old | 4 | 4 |
| Roof | Steel sheet roof over 40 years old | 3 | 3 |
| Roof | Tile roof underlay over 30 years old | 4 | 3 |
| Ventilation | Mechanical ventilation unit not serviced in 2 years | 2 | 4 |
| Ventilation | Natural ventilation in a house from before 2000 | 3 | 3 |

### 2.1 Review notes and triggers

"Fact" names the field in the home profile (`data/home-profile.schema.json`). Dates are from the current catalogue rules.

| Risk | Real risk? | House facts that trigger it |
|---|---|---|
| Electrical installation not checked | Yes. Old wiring is a main cause of electrical fire (`riskassesment.md`: Electrical installation). | `building_year` before 1996. `last_electrical_check` missing or before 2011. |
| Old screw-fuse panel | Yes. Fire and shock risk. | `building_year` before 1985. `panel_type` is screw fuse or unknown. |
| Electric sauna stove wiring | Yes. Sauna stoves are a top cause of electrical fire. | `sauna` is electric stove. `building_year` before 2006. `last_electrical_check` older than 10 years. |
| Wet-room sockets without RCD | Yes. A leak to earth can shock a person. | `building_year` before 1997. `bathroom_waterproofing_year` not after 1996. `last_electrical_check` missing. |
| Chimney not swept | Yes. Soot fire. Smoke gas risk. The terms (5.2.4) ask for a sweep once a year. | `sauna` is wood stove, or `heating` is wood, pellet or oil. `last_chimney_sweep` missing or older than 1 year. |
| Steel oil tank over 30 years | Yes. An oil leak costs tens of thousands of euros. | `heating` is oil. `oil_tank_year` before 1996 (or `building_year` before 1996 when the tank year is unknown). |
| Wet room without waterproofing | Yes. The most common hidden water damage. | `bathroom_waterproofing_year` before 1999 (or `building_year` before 1999 when unknown). |
| False plinth structure | Yes. A known risk structure in houses from 1960 to 1989. The damage does not show on the surface. | `house_type` is not flat. `foundation_type` is slab on ground or unknown. `building_year` 1960 to 1989. `last_moisture_inspection` older than 5 years. |
| Crawl space or basement not inspected | Yes. Moisture and mould risk. | `foundation_type` is crawl space or basement. `building_year` before 1990. `last_moisture_inspection` missing or before 2021. |
| No subsoil drains | Yes. Water at the foundation. | `subsoil_drains` is absent. Or unknown and `building_year` before 1980. |
| Cast-iron floor drain | Yes. Drain joints cause a large share of leak claims. | `floor_drain_type` is cast iron. |
| Pipe renovation overdue in a flat | Yes. Pipes from the 1960s to 1980s are at end of life. | `house_type` is flat or row house. `building_year` 1960 to 1989. `last_pipe_renovation` not after 1995. |
| Copper pipes over 40 years | Yes. Copper pits and leaks at 40 to 50 years. | `pipe_material` is copper. `last_pipe_renovation` before 1986 (or `building_year` before 1986). |
| Galvanized steel pipes | Yes. Steel pipes rust from the inside. | `pipe_material` is galvanized steel. `last_pipe_renovation` not after 1990. |
| Hot-water tank past service life | Yes. Tanks corrode and leak without warning. | `water_heater_year` before 2006 (or `building_year` before 2006 when unknown). |
| Bitumen felt roof over 25 years | Yes. Roof leaks. | `roof_material` is bitumen felt. `last_roof_renovation` before 2001 (or `building_year` before 2001). |
| Steel sheet roof over 40 years | Yes. Seams and fixings fail. | `roof_material` is sheet metal. `last_roof_renovation` before 1986 (or `building_year` before 1986). |
| Tile roof underlay over 30 years | Yes. The underlay fails before the tiles. | `roof_material` is tile. `last_roof_renovation` before 1996 (or `building_year` before 1996). |
| Mechanical ventilation not serviced | Yes. Dirty filters and fans cause bad air and moisture. | `ventilation` is mechanical exhaust or mechanical supply and exhaust. `last_ventilation_service` not within 2 years. |
| Natural ventilation before 2000 | Yes. Air change depends on the weather. | `ventilation` is natural. `building_year` before 2000. |

### 2.2 Gaps in the current catalogue

- The home profile has a `roof_material` value "fibre cement". No catalogue entry uses it. Old fibre-cement roofs can contain asbestos. I recommend one entry: "Fibre-cement roof over 30 years old". Severity 4, probability 3. Trigger: `roof_material` is fibre cement, and `last_roof_renovation` before 1996 (or `building_year` before 1996).
- The profile has `heating` values "district", "ground_heat", "air_heat_pump" and "electric". Only the oil, wood and pellet values have a catalogue entry. Section 3 adds entries for heat pumps and electric heating.

## 3. New risks from `riskassesment.md`

This is the new part of the catalogue. Each risk comes from a hazard category in `docs/riskassesment.md`. Section 3.1 names the category and the home types for each risk.

Home types: D is detached house, R is row house, A is apartment.

| Category | Risk | Severity | Probability |
|---|---|---|---|
| Electricity | Sockets without an earth conductor | 4 | 3 |
| Electricity | No surge protection | 3 | 3 |
| Electricity | EV charger or e-bike charging not checked by an electrician | 5 | 3 |
| Fire safety | Too few or battery-only smoke alarms | 5 | 4 |
| Fire safety | No stove guard (liesivahti) | 5 | 3 |
| Fire safety | No extinguisher or fire blanket | 4 | 3 |
| Fire safety | Liquefied gas or fuel stored in a basement or living space | 5 | 2 |
| Heating | Oil boiler near the end of its service life | 3 | 3 |
| Heating | Old radiators with surface rust | 3 | 2 |
| Heating | Oil tank room without a fire door or protection basin | 4 | 2 |
| Heating | Heat pump or ground system not serviced in the last year | 3 | 3 |
| Heating | No backup heat in a winter power cut | 3 | 3 |
| Heating | Water pipes in unheated rooms without protection | 4 | 3 |
| Moisture | Blocked wall ventilation gaps in a brick-clad wall | 4 | 3 |
| Moisture | Poor surface drainage next to the house | 4 | 4 |
| Moisture | Worn sealant in the wet room | 3 | 4 |
| Moisture | Wet-room waterproofing past its service life | 4 | 3 |
| Moisture | Cracked sealant at a balcony or terrace door | 3 | 3 |
| Moisture | No backflow valve in the sewer | 4 | 2 |
| Moisture | Drain pump station without an alarm | 4 | 2 |
| Indoor air | Radon not measured | 3 | 2 |
| Indoor air | Asbestos and PAH survey missing before a renovation | 4 | 3 |
| Plumbing | Cast-iron sewer pipes over 50 years old | 4 | 3 |
| Plumbing | No leak tray under the dishwasher or washing machine | 3 | 4 |
| Plumbing | Old washing machine hoses or no own shut-off valve | 3 | 3 |
| Plumbing | No water leak detector or automatic shut-off valve | 4 | 3 |
| Plumbing | Water not shut off or monitored during long absences | 4 | 3 |
| Roof | Roof drains and gutters not cleaned each year | 3 | 4 |
| Roof | Low-pitch or flat roof without a snow-load plan | 4 | 2 |
| Roof | Tall trees that can fall on the house | 4 | 2 |
| Roof | Windows at the end of their service life | 2 | 4 |
| Roof | Wood cladding and terrace need maintenance | 2 | 4 |
| Roof | Wild animals in the roof or walls | 2 | 3 |
| Ventilation | Supply-air valve blocked | 2 | 4 |
| Building and documents | Building or extension without a permit | 4 | 2 |
| Building and documents | Wet-room or electrical work done without documents | 4 | 3 |
| Security | Entrance doors and windows with weak locks, no alarm | 3 | 3 |
| Fire safety | Fire barrier between row house units not checked | 5 | 2 |

The last risk applies to row houses only. It is a risk, but the housing company must act. See section 5.

### 3.1 Triggers and notes for the new risks

| Risk | Source in `riskassesment.md` | Applies to | House facts that trigger it |
|---|---|---|---|
| Sockets without an earth conductor | Electrical installation | D, R, A | `building_year` before 1990. All sockets earthed: no or unknown. `last_electrical_check` missing or old. |
| No surge protection | Surge and device damage | D, R, A | Surge protection at the panel: no. The home has a lightning-prone location or valuable electronics. |
| EV charger or e-bike charging not checked | Battery and EV charging | D, R, A | Home has an EV charger, or e-bikes or e-scooters are charged indoors. Charger installed by an electrician: no. |
| Too few or battery-only smoke alarms | Fire (fireplace, chimney, sauna). Rule 5.2.6 | D, R, A | Number of smoke alarms below 1 per started 60 m2 on each floor. Alarm power type is battery. A floor or the basement with no alarm. |
| No stove guard | Cooking and portable appliances | D, R, A | Stove guard installed: no. An older resident lives in the home. |
| No extinguisher or fire blanket | Fire (fireplace, chimney, sauna) | D, R, A | Extinguisher installed: no. |
| Liquefied gas or fuel stored in a basement | Flammable liquids and gas. Rule 5.2.5 | D, R, A | Gas cylinders or fuel in a basement or living space: yes. |
| Oil boiler near the end of its service life | Heating system | D | `heating` is oil. Boiler year more than 25 years ago. |
| Old radiators with surface rust | Ageing pipes and equipment | D, R, A | Radiators installed more than 40 years ago. Surface rust seen: yes. |
| Oil tank room without fire door or basin | Oil tank | D | `heating` is oil. Tank room has a fire door: no. Protection basin: no. |
| Heat pump or ground system not serviced | Heating system | D, R | `heating` is air heat pump or ground heat. Last heat pump service older than 1 year. |
| No backup heat in a winter power cut | Utility network failure | D, R | `heating` is electric, air heat pump or ground heat. No fireplace and no backup heater. |
| Water pipes in unheated rooms | Freezing and cold-season heating | D, R | Pipes in an unheated room, garage or crawl space: yes. Pipe insulation or heat cable: no. |
| Blocked wall ventilation gaps | Moisture and mould. Slow and gradual damage | D, R | Facade is brick veneer. `building_year` before 1990. Gap openings at the wall base open: no or unknown. |
| Poor surface drainage next to the house | Stormwater and drainage | D, R | Ground slopes toward the wall, or is flat. Downspout outlet less than 3 m from the wall. `foundation_type` is basement or crawl space. |
| Worn sealant in the wet room | Wet-room waterproofing and floor drains | D, R, A | Last wet-room sealant check older than 1 year, or never. Wet-room age. |
| Wet-room waterproofing past service life | Wet-room waterproofing and floor drains | D, R, A | `bathroom_waterproofing_year` from 1999 to 2005 (25 years or older). Not covered by the existing entry, which stops at 1998. |
| Cracked sealant at balcony or terrace door | Moisture and mould | D, R, A | Home has a balcony or terrace door. Last threshold sealant check older than 2 years. |
| No backflow valve in the sewer | Sewer and drain pumps | D, R | Basement or low floor drain: yes. Backflow valve: no. Sewer below street level: yes or unknown. |
| Drain pump station without an alarm | Sewer and drain pumps | D, R | Home has a drain pump or dry-keeping pump. Pump alarm: no. |
| Radon not measured | Radon and indoor air | D, R, A | `foundation_type` is basement, crawl space or slab on ground. Last radon measurement missing. A radon pipe with no fan connected. Apartments above the 2nd floor are not included. |
| Asbestos and PAH survey missing | Radon and indoor air | D, R, A | `building_year` before 1994. A renovation is planned. Hazardous-materials survey: no. |
| Cast-iron sewer pipes over 50 years | Ageing pipes and equipment | D, R | Sewer material is cast iron. Sewer year before 1976, or `building_year` before 1976. |
| No leak tray under appliances | Appliances and hoses | D, R, A | Leak tray under the dishwasher or washing machine: no. The floor has no floor drain. |
| Old washing machine hoses or no own valve | Appliances and hoses. Rule 5.5.6 | D, R, A | Hose year more than 10 years ago, or rubber hose. Own shut-off valve: no. |
| No leak detector or auto shut-off valve | Water damage | D, R, A | Leak detector installed: no. Automatic shut-off valve: no. `pipe_material` is copper or galvanized, or building year before 1990. |
| Water not shut off during long absences | Empty home and absence. Rule 5.5.3 | D, R, A | The home is empty for more than a week a few times each year. Main valve closed on leaving: no. Remote sensor: no. A holiday home counts here. |
| Roof drains and gutters not cleaned | Roof and structure | D, R | Low-pitch roof with roof drains, or gutters. Trees within 10 m. Last cleaning older than 1 year. |
| Low-pitch roof without snow-load plan | Roof and structure | D, R | Roof pitch below 1:10 or flat. Snow removal plan: no. |
| Tall trees that can fall on the house | Weather and nature | D, R | Tall tree within 10 m of the house. Tree health: sick or old. |
| Windows at end of service life | Roof and structure | D, R, A | Window year more than 45 years ago, or original. Seals hard or paint worn. |
| Wood cladding and terrace need maintenance | Roof and structure | D, R | Wall material is wood, or the home has a wood terrace. Last paint or oil treatment older than 10 years. |
| Wild animals in the roof or walls | Wild animals | D, R | Gaps at the eaves or vents without mesh. Signs of animals: yes. |
| Supply-air valve blocked | Slow and gradual damage. Moisture and mould | D, R, A | `ventilation` is mechanical exhaust. Supply-air valves open and clean: no or unknown. |
| Building or extension without a permit | Building without a permit | D, R | An addition built after the original permit: yes. Permit and final inspection documents: no. |
| Wet-room or electrical work without documents | Renovation and construction. Building defects | D, R, A | Renovation of a wet room or electrical work done: yes. Done by the owner or no documents (certificate, receipt, inspection record): yes. |
| Weak locks and no alarm | Break-in and theft | D, R, A | Entrance and window locks meet the insurer standard: no. Alarm system: no. Location: remote or ground floor. |
| Fire barrier between row house units | Fire spread between units | R | `house_type` is row house. Building work done through the shared wall or the shared attic. Fire barrier inspected: no. |

### 3.2 Notes on values

- **Smoke alarms (5/4).** The highest value in the catalogue. A fire is critical (5) and missing alarms are common (4). The fix is cheap and has outside proof.
- **Water loss risks (3 to 4).** Water damage is a major source of home claims. The values stay at 3 or 4 because a single water loss is expensive but seldom kills.
- **Radon (3/2).** Low probability in most of Finland. The effect is long-term and serious. A measurement is cheap.
- **Asbestos (4/3).** Probability is high for buildings before 1994. The risk becomes real only during a renovation.
- **Windows (2/4).** Almost every old window is at end of life. The loss is low.

## 4. Where every category in `riskassesment.md` went

Every hazard category in `docs/riskassesment.md` is in one of three places:

- **In the catalogue.** The category gives one or more risks in section 3.
- **Information only.** The customer cannot act alone, or no outside proof is possible. The app can show the risk. It gives no score.
- **Not a catalogue risk.** The category is an insurance rule, a consequence, or a habit.

| Category in `riskassesment.md` | Where it went |
|---|---|
| Water damage | Catalogue: No water leak detector. Old washing machine hoses. |
| Appliances and hoses | Catalogue: No leak tray. Old washing machine hoses. |
| Wet-room waterproofing and floor drains | Catalogue: Worn sealant. Waterproofing past service life. Existing: Wet room without waterproofing. Cast-iron floor drain. |
| Sewer and drain pumps | Catalogue: No backflow valve. Drain pump without alarm. |
| Stormwater and drainage | Catalogue: Poor surface drainage. Roof drains not cleaned. Existing: No subsoil drains. |
| Moisture and mould | Catalogue: Blocked wall gaps. Supply-air valve blocked. Existing: Crawl space inspection. |
| Slow and gradual damage | Catalogue (covered by the old-age entries and the risks above). |
| Building defects | Catalogue: Wet-room or electrical work without documents. |
| Ageing pipes and equipment | Catalogue: Cast-iron sewer. Old radiators. Existing: Copper pipes. Galvanized pipes. Hot-water tank. |
| Electrical installation | Catalogue: Sockets without earth. Existing: Four electrical entries. |
| Surge and device damage | Catalogue: No surge protection. |
| Battery and EV charging | Catalogue: EV charger or e-bike charging not checked. |
| Fire (fireplace, chimney, sauna) | Catalogue: Too few smoke alarms. No extinguisher. Existing: Chimney sweep. |
| Cooking and portable appliances | Catalogue: No stove guard. |
| Open flame, smoking and hot work | Not a catalogue risk. A habit with no outside proof. |
| Flammable liquids and gas | Catalogue: Liquefied gas or fuel in a basement. |
| Heating system | Catalogue: Heat pump service. Oil boiler. No backup heat. |
| Oil tank | Catalogue: Oil tank room fire door. Existing: Oil tank over 30 years. |
| Freezing and cold-season heating | Catalogue: Pipes in unheated rooms. |
| Empty home and absence | Catalogue: Water not shut off during long absences. |
| Roof and structure | Catalogue: Snow-load plan. Windows. Wood cladding. Existing: Three roof entries. |
| Weather and nature | Catalogue: Tall trees. Flood zones are information only. |
| Outbuildings | Information only. Mitigations are in the entries for smoke alarms and extinguisher. |
| Yard and small structures | Not a catalogue risk. A cover limit, not a house risk. |
| Building without a permit | Catalogue: Building or extension without a permit. |
| Renovation and construction | Catalogue: Wet-room or electrical work without documents. Asbestos survey. |
| Break-in and theft | Catalogue: Weak locks, no alarm. |
| Vandalism and robbery | Not a catalogue risk. Covered by the security entry. |
| Keys and valuables | Not a catalogue risk. A habit with no outside proof. |
| Bicycles, e-vehicles and boats | Not a catalogue risk. Low severity, no house fix. |
| Tenants and visitors | Not a catalogue risk. A customer-conduct risk. |
| Loss of rental income | Not a catalogue risk. A consequence of other risks. |
| Loss of use of the home | Not a catalogue risk. A consequence of other risks. |
| Pests | Information only. No partner type yet. |
| Wild animals | Catalogue: Wild animals in the roof or walls. |
| Pets | Not a catalogue risk. A customer-conduct risk. |
| Nearby construction work | Information only. The customer cannot prevent it. |
| Utility network failure | Catalogue: No backup heat in a winter power cut. |
| Contents: accidental damage and loss | Not a catalogue risk. A habit. |
| Digital loss, fraud and illegal use | Not a catalogue risk. |
| Travel and transport | Not a catalogue risk. A different product. |
| Insurance cover gaps | Not a catalogue risk. The app can show it as If advice. |
| Compensation cut by own conduct | Not a catalogue risk. A consequence rule. |
| Liability on the plot | Information only. |
| Radon and indoor air | Catalogue: Radon not measured. Asbestos and PAH survey missing. |
| Water damage from neighbours, from other units | Catalogue: No water leak detector. The leak source is outside the customer's control. |
| Fire spread between units | Catalogue (row house): Fire barrier check. Housing company acts. |
| Fixed interior and responsibility limit | Information only. The articles of association decide. |
| Building pipes | Existing: Pipe renovation overdue in a flat. |
| Fire in the building | Information only. The housing company controls it. |
| Balcony and facade | Catalogue: Cracked sealant at balcony door. The structure is information only. |
| Building services | Information only. The housing company controls it. |
| Storage rooms, Storage and outbuildings | Information only. |
| Liability (apartment) | Information only. |
| Noise and neighbour conflict | Not a catalogue risk. |

## 5. Items that need Antton's choice

- **Fire barrier between row house units.** The customer cannot fix this. The housing company must act. Antton can show it as information with no score.
- **Partner types.** The catalogue entries need a partner type (task 5). The current list in `data/partner-categories.json` has 8 types. New risks need more types: smoke alarm installer or electrician, locksmith, window technician, painter, hazardous-materials surveyor, tree service. Task 5 decides.
- **Entries with an app-only fix.** Some new risks (for example "No extinguisher or fire blanket") have no partner. The customer buys a product. The proof of work is a photo or a receipt. The interview decides whether such risks earn points.
- **Risks that depend on a user answer, not a document.** Many new triggers (alarm count, leak tray, stove guard) come from the customer, not from an inspection report. The service spec says proof of work comes from outside sources. The risk list can use customer answers. The score should use only outside proof.

## 6. Facts, assumptions and unknowns

### Facts
- The catalogue has 20 risks. This document keeps all 20 and adds 38.
- The severity and likelihood values for the new risks come from `docs/riskassesment.md`.
- The cover and rule references in `riskassesment.md` come from the If home insurance terms, term OMA 200.27.

### Assumptions
- A risk is a catalogue risk when a house fact triggers it, and a partner or a document can show the fix.
- A value of 2 for a new risk means "unlikely in a typical house". It does not mean "unlikely in the demo house".

### Unknowns
- The true severity and probability for each risk. If claim data can show them.
- Which home profile fields Antton adds. The new triggers need about 25 new fields (section 3.1).
- Whether the app can read most of these facts from an inspection report. The 3 sample reports contain about half of them.
- The customer text, the partner type, the re-check interval and the points for each new risk. Tasks 4, 5, 6 and 7 define them.
