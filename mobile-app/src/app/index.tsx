import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Car, ChevronRight, Lock, Snowflake } from "lucide-react-native";
import { Button, Card, Heading, LinkBlock, RingOverlay, ScoreRing, Text, Wordmark, areaIcon } from "@/components/ui";
import { risks } from "@/data/mock";
import { getTier, useStore } from "@/lib/store";
import { colors, radius, tierColors } from "@/lib/theme";

export default function Dashboard() {
  const { t, score, completed } = useStore();
  const insets = useSafeAreaInsets();
  const { tier, next } = getTier(score);
  const nextRisk = risks.find((r) => !completed.includes(r.id));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24 + insets.top, paddingBottom: 48, gap: 16 }}>
      {/* The web wordmark is an inline link, so the list spacing never applied below it. */}
      <View>
        <Wordmark />
        <Text color="mutedForeground">{t("home.hello")}, Aino</Text>
      </View>

      <LinkBlock href="/score">
        <Card style={{ alignItems: "center" }}>
          <View style={{ maxWidth: "100%" }}>
            <ScoreRing score={score} showThresholds />
            <RingOverlay>
              <Text size="5xl" display weight={600}>{score}</Text>
              <Text size="sm" color="mutedForeground">/ 1000</Text>
            </RingOverlay>
          </View>
          <View style={{ marginTop: -32, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: radius.full, backgroundColor: colors.secondary, paddingHorizontal: 16, paddingVertical: 4 }}>
            <View style={{ height: 12, width: 12, borderRadius: radius.full, backgroundColor: tierColors[tier.id].solid }} />
            <Text weight={600} color="secondaryForeground">{tier.name}</Text>
          </View>
          <Text size="lg" weight={500} color="mutedForeground" center style={{ marginTop: 12 }}>
            {next ? `${next.min - score} ${t("home.toNext")} ${next.name}` : t("home.topTier")}
          </Text>
        </Card>
      </LinkBlock>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Card style={{ flex: 1, padding: 16 }}>
          <Text size="sm" color="mutedForeground">{t("home.house")}</Text>
          <Text size="3xl" display weight={600}>{score}</Text>
        </Card>
        <Card flat style={{ flex: 1, padding: 16, backgroundColor: colors.muted }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Car size={16} color={colors.mutedForeground} />
            <Text size="sm" color="mutedForeground">{t("home.car")}</Text>
          </View>
          <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Lock size={16} color={colors.mutedForeground} />
            <Text weight={500} color="mutedForeground">{t("home.carSub")}</Text>
          </View>
        </Card>
      </View>

      {nextRisk && (() => {
        const Icon = areaIcon[nextRisk.area];
        return (
          <Card>
            <Text size="sm" color="mutedForeground">{t("home.next")}</Text>
            <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Icon size={24} color={colors.primary} style={{ marginTop: 4 }} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Heading size="xl">{nextRisk.title}</Heading>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text size="3xl" display weight={600} color="primaryLight" tabular>+{nextRisk.points}</Text>
                <Text size="sm" color="mutedForeground">{t("pts")}</Text>
              </View>
            </View>
            <Button big style={{ marginTop: 16 }} onPress={() => router.navigate({ pathname: "/risks/[id]", params: { id: nextRisk.id } })}>{t("home.start")}</Button>
          </Card>
        );
      })()}

      <Card flat style={{ flexDirection: "row", gap: 12, backgroundColor: colors.warningSoft }}>
        <Snowflake size={24} color={colors.foreground} />
        <View style={{ flex: 1 }}>
          <Text weight={600}>{t("home.alert")}</Text>
          <Text color="mutedForeground">{t("home.alertText")}</Text>
        </View>
      </Card>

      <LinkBlock href="/score" style={{ height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: radius["2xl"], paddingHorizontal: 8 }}>
        <Text weight={500} color="primary">{t("home.seeScore")}</Text>
        <ChevronRight size={20} color={colors.primary} />
      </LinkBlock>
    </ScrollView>
  );
}
