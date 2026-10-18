import { useCallback, useEffect, useState } from "react";
import { Platform, View, useWindowDimensions } from "react-native";
import { Link, Stack, type ErrorBoundaryProps } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Figtree_400Regular } from "@expo-google-fonts/figtree/400Regular";
import { Figtree_500Medium } from "@expo-google-fonts/figtree/500Medium";
import { Figtree_600SemiBold } from "@expo-google-fonts/figtree/600SemiBold";
import { Figtree_700Bold } from "@expo-google-fonts/figtree/700Bold";
import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces/600SemiBold";
import { TabBar } from "@/components/TabBar";
import { Button, Heading, Spinner, Text } from "@/components/ui";
import { Entry } from "@/components/Entry";
import { Login } from "@/components/Login";
import { api } from "@/lib/api";
import { useChoice } from "@/lib/choice";
import { StoreProvider, useStore } from "@/lib/store";
import { dictionaries } from "@/lib/i18n";
import { colors, shadows } from "@/lib/theme";

SplashScreen.preventAutoHideAsync();

// Tab pages swap in place; detail pages slide in.
const tabPage = { animation: "none" } as const;

export default function RootLayout() {
  const [loaded, fontError] = useFonts({ Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, Fraunces_600SemiBold });

  useEffect(() => {
    if (loaded || fontError) SplashScreen.hideAsync();
  }, [loaded, fontError]);

  const [choice, choose] = useChoice();
  // undefined: still reading the stored token.
  const [signedIn, setSignedIn] = useState<boolean | undefined>(undefined);
  useEffect(() => { api.restore().then(setSignedIn); }, []);
  const signedOut = useCallback(() => setSignedIn(false), []);

  if (!loaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StoreProvider choice={choice} paused={!signedIn} onSignedOut={signedOut}>
        <StatusBar style="dark" />
        <AppFrame choice={choice} choose={choose} signedIn={signedIn} onSignedIn={() => setSignedIn(true)} />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

// The web demo (mobile-app/Dockerfile) shows the app inside a phone-sized frame on a wide screen.
const PHONE = { width: 390, height: 844 };

// On web at 600 px or wider the app sits in the phone frame; elsewhere it fills the screen up to 430 px.
function AppFrame({ choice, choose, signedIn, onSignedIn }: { choice: ReturnType<typeof useChoice>[0]; choose: ReturnType<typeof useChoice>[1]; signedIn: boolean | undefined; onSignedIn: () => void }) {
  const { status, error, reload, t } = useStore();
  const window = useWindowDimensions();
  const phoneFrame = Platform.OS === "web" && window.width >= 600;
  return (
    <View style={{ flex: 1, backgroundColor: colors.frame, alignItems: "center", justifyContent: phoneFrame ? "center" : undefined }}>
      <View
        style={
          phoneFrame
            ? { width: PHONE.width, height: Math.min(PHONE.height, window.height - 32), borderRadius: 44, borderWidth: 10, borderColor: colors.inverted, overflow: "hidden", backgroundColor: colors.background, boxShadow: "0 30px 60px -20px rgba(36, 21, 12, 0.45)" }
            : { flex: 1, width: "100%", maxWidth: 430, backgroundColor: colors.background, boxShadow: shadows.soft }
        }
      >
        {choice === undefined || signedIn === undefined ? null : choice === null ? (
          <Entry onChoose={choose} />
        ) : !signedIn ? (
          <Login choice={choice} onBack={() => choose(null)} onDone={onSignedIn} />
        ) : status === "loading" ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
            <Spinner size={48} color={colors.primary} />
            <Text color="mutedForeground">{t("app.loading")}</Text>
          </View>
        ) : status === "error" ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 8 }}>
            <Heading size="2xl" center>{t("app.error")}</Heading>
            <Text color="mutedForeground" center>{error}</Text>
            <Button big style={{ marginTop: 16, alignSelf: "stretch" }} onPress={reload}>{t("app.retry")}</Button>
          </View>
        ) : (
          <>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
              <Stack.Screen name="index" options={{ ...tabPage, title: "Home — If Ensurance" }} />
              <Stack.Screen name="risks/index" options={{ ...tabPage, title: "Risks — If Ensurance" }} />
              <Stack.Screen name="maintenance" options={{ ...tabPage, title: "Maintenance — If Ensurance" }} />
              <Stack.Screen name="profile" options={{ ...tabPage, title: "Profile — If Ensurance" }} />
              <Stack.Screen name="risks/[id]" options={{ title: "Risk — If Ensurance" }} />
              <Stack.Screen name="job/[id]" options={{ title: "Job status — If Ensurance" }} />
              <Stack.Screen name="score" options={{ title: "Care Score — If Ensurance" }} />
            </Stack>
            <TabBar />
          </>
        )}
      </View>
    </View>
  );
}

// Renders in place of the root layout, outside StoreProvider, so the chosen language is not known here: English, the app default.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  console.error(error);
  const t = dictionaries.en;
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, paddingHorizontal: 16 }}>
      <View style={{ maxWidth: 448, alignItems: "center" }}>
        <Heading size="xl" display={false} center>{t["err.title"]}</Heading>
        <Text size="sm" color="mutedForeground" center style={{ marginTop: 8 }}>
          {t["err.sub"]}
        </Text>
        <View style={{ marginTop: 24, flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
          <Button onPress={retry}>{t["err.retry"]}</Button>
          <Link href="/" asChild>
            <Button variant="outline">{t["err.home"]}</Button>
          </Link>
        </View>
      </View>
    </View>
  );
}
