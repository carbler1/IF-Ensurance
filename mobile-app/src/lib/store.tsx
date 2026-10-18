import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { InsuranceId } from "@/data/mock";
import { dictionaries, type Lang, type TKey } from "@/lib/i18n";
import { api } from "./api";
import type { AppData, Band, Job, JobStep, Tier } from "./types";

export type { Job, JobStep } from "./types";

// The customer's data lives in the backend; the store loads it once and saves every change there.
// The bearer token is saved by api.ts; with a token the app skips onboarding. Language is saved under "ilp.lang".

type Status = "loading" | "ready" | "error";

type Store = Omit<AppData, "insurances"> & {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: TKey) => string;
  status: Status;
  error: string | null;
  reload: () => void;
  onboarded: boolean;
  finishOnboarding: () => void;
  /** Claims a home (or signs in to it) and loads its data, without leaving onboarding. */
  claimHome: (homeId: string, password: string) => Promise<void>;
  insurances: AppData["insurances"];
  jobs: Record<string, Job>;
  bookJob: (j: Omit<Job, "step">) => void;
  advanceJob: (riskId: string) => Promise<void>;
  completed: string[];
  /** Each insurance's own score, from the backend. */
  scores: Record<InsuranceId, number>;
  /** The Care Score: the average of the insurance scores. It sets the tier. */
  aggregate: number;
  bands: Band[];
  toggleReminder: (id: string) => void;
  addInsurance: (classId: InsuranceId) => Promise<void>;
  getTier: (score: number) => { tier: Tier; next: Tier | undefined; index: number };
  getBand: (score: number) => number;
  nextBand: (score: number) => { percent: number; min: number; pointsTo: number } | undefined;
};

const EMPTY: AppData = {
  customer: { id: "", name: "" },
  home: { address: "", type: "", year: 0, size: 0, heating: "" },
  model: { insuranceStart: 500, maxScore: 1000, bands: [], inspectionPriceFactor: 1 },
  tiers: [],
  insurances: [],
  aggregate: 0,
  risks: [],
  history: [],
  bids: [],
  tasks: [],
  reminders: [],
};

const FALLBACK_TIER: Tier = { id: "bronze", name: "", min: 0, partnerDiscount: 0, rewards: [] };

/** Percent off an insurance's own premium at this score; 0 below the lowest band. */
export function bandFor(score: number, bands: Band[]): number {
  return bands.reduce((pct, b) => (score >= b.min ? b.percent : pct), 0);
}

export function tierFor(score: number, tiers: Tier[]) {
  let idx = 0;
  tiers.forEach((t, i) => {
    if (score >= t.min) idx = i;
  });
  return { tier: tiers[idx] ?? FALLBACK_TIER, next: tiers[idx + 1], index: idx };
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const setLang = useCallback((l: Lang) => { setLangState(l); api.setLang(l); }, []);
  const [onboarded, setOnboarded] = useState(false);
  const [data, setData] = useState<AppData>(EMPTY);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setStatus("loading");
    api.load().then(
      (d) => { setData(d); setStatus("ready"); setError(null); },
      (e: Error & { status?: number }) => {
        if (e.status === 401) { setOnboarded(false); setStatus("ready"); return; } // the token is gone: choose a home again
        setError(e.message);
        setStatus("error");
      },
    );
  }, []);
  useEffect(() => {
    Promise.all([api.restore(), api.getLang()]).then(([has, l]) => {
      if (l === "en" || l === "fi" || l === "sv") setLangState(l);
      if (!has) return setStatus("ready");
      setOnboarded(true);
      reload();
    });
  }, [reload]);
  const claimHome = useCallback(async (homeId: string, password: string) => {
    await api.claim(homeId, password);
    setData(await api.load());
  }, []);

  // Show the change at once, then take the backend's answer (it recomputes the scores).
  // Only the latest request's reply is applied. A failed save refetches quietly, so the screen stays put.
  const seq = useRef(0);
  const save = useCallback((optimistic: (d: AppData) => AppData, request: () => Promise<AppData>) => {
    const mine = ++seq.current;
    const apply = (d: AppData) => { if (mine === seq.current) setData(d); };
    setData(optimistic);
    return request().then(apply, () => api.load().then(apply, () => {}));
  }, []);

  const value = useMemo<Store>(() => {
    const jobs: Record<string, Job> = Object.fromEntries(
      data.risks.filter((r) => r.job).map((r) => [r.id, { riskId: r.id, ...r.job! }]),
    );
    const scores = Object.fromEntries(data.insurances.map((i) => [i.id, i.score])) as Record<InsuranceId, number>;
    const bands = data.model.bands;
    const setJob = (riskId: string, job: (j: AppData["risks"][number]["job"]) => AppData["risks"][number]["job"]) =>
      (d: AppData) => ({ ...d, risks: d.risks.map((r) => (r.id === riskId ? { ...r, job: job(r.job) } : r)) });
    return {
      ...data,
      lang,
      setLang,
      t: (k) => dictionaries[lang][k],
      status,
      error,
      reload,
      onboarded,
      finishOnboarding: () => setOnboarded(true),
      claimHome,
      jobs,
      bookJob: (j) => save(setJob(j.riskId, () => ({ bidId: j.bidId, mode: j.mode, step: 0 })), () => api.book(j.riskId, j.bidId, j.mode)),
      advanceJob: (id) =>
        save(setJob(id, (job) => job && { ...job, step: Math.min(2, job.step + 1) as JobStep }), () => api.advance(id)),
      completed: data.risks.filter((r) => r.job?.step === 2).map((r) => r.id),
      scores,
      aggregate: data.aggregate,
      bands,
      addInsurance: (classId) => api.addInsurance(classId).then(setData),
      toggleReminder: (id) => {
        const on = !data.reminders.includes(id);
        save((d) => ({ ...d, reminders: on ? [...d.reminders, id] : d.reminders.filter((x) => x !== id) }), () => api.setReminder(id, on));
      },
      getTier: (score) => tierFor(score, data.tiers),
      getBand: (score) => bandFor(score, bands),
      nextBand: (score) => {
        const b = bands.find((x) => x.min > score);
        return b && { percent: b.percent, min: b.min, pointsTo: b.min - score };
      },
    };
  }, [lang, setLang, onboarded, data, status, error, reload, save, claimHome]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("StoreProvider missing");
  return c;
}
