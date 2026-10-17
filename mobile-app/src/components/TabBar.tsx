import { Pressable, View } from "react-native";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarCheck, Home, ShieldAlert, User } from "lucide-react-native";
import { useStore } from "@/lib/store";
import { colors } from "@/lib/theme";
import { Text } from "./ui";

const tabs = [
  { to: "/", key: "tab.home", Icon: Home },
  { to: "/risks", key: "tab.risks", Icon: ShieldAlert },
  { to: "/maintenance", key: "tab.maintenance", Icon: CalendarCheck },
  { to: "/profile", key: "tab.profile", Icon: User },
] as const;

export function TabBar() {
  const { t } = useStore();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card, paddingBottom: insets.bottom }}>
      {tabs.map(({ to, key, Icon }) => {
        // Home is active only on "/", the others also on their child pages.
        const active = to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
        const color = active ? colors.primary : colors.mutedForeground;
        return (
          <Pressable
            key={to}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => router.navigate(to)}
            style={{ flex: 1, minHeight: 64, paddingVertical: 8, alignItems: "center", justifyContent: "center", gap: 4 }}
          >
            <Icon size={24} color={color} />
            <Text size="sm" weight={active ? 600 : 400} color={active ? "primary" : "mutedForeground"}>{t(key)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
