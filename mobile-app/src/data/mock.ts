export type RiskArea =
  | "electricity"
  | "plumbing"
  | "water"
  | "roof"
  | "insulation"
  | "frost"
  | "fire"
  | "engine"
  | "storage"
  | "tyres"
  | "service"
  | "vaccine"
  | "joints";

// Five insurances, each with its own score (0–MAX_SCORE). A new insurance starts at
// INSURANCE_START. The insurance's own score sets its discount (bands). The Care Score is the
// average of the five and sets the tier. Mirrors data/score-model.json in the backend.
export type InsuranceId = "house" | "cottage" | "boat" | "car" | "dog";

export const insurances: { id: InsuranceId; object: string; premium: number }[] = [
  { id: "house", object: "Puutarhakatu 12, Turku", premium: 900 },
  { id: "cottage", object: "Summer cottage, Nauvo", premium: 450 },
  { id: "boat", object: "Buster XL motorboat", premium: 300 },
  { id: "car", object: "Škoda Octavia 2016", premium: 700 },
  { id: "dog", object: "Ruska, Labrador", premium: 350 },
];

export const home = {
  address: "Puutarhakatu 12, 20100 Turku",
  type: "Detached house",
  year: 1975,
  size: 132,
  heating: "Oil → heat pump (2015)",
};

export const INSURANCE_START = 500;
export const MAX_SCORE = 1000;

// From min score up, an insurance gets this percent off its own premium. Below 500: nothing.
export const bands = [
  { min: 500, percent: 5 },
  { min: 700, percent: 10 },
  { min: 900, percent: 15 },
] as const;

/** Percent off an insurance's own premium at this score; 0 below the lowest band. */
export function getBand(score: number): number {
  return bands.reduce((pct, b) => (score >= b.min ? b.percent : pct), 0 as number);
}

/** The next band above this score and the points still missing, or undefined at the top. */
export function nextBand(score: number) {
  const b = bands.find((x) => x.min > score);
  return b && { percent: b.percent, min: b.min, pointsTo: b.min - score };
}

// The Care Score tiers. Their rewards are extra bonuses on top of each insurance's own discount.
export const tiers = [
  { id: "bronze", name: "Bronze", min: 0, rewards: ["Seasonal reminders", "5% partner discount"] },
  { id: "silver", name: "Silver", min: 500, rewards: ["1 free checkup / year", "10% partner discount"] },
  {
    id: "gold",
    name: "Gold",
    min: 700,
    rewards: ["One month off one insurance", "1 free checkup / year", "15% partner discount"],
  },
  {
    id: "platinum",
    name: "Platinum",
    min: 850,
    rewards: ["One month off one insurance", "Free yearly home check", "A weekend trip for two", "20% partner discount"],
  },
] as const;

export const partnerDiscountByTier: Record<
  "bronze" | "silver" | "gold" | "platinum",
  number
> = { bronze: 5, silver: 10, gold: 15, platinum: 20 };

export type Risk = {
  id: string;
  insurance: InsuranceId;
  area: RiskArea;
  title: string;
  why: string;
  points: number;
  explain: string;
  fix: string;
  diy: string;
};

export const risks: Risk[] = [
  {
    id: "panel",
    insurance: "house",
    area: "electricity",
    title: "Electrical panel from 1978",
    why: "Old fuses can overheat and cause fires.",
    points: 45,
    explain:
      "Your panel is original. Panels this old often lack residual-current protection, which is a common cause of house fires.",
    fix: "A certified electrician inspects the panel and adds a residual-current device if needed.",
    diy: "You cannot do electrical work yourself, but you can book an inspection to confirm the panel is safe.",
  },
  {
    id: "pipes",
    insurance: "house",
    area: "plumbing",
    title: "Original water pipes",
    why: "Copper pipes over 40 years old start to leak.",
    points: 40,
    explain:
      "Pipes from the 1970s are near the end of their life. Small leaks inside walls can go unnoticed for months.",
    fix: "A plumber checks the pipes with a camera and pressure test, and replaces weak parts.",
    diy: "Check visible joints under sinks for green stains, then book an inspection.",
  },
  {
    id: "leak",
    insurance: "house",
    area: "water",
    title: "No water leak sensor",
    why: "A dishwasher leak can damage floors overnight.",
    points: 25,
    explain:
      "Water damage is the most common home claim in Finland. A sensor with auto shut-off stops the water in seconds.",
    fix: "A partner installs leak sensors and a shut-off valve.",
    diy: "Place sensors under the dishwasher and sink yourself, then book a quick check.",
  },
  {
    id: "roof",
    insurance: "house",
    area: "roof",
    title: "Roof not checked in 6 years",
    why: "Damaged tiles let in snow melt.",
    points: 30,
    explain:
      "Roofs should be checked every 3–5 years. Winter snow load makes small cracks worse.",
    fix: "A roofer inspects the tiles, flashings and underlay.",
    diy: "Look for loose tiles from the ground with binoculars, then book an inspection.",
  },
  {
    id: "attic",
    insurance: "house",
    area: "insulation",
    title: "Thin attic insulation",
    why: "Heat loss can cause ice dams on the roof.",
    points: 20,
    explain: "Insulation from 1978 is usually thinner than today's standard.",
    fix: "A partner measures and adds blown insulation.",
    diy: "Measure the insulation depth in the attic, then book a check.",
  },
  {
    id: "cottage-pipes",
    insurance: "cottage",
    area: "frost",
    title: "Cottage pipes not drained for winter",
    why: "Frozen pipes burst and flood the floor in spring.",
    points: 60,
    explain: "Water left in the pipes of an empty cottage freezes, bursts the pipes and floods the floor when it thaws.",
    fix: "A plumber drains the pipes and the water heater and closes the main valve before the frost.",
    diy: "Drain the pipes yourself with a checklist, then book a quick check.",
  },
  {
    id: "cottage-chimney",
    insurance: "cottage",
    area: "fire",
    title: "Fireplace chimney not swept",
    why: "Soot in the flue can catch fire.",
    points: 40,
    explain: "Soot builds up in a flue that is not swept every year. The cottage chimney was last swept in 2023.",
    fix: "A chimney sweep cleans the flue and checks the fireplace.",
    diy: "You cannot sweep the flue yourself safely, but you can book the sweep for the start of the season.",
  },
  {
    id: "boat-engine",
    insurance: "boat",
    area: "engine",
    title: "Boat engine not serviced in two years",
    why: "Worn fuel lines can fail at sea.",
    points: 50,
    explain: "An unserviced engine is the most common reason a boat breaks down or catches fire at sea.",
    fix: "A boat mechanic services the engine, the fuel line and the cooling system.",
    diy: "Check the fuel line and the impeller yourself, then book a service check.",
  },
  {
    id: "boat-storage",
    insurance: "boat",
    area: "storage",
    title: "Boat stored outdoors without a cover",
    why: "Snow and ice crack the hull over winter.",
    points: 40,
    explain: "Snow and melt water collect in an uncovered boat; the weight and the frost crack the hull and the deck.",
    fix: "A boat yard stores the boat indoors or fits a winter cover.",
    diy: "Fit a winter cover yourself, then book a quick check.",
  },
  {
    id: "car-tyres",
    insurance: "car",
    area: "tyres",
    title: "Winter tyres over five years old",
    why: "Old rubber grips the ice far worse.",
    points: 50,
    explain: "Your winter tyres are from 2019. Rubber hardens with age and the braking distance on ice grows.",
    fix: "A tyre shop checks the tread and fits new winter tyres if needed.",
    diy: "Measure the tread depth yourself, then book a tyre check.",
  },
  {
    id: "car-service",
    insurance: "car",
    area: "service",
    title: "Car not serviced in the last year",
    why: "Worn brakes go unnoticed without a service.",
    points: 40,
    explain: "The last service was in March 2025. Worn brakes and old fluids go unnoticed without a yearly service.",
    fix: "A garage services the car and checks the brakes.",
    diy: "Check the oil and the lights yourself, then book the service.",
  },
  {
    id: "dog-vaccine",
    insurance: "dog",
    area: "vaccine",
    title: "Ruska's vaccinations are out of date",
    why: "Parvovirus and distemper need long, costly care.",
    points: 40,
    explain: "An unvaccinated dog can catch parvovirus or distemper, which need long and costly care.",
    fix: "A vet renews the vaccinations.",
    diy: "There is no way to do this yourself; book a vet visit.",
  },
  {
    id: "dog-joints",
    insurance: "dog",
    area: "joints",
    title: "Older large dog without a joint check",
    why: "Hip problems get worse without early care.",
    points: 50,
    explain: "Large dogs over six years old often develop hip and elbow problems that get worse without care.",
    fix: "A vet checks the hips and the elbows.",
    diy: "Watch for stiffness after walks, then book a vet check.",
  },
];

export type Bid = {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  price: number;
  date: string;
};

export const bids: Bid[] = [
  {
    id: "b1",
    name: "Turun Sähkö & Huolto",
    rating: 4.9,
    reviews: 212,
    price: 189,
    date: "Tue 20 Oct",
  },
  {
    id: "b2",
    name: "Aura Talotekniikka",
    rating: 4.7,
    reviews: 98,
    price: 165,
    date: "Thu 22 Oct",
  },
  {
    id: "b3",
    name: "Saaristo Asennus Oy",
    rating: 4.8,
    reviews: 154,
    price: 210,
    date: "Mon 19 Oct",
  },
];

export const inspectionPriceFactor = 0.45;

// What changed each insurance's score since it was insured (from INSURANCE_START).
export const scoreHistory: { insurance: InsuranceId; label: string; points: number }[] = [
  { insurance: "house", label: "Heat pump installed (2015)", points: 60 },
  { insurance: "house", label: "Smoke alarms registered", points: 20 },
  { insurance: "house", label: "Roof check aged", points: -10 },
  { insurance: "house", label: "Missed gutter cleaning", points: -15 },
  { insurance: "cottage", label: "Fire extinguisher registered", points: 20 },
  { insurance: "boat", label: "Engine service missed in 2024", points: -30 },
  { insurance: "car", label: "Clean driving record, 3 years", points: 150 },
  { insurance: "car", label: "Driver safety course", points: 40 },
  { insurance: "dog", label: "Insured since a puppy", points: 200 },
  { insurance: "dog", label: "Microchip registered", points: 60 },
];

export type Task = {
  id: string;
  season: "autumn" | "winter" | "spring" | "summer";
  title: string;
  due: string;
  reason: "age" | "partner" | "weather" | "law";
  reasonText: string;
};

export const tasks: Task[] = [
  {
    id: "t1",
    season: "autumn",
    title: "Shut off outdoor tap",
    due: "23 Oct",
    reason: "weather",
    reasonText: "Frost forecast in Turku",
  },
  {
    id: "t2",
    season: "autumn",
    title: "Clean gutters",
    due: "31 Oct",
    reason: "age",
    reasonText: "Last cleaned 14 months ago",
  },
  {
    id: "t3",
    season: "winter",
    title: "Change heat pump filter",
    due: "15 Dec",
    reason: "age",
    reasonText: "Filter is 11 months old",
  },
  {
    id: "t4",
    season: "winter",
    title: "Check roof snow load",
    due: "Jan",
    reason: "weather",
    reasonText: "Heavy snow is common in January",
  },
  {
    id: "t5",
    season: "spring",
    title: "Inspect drainage well",
    due: "Apr",
    reason: "partner",
    reasonText: "Recommended in partner report",
  },
  {
    id: "t6",
    season: "summer",
    title: "Test smoke alarms",
    due: "Jun",
    reason: "law",
    reasonText: "Required by the Rescue Act",
  },
];

export const questions = [
  { id: "q1", options: ["yes", "no", "unsure"] },
  { id: "q2", options: ["yes", "no", "unsure"] },
  { id: "q3", options: ["yes", "no", "unsure"] },
  { id: "q4", options: ["yes", "no", "unsure"] },
] as const;
