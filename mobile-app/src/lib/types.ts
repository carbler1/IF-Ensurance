// The shape of GET /v1/me/app (backend/app_api.py).
import type { InsuranceId, RiskArea, TierId } from "@/data/mock";

export type JobStep = 0 | 1 | 2;
export type Job = { riskId: string; bidId: string; mode: "hire" | "diy"; step: JobStep };

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
  job: { bidId: string; mode: "hire" | "diy"; step: JobStep } | null;
};

export type Bid = { id: string; name: string; rating: number; reviews: number; price: number; date: string };

export type Task = {
  id: string;
  season: "autumn" | "winter" | "spring" | "summer";
  title: string;
  due: string;
  reason: "age" | "partner" | "weather" | "law";
  reasonText: string;
};

export type Tier = { id: TierId; name: string; min: number; partnerDiscount: number; rewards: string[] };
export type Band = { min: number; percent: number };

export type Insurance = { id: InsuranceId; objectId: string; object: string; premium: number; score: number; band: number };

export type AppData = {
  customer: { id: string; name: string };
  home: { address: string; type: string; year: number; size: number; heating: string };
  model: { insuranceStart: number; maxScore: number; bands: Band[]; inspectionPriceFactor: number };
  tiers: Tier[];
  insurances: Insurance[];
  aggregate: number;
  risks: Risk[];
  history: { insurance: InsuranceId; label: string; points: number }[];
  bids: Bid[];
  tasks: Task[];
  reminders: string[];
};
