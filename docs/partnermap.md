# Partner map for the risk catalogue

Status: draft, 2026-10-17. Task 5 of `docs/rasitasks.md`. Author: Rasi (analyst).
Sources: `docs/cataloguereview.md` (the risks), `.plans/catalogue-triggers-partners-spec.md` (the interview decisions), `data/partner-categories.json` (the partner types in the app).

## Summary

Each risk needs a partner type that fixes it. This document maps all 58 risks to a partner type and checks the map against `data/partner-categories.json`.

Findings:

1. The 20 existing risks map to the 8 types in the file. No change is needed.
2. The 38 new risks need 6 new partner types. The file has none of them.
3. Five items have no partner. Two are advice only (backup heat, snow-load plan). Three belong to the housing company (fire barrier, renovation costs, shared heat pump).
4. Some risks accept more than one partner type. A catalogue entry now holds one partner type. Antton must change the entry to hold a list.
5. Two risks need two partners: one who finds the problem and one who fixes it.

## 1. Check against `data/partner-categories.json`

The file has 8 types. The spec adds 6 types. The suggested ids follow the style of the file.

| Type | Id | In the file today? | Used by the catalogue today? |
|---|---|---|---|
| Electrician | `electrician` | Yes | Yes, 4 entries |
| Plumber | `plumber` | Yes | Yes, 5 entries |
| Roofer | `roofer` | Yes | Yes, 3 entries |
| Moisture inspector | `moisture_inspector` | Yes | Yes, 3 entries |
| Bathroom renovation | `bathroom_renovation` | Yes | Yes, 1 entry |
| Heating technician | `heating_technician` | Yes | Yes, 1 entry |
| Chimney sweep | `chimney_sweep` | Yes | Yes, 1 entry |
| Ventilation technician | `ventilation_technician` | Yes | Yes, 2 entries |
| Locksmith and alarm installer | `locksmith_alarm` | **No. Add.** | No |
| Hazardous-materials surveyor | `hazmat_surveyor` | **No. Add.** | No |
| Tree service and pest control | `tree_pest` | **No. Add.** | No |
| Facade and windows | `facade_windows` | **No. Add.** | No |
| Independent inspector | `independent_inspector` | **No. Add.** | No |
| Home maintenance | `home_maintenance` | **No. Add.** | No |

All 20 `partner_category` values in `data/catalogue/` are in the file. The check passes for the existing risks.

The mock partner table `fixtures/partners.json` gives each partner a list of categories. A partner can hold more than one type, for example a bathroom renovation partner that is also a plumber. The new types need mock partners too. See section 5.

## 2. The partner types

A partner has one of three roles in a risk:

- **Fixer.** Does the work and confirms it. The confirmation changes the score.
- **Diagnoser.** Inspects and finds out whether work is needed. A diagnoser does not fix.
- **Verifier.** Checks work that someone else did, or reads documents, and writes a report.

| Type | What the partner does | Risks the type handles |
|---|---|---|
| Electrician | Fixer. Checks and repairs the electrics. Can also confirm smoke alarms. | Electrical check (including earthing). Screw-fuse panel. Sauna stove wiring. Wet-room sockets without RCD. Surge protection. EV and e-bike charging. Stove guard. Wet-room or electrical work without documents (electrical part). |
| Plumber | Fixer. Water, pipes, drains, appliances. | Floor drain. Pipe renovation in a flat. Copper pipes. Galvanized pipes. Hot-water tank. Cast-iron sewer. Pipes in unheated rooms. Sewer backflow protection. Leak tray. Washing machine hoses and valve. Leak detector and shut-off valve. Long absences. |
| Roofer | Fixer. Roof coverings and roof structure. | Bitumen felt roof. Steel sheet roof. Tile roof underlay. |
| Moisture inspector | Diagnoser. Measures moisture and checks structures. | False plinth. Crawl space or basement. Subsoil drains. Blocked wall gaps. Poor surface drainage (diagnosis). |
| Bathroom renovation | Fixer. Wet-room work: tiles, waterproofing, sealant. | Wet room without waterproofing. Worn sealant. Waterproofing past its service life (renewal). Wet-room work without documents (wet-room part). |
| Heating technician | Fixer. Boilers, oil tanks, heat pumps, radiators. Can also be the maker's service partner for a heat pump. | Oil tank. Oil boiler. Old radiators. Oil tank room. Heat pump service. |
| Chimney sweep | Fixer. Cleans and checks chimneys. Can also confirm fire-safety items. | Chimney not swept. Part of the fire-safety visit. |
| Ventilation technician | Fixer. Ventilation units, fans and valves. | Mechanical ventilation service. Natural ventilation. Supply-air valve. |
| Locksmith and alarm installer | Fixer. Locks, doors and burglar alarms. Can also confirm smoke alarms. | Weak locks and no alarm. Part of the fire-safety visit. |
| Hazardous-materials surveyor | Diagnoser. Radon measurement. Asbestos and PAH survey. | Radon. Asbestos and PAH. |
| Tree service and pest control | Fixer. Tree work. Animal-proofing and pest control. | Tall trees. Wild animals. |
| Facade and windows | Fixer. Windows, seals, wood cladding, terrace. | Windows. Wood cladding. Terrace. Balcony or terrace door sealant. |
| Independent inspector | Diagnoser and verifier. A vetted building inspector (kuntotarkastaja). Grades work. Reads permit documents. | Building without a permit. Waterproofing past its service life (grade). Wet-room or electrical work without documents (confirm). Product kits (inspection). |
| Home maintenance | Fixer. A general handyman for small jobs. | Poor surface drainage (fix). Roof drains and gutters. |

## 3. The map: every risk and its partner

"Primary" is the partner type that the app shows first. "Also accepted" lists other types that can confirm the same fix. "Proof" is what the partner delivers. Antton uses the proof to write the confirmation step.

### 3.1 Electricity

| Risk | Primary | Also accepted | Proof |
|---|---|---|---|
| Electrical installation not checked in 15 years (includes earthing for homes built before 1990) | Electrician | | Inspection report |
| Old screw-fuse panel | Electrician | | Panel report or invoice |
| Electric sauna stove wiring not checked in 10 years | Electrician | | Inspection report |
| Wet-room sockets without a residual-current device | Electrician | | Work report |
| No surge protection | Electrician | | Work report |
| EV charger or e-bike charging not checked | Electrician | | Installation certificate |

### 3.2 Fire safety

| Risk | Primary | Also accepted | Proof |
|---|---|---|---|
| Too few or old smoke alarms | Electrician | Locksmith and alarm installer. Chimney sweep. | Visit report with alarm count and test |
| No stove guard (liesivahti) | Electrician | | Installation report |
| No extinguisher or fire blanket | Electrician | Locksmith and alarm installer. Chimney sweep. | Visit report |
| Gas or fuel stored in a basement or living space | Electrician | Locksmith and alarm installer. Chimney sweep. | Visit report |
| Fire barrier between row house units | None | | Housing company risk. See section 3.10. |

The first, third and fourth risks form the fire-safety visit. One visit by any of the three partner types can confirm all of them. Each risk keeps its own points.

### 3.3 Heating

| Risk | Primary | Also accepted | Proof |
|---|---|---|---|
| Chimney not swept in the last year | Chimney sweep | | Sweep record |
| Steel oil tank over 30 years old | Heating technician | | Tank inspection record |
| Oil boiler near the end of its service life | Heating technician | | Inspection report |
| Old radiators with surface rust | Heating technician | Plumber | Inspection report |
| Oil tank room without a fire door or protection basin | Heating technician | | Inspection report |
| Heat pump or ground system not serviced | Heating technician | The maker's service partner | Service record |
| No backup heat in a winter power cut | None | | Advice only |
| Water pipes in unheated rooms | Plumber | | Work report |

One heating technician visit can inspect the oil tank, the boiler and the tank room together. The three risks stay separate.

### 3.4 Moisture

| Risk | Primary | Also accepted | Proof |
|---|---|---|---|
| Wet room without modern waterproofing | Bathroom renovation | | Waterproofing certificate |
| False plinth risk structure not inspected | Moisture inspector | | Inspection report |
| Crawl space or basement not inspected for moisture | Moisture inspector | | Inspection report |
| No subsoil drains around the house | Moisture inspector | | Inspection report |
| Blocked wall ventilation gaps in a brick-clad wall | Moisture inspector | | Inspection report with photos |
| Poor surface drainage next to the house | Moisture inspector (diagnoses). Home maintenance (fixes). | | Diagnosis report, then work report |
| Worn sealant in the wet room | Bathroom renovation | | Work report |
| Wet-room waterproofing past its service life | Independent inspector (grades). Bathroom renovation (renews if needed). | Moisture inspector (reading) | Grade report, then waterproofing certificate |
| Cracked sealant at a balcony or terrace door | Facade and windows | | Work report |
| Sewer backflow protection | Plumber | | Work report |

### 3.5 Indoor air

| Risk | Primary | Also accepted | Proof |
|---|---|---|---|
| Radon not measured | Hazardous-materials surveyor | | Measurement report. Advice only, unless a renovation is under way. |
| Asbestos and PAH survey missing before a renovation | Hazardous-materials surveyor | | Survey report. Advice only, unless a renovation is under way. |

### 3.6 Plumbing

| Risk | Primary | Also accepted | Proof |
|---|---|---|---|
| Cast-iron floor drain in the wet room | Plumber | Bathroom renovation | Work report |
| Pipe renovation overdue in a 1960s to 1980s flat | Plumber | | Pipe survey or renovation record |
| Copper water pipes over 40 years old | Plumber | | Pipe survey or invoice |
| Galvanized steel water pipes | Plumber | | Pipe survey or invoice |
| Hot-water tank past its service life | Plumber | | Invoice or inspection report |
| Cast-iron sewer pipes over 50 years old | Plumber | | Pipe survey |
| No leak tray under the dishwasher or washing machine | Plumber | | Work report with photo |
| Old washing machine hoses or no own shut-off valve | Plumber | | Work report |
| No leak detector or automatic shut-off valve | Plumber | Electrician (for a powered sensor) | Installation report |
| Water not shut off during long absences | Plumber | | Installation report |

### 3.7 Roof and building envelope

| Risk | Primary | Also accepted | Proof |
|---|---|---|---|
| Bitumen felt roof over 25 years old | Roofer | | Roof report or invoice |
| Steel sheet roof over 40 years old | Roofer | | Roof report or invoice |
| Tile roof underlay over 30 years old | Roofer | | Roof report or invoice |
| Roof drains and gutters not cleaned each year | Home maintenance | The customer | Advice only. An independent inspector can confirm the work if the customer wants score. |
| Low-pitch roof without a snow-load plan | None | | Advice only |
| Tall trees that can fall on the house | Tree service and pest control | | Work report |
| Windows at the end of their service life | Facade and windows | | Inspection report or invoice |
| Wood cladding needs maintenance | Facade and windows | | Work report |
| Terrace needs maintenance | Facade and windows | | Work report |
| Wild animals in the roof or walls | Tree service and pest control | | Work report with photos |

### 3.8 Ventilation

| Risk | Primary | Also accepted | Proof |
|---|---|---|---|
| Mechanical ventilation unit not serviced in 2 years | Ventilation technician | | Service record |
| Natural ventilation in a house from before 2000 | Ventilation technician | | Work report |
| Supply-air valve blocked | Ventilation technician | | Work report |

### 3.9 Building, documents and security

| Risk | Primary | Also accepted | Proof |
|---|---|---|---|
| Building or extension without a permit | Independent inspector | | Document check report |
| Wet-room or electrical work without documents | Electrician (electrical work). Bathroom renovation (wet-room work). | Independent inspector | Inspection report |
| Weak locks and no alarm | Locksmith and alarm installer | | Lock and alarm report |

### 3.10 Housing company items (no partner)

These items have no partner. The app shows them in the list "about your building". They have no score.

| Item | What the customer does |
|---|---|
| Fire barrier between row house units | Asks the housing company to check the fire wall and attic barrier. |
| Housing company renovation costs | Asks the housing company for the dates and amounts. |
| Shared heat pump near the end of its service life | Asks the housing company for the maintenance plan. |

## 4. Rules for fixers, diagnosers and verifiers

1. **The fixer confirms the fix.** The confirmation by the fixer changes the score (see `docs/rasitasks.md`, task 7).
2. **A diagnoser may close a risk.** If the moisture inspector or the independent inspector finds no problem, the risk closes with the state "verified, no work needed". The customer earns the points for the inspection, not for the fix.
3. **A webshop kit needs an inspection.** A kit that the customer fits alone earns points only after an independent inspector checks it (interview decision).
4. **Two-partner risks.** Two risks use two partners: surface drainage, and waterproofing past its service life. The first partner diagnoses. The second partner fixes. The app shows the second partner after the diagnosis.
5. **More than one accepted type.** If a risk lists "also accepted" types, any of the listed types can confirm. The app shows the primary type first.

## 5. What Antton needs to change

1. Add 6 ids to `data/partner-categories.json`: `locksmith_alarm`, `hazmat_surveyor`, `tree_pest`, `facade_windows`, `independent_inspector`, `home_maintenance`.
2. Change `mitigation.partner_category` in the catalogue entry from one value to a list, so the entry can hold the primary type and the "also accepted" types. A risk with two partners needs a second field for the fixer.
3. Add risks with no partner (backup heat, snow-load plan, fire barrier, the two housing company items) as entries without `partner_category`. Check that the app code allows this.
4. Add mock partners for the new types in `fixtures/partners.json`. The demo house (1975 detached house) needs mock partners for these types:
   - **Facade and windows**: the 1975 report flags the windows.
   - **Independent inspector**: the 1975 report has an extension without a permit.
   - **Locksmith and alarm installer**: shown for every home without a lock check.
   - The other 3 new types are not needed for the demo.
5. Decide whether the heating technician type holds the maker's service as a sub-type or a flag.

## 6. Facts, assumptions and unknowns

### Facts
- The file has 8 partner types. All 20 existing catalogue risks use one of them.
- The 14 types in section 1 follow the interview decisions in `.plans/catalogue-triggers-partners-spec.md`.
- The mock table `fixtures/partners.json` lets one partner hold several types.

### Assumptions
- An electrician can confirm smoke alarms, stove guards and surge protection. This is normal work for an electrician in Finland. I did not check it with a real partner.
- A chimney sweep and a locksmith and alarm installer can confirm smoke alarms and fire-safety items. The interview chose this. It is not checked with real partners.
- A home maintenance partner can fix surface drainage in small cases. Large groundwork is outside the app (interview decision).
- The partner types in section 2 exist as real business types in Finland. The two least certain are "independent inspector" (a kuntotarkastaja is a real role) and "home maintenance" (a handyman or kiinteistöhuolto firm).

### Unknowns
- Which real partners If has in each type, and where.
- Whether the independent inspector can read permit documents and the building register, or only inspect on site.
- The price range and the listing fee for each new type. These are mock data in phase 1.
- Whether a heating technician can act as the maker's service partner for all heat pump brands.
