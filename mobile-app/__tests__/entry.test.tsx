import { fireEvent } from "@testing-library/react-native";
import { renderRouter, screen } from "expo-router/testing-library";
import { memStorage } from "../test-support/fakeApi";

jest.mock("expo-font", () => ({ ...jest.requireActual("expo-font"), useFonts: () => [true, null] }));

describe("Entry screen", () => {
  it("shows when nothing is chosen, and a tap opens the dashboard", async () => {
    memStorage.clear();
    await renderRouter("./src/app", { initialUrl: "/" });

    expect(await screen.findByText("Who do you want to insure?")).toBeOnTheScreen();
    expect(screen.queryByText("Good evening, Aino")).not.toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText("Cat"));

    expect(await screen.findByText("Good evening, Aino")).toBeOnTheScreen();
    expect(memStorage.get("ilp.choice")).toBe("cat");
  });
});
