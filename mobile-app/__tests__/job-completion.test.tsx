import { Pressable, Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StoreProvider, useStore } from "@/lib/store";

function Probe() {
  const { jobs, completed, scores, aggregate, bookJob, advanceJob } = useStore();
  const job = jobs["pipes"];
  return (
    <>
      <Text testID="step">{job ? job.step : "none"}</Text>
      <Text testID="handled">{completed.includes("pipes") ? "yes" : "no"}</Text>
      <Text testID="score">{scores.house}</Text>
      <Text testID="aggregate">{aggregate}</Text>
      <Pressable accessibilityRole="button" onPress={() => bookJob({ riskId: "pipes", bidId: "b2", mode: "hire" })}><Text>book</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => advanceJob("pipes")}><Text>advance</Text></Pressable>
    </>
  );
}

const text = (id: string) => String(screen.getByTestId(id).props.children);
const read = () => ({ step: text("step"), handled: text("handled"), score: text("score"), aggregate: text("aggregate") });
const click = (name: string) => fireEvent.press(screen.getByRole("button", { name }));

describe("job completion drives the handled risk state", () => {
  it("only marks the pipes risk handled once the partner confirmed the work", async () => {
    await render(
      <StoreProvider>
        <Probe />
      </StoreProvider>,
    );

    expect(read()).toEqual({ step: "none", handled: "no", score: "555", aggregate: "599" });

    await click("book");
    expect(read()).toEqual({ step: "0", handled: "no", score: "555", aggregate: "599" });

    await click("advance");
    expect(read()).toEqual({ step: "1", handled: "no", score: "555", aggregate: "599" });

    await click("advance");
    expect(read()).toEqual({ step: "2", handled: "yes", score: "595", aggregate: "607" });
  });
});
