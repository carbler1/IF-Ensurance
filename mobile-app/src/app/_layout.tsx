import { useEffect } from "react";
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
import { Fraunces_400Regular } from "@expo-google-fonts/fraunces/400Regular";
import { Fraunces_400Regular_Italic } from "@expo-google-fonts/fraunces/400Regular_Italic";
import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces/600SemiBold";
import { Onboarding } from "@/components/Onboarding";
import { TabBar } from "@/components/TabBar";
import { Button, Heading, Spinner, Text } from "@/components/ui";
import { StoreProvider, useStore } from "@/lib/store";
import { colors, shadows } from "@/lib/theme";

SplashScreen.preventAutoHideAsync();

// Tab pages swap in place like the web app; detail pages slide in.
const tabPage = { animation: "none" } as const;

export default function RootLayout() {
  const [loaded] = useFonts({ Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, Fraunces_400Regular, Fraunces_400Regular_Italic, Fraunces_600SemiBold });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        <AppFrame />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

// The web demo (mobile-app/Dockerfile) shows the app inside a phone-sized frame on a wide screen.
const PHONE = { width: 390, height: 844 };

// On wide screens (web, tablets) the app keeps its 430px phone column on the frame colour.
function AppFrame() {
  const { onboarded, status, error, reload, t } = useStore();
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
        {status === "loading" ? (
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
        ) : onboarded ? (
          <>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
              <Stack.Screen name="index" options={{ ...tabPage, title: "Home — If Life Partner" }} />
              <Stack.Screen name="risks/index" options={{ ...tabPage, title: "Risks — If Life Partner" }} />
              <Stack.Screen name="maintenance" options={{ ...tabPage, title: "Maintenance — If Life Partner" }} />
              <Stack.Screen name="profile" options={{ ...tabPage, title: "Profile — If Life Partner" }} />
              <Stack.Screen name="risks/[id]" options={{ title: "Risk — If Life Partner" }} />
              <Stack.Screen name="job/[id]" options={{ title: "Job status — If Life Partner" }} />
              <Stack.Screen name="score" options={{ title: "Care Score — If Life Partner" }} />
            </Stack>
            <TabBar />
          </>
        ) : (
          <Onboarding />
        )}
      </View>
    </View>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  console.error(error);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, paddingHorizontal: 16 }}>
      <View style={{ maxWidth: 448, alignItems: "center" }}>
        <Heading size="xl" display={false} center>This page didn't load</Heading>
        <Text size="sm" color="mutedForeground" center style={{ marginTop: 8 }}>
          Something went wrong on our end. You can try refreshing or head back home.
        </Text>
        <View style={{ marginTop: 24, flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
          <Button onPress={retry}>Try again</Button>
          <Link href="/" asChild>
            <Button variant="outline">Go home</Button>
          </Link>
        </View>
      </View>
    </View>
  );
}
