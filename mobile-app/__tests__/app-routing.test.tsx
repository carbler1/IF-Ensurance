import { renderRouter, screen } from "expo-router/testing-library";

// Font files do not load under Jest; treat them as ready so the app renders.
jest.mock("expo-font", () => ({ ...jest.requireActual("expo-font"), useFonts: () => [true, null] }));

describe("App routing", () => {
  it("opens straight on the home page, with no sign-in", async () => {
    await renderRouter("./src/app", { initialUrl: "/" });

    expect(await screen.findByText("Good evening, Aino")).toBeOnTheScreen();
    expect(screen).toHavePathname("/");
    expect(screen.queryByText("Page not found")).not.toBeOnTheScreen();
  });
});
