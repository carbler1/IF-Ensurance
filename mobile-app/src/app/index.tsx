import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronRight, Snowflake } from "lucide-react-native";
import { Button, Card, CountUp, Heading, LinkBlock, RingOverlay, ScoreRing, Text, Wordmark, areaIcon, insuranceIcon, tierSegmentsOf } from "@/components/ui";
import { fmt } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { colors, radius, tierColors } from "@/lib/theme";

export default function Dashboard() {
  const { t, scores, aggregate: score, completed, customer, insurances, risks, tiers, getTier, getBand } = useStore();
  const insets = useSafeAreaInsets();
  const { tier, next } = getTier(score);
  // The open fix worth the most points, across all five insurances.
  const nextRisk = [...risks].sort((a, b) => b.points - a.points).find((r) => !completed.includes(r.id));
  const rows = [insurances.slice(0, 2), insurances.slice(2, 4), insurances.slice(4)];

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24 + insets.top, paddingBottom: 48, gap: 16 }}>
      {/* The web wordmark is an inline link, so the list spacing never applied below it. */}
      <View style={{ alignItems: "center" }}>
        <Wordmark />
        <Text color="mutedForeground" center>{t("home.hello")}, {customer.name}</Text>
      </View>

      <LinkBlock href="/score">
        <Card style={{ alignItems: "center" }}>
          <View style={{ maxWidth: "100%" }}>
            <ScoreRing score={score} showThresholds segments={tierSegmentsOf(tiers)} />
            <RingOverlay>
              <CountUp size="5xl" display weight={600} value={score} />
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

      {/* One small card per insurance: its own score and the discount that score earns. */}
      <View style={{ gap: 12 }}>
        {rows.map((row, i) => (
          <View key={i} style={{ flexDirection: "row", gap: row.length === 1 ? 6 : 12 }}>
            {row.length === 1 && <View style={{ flex: 1 }} />}
            {row.map(({ id }) => {
              const Icon = insuranceIcon[id];
              const pct = getBand(scores[id]);
              return (
                <LinkBlock key={id} href="/score" style={{ flex: row.length === 1 ? 2 : 1 }}>
                  <Card style={{ flex: 1, padding: 16, alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, maxWidth: "100%" }}>
                      <Icon size={16} color={colors.mutedForeground} />
                      <Text size="sm" color="mutedForeground" numberOfLines={1} style={{ flexShrink: 1 }}>{t(`ins.${id}`)}</Text>
                    </View>
                    <Text size="3xl" display weight={600} tabular>{scores[id]}</Text>
                    <Text size="sm" weight={pct ? 600 : 400} color={pct ? "success" : "mutedForeground"} center>
                      {pct ? fmt(t("band.off"), { pct }) : t("band.none")}
                    </Text>
                  </Card>
                </LinkBlock>
              );
            })}
            {row.length === 1 && <View style={{ flex: 1 }} />}
          </View>
        ))}
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
                <Text size="3xl" weight={700} color="primary" tabular>+{nextRisk.points}</Text>
                <Text size="sm" color="mutedForeground">{t("pts")}</Text>
              </View>
            </View>
            <Button big style={{ marginTop: 16 }} onPress={() => router.navigate({ pathname: "/risks/[id]", params: { id: nextRisk.id } })}>{t("home.start")}</Button>
          </Card>
        );
      })()}

      <Card flat style={{ flexDirection: "row", gap: 12, backgroundColor: colors.accent }}>
        <View style={{ height: 40, width: 40, alignItems: "center", justifyContent: "center", borderRadius: radius.full, backgroundColor: colors.card }}>
          <Snowflake size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text weight={600} color="accentForeground">{t("home.alert")}</Text>
          <Text color="foreground">{t("home.alertText")}</Text>
        </View>
      </Card>

      <LinkBlock href="/score" style={{ minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderRadius: radius["2xl"], paddingHorizontal: 8 }}>
        <Text weight={500} color="primary">{t("home.seeScore")}</Text>
        <ChevronRight size={20} color={colors.primary} />
      </LinkBlock>
    </ScrollView>
  );
}
