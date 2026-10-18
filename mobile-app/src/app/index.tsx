import { View } from "react-native";
import { ChevronRight, Snowflake } from "@/lib/icons";
import { Arrive, Card, CountUp, LinkBlock, RingOverlay, ScoreRing, Screen, Text, Wordmark, areaIcon, insuranceIcon, ringLandMs, tierSegmentsOf } from "@/components/ui";
import { fmt } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { colors, radius, shadows, tierColors } from "@/lib/theme";

export default function Dashboard() {
  const { t, aggregate: score, completed, customer, allInsurances, risks, tiers, model, home, getTier, getBand } = useStore();
  const { tier, next } = getTier(score);
  const city = home.address.replace(/^.*\d{5}\s*/, ""); // the address ends in "20100 Turku"
  // The open fix worth the most points, across all five insurances.
  const nextRisk = [...risks].sort((a, b) => b.points - a.points).find((r) => !completed.includes(r.id));

  return (
    <Screen>
      <View style={{ alignItems: "center" }}>
        <Wordmark />
        <Text color="mutedForeground" center>{t("home.hello")}, {customer.name}</Text>
      </View>

      {/* The hero: the Care Score on the page itself, no card, so nothing else competes with it. */}
      <LinkBlock href="/score" style={{ alignItems: "center", paddingTop: 8, paddingBottom: 20 }}>
        <View style={{ maxWidth: "100%" }}>
          <ScoreRing once="home" size={232} max={model.maxScore} score={score} showThresholds segments={tierSegmentsOf(tiers)} surface={colors.background} />
          <RingOverlay>
            <Text size="sm" weight={500} color="mutedForeground" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} center maxFontSizeMultiplier={1.3}>{t("home.ringLabel")}</Text>
            <CountUp once="home" size="6xl" display weight={600} value={score} />
            <Text size="sm" color="mutedForeground" numberOfLines={1} maxFontSizeMultiplier={1.3}>/ {model.maxScore}</Text>
          </RingOverlay>
        </View>
        {/* Reading order as the score lands: the number, then the tier, then the next goal. */}
        <Arrive once="home" delay={ringLandMs - 250} style={{ marginTop: -28, flexDirection: "row", alignItems: "center", gap: 8, maxWidth: "100%", borderRadius: radius.full, backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 6, boxShadow: shadows.sm }}>
          <View style={{ flexShrink: 0, height: 12, width: 12, borderRadius: radius.full, backgroundColor: tierColors[tier.id].solid }} />
          <Text weight={600} style={{ flexShrink: 1 }}>{tier.name}</Text>
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
        accessibilityLabel={allInsurances.map(({ id, score: s }) => `${t(`ins.${id}`)} ${s}, ${getBand(s) ? fmt(t("band.off"), { pct: getBand(s) }) : t("band.none")}`).join("; ")}
      >
        <Card style={{ flexDirection: "row", paddingHorizontal: 4, paddingVertical: 10 }}>
          {allInsurances.map(({ id, score: own }, i) => {
            const Icon = insuranceIcon[id];
            const pct = getBand(own);
            return (
              <View key={id} style={[{ flex: 1, minWidth: 0, paddingHorizontal: 2, alignItems: "center", gap: 1 }, i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
                <Icon size={18} color={colors.primary} />
                <Text size="xl" display weight={600} tabular numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} maxFontSizeMultiplier={1.3}>{own}</Text>
                <Text size="xs" weight={600} color={pct ? "success" : "mutedForeground"} maxFontSizeMultiplier={1.3} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} center>{pct ? fmt(t("band.off"), { pct }) : "—"}</Text>
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
            <Card style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 }}>
              <View style={{ height: 32, width: 32, alignItems: "center", justifyContent: "center", borderRadius: radius.full, backgroundColor: colors.accent }}>
                <Icon size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" color="mutedForeground">{t("home.next")}</Text>
                <Text weight={600}>{nextRisk.title}</Text>
              </View>
              <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
                <Text size="xl" weight={700} color="primary" tabular>+{nextRisk.points}</Text>
                <Text size="xs" color="mutedForeground">{t("pts")}</Text>
              </View>
              <ChevronRight size={20} color={colors.mutedForeground} />
            </Card>
          </LinkBlock>
        );
      })()}

      <Card flat style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16, backgroundColor: colors.accent }}>
        <View style={{ height: 32, width: 32, alignItems: "center", justifyContent: "center", borderRadius: radius.full, backgroundColor: colors.card }}>
          <Snowflake size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" weight={600} color="accentForeground">{t("home.alert")}</Text>
          <Text>{fmt(t("home.alertText"), { city })}</Text>
        </View>
      </Card>

      <LinkBlock href="/score" style={{ minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderRadius: radius["2xl"], paddingHorizontal: 8 }}>
        <Text weight={500} color="primary" center style={{ flexShrink: 1 }}>{t("home.seeScore")}</Text>
        <ChevronRight size={20} color={colors.primary} />
      </LinkBlock>
    </Screen>
  );
}
