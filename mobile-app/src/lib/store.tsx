import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { BASE_SCORE, risks, tiers } from "@/data/mock";
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
  score: number;
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
    const score = BASE_SCORE + risks.filter((r) => completed.includes(r.id)).reduce((s, r) => s + r.points, 0);
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
      score,
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
