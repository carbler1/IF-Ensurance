# Catalogue triggers, partners and customer answers: spec

Status: decided in interview, 2026-10-17. Author: Rasi (analyst), with Claude.
Inputs: `docs/cataloguereview.md` (58 risks), `docs/riskassesment.md`, `data/catalogue/`, `data/home-profile.schema.json`, `data/partner-categories.json`.
Scope: this spec fixes the trigger facts, the partner, and the customer-answer rules for each risk. It does not set points, re-check intervals or customer text. Tasks 4 to 7 do that.

## 1. Rules for facts and customer answers

### 1.1 Fact states
Every fact has one of these states:

| State | Meaning | Effect on the risk list |
|---|---|---|
| unknown | Nobody has told the app. | The risk does not enter the ranked list. The app shows a "check this" task. No score effect. |
| customer says fine | The customer answered that the home is fine. | The risk stays in the list. Its rank drops. It carries the label "needs proof". |
| customer says problem | The customer answered that the home has the problem. | The risk shows at full rank. The customer can book a partner. |
| verified | A partner, an independent inspector, or a document confirms the fact. | The risk follows the verified value. Score changes only here. |

- A customer answer is never proof. Score changes only after the "verified" state.
- The customer can resolve an unknown by answering. The fact then moves to "customer says fine" or "customer says problem".
- If sources disagree, the newest partner confirmation or document wins. A customer answer is the lowest source.

### 1.2 The "check this" list
- The list holds every unknown fact that could trigger a risk.
- There is no cap. The list groups tasks by area of the house (for example kitchen, bathroom, roof, basement, electrics).
- Questions are progressive: the app asks a few key facts first. The start questionnaire must still cover all relevant points for the house type.
- Each task has 1 or 2 plain questions with a "don't know" answer.

### 1.3 Product fixes
- A partner installs the product (alarm, leak detector, valve) and confirms the work. The partner earns the proof.
- A webshop kit that the customer fits alone gives proof only after a partner inspects it.

### 1.4 Information and advice risks
- Housing company risks go to a separate list called "about your building". They have no rank and no score. Each has an "ask the housing company" action.
- Advice-only risks show as tips. They carry no score. If a customer wants score, an independent inspector can confirm the work.

### 1.5 Severity per home type
- Each risk has one severity and one probability: the common case. Trigger rules by `house_type` hide risks that do not apply.
- `house_type` gets a new value `holiday_home`. Holiday homes raise the effect of absences and freezing. A separate severity table for them comes later.

## 2. Partner types

Existing types (8): electrician, plumber, roofer, moisture inspector, bathroom renovation, heating technician, chimney sweep, ventilation technician.

New types (6). Antton adds them to `data/partner-categories.json`:

| New type | Does |
|---|---|
| Locksmith and alarm installer | Locks, doors, burglar alarms. Can also confirm smoke alarms. |
| Hazardous-materials surveyor | Radon measurement. Asbestos and PAH survey. |
| Tree service and pest control | Dangerous trees. Wild animals and rodents in roof and walls. |
| Facade and windows | Windows, seals, wood cladding, terrace, balcony door sealant. |
| Independent inspector | A vetted building inspector (kuntotarkastaja). Grades work. Reads permit documents. Confirms work done by others. |
| Home maintenance | A general handyman. Gutters, downspouts, regrading small areas, small chores. |

The heating technician type also covers the maker's service partner for heat pumps. This can be a sub-type per brand.

## 3. Changes to the existing 20 risks

- All 20 keep their current triggers and thresholds (electrical check 15 years, chimney sweep 1 year, sauna wiring 10 years, tile underlay 30 years).
- All 20 keep their current partner.
- "Electrical installation not checked in 15 years" absorbs the earthing risk. See section 4. The earthing finding shows only for homes built before 1990.
- The existing "Wet room without modern waterproofing" stays. It covers waterproofing installed before 1999.
- Open: add one entry "Fibre-cement roof over 30 years old" (severity 4, probability 3). The profile has the roof value. No entry uses it. Not decided.

## 4. New risks: trigger, partner and treatment

"Fire visit" means one visit by the electrician, the locksmith and alarm installer, or the chimney sweep. The visit can confirm several fire-safety risks at once. Each risk keeps its own points.

### 4.1 Electricity

| Risk | Trigger facts | Customer answers | Partner | Treatment |
|---|---|---|---|---|
| Sockets without an earth conductor | Merged into "Electrical installation not checked". `building_year` before 1990. | None. The electrician finds it. | Electrician | Part of the electrical check risk. |
| No surge protection | Surge protection at the panel: no or unknown. | Do you have surge protection at the panel? | Electrician | Scored. |
| EV charger or e-bike charging not checked | Home has an EV charger, or e-bikes or e-scooters charge indoors. Charger installed by an electrician: no or unknown. | Do you have an EV charger? Do you charge e-bikes indoors? Who installed the charger? | Electrician | Scored. One risk covers both. |

### 4.2 Fire safety

| Risk | Trigger facts | Customer answers | Partner | Treatment |
|---|---|---|---|---|
| Too few or old smoke alarms | Alarm count per floor below 1 per started 60 m2. Alarm age 10 years or more. Alarms interlinked: no. | How many alarms on each floor? How old are they? Do they sound together? | Fire visit | Scored. Severity 5, probability 4. |
| No stove guard (liesivahti) | Stove guard installed: no or unknown. | Do you have a stove guard? | Electrician | Scored. Shown to every home without one. The app asks no age question. |
| No extinguisher or fire blanket | Extinguisher or blanket present: no or unknown. | Do you have an extinguisher or a fire blanket? | Fire visit | Scored through a partner who confirms the item. |
| Gas or fuel stored in a basement or living space | Gas cylinders or fuel in a basement or living space: yes. | Do you store gas or fuel in the home? | Fire visit | Scored. |
| Fire barrier between row house units | `house_type` is row house. Building work through the shared wall or attic. | None. | None | In the "about your building" list. |

Open: the interview did not choose "battery or mains power" as an alarm fact. Antton can add it as a fact. It does not change the trigger.

### 4.3 Heating

| Risk | Trigger facts | Customer answers | Partner | Treatment |
|---|---|---|---|---|
| Oil boiler near the end of its service life | `heating` is oil. Boiler year 25 years or more ago. | What year is the boiler? | Heating technician | Scored. |
| Old radiators with surface rust | Radiators 40 years or older. | Are the radiators original? Is there rust? | Heating technician | Scored. |
| Oil tank room without a fire door or protection basin | `heating` is oil. Fire door: no. Basin: no. | Does the tank room have a fire door? A basin? | Heating technician | Scored. |
| Heat pump or ground system not serviced | `heating` is air heat pump or ground heat. Last service older than 2 years by default. | When was the last service? | Heating technician or the maker's service partner | Scored. Default interval 2 years. The interval can be longer if the system maker allows it. |
| No backup heat in a winter power cut | `heating` is electric, air heat pump or ground heat. No fireplace or backup heater. | Do you have backup heat? | None | Advice only. |
| Water pipes in unheated rooms | Pipes in an unheated room, garage or crawl space: yes. Insulation or heat cable: no. | Do pipes run through unheated rooms? | Plumber | Scored. |

One heating technician visit can inspect the tank, the boiler and the tank room together. The risks stay separate.

### 4.4 Moisture

| Risk | Trigger facts | Customer answers | Partner | Treatment |
|---|---|---|---|---|
| Blocked wall ventilation gaps in a brick-clad wall | Facade is brick veneer. `building_year` before 1990. Gap openings open: no or unknown. | What is the wall material? | Moisture inspector | Scored. |
| Poor surface drainage next to the house | `foundation_type` is basement or crawl space. `building_year` before 1990. No customer slope questions. | None. | Moisture inspector diagnoses. Home maintenance fixes. | Scored. Large groundwork is a separate quote outside the app. |
| Worn sealant in the wet room | Last wet-room sealant check older than 3 years, or never. | When was the sealant last renewed? | Bathroom renovation | Scored. Re-check every 3 years. |
| Wet-room waterproofing past its service life | `bathroom_waterproofing_year` from 1999 to 2005. | When was the wet room renovated? | Independent inspector grades. Bathroom renovation renews if needed. | Scored. |
| Cracked sealant at a balcony or terrace door | Home has a balcony or terrace door. Last threshold check older than 3 years. | Does the home have a balcony door? When was the sealant checked? | Facade and windows | Scored. Re-check every 3 years. |
| Sewer backflow protection | Basement floor drain, or a drain pump station: yes. Backflow valve: no. Pump alarm: no. | Is there a floor drain in the basement? Is there a pump? | Plumber | Scored. One risk for the valve and the alarm. |

### 4.5 Indoor air

| Risk | Trigger facts | Customer answers | Partner | Treatment |
|---|---|---|---|---|
| Radon not measured | Municipality in a higher-radon area. `foundation_type` is basement, crawl space or slab. Last measurement: none. | None. The address gives the municipality. | Hazardous-materials surveyor | Advice only, unless a renovation is under way. Not a claims driver. |
| Asbestos and PAH survey missing | `building_year` before 1994. A renovation is planned or under way. Survey: none. | Is a renovation planned? | Hazardous-materials surveyor | Advice only, unless a renovation is under way. |

### 4.6 Plumbing

| Risk | Trigger facts | Customer answers | Partner | Treatment |
|---|---|---|---|---|
| Cast-iron sewer pipes over 50 years old | Sewer material is cast iron. Sewer year before 1976 (or `building_year` before 1976). | What are the sewer pipes made of? | Plumber | Scored. |
| No leak tray under the dishwasher or washing machine | Leak tray: no or unknown. Floor drain under the appliance: no. | Is there a tray under the machines? | Plumber | Scored. Stays a separate risk. |
| Old washing machine hoses or no own valve | Hose year 10 years or more ago, or rubber hose. Own shut-off valve: no. | How old are the hoses? Is there a valve? | Plumber | Scored. Stays separate. |
| No leak detector or automatic shut-off valve | Detector: no. Shut-off valve: no. `pipe_material` copper or galvanized, or `building_year` before 1990. | Do you have a leak detector or an automatic valve? | Plumber | Scored. Stays separate. |
| Water not shut off during long absences | Home empty for more than a week several times a year. Main valve closed on leaving: no. Remote sensor: no. Includes holiday homes. | How often is the home empty for a week? Do you close the main valve? | Plumber | Scored. Stays separate. |

### 4.7 Roof and building envelope

| Risk | Trigger facts | Customer answers | Partner | Treatment |
|---|---|---|---|---|
| Roof drains and gutters not cleaned each year | Roof drains or gutters present. Trees within 10 m. Last cleaning older than 1 year. | When did you last clean the drains? | Home maintenance, or the customer | Advice only. If the customer wants score, an independent inspector confirms. |
| Low-pitch roof without a snow-load plan | Roof pitch below 1:10 or flat. | None. | None | Advice only. |
| Tall trees that can fall on the house | Tall tree within 10 m. Tree health: sick or old. | Are there tall trees near the house? | Tree service and pest control | Scored. |
| Windows at the end of their service life | Windows 45 years or older, or original. Seals hard. | What year are the windows? | Facade and windows | Scored. Separate risk. |
| Wood cladding needs maintenance | Wall material is wood. Last paint older than 10 years. | When was the cladding last painted? | Facade and windows | Scored. Separate risk. |
| Terrace needs maintenance | Wood terrace: yes. Last treatment older than 5 years. | Do you have a wood terrace? When was it treated? | Facade and windows | Scored. Separate risk. |
| Wild animals in the roof or walls | Gaps at eaves or vents without mesh. Signs of animals. | Do you hear or see animals? | Tree service and pest control | Scored. |

### 4.8 Ventilation

| Risk | Trigger facts | Customer answers | Partner | Treatment |
|---|---|---|---|---|
| Supply-air valve blocked | `ventilation` is mechanical exhaust. Supply-air valves open and clean: no or unknown. | Are the supply-air valves open? | Ventilation technician | Scored. |

### 4.9 Building and documents

| Risk | Trigger facts | Customer answers | Partner | Treatment |
|---|---|---|---|---|
| Building or extension without a permit | An addition built after the original permit: yes. Permit and final inspection documents: none. | Did you add a building or extension? Do you have the permit? | Independent inspector | Scored. The app reads the uploaded permit papers or the building register. |
| Wet-room or electrical work without documents | A wet room or electrical work was renovated. Done by the owner or no documents. | Who did the work? Do you have the papers? | Electrician or bathroom renovation partner inspects and issues a report. Independent inspector can confirm. | Scored. |

### 4.10 Security

| Risk | Trigger facts | Customer answers | Partner | Treatment |
|---|---|---|---|---|
| Weak locks and no alarm | Lock meets the insurer standard: no or unknown. Alarm: no. | Do you know your locks meet the standard? Do you have an alarm? | Locksmith and alarm installer | Scored. Shown to every home without a confirmed lock check. Links to the lower deductible when an alarm limits damage (term 6.4.1). |

## 5. Facts the app must hold

New facts, by group. Antton names the fields.

- **House:** `house_type` gets `holiday_home`. Home empty for a week or more, how often.
- **Electricity:** surge protection at the panel. EV charger present. E-bike charging indoors. Charger installer. Stove guard.
- **Fire:** alarm count per floor, alarm age, alarms interlinked. Extinguisher or blanket. Gas or fuel storage. Tank room fire door and protection basin.
- **Heating:** boiler year. Radiator year and rust. Last heat pump service. Backup heat. Pipes in unheated rooms.
- **Moisture:** facade material and gap openings. Last wet-room sealant check. Balcony door and last threshold check. Floor drain in basement and backflow valve. Drain pump and alarm.
- **Plumbing:** sewer material and year. Leak tray. Washing machine hose year and own valve. Leak detector and automatic valve.
- **Roof and envelope:** roof drain count and last cleaning. Roof pitch. Tall trees near the house. Window year. Wood wall material and last paint. Wood terrace and last treatment. Animal signs.
- **Ventilation:** supply-air valve state.
- **Documents and security:** addition after the original permit and permit papers. Who did the wet-room or electrical work and the papers. Lock standard. Alarm system. Planned renovation. Radon measurement date. Hazardous-materials survey.

The start questionnaire must cover every fact that applies to the house type. The app asks the rest as "check this" tasks.

## 6. Open items

- Add or not add the fibre-cement roof entry (section 3).
- Add or not add "battery or mains power" as an alarm fact (section 4.2).
- Partner assignments for the electrician, plumber, heating, locks, tree and survey groups were approved as proposed. The moisture, bathroom and facade groups changed as in sections 4.4 and 4.7.
- Points, re-check intervals and customer text for all 58 risks. Tasks 4 to 7.
- Whether advice-only risks (backup heat, snow plan, roof drains, radon, asbestos) need a re-check interval for the maintenance list.
- The severity table for holiday homes.
- How the app reads the building register for the permit risk.
