import { View } from "react-native";
import { Leaf, Snowflake, Sprout, Sun } from "@/lib/icons";
import { Card, Heading, Screen, SwitchRow, Text } from "@/components/ui";
import { useStore } from "@/lib/store";
import { colors, radius, seasonColors } from "@/lib/theme";

const seasons = ["autumn", "winter", "spring", "summer"] as const;

// Each season gets its own icon and warm or cool tint, so the list reads like a year, not a chore list.
const seasonLook = {
  autumn: { Icon: Leaf, ...seasonColors.autumn },
  winter: { Icon: Snowflake, solid: colors.primary, soft: colors.accent },
  spring: { Icon: Sprout, solid: colors.success, soft: colors.successSoft },
  summer: { Icon: Sun, ...seasonColors.summer },
};

export default function Maintenance() {
  const { t, reminders, toggleReminder, tasks } = useStore();
  return (
    <Screen title={t("m.title")} sub={t("m.sub")}>
      {seasons.map((s) => (
        <View key={s} style={{ gap: 12 }}>
          <View style={{ paddingTop: 8, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ height: 36, width: 36, alignItems: "center", justifyContent: "center", borderRadius: radius.full, backgroundColor: seasonLook[s].soft }}>
              {(() => { const Icon = seasonLook[s].Icon; return <Icon size={20} color={seasonLook[s].solid} />; })()}
            </View>
            <Heading size="xl">{t(`m.${s}`)}</Heading>
          </View>
          {tasks.filter((x) => x.season === s).map((task) => (
            <Card key={task.id}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <View style={{ flexShrink: 1 }}>
                  <Heading size="lg" display={false}>{task.title}</Heading>
                  <Text color="mutedForeground">{t("m.due")}: {task.due}</Text>
                </View>
                <View style={{ borderRadius: radius.full, backgroundColor: seasonLook[s].soft, paddingHorizontal: 12, paddingVertical: 4 }}>
                  <Text size="sm" weight={600} style={{ color: seasonLook[s].solid }}>{t(`m.reason.${task.reason}`)}</Text>
                </View>
              </View>
              <Text size="sm" color="mutedForeground" style={{ marginTop: 8 }}>{task.reasonText}</Text>
              <SwitchRow
                label={`${t("m.remind")}: ${task.title}`}
                value={reminders.includes(task.id)}
                onValueChange={() => toggleReminder(task.id)}
                style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 4 }}
              >
                <Text weight={500}>{t("m.remind")}</Text>
              </SwitchRow>
            </Card>
          ))}
        </View>
      ))}
    </Screen>
  );
}
