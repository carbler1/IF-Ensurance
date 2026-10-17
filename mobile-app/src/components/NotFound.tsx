import { View } from "react-native";
import { router } from "expo-router";
import { useStore } from "@/lib/store";
import { colors } from "@/lib/theme";
import { Button, Heading, Text } from "./ui";

export function NotFound() {
  const { t } = useStore();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, paddingHorizontal: 16 }}>
      <View style={{ maxWidth: 448, alignItems: "center" }}>
        <Heading size="7xl" weight={700} center>404</Heading>
        <Heading size="xl" center style={{ marginTop: 16 }}>{t("nf.title")}</Heading>
        <Text size="sm" color="mutedForeground" center style={{ marginTop: 8 }}>
          {t("nf.sub")}
        </Text>
        <Button style={{ marginTop: 24 }} onPress={() => router.navigate("/")}>{t("err.home")}</Button>
      </View>
    </View>
  );
}
