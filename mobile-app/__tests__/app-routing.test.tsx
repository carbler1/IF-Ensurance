import { act, fireEvent, renderRouter, screen } from "expo-router/testing-library";

// Font files do not load under Jest; treat them as ready so the app renders.
jest.mock("expo-font", () => ({ ...jest.requireActual("expo-font"), useFonts: () => [true, null] }));

const press = (text: string) => fireEvent.press(screen.getByText(text));

describe("App routing", () => {
  it("walks onboarding and lands on the home page instead of not found", async () => {
    jest.useFakeTimers();
    await renderRouter("./src/app", { initialUrl: "/" });

    expect(await screen.findByText("Let's look after your home together")).toBeOnTheScreen();
    await press("Find my home");
    await press("Looks right");
    for (let i = 0; i < 4; i++) await press("Yes");
    await press("Skip for now");
    expect(screen.getByText("Analysing your home…")).toBeOnTheScreen();
    await act(() => jest.advanceTimersByTime(2400));

    expect(screen).toHavePathname("/");
    expect(await screen.findByText("Good evening, Aino")).toBeOnTheScreen();
    expect(screen.queryByText("Page not found")).not.toBeOnTheScreen();
    jest.useRealTimers();
  });
});
