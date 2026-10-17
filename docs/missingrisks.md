# Risks that the catalogue does not have

Status: draft, 2026-10-17. Task 2 of `docs/rasitasks.md`. Author: Rasi (analyst).

## Summary

I read the 3 sample reports in `samples/synthetic/`. A real inspector flags 22 risks that the catalogue in `data/catalogue/` does not have. This document lists them. For each risk it names the house facts that trigger it.

I based each risk on the hazard categories in `docs/riskassesment.md`. The "Category" column uses the names from that document.

Some risks need facts that the app does not collect yet. The list of new facts is in section 4. Antton decides which ones to add.

Scope: this document names the risks and the triggers. It does not give severity, probability, customer text or partners. Tasks 3 to 6 do that.

## 1. How I compared the reports

1. I read each report. I took every risk, defect and recommended action that the inspector wrote.
2. I compared each one with the 20 catalogue entries.
3. I kept only the items that no catalogue entry covers. If an entry covers the item in part, I wrote "extend" in the Type column.
4. I removed items that the customer cannot act on, for example a repair that only the housing company can do. I kept these in section 3 as information.

The 20 catalogue entries already cover these inspector findings:

- 1975 house: the old oil tank, the old screw-fuse panel, the wet room without waterproofing, the cast-iron floor drain, the old copper pipes, the false plinth, the missing subsoil drains, the chimney sweep and the natural ventilation.
- The 1992 and 2010 reports name no risk that a catalogue entry covers.

## 2. Missing risks that the customer can act on

Type: **new** means no catalogue entry covers it. **extend** means an entry exists and needs a wider trigger.

| # | Risk | Seen in | Type | Category in `riskassesment.md` | House facts that trigger it |
|---|---|---|---|---|---|
| 1 | Too few smoke alarms, or alarms with batteries only | 1975 | new | Fire (fireplace, chimney, sauna). Rule 5.2.6 | Number of smoke alarms. Alarm power type (battery or mains). Floor area in m2 and number of floors. A basement or a separate floor with no alarm. |
| 2 | No leak tray under the dishwasher or washing machine | 1975, 1992 | new | Appliances and hoses. Rule 5.5.8 | Whether a leak tray is under each appliance. Whether the floor under the appliance has a floor drain. |
| 3 | Old washing machine hoses | 1975 | new | Appliances and hoses. Rule 5.5.6 | Year of the washing machine hoses. Hose type (rubber or pressure hose). Whether the machine has its own shut-off valve. |
| 4 | Worn sealant in the wet room (shower corner, floor drain frame) | 1975, 1992, 2010 | new | Wet-room waterproofing and floor drains | Year of the last wet-room sealant check. Wet-room age. Waterproofing year. Floor drain type. |
| 5 | Cast-iron sewer pipes over 50 years old | 1975 | new | Ageing pipes and equipment. Slow and gradual damage | Sewer pipe material. Year of the sewer pipes. Year of the last pipe renovation. |
| 6 | Oil boiler near the end of its service life | 1975 | new | Heating system. Oil tank | Heating type is oil. Year of the boiler. Year of the last boiler service. |
| 7 | Old radiators with surface rust | 1975 | new | Ageing pipes and equipment | Year of the radiators. Whether the radiators are original. |
| 8 | Ungrounded sockets in bedrooms and living rooms | 1975 | new | Electrical installation | Year of the installation. Panel type. Whether all sockets have an earth conductor. Year of the last electrical inspection. |
| 9 | Roof drain blocked, water pools on the roof | 1975 | new | Roof and structure. Stormwater and drainage | Roof type is flat or low-pitch (below 1:10). Number of roof drains. Date of the last roof drain cleaning. |
| 10 | Poor surface drainage next to the house (flat or sloping-in ground, short downspouts, trees close to the wall) | 1975 | extend `moisture/subsoil_drains.missing` | Stormwater and drainage. Moisture and mould | Ground slope near the walls. Downspout outlet distance from the wall (below 3 m). Foundation type is basement or crawl space. Trees within 6 m. |
| 11 | Blocked wall ventilation gaps (mortar in the brick facade gaps) | 1975 | new | Moisture and mould. Slow and gradual damage | Facade type is brick veneer. Building year before 1990. Whether the gap openings at the bottom of the wall are open. |
| 12 | Windows at the end of their service life, hard seals | 1975, 1992 | new | Roof and structure. Slow and gradual damage | Window type and year. Whether the windows are original. Date of the last seal check. |
| 13 | Garage or extension built without a permit | 1975 | new | Building without a permit. Cover gaps | Whether a part was added after the original permit. Year of the addition. Whether a permit and a final inspection exist. |
| 14 | Hazardous materials before renovation (asbestos, PAH) | 1975 | new | Radon and indoor air | Building year before 1994. A renovation is planned. Whether a hazardous-materials survey exists. |
| 15 | No radon measurement | 1975, 2010 | new | Radon and indoor air | House has a basement or a slab on ground. Municipality. Date of the last radon measurement. For a radon pipe: whether a fan is connected. |
| 16 | Cracked sealant at the balcony door threshold | 1992 | new | Moisture and mould | Home has a balcony or a terrace door. Date of the last sealant check. |
| 17 | Blocked supply-air valve | 1992 | extend `ventilation/mechanical.service_overdue` | Moisture and mould. Slow and gradual damage | Ventilation type is mechanical exhaust. Whether the supply-air valves are open. Date of the last valve cleaning. |
| 18 | Wood cladding and terrace need maintenance | 2010 | new | Roof and structure | Wall material is wood. Year of the last painting. Whether the home has a wood terrace. Year of the last terrace treatment. |
| 19 | No fire protection for the oil tank room | 1975 | extend `heating/oil_tank.age` | Fire. Flammable liquids and gas | Heating type is oil. Whether the tank room has a fire door. Whether the tank has a protection basin. |
| 20 | Exhaust valve without airflow in a natural ventilation house | 1975 | extend `ventilation/natural.old_house` | Moisture and mould | Ventilation type is natural. Whether all exhaust valves have airflow. Whether supply-air valves exist. |

## 3. Missing risks that the customer cannot act on alone

These risks belong to the housing company. The customer can only ask and read. I list them for the app to show as information. They give no care score.

| # | Risk | Seen in | Category in `riskassesment.md` | House facts that trigger it |
|---|---|---|---|---|
| 21 | Housing company renovation costs (facade, balcony, windows) | 1992 | Insurance cover gaps. Balcony and facade | Home is a flat or row house. The housing company plan lists a repair within 10 years (kunnossapitotarveselvitys). Year of the planned repair. |
| 22 | Shared ground heat pump near the end of its service life | 2010 | Heating system | Heating type is ground heat or a shared system. Pump installation year (16 years or more). Housing company owns the system. |

## 4. New facts the app does not collect yet

The current home profile has 20 fields. The risks above need these extra facts. I ordered them by how many risks use them.

| New fact | Used by risk # | Hard to get from a customer? |
|---|---|---|
| Date of the last wet-room sealant check | 4, 16 | Easy. A date or "never". |
| Number and type of smoke alarms | 1 | Easy. Count and mains or battery. |
| Leak tray under each appliance | 2 | Easy. Yes or no. |
| Washing machine hose year | 3 | Medium. Customer often does not know. |
| Sewer pipe material and year | 5 | Medium. Inspection report gives it. |
| Boiler year and last service date | 6 | Easy for oil boiler owners. |
| Radiator year | 7 | Medium. Inspection report gives it. |
| All sockets earthed (yes or no) | 8 | Hard. An electrician must check. |
| Roof drain count and last cleaning date | 9 | Easy. |
| Ground slope and downspout distance | 10 | Hard. The customer needs a photo or a partner check. |
| Facade type and gap openings | 11 | Medium. Inspection report gives it. |
| Window type, year and last seal check | 12 | Easy for year. Seal check is a partner job. |
| Permit and addition history | 13 | Medium. Building permit register gives it. |
| Hazardous-materials survey (yes or no) | 14 | Easy. |
| Date of the last radon measurement. Radon fan connected (yes or no) | 15 | Easy. |
| Wood wall material and last paint year | 18 | Easy. |
| Oil tank room has a fire door | 19 | Medium. |
| Supply-air valve state | 17, 20 | Medium. A ventilation technician checks. |
| Housing company repair plan | 21 | Medium. The housing company certificate (isännöitsijäntodistus) gives it. |
| Heat pump year | 22 | Medium. The housing company gives it. |

Most facts come from an inspection report (kuntotarkastus). The app reads the report. A customer can also type them. Facts that need a partner check are better as a "checkup" mitigation than as a customer question.

## 5. Which risks to add first for the demo

The demo house is the 1975 detached house (`docs/demohouse.md`). These risks give the best story for it. I ordered them by value for the demo:

1. **#1 Too few smoke alarms.** Easy to understand. A very cheap fix. It reduces the worst outcome (a fatal fire).
2. **#8 Ungrounded sockets.** Links to the electrician story already in the demo.
3. **#2 and #3 Leak tray and hoses.** A cheap plumber job. Water damage is the most common home claim.
4. **#4 Worn wet-room sealant.** Appears in all three reports.
5. **#13 Building without a permit.** A new kind of risk. It shows that the app reads documents, not only facts.

The other risks are real but add little to the demo. Antton can add them after the demo.

## 6. Facts, assumptions and unknowns

### Facts
- The 3 sample reports are synthetic. They are fictional documents, written for testing.
- The catalogue has 20 entries in 6 categories.
- Risks 1 to 22 are named by an inspector in at least one sample report.

### Assumptions
- A real Finnish inspection report names the same kinds of risks as the synthetic reports.
- A risk that three reports name (risk #4) is common in Finland. Three synthetic reports are a weak sample.
- The category names in `docs/riskassesment.md` are the right place to link each risk.

### Unknowns
- The severity and probability of each new risk. Task 3 sets these.
- Which partner type fixes each risk. Task 5 maps these.
- Which new facts Antton can add before the demo.
- Whether the "extend" items should become new catalogue entries or only wider triggers.
