import { act, render } from "@testing-library/react-native";
import { RiskScorePreview } from "@/components/RiskScorePreview";

const captured = { score: 0, projectedScore: 0, thresholdScore: 0 };
jest.mock("@/components/ui", () => ({
  ...jest.requireActual("@/components/ui"),
  useReducedMotion: () => false,
  ScoreRing: (props: typeof captured) => {
    Object.assign(captured, props);
    return null;
  },
}));
jest.mock("@/lib/store", () => {
  const bands = [{ min: 500, percent: 5 }, { min: 700, percent: 10 }, { min: 900, percent: 15 }];
  const getBand = (score: number) => bands.reduce((p, b) => (score >= b.min ? b.percent : p), 0);
  return { useStore: () => ({ t: (key: string) => key, bands, getBand }) };
});

describe("Risk score preview thresholds", () => {
  it("keeps threshold visibility tied to the actual score when animation crosses 700", async () => {
    // Animated also asks for frames, so keep every pending callback and run them together.
    let pending: FrameRequestCallback[] = [];
    const frame = (now: number) => {
      const due = pending;
      pending = [];
      due.forEach((cb) => cb(now));
    };
    jest.spyOn(globalThis, "requestAnimationFrame").mockImplementation((next: FrameRequestCallback) => {
      pending.push(next);
      return 1;
    });
    jest.spyOn(globalThis, "cancelAnimationFrame").mockImplementation(() => {});
    await render(<RiskScorePreview score={680} addedPoints={40} label="House score" />);
    await act(() => frame(0));
    await act(() => frame(1850));
    expect(captured.projectedScore).toBe(720);
    expect(captured.score).toBe(680);
    expect(captured.thresholdScore).toBe(680);
    expect(captured.thresholdScore).toBeLessThan(700);
  });
});
