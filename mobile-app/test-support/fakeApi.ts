// A stand-in for src/lib/api.ts in the Jest tests. It serves a recorded GET /v1/me/app response
// (app.json, from the real backend) and applies bookings and reminders the way the backend does:
// a booking confirmed at step 2 adds its points to its insurance's score, and the Care Score is the
// average. Refresh app.json when the demo person changes.
import type { AppData } from "@/lib/types";
import recorded from "./app.json";

let state: AppData = structuredClone(recorded as AppData);

// The entry choice and the token are preset so tests open on the dashboard; the entry and login tests clear them.
export const memStorage = new Map<string, string>();
export const storage = {
  get: (k: string) => Promise.resolve(memStorage.get(k) ?? null),
  set: (k: string, v: string) => { memStorage.set(k, v); return Promise.resolve(); },
};

export function resetFakeApi() {
  state = structuredClone(recorded as AppData);
  memStorage.clear();
  lang = "en";
  loadLangs.length = 0;
  memStorage.set("ilp.choice", "house");
  memStorage.set("ilp.token", "fake-token");
  passwords.clear();
}

// Fake profiles for the search. `key` is what a person types; the real backend matches its own fields.
const profiles = [
  { customer_id: "cust_house_1", cls: "house", key: "lehtotie 16 13185", label: "Lehtotie 1*, 131** Hämeenlinna", taken: true },
  { customer_id: "cust_house_2", cls: "house", key: "puutarhakatu 6 65057", label: "Puutarhakatu *, 650** Vaasa", taken: false },
  { customer_id: "cust_boat_1", cls: "boat", key: "fin 1234", label: "FIN ****", taken: false },
];
export const FAKE_PASSWORD = "hunter2hunter2";
const passwords = new Map<string, string>();

function rescore() {
  const start = structuredClone(recorded as AppData);
  const bands = state.model.bands;
  state.insurances = state.insurances.map((ins) => {
    const base = start.insurances.find((i) => i.id === ins.id)!.score;
    const done = state.risks.filter((r) => r.insurance === ins.id && r.job?.step === 2).reduce((a, r) => a + r.points, 0);
    const score = Math.min(state.model.maxScore, base + done);
    return { ...ins, score, band: bands.reduce((p, b) => (score >= b.min ? b.percent : p), 0) };
  });
  state.aggregate = Math.round(state.insurances.reduce((a, i) => a + i.score, 0) / state.insurances.length);
}

// The language each load was asked for. The fake answers in English whatever it is.
let lang = "en";
export const loadLangs: string[] = [];

const answer = () => Promise.resolve(structuredClone(state));

export class ApiError extends Error {
  constructor(message: string, readonly status = 0) {
    super(message);
  }
}

// A test of the add action starts from a customer who lacks one insurance.
export const dropInsuranceFromFakeApi = (id: string) => { state.insurances = state.insurances.filter((i) => i.id !== id); };

export const api = {
  restore: () => Promise.resolve((memStorage.get("ilp.token") ?? "") !== ""),
  search: (cls: string, q: string) => {
    const n = q.toLowerCase().replace(/[\s-]/g, "");
    return Promise.resolve(profiles.filter((p) => p.cls === cls && p.key.replace(/\s/g, "").includes(n)).map(({ customer_id, label, taken }) => ({ customer_id, label, taken })));
  },
  // Like POST /v1/claim: the first claim sets the password, later ones verify it.
  claim: (customerId: string, password: string) => {
    const p = profiles.find((x) => x.customer_id === customerId);
    const set = passwords.get(customerId) ?? (p?.taken ? FAKE_PASSWORD : undefined);
    if (set !== undefined && set !== password) return Promise.reject(new ApiError("Wrong password.", 401));
    passwords.set(customerId, password);
    memStorage.set("ilp.token", "fake-token");
    return Promise.resolve();
  },
  getLang: () => Promise.resolve(null as string | null),
  setLang: (l: string) => { lang = l; return Promise.resolve(); },
  load: () => { loadLangs.push(lang); return answer(); },
  book: (riskId: string, bidId: string, mode: "hire" | "diy") => {
    state.risks = state.risks.map((r) => (r.id === riskId ? { ...r, job: { bidId, mode, step: 0 } } : r));
    return answer();
  },
  advance: (riskId: string) => {
    state.risks = state.risks.map((r) => (r.id === riskId && r.job ? { ...r, job: { ...r.job, step: Math.min(2, r.job.step + 1) as 0 | 1 | 2 } } : r));
    rescore();
    return answer();
  },
  // Like POST /v1/me/insurances: a new insurance starts at the model's start score, one per class.
  addInsurance: (classId: string) => {
    if (state.insurances.some((i) => i.id === classId)) return Promise.reject(new ApiError("You already have this insurance.", 409));
    const score = state.model.insuranceStart;
    state.insurances = [...state.insurances, { id: classId as AppData["insurances"][number]["id"], objectId: `fake_${classId}`, object: classId, premium: 100, score, band: state.model.bands.reduce((p, b) => (score >= b.min ? b.percent : p), 0) }];
    state.aggregate = Math.round(state.insurances.reduce((a, i) => a + i.score, 0) / state.insurances.length);
    return answer();
  },
  setReminder: (taskId: string, on: boolean) => {
    state.reminders = on ? [...new Set([...state.reminders, taskId])] : state.reminders.filter((x) => x !== taskId);
    return answer();
  },
};
