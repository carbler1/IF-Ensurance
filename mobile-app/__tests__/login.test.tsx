import { fireEvent } from "@testing-library/react-native";
import { renderRouter, screen } from "expo-router/testing-library";
import { api } from "@/lib/api";
import { ApiError, FAKE_PASSWORD, memStorage } from "../test-support/fakeApi";

jest.mock("expo-font", () => ({ ...jest.requireActual("expo-font"), useFonts: () => [true, null] }));

const HINT = "Street address or postal code";
const TAKEN = "Lehtotie 1*, 131** Hämeenlinna";

async function toPassword(label: string, typed: string) {
  fireEvent.changeText(await screen.findByLabelText(HINT), typed);
  fireEvent.press(await screen.findByText(label));
}

describe("Login", () => {
  beforeEach(() => { memStorage.delete("ilp.token"); });

  it("entry icon, search key, hit, password, dashboard", async () => {
    memStorage.delete("ilp.choice");
    await renderRouter("./src/app", { initialUrl: "/" });
    fireEvent.press(await screen.findByLabelText("House"));
    fireEvent.changeText(await screen.findByLabelText(HINT), "Leh");
    fireEvent.changeText(screen.getByLabelText(HINT), "Lehtotie");
    fireEvent.press(await screen.findByText(TAKEN));
    fireEvent.changeText(screen.getByLabelText("Enter your password"), FAKE_PASSWORD);
    fireEvent.press(screen.getByText("Continue"));
    expect(await screen.findByText("Good evening, Aino")).toBeOnTheScreen();
    expect(memStorage.get("ilp.token")).toBeTruthy();
  });

  it("a free profile asks to choose a password", async () => {
    await renderRouter("./src/app", { initialUrl: "/" });
    await toPassword("Puutarhakatu *, 650** Vaasa", "Puutarha");
    expect(screen.getByLabelText("Choose a password")).toBeOnTheScreen();
  });

  it("a wrong password shows an error", async () => {
    await renderRouter("./src/app", { initialUrl: "/" });
    await toPassword(TAKEN, "Lehtotie");
    fireEvent.changeText(screen.getByLabelText("Enter your password"), "nope");
    fireEvent.press(screen.getByText("Continue"));
    expect(await screen.findByText("The password is wrong.")).toBeOnTheScreen();
    expect(screen.queryByText("Good evening, Aino")).not.toBeOnTheScreen();
  });

  it("no hits shows a message", async () => {
    await renderRouter("./src/app", { initialUrl: "/" });
    fireEvent.changeText(await screen.findByLabelText(HINT), "Zzzzzz");
    expect(await screen.findByText("Nothing found. Check what you typed.")).toBeOnTheScreen();
  });

  it("a 401 on a call returns to the login", async () => {
    memStorage.set("ilp.token", "stale");
    jest.spyOn(api, "load").mockRejectedValueOnce(new ApiError("Unauthorized", 401));
    await renderRouter("./src/app", { initialUrl: "/" });
    expect(await screen.findByLabelText(HINT)).toBeOnTheScreen();
  });
});
