import { View } from "react-native";
import { Cat } from "@/lib/icons";
import { Heading, PressCard, Screen, Text, insuranceIcon } from "@/components/ui";
import { choices, type Choice } from "@/lib/choice";
import { useStore } from "@/lib/store";
import { colors, radius, shadows } from "@/lib/theme";

const icon = { house: insuranceIcon.house, car: insuranceIcon.car, dog: insuranceIcon.dog, cat: Cat };

// The first screen: one tap on an icon picks it and opens the dashboard.
export function Entry({ onChoose }: { onChoose: (c: Choice) => void }) {
  const { t } = useStore();
  return (
    <Screen>
      <Heading size="2xl" center style={{ marginTop: 24 }}>{t("entry.title")}</Heading>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, marginTop: 16 }}>
        {choices.map((c) => {
          const Icon = icon[c];
          const label = c === "cat" ? t("entry.cat") : t(`ins.${c}`);
          return (
            <PressCard
              key={c}
              accessibilityRole="button"
              accessibilityLabel={label}
              onPress={() => onChoose(c)}
              style={{ flexBasis: "45%", flexGrow: 1, minHeight: 160, alignItems: "center", justifyContent: "center", gap: 12, borderRadius: radius["2xl"], backgroundColor: colors.card, boxShadow: shadows.soft }}
            >
              <Icon size={64} color={colors.primary} />
              <Text size="lg" weight={600}>{label}</Text>
            </PressCard>
          );
        })}
      </View>
    </Screen>
  );
}
