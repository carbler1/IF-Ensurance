import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarCheck, Home, ShieldAlert, User } from "@/lib/icons";
import { useStore } from "@/lib/store";
import { colors } from "@/lib/theme";
import { Text, useReducedMotion } from "./ui";

// The icon gives a short pop when its tab becomes active.
function TabIcon({ Icon, active, color }: { Icon: (typeof tabs)[number]["Icon"]; active: boolean; color: string }) {
  const pop = useRef(new Animated.Value(0)).current;
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!active || reducedMotion) return;
    pop.setValue(0);
    Animated.timing(pop, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [active, pop, reducedMotion]);
  return (
    <Animated.View style={{ transform: [{ scale: pop.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 1.18, 1] }) }] }}>
      <Icon size={24} color={color} />
    </Animated.View>
  );
}

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
            style={({ pressed }) => [{ flex: 1, minHeight: 64, paddingVertical: 8, alignItems: "center", justifyContent: "center", gap: 4 }, pressed && { backgroundColor: colors.accent }]}
          >
            <TabIcon Icon={Icon} active={active} color={color} />
            {/* One line and a capped scale: at large font sizes "Maintenance" would break mid-word and push its icon up. */}
            <Text size="sm" weight={active ? 600 : 400} color={active ? "primary" : "mutedForeground"} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.3}>{t(key)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
