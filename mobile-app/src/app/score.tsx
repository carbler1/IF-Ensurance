import { View } from "react-native";
import { Check, TrendingDown, TrendingUp } from "lucide-react-native";
import { Card, Heading, Screen, Text } from "@/components/ui";
import { risks, scoreHistory, tiers } from "@/data/mock";
import { getTier, useStore } from "@/lib/store";
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
  const { t, score, completed } = useStore();
  const current = getTier(score).tier.id;
  const items = [...scoreHistory, ...risks.filter((r) => completed.includes(r.id)).map((r) => ({ label: `${r.title} — ${t("job.verified")}`, points: r.points }))];
  const up = items.filter((i) => i.points > 0);
  const down = items.filter((i) => i.points < 0);

  return (
    <Screen back title={t("score.title")} sub={`${score} / 1000`}>
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
