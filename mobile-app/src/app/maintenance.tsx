import { View } from "react-native";
import { Card, Heading, Screen, SwitchRow, Text } from "@/components/ui";
import { useStore } from "@/lib/store";
import { colors, radius } from "@/lib/theme";

const seasons = ["autumn", "winter", "spring", "summer"] as const;

export default function Maintenance() {
  const { t, reminders, toggleReminder, tasks } = useStore();
  return (
    <Screen title={t("m.title")} sub={t("m.sub")}>
      {seasons.map((s) => (
        <View key={s} style={{ gap: 12 }}>
          <Heading size="xl" style={{ paddingTop: 8 }}>{t(`m.${s}`)}</Heading>
          {tasks.filter((x) => x.season === s).map((task) => (
            <Card key={task.id}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <View style={{ flexShrink: 1 }}>
                  <Heading size="lg" display={false}>{task.title}</Heading>
                  <Text color="mutedForeground">{t("m.due")}: {task.due}</Text>
                </View>
                <View style={{ borderRadius: radius.full, backgroundColor: colors.secondary, paddingHorizontal: 12, paddingVertical: 4 }}>
                  <Text size="sm" weight={500} color="secondaryForeground">{t(`m.reason.${task.reason}`)}</Text>
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
