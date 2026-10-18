import { renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { StoreProvider, useStore } from "@/lib/store";

const withChoice = (choice: string) => ({ children }: { children: ReactNode }) => <StoreProvider choice={choice}>{children}</StoreProvider>;

describe("store filtered by the entry choice", () => {
  it.each(["dog", "house"])("keeps only %s items and its score as the aggregate", async (id) => {
    const { result } = renderHook(() => useStore(), { wrapper: withChoice(id) });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    const s = result.current;
    expect(s.insurances.map((i) => i.id)).toEqual([id]);
    expect(s.allInsurances.length).toBeGreaterThan(1);
    expect(s.risks.length).toBeGreaterThan(0);
    expect(s.risks.every((r) => r.insurance === id)).toBe(true);
    expect(s.history.every((h) => h.insurance === id)).toBe(true);
    expect(Object.keys(s.scores)).toEqual([id]);
    expect(s.aggregate).toBe(s.insurances[0].score);
  });
});
