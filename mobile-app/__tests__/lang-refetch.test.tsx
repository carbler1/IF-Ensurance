import { Pressable, Text } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { StoreProvider, useStore } from "@/lib/store";
import { loadLangs } from "../test-support/fakeApi";

function Probe() {
  const { status, setLang } = useStore();
  return (
    <>
      <Text testID="status">{status}</Text>
      <Pressable accessibilityRole="button" onPress={() => setLang("fi")}><Text>fi</Text></Pressable>
    </>
  );
}

it("switching the language refetches the app data with that language", async () => {
  render(<StoreProvider><Probe /></StoreProvider>);
  await screen.findByText("ready");
  expect(loadLangs).toEqual(["en"]);
  fireEvent.press(screen.getByText("fi"));
  await act(async () => {});
  expect(loadLangs).toEqual(["en", "fi"]);
  expect(screen.getByTestId("status").props.children).toBe("ready");
});
