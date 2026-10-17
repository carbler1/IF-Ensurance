export type RiskArea =
  | "electricity"
  | "plumbing"
  | "water"
  | "roof"
  | "insulation";

export const home = {
  address: "Puutarhakatu 12, 20100 Turku",
  type: "Detached house",
  year: 1975,
  size: 132,
  heating: "Oil → heat pump (2015)",
};

export const BASE_SCORE = 640;
export const MAX_SCORE = 1000;

export const tiers = [
  {
    id: "bronze",
    name: "Bronze",
    min: 0,
    rewards: ["Seasonal reminders", "5% partner discount"],
  },
  {
    id: "silver",
    name: "Silver",
    min: 500,
    rewards: [
      "5% lower premium",
      "10% partner discount",
      "1 free checkup / year",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    min: 700,
    rewards: [
      "10% lower premium",
      "Deductible (omavastuu) −100 €",
      "15% partner discount",
    ],
  },
  {
    id: "platinum",
    name: "Platinum",
    min: 850,
    rewards: [
      "15% lower premium",
      "Deductible (omavastuu) −200 €",
      "20% partner discount",
      "Free yearly home check",
    ],
  },
] as const;

export const partnerDiscountByTier: Record<
  "bronze" | "silver" | "gold" | "platinum",
  number
> = { bronze: 5, silver: 10, gold: 15, platinum: 20 };

export type Risk = {
  id: string;
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
    area: "insulation",
    title: "Thin attic insulation",
    why: "Heat loss can cause ice dams on the roof.",
    points: 20,
    explain: "Insulation from 1978 is usually thinner than today's standard.",
    fix: "A partner measures and adds blown insulation.",
    diy: "Measure the insulation depth in the attic, then book a check.",
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

export const scoreHistory = [
  { label: "Heat pump installed (2015)", points: 60 },
  { label: "Smoke alarms registered", points: 20 },
  { label: "Roof check aged", points: -10 },
  { label: "Missed gutter cleaning", points: -15 },
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
