import { Slot, router } from "expo-router";
import { act, fireEvent, renderRouter, screen } from "expo-router/testing-library";
import JobStatus from "@/app/job/[id]";
import RiskDetail from "@/app/risks/[id]";
import { StoreProvider } from "@/lib/store";

const press = (text: string) => fireEvent.press(screen.getByText(text));

// The job page is reached through the confirmed card, so the real flow is walked:
// hire a partner -> book -> follow the job -> simulate the two remaining steps.
describe("handled risk page", () => {
  it("keeps only the handled note once the partner has confirmed the work", async () => {
    await renderRouter(
      {
        _layout: () => <StoreProvider><Slot /></StoreProvider>,
        "risks/[id]": RiskDetail,
        "job/[id]": JobStatus,
      },
      { initialUrl: "/risks/pipes" },
    );

    // Open risk: explainer, score preview and booking are all on offer.
    expect(await screen.findByText("What's the risk")).toBeOnTheScreen();
    expect(screen.getByRole("image")).toBeOnTheScreen();
    expect(screen.getByText("The fix")).toBeOnTheScreen();

    await press("Hire a vetted If partner");
    await press("Aura Talotekniikka");
    await press("Book");

    expect(await screen.findByText("Booking confirmed")).toBeOnTheScreen();

    await press("Follow the job");
    expect(await screen.findByText("Booked")).toBeOnTheScreen();

    await press("Simulate next step");
    await press("Simulate next step");
    expect(await screen.findByText("Your Care Score went up")).toBeOnTheScreen();

    await act(() => router.navigate({ pathname: "/risks/[id]", params: { id: "pipes" } }));

    expect(await screen.findByText("This risk is handled")).toBeOnTheScreen();
    // Nothing else survives: no score preview circle, no explainer, no re-booking.
    expect(screen.queryByRole("image")).not.toBeOnTheScreen();
    expect(screen.queryByText("What's the risk")).not.toBeOnTheScreen();
    expect(screen.queryByText("The fix")).not.toBeOnTheScreen();
    expect(screen.queryByText("Booking confirmed")).not.toBeOnTheScreen();
    expect(screen.queryByText("Hire a vetted If partner")).not.toBeOnTheScreen();
    expect(screen.queryByText("Book")).not.toBeOnTheScreen();
  });
});
