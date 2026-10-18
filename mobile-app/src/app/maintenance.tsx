import { useState } from "react";
import { Pressable, View } from "react-native";
import { ChevronRight, Leaf, Snowflake, Sprout, Sun } from "@/lib/icons";
import { Card, Heading, Screen, SwitchRow, Text } from "@/components/ui";
import { useStore } from "@/lib/store";
import { colors, radius, seasonColors } from "@/lib/theme";

const seasons = ["autumn", "winter", "spring", "summer"] as const;

// Each season gets its own icon and warm or cool tint, so the list reads like a year, not a chore list.
const seasonLook = {
  autumn: { Icon: Leaf, ...seasonColors.autumn },
  winter: { Icon: Snowflake, ...seasonColors.winter },
  spring: { Icon: Sprout, ...seasonColors.spring },
  summer: { Icon: Sun, ...seasonColors.summer },
};

export default function Maintenance() {
  const { t, reminders, toggleReminder, tasks } = useStore();
  // Autumn, the first season, starts open; the rest fold away.
  const [open, setOpen] = useState<string[]>([seasons[0]]);
  return (
    <Screen title={t("m.title")} sub={t("m.sub")}>
      {seasons.map((s) => {
        const { Icon, solid, soft } = seasonLook[s];
        const list = tasks.filter((x) => x.season === s);
        const isOpen = open.includes(s);
        return (
          <View key={s} style={{ gap: 12 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              onPress={() => setOpen(isOpen ? open.filter((x) => x !== s) : [...open, s])}
              style={({ pressed }) => [{ minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: radius["2xl"], backgroundColor: soft, paddingHorizontal: 14 }, pressed && { opacity: 0.8 }]}
            >
              <View style={{ height: 36, width: 36, alignItems: "center", justifyContent: "center", borderRadius: radius.full, backgroundColor: colors.card }}>
                <Icon size={20} color={solid} />
              </View>
              <Heading size="xl" style={{ flex: 1, color: solid }}>{t(`m.${s}`)}</Heading>
              <Text weight={600} tabular style={{ color: solid }}>{list.length}</Text>
              <View style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }}><ChevronRight size={20} color={solid} /></View>
            </Pressable>
            {isOpen && list.map((task) => (
              <Card key={task.id} style={{ borderWidth: 1, borderColor: soft }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <View style={{ flexShrink: 1 }}>
                    <Heading size="lg" display={false}>{task.title}</Heading>
                    <Text color="mutedForeground">{t("m.due")}: {task.due}</Text>
                  </View>
                  <View style={{ borderRadius: radius.full, backgroundColor: soft, paddingHorizontal: 12, paddingVertical: 4 }}>
                    <Text size="sm" weight={600} style={{ color: solid }}>{t(`m.reason.${task.reason}`)}</Text>
                  </View>
                </View>
                <Text size="sm" color="mutedForeground" style={{ marginTop: 8 }}>{task.reasonText}</Text>
                <SwitchRow
                  label={`${t("m.remind")}: ${task.title}`}
                  tint={solid}
                  value={reminders.includes(task.id)}
                  onValueChange={() => toggleReminder(task.id)}
                  style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: soft, paddingTop: 4 }}
                >
                  <Text weight={500}>{t("m.remind")}</Text>
                </SwitchRow>
              </Card>
            ))}
          </View>
        );
      })}
    </Screen>
  );
}
