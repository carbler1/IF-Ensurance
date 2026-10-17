import { useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { CalendarDays, CheckCircle2, HardHat, Search, Star } from "lucide-react-native";
import { NotFound } from "@/components/NotFound";
import { RiskScorePreview } from "@/components/RiskScorePreview";
import { Button, Card, Heading, PopIn, Screen, Text, areaIcon } from "@/components/ui";
import { fmt } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Risk } from "@/lib/types";
import { colors, radius, shadows } from "@/lib/theme";

export default function RiskDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { risks } = useStore();
  const risk = risks.find((r) => r.id === id);
  if (!risk) return <NotFound />;
  return <RiskDetail key={risk.id} risk={risk} />;
}

// A selectable option card: blue border and tint when chosen, soft shadow otherwise.
const choice = (selected: boolean) => [
  { borderRadius: radius["2xl"], borderWidth: 2, backgroundColor: colors.card, padding: 16 },
  selected ? { borderColor: colors.primary, backgroundColor: colors.accent } : { borderColor: "transparent", boxShadow: shadows.soft },
];

function RiskDetail({ risk }: { risk: Risk }) {
  const { t, scores, aggregate, bookJob, jobs, completed, bids, model, getTier } = useStore();
  const inspectionPriceFactor = model.inspectionPriceFactor;
  const [mode, setMode] = useState<"hire" | "diy" | null>(null);
  const [bid, setBid] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const Icon = areaIcon[risk.area];
  // Partner discounts follow the Care Score tier; the preview shows this insurance's own score.
  const discount = getTier(aggregate).tier.partnerDiscount;
  const existing = jobs[risk.id];
  const done = existing?.step === 2;
  const addedPoints = completed.includes(risk.id) ? 0 : risk.points;
  const scoreProgress = <RiskScorePreview key={risk.id} score={scores[risk.insurance]} addedPoints={addedPoints} label={fmt(t("rd.safetyScore"), { name: t(`ins.${risk.insurance}`) })} />;

  // A finished job leaves nothing but the handled note: no score preview, no explainer, no booking.
  if (done) {
    return (
      <Screen back>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ height: 56, width: 56, alignItems: "center", justifyContent: "center", borderRadius: radius["2xl"], backgroundColor: colors.secondary }}>
            <Icon size={28} color={colors.secondaryForeground} />
          </View>
          <Heading style={{ flexShrink: 1 }}>{risk.title}</Heading>
        </View>
        <Card style={{ alignItems: "center" }}>
          <CheckCircle2 size={48} color={colors.success} />
          <Heading size="xl" center style={{ marginTop: 12 }}>{t("rd.handled")}</Heading>
          <Text color="mutedForeground" center style={{ marginTop: 4 }}>{t("rd.handledSub")}</Text>
        </Card>
      </Screen>
    );
  }

  if (confirmed || existing) {
    return (
      <Screen back>
        {scoreProgress}
        <PopIn>
          <Card style={{ alignItems: "center" }}>
            <CheckCircle2 size={64} color={colors.success} />
            <Heading size="2xl" center style={{ marginTop: 16 }}>{t("rd.confirmed")}</Heading>
            <Text color="mutedForeground" center style={{ marginTop: 8 }}>{t("rd.confirmedSub")}</Text>
            <Button big style={{ marginTop: 24, alignSelf: "stretch" }} onPress={() => router.navigate({ pathname: "/job/[id]", params: { id: risk.id } })}>{t("rd.follow")}</Button>
          </Card>
        </PopIn>
      </Screen>
    );
  }

  return (
    <Screen back>
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <View style={{ height: 56, width: 56, alignItems: "center", justifyContent: "center", borderRadius: radius["2xl"], backgroundColor: colors.secondary }}>
          <Icon size={28} color={colors.secondaryForeground} />
        </View>
        <View style={{ alignItems: "center" }}>
          <Text size="3xl" display weight={600} color="primaryLight" tabular>+{risk.points}</Text>
          <Text size="sm" color="mutedForeground">{t("pts")}</Text>
        </View>
      </View>
      <Heading>{risk.title}</Heading>
      {scoreProgress}
      <Card>
        <Heading size="lg">{t("rd.what")}</Heading>
        <Text color="mutedForeground" style={{ marginTop: 4 }}>{risk.explain}</Text>
        <Heading size="lg" style={{ marginTop: 16 }}>{t("rd.fix")}</Heading>
        <Text color="mutedForeground" style={{ marginTop: 4 }}>{mode === "diy" ? risk.diy : risk.fix}</Text>
      </Card>

      <Heading size="xl" style={{ paddingTop: 8 }}>{t("rd.how")}</Heading>
      {([["hire", HardHat], ["diy", Search]] as const).map(([m, MIcon]) => (
        <Pressable
          key={m}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === m }}
          onPress={() => { setMode(m); setBid(null); }}
          style={[...choice(mode === m), { flexDirection: "row", alignItems: "center", gap: 16 }]}
        >
          <MIcon size={28} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text size="lg" weight={600}>{t(m === "hire" ? "rd.hire" : "rd.diy")}</Text>
            <Text color="mutedForeground">{t(m === "hire" ? "rd.hireSub" : "rd.diySub")}</Text>
          </View>
        </Pressable>
      ))}

      {mode && (
        <>
          <Heading size="xl" style={{ paddingTop: 8 }}>{t("rd.bids")}</Heading>
          <Text color="mutedForeground" style={{ marginTop: -8 }}>{t("rd.bidsSub")}</Text>
          {bids.map((b) => {
            const base = Math.round(mode === "diy" ? b.price * inspectionPriceFactor : b.price);
            const final = Math.round(base * (1 - discount / 100));
            return (
              <Pressable key={b.id} accessibilityRole="button" accessibilityState={{ selected: bid === b.id }} onPress={() => setBid(b.id)} style={choice(bid === b.id)}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                  <Text weight={600} style={{ flexShrink: 1 }}>{b.name}</Text>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text size="xl" weight={600}>{final} €</Text>
                    <Text size="sm" color="mutedForeground" style={{ textDecorationLine: "line-through" }}>{base} €</Text>
                  </View>
                </View>
                <View style={{ marginTop: 4, flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Star size={16} color={colors.warning} fill={colors.warning} />
                    <Text size="sm" color="mutedForeground">{b.rating} ({b.reviews})</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <CalendarDays size={16} color={colors.mutedForeground} />
                    <Text size="sm" color="mutedForeground">{t("rd.earliest")} {b.date}</Text>
                  </View>
                  <Text size="sm" weight={600} color="success">−{discount}% {t("rd.yourDiscount")}</Text>
                </View>
              </Pressable>
            );
          })}
          <Button
            big
            disabled={!bid}
            onPress={() => { if (!bid) return; bookJob({ riskId: risk.id, bidId: bid, mode }); setConfirmed(true); }}
          >
            {t("rd.book")}
          </Button>
        </>
      )}
    </Screen>
  );
}
