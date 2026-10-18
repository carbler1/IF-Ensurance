import { areaIcon } from "@/components/ui";

// The backend sends any area from backend/presets.py; an area without an icon crashes the risk pages.
it("has an icon for every risk area the backend sends", () => {
  for (const area of ["electricity", "plumbing", "water", "roof", "insulation", "frost", "fire", "engine", "storage", "tyres", "service", "vaccine", "joints", "ventilation"])
    expect((areaIcon as Record<string, unknown>)[area]).toBeDefined();
});
