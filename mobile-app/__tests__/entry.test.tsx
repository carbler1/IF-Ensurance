import { fireEvent } from "@testing-library/react-native";
import { renderRouter, screen } from "expo-router/testing-library";
import { memStorage } from "../test-support/fakeApi";

jest.mock("expo-font", () => ({ ...jest.requireActual("expo-font"), useFonts: () => [true, null] }));

describe("Entry screen", () => {
  it("shows the five icons when nothing is chosen, and a tap opens the login", async () => {
    memStorage.clear();
    await renderRouter("./src/app", { initialUrl: "/" });

    expect(await screen.findByText("Who do you want to insure?")).toBeOnTheScreen();
    expect(screen.queryByText("Good evening, Aino")).not.toBeOnTheScreen();
    for (const l of ["House", "Summer cottage", "Boat", "Car", "Dog"]) expect(screen.getByLabelText(l)).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText("Boat"));

    expect(await screen.findByLabelText("Boat registration number")).toBeOnTheScreen();
    expect(memStorage.get("ilp.choice")).toBe("boat");
  });
});
