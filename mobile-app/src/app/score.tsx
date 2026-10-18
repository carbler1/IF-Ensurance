import { View } from "react-native";
import { Check, TrendingDown, TrendingUp } from "@/lib/icons";
import { Card, Heading, Screen, Text, insuranceIcon, softColors } from "@/components/ui";
import { fmt } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { colors, radius, shadows, tierColors } from "@/lib/theme";

function Row({ label, points, first }: { label: string; points: number; first: boolean }) {
  return (
    <View style={[{ flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 12 }, !first && { borderTopWidth: 1, borderTopColor: colors.border }]}>
      <Text style={{ flexShrink: 1 }}>{label}</Text>
      <Text weight={600} color={points > 0 ? "success" : "destructive"}>{points > 0 ? `+${points}` : `−${Math.abs(points)}`}</Text>
    </View>
  );
}

export default function ScoreBreakdown() {
  const { t, scores, aggregate, completed, insurances, risks, history: scoreHistory, tiers, bands, model, getBand, getTier, nextBand } = useStore();
  const { tier, next: nextTier } = getTier(aggregate);
  const current = tier.id;
  const currentBand = (pct: number) => bands.reduce((m, b) => (b.percent === pct ? b.min : m), 0);
  const items = [
    ...scoreHistory.map((h) => ({ label: `${t(`ins.${h.insurance}`)} · ${h.label}`, points: h.points })),
    ...risks.filter((r) => completed.includes(r.id)).map((r) => ({ label: `${t(`ins.${r.insurance}`)} · ${r.title} — ${t("job.verified")}`, points: r.points })),
  ];
  const up = items.filter((i) => i.points > 0);
  const down = items.filter((i) => i.points < 0);
  const ladder = [{ min: 0, percent: 0 }, ...bands];

  return (
    <Screen back>
      {/* One centred stack: title, the score as the hero number, the tier and next goal, then the one-line meaning. */}
      <View style={{ alignItems: "center", gap: 6, paddingBottom: 8 }}>
        <Heading size="2xl" center>{t("score.title")}</Heading>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
          <Text size="6xl" display weight={600} tabular maxFontSizeMultiplier={1.3}>{aggregate}</Text>
          <Text size="lg" color="mutedForeground" tabular>/ {model.maxScore}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, borderRadius: radius.full, backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 6, boxShadow: shadows.sm }}>
          <View style={{ height: 12, width: 12, borderRadius: radius.full, backgroundColor: tierColors[tier.id].solid }} />
          <Text weight={600}>{tier.name}</Text>
        </View>
        <Text weight={500} color="mutedForeground" center>{nextTier ? `${nextTier.min - aggregate} ${t("home.toNext")} ${nextTier.name}` : t("home.topTier")}</Text>
        <Text size="sm" color="mutedForeground" center style={{ marginTop: 6, maxWidth: 300 }}>{t("score.average")}</Text>
      </View>

      <Card>
        <Heading size="lg">{t("score.insurances")}</Heading>
        <View style={{ marginTop: 8 }}>
          {insurances.map(({ id, object }, n) => {
            const Icon = insuranceIcon[id];
            const pct = getBand(scores[id]);
            const next = nextBand(scores[id]);
            // The bar runs from the start of the current band to the next one: how far this insurance is to its next discount.
            const from = currentBand(pct);
            const fill = next ? (scores[id] - from) / (next.min - from) : 1;
            return (
              <View key={id} style={[{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 16 }, n > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={{ height: 44, width: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.xl, backgroundColor: colors.secondary }}>
                  <Icon size={22} color={colors.secondaryForeground} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <Text weight={600} numberOfLines={1} style={{ flexShrink: 1 }}>{t(`ins.${id}`)}</Text>
                    <Text size="2xl" display weight={600} tabular>{scores[id]}</Text>
                  </View>
                  <Text size="sm" color="mutedForeground" numberOfLines={1}>{object}</Text>
                  <View style={{ marginTop: 10, height: 6, borderRadius: radius.full, backgroundColor: colors.muted, overflow: "hidden" }}>
                    <View style={{ height: 6, width: `${Math.max(0, Math.min(1, fill)) * 100}%`, borderRadius: radius.full, backgroundColor: next ? colors.primary : colors.success }} />
                  </View>
                  <View style={{ marginTop: 6, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", columnGap: 12 }}>
                    {/* Without a discount the "points to" line already says so. */}
                    {pct > 0 && <Text size="sm" weight={600} color="success">{fmt(t("band.off"), { pct })}</Text>}
                    <Text size="sm" color="mutedForeground" tabular>{next ? fmt(t("band.toNext"), { n: next.pointsTo, pct: next.percent }) : t("band.top")}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </Card>

      <Card>
        <Heading size="lg">{t("score.bands")}</Heading>
        <Text color="mutedForeground" style={{ marginTop: 4 }}>{t("score.bandsSub")}</Text>
        <View style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
          {ladder.map((b, i) => {
            const held = insurances.filter(({ id }) => currentBand(getBand(scores[id])) === b.min).length;
            return (
              // A blue border marks the bands where at least one of your insurances sits now.
              <View key={b.min} style={{ flex: 1, borderRadius: radius.xl, borderWidth: 2, borderColor: held > 0 ? colors.primary : "transparent", padding: 10, backgroundColor: softColors[i] ?? colors.secondary, alignItems: "center" }}>
                <Text size="sm" color="mutedForeground">{b.min === 0 ? fmt(t("score.below"), { min: bands[0].min }) : `${b.min}+`}</Text>
                <Text size="lg" weight={600}>{b.percent ? `${b.percent}%` : "—"}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TrendingUp size={20} color={colors.success} />
          <Heading size="lg">{t("score.raised")}</Heading>
        </View>
        <View style={{ marginTop: 8 }}>
          {up.map((i, n) => <Row key={i.label} {...i} first={n === 0} />)}
        </View>
        <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TrendingDown size={20} color={colors.destructive} />
          <Heading size="lg">{t("score.lowered")}</Heading>
        </View>
        <View style={{ marginTop: 8 }}>
          {down.map((i, n) => <Row key={i.label} {...i} first={n === 0} />)}
        </View>
      </Card>

      <Heading size="xl" style={{ paddingTop: 8 }}>{t("score.ladder")}</Heading>
      {[...tiers].reverse().map((tier) => (
        <Card key={tier.id} style={tier.id === current && { boxShadow: `0 0 0 2px ${colors.ring}, ${shadows.soft}` }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ height: 16, width: 16, borderRadius: radius.full, backgroundColor: tierColors[tier.id].solid }} />
              <Text size="lg" weight={600}>{tier.name}</Text>
            </View>
            <Text size="sm" color="mutedForeground">{tier.id === current ? t("score.current") : `${tier.min}+`}</Text>
          </View>
          <View style={{ marginTop: 8, gap: 4 }}>
            {tier.rewards.map((r) => (
              <View key={r} style={{ flexDirection: "row", gap: 8 }}>
                <Check size={16} color={colors.primary} style={{ marginTop: 4 }} />
                <Text color="mutedForeground" style={{ flex: 1 }}>{r}</Text>
              </View>
            ))}
          </View>
        </Card>
      ))}
    </Screen>
  );
}
