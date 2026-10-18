import { Slot } from "expo-router";
import { fireEvent, renderRouter, screen } from "expo-router/testing-library";
import Profile from "@/app/profile";
import { StoreProvider } from "@/lib/store";
import { dropInsuranceFromFakeApi } from "../test-support/fakeApi";

const renderProfile = () =>
  renderRouter({ _layout: () => <StoreProvider><Slot /></StoreProvider>, profile: Profile }, { initialUrl: "/profile" });

describe("profile insurances", () => {
  it("lists the customer's own insurances and offers no add when they have all", async () => {
    await renderProfile();
    expect(await screen.findByText("My insurances")).toBeOnTheScreen();
    expect(screen.getByText("Boat")).toBeOnTheScreen();
    expect(screen.queryByText(/Add insurance/)).toBeNull();
  });

  it("adds a missing insurance to the list", async () => {
    dropInsuranceFromFakeApi("boat");
    await renderProfile();
    fireEvent.press(await screen.findByText("Add insurance: Boat"));
    expect(await screen.findByText("boat")).toBeOnTheScreen(); // the fake names the new object after its class
    expect(screen.queryByText(/Add insurance/)).toBeNull();
  });
});
