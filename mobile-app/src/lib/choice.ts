import { useCallback, useEffect, useState } from "react";
import { router } from "expo-router";
import { storage } from "./api";

export const choices = ["house", "cottage", "boat", "car", "dog"] as const;
export type Choice = (typeof choices)[number];

// The entry choice, saved under "ilp.choice". undefined: still reading; null: nothing chosen yet. Not sent to the backend.
export function useChoice() {
  const [choice, setChoice] = useState<Choice | null | undefined>(undefined);
  useEffect(() => {
    storage.get("ilp.choice").then((c) => setChoice(choices.find((x) => x === c) ?? null));
  }, []);
  const choose = useCallback((c: Choice | null) => {
    setChoice(c);
    storage.set("ilp.choice", c ?? ""); // an empty value means no choice
    router.replace("/");
  }, []);
  return [choice, choose] as const;
}
