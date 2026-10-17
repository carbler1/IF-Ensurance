import { View } from "react-native";
import { ChevronRight, Snowflake } from "@/lib/icons";
import { Arrive, Card, CountUp, LinkBlock, RingOverlay, ScoreRing, Screen, Text, Wordmark, areaIcon, insuranceIcon, ringLandMs, tierSegmentsOf } from "@/components/ui";
import { fmt } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { colors, radius, shadows, tierColors } from "@/lib/theme";

export default function Dashboard() {
  const { t, scores, aggregate: score, completed, customer, insurances, risks, tiers, model, getTier, getBand } = useStore();
  const { tier, next } = getTier(score);
  // The open fix worth the most points, across all five insurances.
  const nextRisk = [...risks].sort((a, b) => b.points - a.points).find((r) => !completed.includes(r.id));

  return (
    <Screen>
      {/* The web wordmark is an inline link, so the list spacing never applied below it. */}
      <View style={{ alignItems: "center" }}>
        <Wordmark />
        <Text color="mutedForeground" center>{t("home.hello")}, {customer.name}</Text>
      </View>

      {/* The hero: the Care Score on the page itself, no card, so nothing else competes with it. */}
      <LinkBlock href="/score" style={{ alignItems: "center", paddingTop: 8, paddingBottom: 20 }}>
        <View style={{ maxWidth: "100%" }}>
          <ScoreRing once="home" size={232} max={model.maxScore} score={score} showThresholds segments={tierSegmentsOf(tiers)} surface={colors.background} />
          <RingOverlay>
            <Text size="sm" weight={500} color="mutedForeground" maxFontSizeMultiplier={1.3}>{t("home.ringLabel")}</Text>
            <CountUp once="home" size="6xl" display weight={600} value={score} />
            <Text size="sm" color="mutedForeground" maxFontSizeMultiplier={1.3}>/ {model.maxScore}</Text>
          </RingOverlay>
        </View>
        {/* Reading order as the score lands: the number, then the tier, then the next goal. */}
        <Arrive once="home" delay={ringLandMs - 250} style={{ marginTop: -28, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: radius.full, backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 6, boxShadow: shadows.sm }}>
          <View style={{ height: 12, width: 12, borderRadius: radius.full, backgroundColor: tierColors[tier.id].solid }} />
          <Text weight={600}>{tier.name}</Text>
        </Arrive>
        <Arrive once="home" delay={ringLandMs - 50}>
          <Text size="lg" weight={500} color="mutedForeground" center style={{ marginTop: 10 }}>
            {next ? `${next.min - score} ${t("home.toNext")} ${next.name}` : t("home.topTier")}
          </Text>
        </Arrive>
      </LinkBlock>

      {/* The five insurances as one row of equal columns: no orphan tile, and quieter than the hero. */}
      <LinkBlock
        href="/score"
        accessibilityLabel={insurances.map(({ id }) => `${t(`ins.${id}`)} ${scores[id]}, ${getBand(scores[id]) ? fmt(t("band.off"), { pct: getBand(scores[id]) }) : t("band.none")}`).join("; ")}
      >
        <Card style={{ flexDirection: "row", paddingHorizontal: 4, paddingVertical: 16 }}>
          {insurances.map(({ id }, i) => {
            const Icon = insuranceIcon[id];
            const pct = getBand(scores[id]);
            return (
              <View key={id} style={[{ flex: 1, alignItems: "center", gap: 4 }, i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
                <Icon size={20} color={colors.mutedForeground} />
                <Text size="xl" display weight={600} tabular maxFontSizeMultiplier={1.3}>{scores[id]}</Text>
                <Text size="xs" weight={600} color={pct ? "success" : "mutedForeground"} maxFontSizeMultiplier={1.3} numberOfLines={1} adjustsFontSizeToFit>{pct ? fmt(t("band.off"), { pct }) : "—"}</Text>
              </View>
            );
          })}
        </Card>
      </LinkBlock>

      {/* Supporting rows: one shape for the next step and the alert, so they read as a pair under the hero. */}
      {nextRisk && (() => {
        const Icon = areaIcon[nextRisk.area];
        return (
          <LinkBlock href={{ pathname: "/risks/[id]", params: { id: nextRisk.id } }}>
            <Card style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16 }}>
              <View style={{ height: 40, width: 40, alignItems: "center", justifyContent: "center", borderRadius: radius.full, backgroundColor: colors.accent }}>
                <Icon size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" color="mutedForeground">{t("home.next")}</Text>
                <Text weight={600}>{nextRisk.title}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text size="xl" weight={700} color="primary" tabular>+{nextRisk.points}</Text>
                <Text size="xs" color="mutedForeground">{t("pts")}</Text>
              </View>
              <ChevronRight size={20} color={colors.mutedForeground} />
            </Card>
          </LinkBlock>
        );
      })()}

      <Card flat style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16, backgroundColor: colors.accent }}>
        <View style={{ height: 40, width: 40, alignItems: "center", justifyContent: "center", borderRadius: radius.full, backgroundColor: colors.card }}>
          <Snowflake size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text size="sm" weight={600} color="accentForeground">{t("home.alert")}</Text>
          <Text>{t("home.alertText")}</Text>
        </View>
      </Card>

      <LinkBlock href="/score" style={{ minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderRadius: radius["2xl"], paddingHorizontal: 8 }}>
        <Text weight={500} color="primary">{t("home.seeScore")}</Text>
        <ChevronRight size={20} color={colors.primary} />
      </LinkBlock>
    </Screen>
  );
}
