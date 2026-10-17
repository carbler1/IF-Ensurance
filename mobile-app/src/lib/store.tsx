import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { INSURANCE_START, MAX_SCORE, insurances, risks, scoreHistory, tiers, type InsuranceId } from "@/data/mock";

export { getBand, nextBand } from "@/data/mock";
import { dictionaries, type Lang, type TKey } from "@/lib/i18n";

export type JobStep = 0 | 1 | 2;
export type Job = { riskId: string; bidId: string; mode: "hire" | "diy"; step: JobStep };

type Store = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: TKey) => string;
  onboarded: boolean;
  finishOnboarding: () => void;
  jobs: Record<string, Job>;
  bookJob: (j: Omit<Job, "step">) => void;
  advanceJob: (riskId: string) => void;
  completed: string[];
  /** Each insurance's own score: start + history + points of its confirmed fixes, 0–MAX_SCORE. */
  scores: Record<InsuranceId, number>;
  /** The Care Score: the average of the insurance scores. It sets the tier. */
  aggregate: number;
  reminders: string[];
  toggleReminder: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [onboarded, setOnboarded] = useState(false);
  const [jobs, setJobs] = useState<Record<string, Job>>({});
  const [reminders, setReminders] = useState<string[]>(["t1"]);

  const value = useMemo<Store>(() => {
    const completed = Object.values(jobs).filter((j) => j.step === 2).map((j) => j.riskId);
    const scores = scoresFor(completed);
    return {
      lang,
      setLang,
      t: (k) => dictionaries[lang][k],
      onboarded,
      finishOnboarding: () => setOnboarded(true),
      jobs,
      bookJob: (j) => setJobs((p) => ({ ...p, [j.riskId]: { ...j, step: 0 } })),
      advanceJob: (id) =>
        setJobs((p) => (p[id] ? { ...p, [id]: { ...p[id], step: Math.min(2, p[id].step + 1) as JobStep } } : p)),
      completed,
      scores,
      aggregate: aggregateOf(scores),
      reminders,
      toggleReminder: (id) => setReminders((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])),
    };
  }, [lang, onboarded, jobs, reminders]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("StoreProvider missing");
  return c;
}

export function getTier(score: number) {
  let idx = 0;
  tiers.forEach((t, i) => {
    if (score >= t.min) idx = i;
  });
  return { tier: tiers[idx]!, next: tiers[idx + 1], index: idx };
}

const clamp = (n: number) => Math.max(0, Math.min(MAX_SCORE, n));

export function scoresFor(completed: string[]): Record<InsuranceId, number> {
  const sum = (xs: { points: number }[]) => xs.reduce((a, x) => a + x.points, 0);
  return Object.fromEntries(
    insurances.map(({ id }) => [
      id,
      clamp(INSURANCE_START + sum(scoreHistory.filter((h) => h.insurance === id)) + sum(risks.filter((r) => r.insurance === id && completed.includes(r.id)))),
    ]),
  ) as Record<InsuranceId, number>;
}

export const aggregateOf = (scores: Record<InsuranceId, number>) =>
  Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / insurances.length);
