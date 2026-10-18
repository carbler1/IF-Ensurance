import { Pressable, Text } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { StoreProvider, useStore } from "@/lib/store";
import { api } from "@/lib/api";

function Probe() {
  const { status, reminders, toggleReminder } = useStore();
  return (
    <>
      <Text testID="status">{status}</Text>
      <Text testID="rem">{reminders.length}</Text>
      <Pressable accessibilityRole="button" onPress={() => toggleReminder("zz")}><Text>toggle</Text></Pressable>
    </>
  );
}

it("a failed save refetches without the loading state", async () => {
  render(<StoreProvider><Probe /></StoreProvider>);
  await screen.findByText("ready");
  const before = screen.getByTestId("rem").props.children;
  jest.spyOn(api, "setReminder").mockRejectedValueOnce(new Error("boom"));
  fireEvent.press(screen.getByText("toggle"));
  expect(screen.getByTestId("status").props.children).toBe("ready");
  await act(async () => {});
  expect(screen.getByTestId("status").props.children).toBe("ready");
  expect(screen.getByTestId("rem").props.children).toBe(before);
});
