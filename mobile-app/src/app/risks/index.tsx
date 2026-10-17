import { View } from "react-native";
import { CheckCircle2 } from "lucide-react-native";
import { Card, Heading, LinkBlock, Screen, Text, areaIcon, insuranceIcon } from "@/components/ui";
import { insurances, risks } from "@/data/mock";
import { fmt } from "@/lib/i18n";
import { getBand, useStore } from "@/lib/store";
import { colors, radius } from "@/lib/theme";

export default function RiskList() {
  const { t, completed, scores } = useStore();
  return (
    <Screen title={t("risks.title")} sub={t("risks.sub")}>
      {insurances.map(({ id }) => {
        const InsIcon = insuranceIcon[id];
        const pct = getBand(scores[id]);
        return (
          <View key={id} style={{ gap: 16 }}>
            <View style={{ paddingTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <InsIcon size={22} color={colors.primary} />
                <Heading size="xl">{t(`ins.${id}`)}</Heading>
              </View>
              <Text size="sm" color="mutedForeground">{scores[id]} · {pct ? fmt(t("band.off"), { pct }) : t("band.none")}</Text>
            </View>
            {risks.filter((r) => r.insurance === id).map((r) => {
              const Icon = areaIcon[r.area];
              const done = completed.includes(r.id);
              return (
                <LinkBlock key={r.id} href={{ pathname: "/risks/[id]", params: { id: r.id } }}>
                  <Card style={done && { opacity: 0.6 }}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ height: 48, width: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.xl, backgroundColor: colors.secondary }}>
                          <Icon size={24} color={colors.secondaryForeground} />
                        </View>
                        <Heading size="xl" style={{ marginTop: 12 }}>{r.title}</Heading>
                        <Text color="mutedForeground" style={{ marginTop: 4 }}>{r.why}</Text>
                        {done && (
                          <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <CheckCircle2 size={20} color={colors.success} />
                            <Text weight={600} color="success">{t("risks.done")}</Text>
                          </View>
                        )}
                      </View>
                      <View style={{ alignItems: "center" }}>
                        <Text size="3xl" display weight={600} color="primaryLight" tabular>+{r.points}</Text>
                        <Text size="sm" color="mutedForeground">{t("pts")}</Text>
                      </View>
                    </View>
                  </Card>
                </LinkBlock>
              );
            })}
          </View>
        );
      })}
    </Screen>
  );
}
