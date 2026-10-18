import { Slot } from "expo-router";
import { renderRouter, screen } from "expo-router/testing-library";
import Home from "@/app/index";
import { StoreProvider } from "@/lib/store";

describe("home insurance cards", () => {
  it("shows one card per owned class even when a class is chosen", async () => {
    await renderRouter({ _layout: () => <StoreProvider choice="house"><Slot /></StoreProvider>, index: Home }, { initialUrl: "/" });
    await screen.findByText(/Good (morning|afternoon|evening)/);
    const row = screen.getByLabelText(/House \d+/);
    for (const n of ["House", "Summer cottage", "Boat", "Car", "Dog"]) expect(row.props.accessibilityLabel).toMatch(new RegExp(`${n} \\d+`));
    expect(row.props.accessibilityLabel.split("; ")).toHaveLength(5);
  });
});
