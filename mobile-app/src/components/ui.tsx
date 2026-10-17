import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text as RNText,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Link, router, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, G, Line, Text as SvgText } from "react-native-svg";
import { Bone, Car, ChevronLeft, CircleGauge, Cog, Dog, Droplets, Flame, Home as HomeIcon, Layers, Loader2, Sailboat, Snowflake, Syringe, TreePine, Warehouse, Wrench, Zap, type LucideIcon } from "lucide-react-native";
import { bands, tiers, type InsuranceId, type RiskArea } from "@/data/mock";
import { useStore } from "@/lib/store";
import { colors, fontFamily, radius, shadows, sizes, tierColors, type ColorName, type SizeName, type Weight } from "@/lib/theme";

export const areaIcon: Record<RiskArea, LucideIcon> = {
  electricity: Zap,
  plumbing: Wrench,
  water: Droplets,
  roof: HomeIcon,
  insulation: Layers,
  frost: Snowflake,
  fire: Flame,
  engine: Cog,
  storage: Warehouse,
  tyres: CircleGauge,
  service: Wrench,
  vaccine: Syringe,
  joints: Bone,
};

export const insuranceIcon: Record<InsuranceId, LucideIcon> = {
  house: HomeIcon,
  cottage: TreePine,
  boat: Sailboat,
  car: Car,
  dog: Dog,
};

/** Ring segments: where each starts and its soft colour. */
export type RingSegment = { key: string; min: number; soft: string };

/** The Care Score ring: the four tiers. */
export const tierSegments: RingSegment[] = tiers.map((t) => ({ key: t.id, min: t.min, soft: tierColors[t.id].soft }));

/** An insurance's ring: no discount, then each discount band, in the same soft colours as the tiers. */
export const bandSegments: RingSegment[] = [
  { key: "none", min: 0, soft: tierColors.bronze.soft },
  ...bands.map((b, i) => ({ key: `band-${b.min}`, min: b.min, soft: Object.values(tierColors)[i + 1]?.soft ?? tierColors.platinum.soft })),
];

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}

type TextOwnProps = {
  size?: SizeName;
  weight?: Weight;
  display?: boolean;
  italic?: boolean;
  color?: ColorName;
  center?: boolean;
  tabular?: boolean;
};

export function Text({ size = "body", weight = 400, display = false, italic = false, color = "foreground", center, tabular, style, ...props }: TextProps & TextOwnProps) {
  const [fontSize, lineHeight] = sizes[size];
  return (
    <RNText
      {...props}
      style={[
        { fontFamily: fontFamily(display, weight, italic), fontSize, lineHeight, color: colors[color] },
        center && { textAlign: "center" },
        tabular && { fontVariant: ["tabular-nums"] },
        style,
      ]}
    />
  );
}

// h1-h3 use the display face with slightly tight tracking, like the web base styles.
export function Heading({ size = "3xl", weight = 600, display = true, style, ...props }: TextProps & TextOwnProps) {
  return <Text accessibilityRole="header" size={size} weight={weight} display={display} style={[{ letterSpacing: -0.01 * sizes[size][0] }, style]} {...props} />;
}

export function Screen({ title, sub, back, children }: { title?: string; sub?: string; back?: boolean; children: ReactNode }) {
  const { t } = useStore();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24 + insets.top, paddingBottom: 48 }}>
      {back && (
        <Pressable
          accessibilityRole="button"
          onPress={() => (router.canGoBack() ? router.back() : router.navigate("/"))}
          style={{ marginBottom: 12, marginLeft: -8, height: 44, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, alignSelf: "flex-start" }}
        >
          <ChevronLeft size={20} color={colors.primary} />
          <Text size="base" weight={500} color="primary">{t("back")}</Text>
        </Pressable>
      )}
      {title && <Heading>{title}</Heading>}
      {sub && <Text color="mutedForeground" style={{ marginTop: 8 }}>{sub}</Text>}
      <View style={[title ? { marginTop: 24 } : null, { gap: 16 }]}>{children}</View>
    </ScrollView>
  );
}

export function Card({ style, flat, children }: { style?: StyleProp<ViewStyle>; flat?: boolean; children: ReactNode }) {
  return <View style={[{ borderRadius: radius["2xl"], backgroundColor: colors.card, padding: 20 }, !flat && { boxShadow: shadows.soft }, style]}>{children}</View>;
}

export function Wordmark() {
  return (
    <Link href="/" asChild>
      <Pressable accessibilityRole="link" style={{ alignSelf: "flex-start" }}>
        <Text size="xl" display weight={600} color="primary">
          If <Text size="xl" display italic color="primary">Life Partner</Text>
        </Text>
      </Pressable>
    </Link>
  );
}

// A tappable block that navigates, like a web <Link className="block">.
export function LinkBlock({ href, style, children }: { href: Href; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link" style={style}>{children}</Pressable>
    </Link>
  );
}

type ButtonVariant = "default" | "outline" | "ghost";

export function Button({ children, onPress, variant = "default", big, disabled, icon: Icon, style, testID }: { children: string; onPress?: () => void; variant?: ButtonVariant; big?: boolean; disabled?: boolean; icon?: LucideIcon; style?: StyleProp<ViewStyle>; testID?: string }) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, height: big ? 56 : 36, borderRadius: big ? radius["2xl"] : radius.md },
        variant === "default" && { backgroundColor: pressed ? colors.primaryPressed : colors.primary, boxShadow: shadows.button },
        variant === "outline" && { borderWidth: 1, borderColor: colors.input, backgroundColor: pressed ? colors.accent : colors.background, boxShadow: shadows.sm },
        variant === "ghost" && pressed && { backgroundColor: colors.accent },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {({ pressed }) => {
        const color: ColorName = variant === "default" ? "primaryForeground" : pressed ? "accentForeground" : "foreground";
        return (
          <>
            {Icon && <Icon size={16} color={colors[color]} />}
            <Text size={big ? "lg" : "sm"} weight={500} color={color} numberOfLines={1}>{children}</Text>
          </>
        );
      }}
    </Pressable>
  );
}

export function Input({ style, ...props }: TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={colors.mutedForeground}
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      style={[
        { height: 56, borderRadius: radius["2xl"], borderWidth: 1, borderColor: colors.input, paddingHorizontal: 12, fontFamily: fontFamily(false, 400), fontSize: 18, color: colors.foreground },
        { boxShadow: focused ? `0 0 0 1px ${colors.ring}, ${shadows.sm}` : shadows.sm },
        style as StyleProp<TextStyle>,
      ]}
    />
  );
}

export function Switch({ value, onValueChange, label }: { value: boolean; onValueChange: (v: boolean) => void; label?: string }) {
  const x = useRef(new Animated.Value(value ? 16 : 0)).current;
  useEffect(() => {
    Animated.timing(x, { toValue: value ? 16 : 0, duration: 150, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }).start();
  }, [value, x]);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      hitSlop={12}
      style={{ height: 20, width: 36, borderRadius: radius.full, borderWidth: 2, borderColor: "transparent", justifyContent: "center", backgroundColor: value ? colors.primary : colors.input, boxShadow: shadows.sm }}
    >
      <Animated.View style={{ height: 16, width: 16, borderRadius: radius.full, backgroundColor: colors.background, boxShadow: shadows.lg, transform: [{ translateX: x }] }} />
    </Pressable>
  );
}

// The web "pop-in" utility: scale 0.85 -> 1 and fade in with a slight overshoot.
export function PopIn({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 600, easing: Easing.bezier(0.2, 0.9, 0.3, 1.3), useNativeDriver: true }).start();
  }, [v]);
  return <Animated.View style={[style, { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: "clamp" }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]}>{children}</Animated.View>;
}

export function Spinner({ size, color }: { size: number; color: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <Animated.View style={{ transform: [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }}>
      <Loader2 size={size} color={color} />
    </Animated.View>
  );
}

export function ScoreRing({ score, max = 1000, size = 200, projectedScore = score, thresholdScore = score, showThresholds = false, segments = tierSegments }: { score: number; max?: number; size?: number; projectedScore?: number; thresholdScore?: number; showThresholds?: boolean; segments?: RingSegment[] }) {
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / max));
  const projectedPct = Math.max(pct, Math.min(1, projectedScore / max));
  const padding = showThresholds ? 34 : 0;
  const outerSize = size + padding * 2;
  const center = outerSize / 2;
  const reducedMotion = useReducedMotion();

  // The main arc eases to a new score over one second, like the web CSS transition.
  const [offset, setOffset] = useState(c * (1 - pct));
  const anim = useRef(new Animated.Value(offset)).current;
  useEffect(() => {
    const id = anim.addListener(({ value }) => setOffset(value));
    return () => anim.removeListener(id);
  }, [anim]);
  useEffect(() => {
    Animated.timing(anim, { toValue: c * (1 - pct), duration: reducedMotion ? 0 : 1000, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: false }).start();
  }, [c, pct, anim, reducedMotion]);

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`${score} / ${max}${projectedScore > score ? ` → ${projectedScore}` : ""}`} style={{ width: outerSize, maxWidth: "100%", aspectRatio: 1 }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${outerSize} ${outerSize}`}>
        <G transform={`rotate(-90 ${center} ${center})`}>
          {segments.map((seg, i) => {
            const start = seg.min;
            const end = segments[i + 1]?.min ?? max;
            return (
              <Circle
                key={seg.key}
                cx={center}
                cy={center}
                r={r}
                fill="none"
                strokeWidth={14}
                strokeDasharray={`${c * ((end - start) / max)} ${c}`}
                strokeDashoffset={-c * (start / max)}
                stroke={seg.soft}
              />
            );
          })}
          <Circle cx={center} cy={center} r={r} fill="none" strokeWidth={14} strokeLinecap="round" strokeDasharray={`${c}`} strokeDashoffset={offset} stroke={colors.primary} />
          {projectedPct > pct && <Circle cx={center} cy={center} r={r} fill="none" strokeWidth={14} strokeDasharray={`${c * (projectedPct - pct)} ${c}`} strokeDashoffset={-c * pct} stroke={colors.primaryLight} />}
        </G>
        {showThresholds && segments.filter((seg) => seg.min > thresholdScore).map((seg) => {
          const angle = seg.min / max * 2 * Math.PI - Math.PI / 2;
          const x = Math.cos(angle);
          const y = Math.sin(angle);
          const labelX = center + x * (r + 22);
          const labelY = center + y * (r + 22);
          return (
            <G key={seg.key}>
              <Line x1={center + x * (r - 10)} y1={center + y * (r - 10)} x2={center + x * (r + 10)} y2={center + y * (r + 10)} strokeWidth={2} stroke={colors.foreground} />
              <SvgText x={labelX} y={labelY + 4} textAnchor={x < -0.3 ? "end" : x > 0.3 ? "start" : "middle"} fill={colors.mutedForeground} fontFamily={fontFamily(false, 600)} fontSize={11}>
                {seg.min}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

// Centres its children over a ScoreRing, like the web "absolute inset-0" overlay.
export function RingOverlay({ children }: { children: ReactNode }) {
  return <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" }}>{children}</View>;
}
