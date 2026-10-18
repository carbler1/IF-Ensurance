import { useState } from "react";
import { View } from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
import { BadgeCheck, Check, ShieldCheck } from "@/lib/icons";
import { Button, Card, PopIn, Screen, Text } from "@/components/ui";
import { fmt } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { colors, radius } from "@/lib/theme";

export default function JobStatus() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, jobs, advanceJob, scores, aggregate, bids, risks, model, getBand, getTier } = useStore();
  const [busy, setBusy] = useState(false);
  const job = jobs[id];
  const risk = risks.find((r) => r.id === id);
  if (!job || !risk) {
    return (
      <Screen back title={t("job.title")}>
        <Link href="/risks"><Text color="primary">{t("tab.risks")}</Text></Link>
      </Screen>
    );
  }
  const partner = bids.find((b) => b.id === job.bidId);
  const steps = [t("job.booked"), t("job.progress"), t("job.confirmed")];

  return (
    <Screen back title={t("job.title")} sub={`${risk.title} · ${partner?.name}`}>
      <Card>
        <View>
          {steps.map((s, i) => (
            <View key={s} style={{ flexDirection: "row", gap: 16 }}>
              <View style={{ alignItems: "center", flexShrink: 0 }}>
                <View style={{ height: 40, width: 40, alignItems: "center", justifyContent: "center", borderRadius: radius.full, backgroundColor: i <= job.step ? colors.primary : colors.muted }}>
                  {i <= job.step ? <Check size={20} color={colors.primaryForeground} /> : <Text color="mutedForeground">{i + 1}</Text>}
                </View>
                {i < steps.length - 1 && <View style={{ height: 32, width: 4, backgroundColor: i < job.step ? colors.primary : colors.muted }} />}
              </View>
              <Text size="lg" weight={i <= job.step ? 600 : 400} color={i <= job.step ? "foreground" : "mutedForeground"} style={{ flex: 1, minWidth: 0, paddingTop: 8 }}>{s}</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 16, flexDirection: "row", gap: 8, borderRadius: radius.xl, backgroundColor: colors.successSoft, padding: 12 }}>
          <ShieldCheck size={20} color={colors.success} />
          <Text color="success" style={{ flex: 1, minWidth: 0 }}>{t("job.proof")}</Text>
        </View>
      </Card>

      {job.step < 2 ? (
        <Button big variant="outline" style={{ backgroundColor: colors.card }} disabled={busy} onPress={() => { setBusy(true); advanceJob(id).finally(() => setBusy(false)); }}>
          {t("job.simulate")}
        </Button>
      ) : (
        <PopIn>
          <Card style={{ alignItems: "center" }}>
            <Text color="mutedForeground" center>{t("job.up")}</Text>
            <Text size="6xl" weight={700} color="primary" center numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>+{risk.points}</Text>
            <Text size="lg" center style={{ marginTop: 4 }}>
              {t(`ins.${risk.insurance}`)} {scores[risk.insurance]} / {model.maxScore} · {getBand(scores[risk.insurance]) ? fmt(t("band.off"), { pct: getBand(scores[risk.insurance]) }) : t("band.none")}
            </Text>
            <Text color="mutedForeground" center>{t("score.title")} {aggregate} · {getTier(aggregate).tier.name}</Text>
            <View style={{ marginTop: 16, alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: 8, borderRadius: radius.xl, backgroundColor: colors.successSoft, padding: 12 }}>
              <BadgeCheck size={24} color={colors.success} />
              <Text style={{ flex: 1, minWidth: 0 }}>{risk.title} — {t("job.verified")}</Text>
              <Text weight={600} color="success" style={{ flexShrink: 0 }}>+{risk.points}</Text>
            </View>
            <Button big style={{ marginTop: 24, alignSelf: "stretch" }} onPress={() => router.navigate("/")}>{t("job.back")}</Button>
          </Card>
        </PopIn>
      )}
    </Screen>
  );
}
