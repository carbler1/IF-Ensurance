// A stand-in for src/lib/api.ts in the Jest tests. It serves a recorded GET /v1/me/app response
// (app.json, from the real backend) and applies bookings and reminders the way the backend does:
// a booking confirmed at step 2 adds its points to its insurance's score, and the Care Score is the
// average. Refresh app.json when the demo person changes.
import type { AppData } from "@/lib/types";
import recorded from "./app.json";

let state: AppData = structuredClone(recorded as AppData);

// A visitor with a stored token skips onboarding; a test of onboarding calls signOutFakeApi().
let signedIn = true;

export const signOutFakeApi = () => { signedIn = false; };

export function resetFakeApi() {
  signedIn = true;
  state = structuredClone(recorded as AppData);
}

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

const answer = () => Promise.resolve(structuredClone(state));

export class ApiError extends Error {}

export const api = {
  restore: () => Promise.resolve(signedIn),
  getLang: () => Promise.resolve(null as string | null),
  setLang: (_l: string) => Promise.resolve(),
  homes: () => Promise.resolve([
    { home_id: "home_02", address: "Lehtotie 16, 13185 Hämeenlinna", city: "Hämeenlinna", taken: false },
    { home_id: "home_03", address: "Puutarhakatu 6, 65057 Vaasa", city: "Vaasa", taken: true },
  ]),
  claim: (_homeId: string, password: string) => {
    if (password.length < 8) return Promise.reject(new ApiError("The request is not valid."));
    signedIn = true;
    return Promise.resolve();
  },
  load: answer,
  book: (riskId: string, bidId: string, mode: "hire" | "diy") => {
    state.risks = state.risks.map((r) => (r.id === riskId ? { ...r, job: { bidId, mode, step: 0 } } : r));
    return answer();
  },
  advance: (riskId: string) => {
    state.risks = state.risks.map((r) => (r.id === riskId && r.job ? { ...r, job: { ...r.job, step: Math.min(2, r.job.step + 1) as 0 | 1 | 2 } } : r));
    rescore();
    return answer();
  },
  setReminder: (taskId: string, on: boolean) => {
    state.reminders = on ? [...new Set([...state.reminders, taskId])] : state.reminders.filter((x) => x !== taskId);
    return answer();
  },
};
