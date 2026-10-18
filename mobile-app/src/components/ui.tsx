import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  Text as RNText,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Link, router, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, G, Line, Text as SvgText } from "react-native-svg";
import { Bone, Car, ChevronLeft, CircleGauge, Cog, Dog, Droplets, Flame, Home as HomeIcon, Layers, Loader2, Sailboat, Snowflake, Syringe, TreePine, Warehouse, Wrench, Zap, type LucideIcon } from "@/lib/icons";
import type { InsuranceId, RiskArea } from "@/data/mock";
import type { Band, Tier } from "@/lib/types";
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

/** The soft ring colours, lowest first: the tier colours. */
export const softColors = Object.values(tierColors).map((c) => c.soft);

/** The Care Score ring: the tiers. */
export const tierSegmentsOf = (tiers: Tier[]): RingSegment[] =>
  tiers.map((t, i) => ({ key: t.id, min: t.min, soft: tierColors[t.id]?.soft ?? softColors[i % softColors.length] }));

/** An insurance's ring: no discount, then each discount band, in the same soft colours as the tiers. */
export const bandSegmentsOf = (bands: Band[]): RingSegment[] => [
  { key: "none", min: 0, soft: softColors[0] },
  ...bands.map((b, i) => ({ key: `band-${b.min}`, min: b.min, soft: softColors[Math.min(i + 1, softColors.length - 1)] })),
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
  color?: ColorName;
  center?: boolean;
  tabular?: boolean;
};

export function Text({ size = "body", weight = 400, display = false, color = "foreground", center, tabular, style, ...props }: TextProps & TextOwnProps) {
  const [fontSize, lineHeight] = sizes[size];
  return (
    <RNText
      {...props}
      style={[
        { fontFamily: fontFamily(display, weight), fontSize, lineHeight, color: colors[color] },
        center && { textAlign: "center" },
        tabular && { fontVariant: ["tabular-nums"] },
        style,
      ]}
    />
  );
}

// Headings use the display face with slightly tight tracking.
export function Heading({ size = "3xl", weight = 600, display = true, style, ...props }: TextProps & TextOwnProps) {
  return <Text accessibilityRole="header" size={size} weight={weight} display={display} style={[{ letterSpacing: -0.01 * sizes[size][0] }, style]} {...props} />;
}

export function Screen({ title, sub, back, children }: { title?: string; sub?: string; back?: boolean; children: ReactNode }) {
  const { t } = useStore();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  // Android does not scroll a focused field into view when the keyboard opens; this does, on both platforms.
  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", () => {
      const input = TextInput.State.currentlyFocusedInput();
      if (input) scroll.current?.scrollResponderScrollNativeHandleToKeyboard(input, 160, true);
    });
    return () => sub.remove();
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView ref={scroll} automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24 + insets.top, paddingBottom: 48 }}>
        {back && (
          <Pressable
            accessibilityRole="button"
            onPress={() => (router.canGoBack() ? router.back() : router.navigate("/"))}
            style={({ pressed }) => [{ marginBottom: 12, marginLeft: -8, minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, alignSelf: "flex-start", borderRadius: radius.md }, pressed && { backgroundColor: colors.accent }]}
          >
            <ChevronLeft size={20} color={colors.primary} />
            <Text size="base" weight={500} color="primary">{t("back")}</Text>
          </Pressable>
        )}
        {title && <Heading center>{title}</Heading>}
        {sub && <Text color="mutedForeground" center style={{ marginTop: 8 }}>{sub}</Text>}
        <View style={[title ? { marginTop: 24 } : null, { gap: 16 }]}>{children}</View>
      </ScrollView>
      {/* Covers content that scrolls up under the status bar. */}
      <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, height: insets.top, backgroundColor: colors.background }} />
    </View>
  );
}

export function Card({ style, flat, children }: { style?: StyleProp<ViewStyle>; flat?: boolean; children: ReactNode }) {
  return <View style={[{ borderRadius: radius["2xl"], backgroundColor: colors.card, padding: 20 }, !flat && { boxShadow: shadows.soft }, style]}>{children}</View>;
}

// The If Ensurance mark, after If's own: a blue disc with a white italic "if", whose three dots climb a step
// each, like a score going up. A rendered image (assets/mark.png, built with the app icons), so it matches them exactly.
export function Mark({ size = 40 }: { size?: number }) {
  return <Image source={require("../../assets/mark.png")} aria-hidden style={{ width: size, height: size }} />;
}

// The lockup reads "if… Ensurance": the italic serif lives in the disc, the name in the app's sans for contrast.
export function Wordmark() {
  const { t } = useStore();
  return (
    <Link href="/" asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={t("brand")} hitSlop={{ top: 4, bottom: 4 }} style={{ alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Mark size={40} />
        <Text size="xl" weight={600} style={{ letterSpacing: -0.4 }}>Ensurance</Text>
      </Pressable>
    </Link>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// A tappable card: it sinks and takes a blue tint while held, then springs back on release.
export function PressCard({ style, children, ...props }: PressableProps & { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const held = useRef(new Animated.Value(0)).current;
  const reducedMotion = useReducedMotion();
  const pressIn = () => Animated.timing(held, { toValue: 1, duration: reducedMotion ? 0 : 140, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  const pressOut = () => (reducedMotion ? Animated.timing(held, { toValue: 0, duration: 0, useNativeDriver: true }) : Animated.spring(held, { toValue: 0, speed: 14, bounciness: 10, useNativeDriver: true })).start();
  return (
    <AnimatedPressable
      {...props}
      onPressIn={(e) => { pressIn(); props.onPressIn?.(e); }}
      onPressOut={(e) => { pressOut(); props.onPressOut?.(e); }}
      style={[style, { transform: [{ scale: held.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] }) }] }]}
    >
      {children}
      <Animated.View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, borderRadius: radius["2xl"], borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primaryTint, opacity: held }} />
    </AnimatedPressable>
  );
}

export function LinkBlock({ href, style, accessibilityLabel, children }: { href: Href; style?: StyleProp<ViewStyle>; accessibilityLabel?: string; children: ReactNode }) {
  return (
    <Link href={href} asChild>
      <PressCard accessibilityRole="link" accessibilityLabel={accessibilityLabel} style={style}>{children}</PressCard>
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
        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8, minHeight: big ? 56 : 44, borderRadius: big ? radius["2xl"] : radius.md },
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
            <Text size={big ? "lg" : "sm"} weight={500} color={color} center style={{ flexShrink: 1 }}>{children}</Text>
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
        { minHeight: 56, borderRadius: radius["2xl"], borderWidth: 1, borderColor: colors.control, paddingHorizontal: 12, paddingVertical: 12, fontFamily: fontFamily(false, 400), fontSize: 18, color: colors.foreground },
        { boxShadow: focused ? `0 0 0 1px ${colors.ring}, ${shadows.sm}` : shadows.sm },
        style as StyleProp<TextStyle>,
      ]}
    />
  );
}

// A settings row that is one switch: a screen reader gets one element with its role, label and state.
// The track is only drawn; the whole row takes the tap.
export function SwitchRow({ value, onValueChange, label, style, children }: { value: boolean; onValueChange: (v: boolean) => void; label: string; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const x = useRef(new Animated.Value(value ? 16 : 0)).current;
  useEffect(() => {
    Animated.timing(x, { toValue: value ? 16 : 0, duration: 150, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }).start();
  }, [value, x]);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      aria-checked={value}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [{ minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, pressed && { opacity: 0.7 }, style]}
    >
      <View style={{ flexShrink: 1 }}>{children}</View>
      <View style={{ height: 20, width: 36, borderRadius: radius.full, justifyContent: "center", paddingHorizontal: 2, backgroundColor: value ? colors.primary : colors.control, boxShadow: shadows.sm }}>
        <Animated.View style={{ height: 16, width: 16, borderRadius: radius.full, backgroundColor: colors.background, boxShadow: shadows.lg, transform: [{ translateX: x }] }} />
      </View>
    </Pressable>
  );
}

// Fades in and rises 6 px with a slight overshoot.
export function PopIn({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    // Reduce Motion: no scale or overshoot, only a short fade, so the confirmation still registers.
    Animated.timing(v, { toValue: 1, duration: reducedMotion ? 150 : 600, easing: reducedMotion ? Easing.linear : Easing.bezier(0.2, 0.9, 0.3, 1.3), useNativeDriver: true }).start();
  }, [v, reducedMotion]);
  return <Animated.View style={[style, { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: "clamp" }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [reducedMotion ? 1 : 0.85, 1] }) }] }]}>{children}</Animated.View>;
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

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** The ring's first sweep lands at this time; what follows the score (tier, next goal) keys off it. */
export const ringLandMs = 1100;
const ringEase = Easing.bezier(0.16, 1, 0.3, 1);

const playedIntros = new Set<string>();

// once: an id whose entrance plays only on its first mount in this app session; later mounts start at rest.
// Read at render, so siblings mounted together all see the same answer.
function useIntro(once?: string) {
  const intro = useRef(once === undefined || !playedIntros.has(once)).current;
  useEffect(() => {
    if (once) playedIntros.add(once);
  }, [once]);
  return intro;
}

// The first sweep tells the score; later changes are updates and move faster.
function useSweepDuration(intro: boolean) {
  const first = useRef(true);
  const reducedMotion = useReducedMotion();
  return () => {
    const ms = reducedMotion ? 0 : first.current ? (intro ? ringLandMs : 0) : 700;
    first.current = false;
    return ms;
  };
}

/** surface: the colour behind the ring, which the threshold notches cut through to. once: see useIntro. */
export function ScoreRing({ score, max = 1000, size = 200, projectedScore = score, thresholdScore = score, showThresholds = false, segments, surface = colors.card, once, projectedProgress }: { score: number; max?: number; size?: number; projectedScore?: number; thresholdScore?: number; showThresholds?: boolean; segments: RingSegment[]; surface?: string; once?: string; projectedProgress?: Animated.Value }) {
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / max));
  const projectedPct = Math.max(pct, Math.min(1, projectedScore / max));
  const padding = showThresholds ? 34 : 0;
  const outerSize = size + padding * 2;
  const center = outerSize / 2;
  const reducedMotion = useReducedMotion();
  const intro = useIntro(once);
  const sweepMs = useSweepDuration(intro);
  const thresholds = showThresholds ? segments.filter((seg) => seg.min > thresholdScore) : [];
  const goal = thresholds[0];
  const at = (value: number, radius: number) => {
    const angle = (value / max) * 2 * Math.PI - Math.PI / 2;
    return { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius, dx: Math.cos(angle) };
  };

  // The arc sweeps from empty to the score; on landing, one ripple at the next threshold points to the goal.
  // Animated props on the SVG circles: no React re-render per frame.
  const offset = useRef(new Animated.Value(intro ? c : c * (1 - pct))).current;
  const ripple = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const duration = sweepMs();
    const arc = Animated.timing(offset, { toValue: c * (1 - pct), duration, easing: ringEase, useNativeDriver: false });
    ripple.setValue(0);
    const run = duration === 0 || !goal ? arc : Animated.sequence([arc, Animated.timing(ripple, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false })]);
    run.start();
    return () => run.stop();
    // sweepMs is left out of the deps on purpose: it is a fresh closure each render, and the sweep reruns only on a new score.
  }, [c, pct, offset, ripple, reducedMotion, goal?.min]);

  const goalPoint = goal && at(goal.min, r);
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
          <AnimatedCircle cx={center} cy={center} r={r} fill="none" strokeWidth={14} strokeLinecap="round" strokeDasharray={`${c}`} strokeDashoffset={offset} stroke={colors.primary} />
          {/* projectedProgress (0..1) grows the projected arc without re-rendering the ring. */}
          {projectedPct > pct && (
            <AnimatedCircle
              cx={center}
              cy={center}
              r={r}
              fill="none"
              strokeWidth={14}
              strokeDasharray={projectedProgress ? projectedProgress.interpolate({ inputRange: [0, 1], outputRange: [`0 ${c}`, `${c * (projectedPct - pct)} ${c}`] }) : `${c * (projectedPct - pct)} ${c}`}
              strokeDashoffset={-c * pct}
              stroke={colors.primaryLight}
            />
          )}
          {/* The scale's start and end meet at the top: a short gap keeps 0 and the maximum apart and gives the arc a clean start. */}
          {showThresholds && <Circle cx={center} cy={center} r={r} fill="none" strokeWidth={16} strokeDasharray={`9 ${c}`} strokeDashoffset={9} stroke={surface} />}
        </G>
        {goalPoint && (
          <AnimatedCircle
            cx={goalPoint.x}
            cy={goalPoint.y}
            r={ripple.interpolate({ inputRange: [0, 1], outputRange: [7, 22] })}
            fill={colors.primary}
            opacity={ripple.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.28, 0] })}
          />
        )}
        {thresholds.map((seg) => {
          const inner = at(seg.min, r - 8);
          const outer = at(seg.min, r + 8);
          const label = at(seg.min, r + 22);
          const isGoal = seg === goal;
          return (
            <G key={seg.key}>
              {/* A notch cut through the track marks where the next tier or band starts. */}
              <Line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} strokeWidth={3} stroke={surface} />
              <SvgText x={label.x} y={label.y + 4} textAnchor={label.dx < -0.3 ? "end" : label.dx > 0.3 ? "start" : "middle"} fill={isGoal ? colors.foreground : colors.mutedForeground} fontFamily={fontFamily(false, isGoal ? 700 : 500)} fontSize={isGoal ? 12 : 11}>
                {seg.min}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

// A number that counts up to its value with the same timing as the ScoreRing arc.
export function CountUp({ value, once, ...props }: TextProps & TextOwnProps & { value: number; once?: string }) {
  const intro = useIntro(once);
  const sweepMs = useSweepDuration(intro);
  const reducedMotion = useReducedMotion();
  const [shown, setShown] = useState(intro ? 0 : value);
  const anim = useRef(new Animated.Value(intro ? 0 : value)).current;
  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setShown(Math.round(v)));
    return () => anim.removeListener(id);
  }, [anim]);
  useEffect(() => {
    const run = Animated.timing(anim, { toValue: value, duration: sweepMs(), easing: ringEase, useNativeDriver: false });
    run.start();
    return () => run.stop();
  }, [value, anim, reducedMotion]);
  return <Text accessibilityLabel={String(value)} tabular maxFontSizeMultiplier={1.2} {...props}>{shown}</Text>;
}

// Arrives after the ring lands: rises 6 px and fades in. With Reduce Motion it is simply there.
export function Arrive({ delay = 0, once, style, children }: { delay?: number; once?: string; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const intro = useIntro(once);
  const v = useRef(new Animated.Value(intro ? 0 : 1)).current;
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const run = Animated.timing(v, { toValue: 1, duration: reducedMotion || !intro ? 0 : 420, delay: reducedMotion || !intro ? 0 : delay, easing: ringEase, useNativeDriver: true });
    run.start();
    return () => run.stop();
  }, [v, reducedMotion, delay, intro]);
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }]}>{children}</Animated.View>;
}

// Centres its children over a ScoreRing.
export function RingOverlay({ children }: { children: ReactNode }) {
  return <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" }}>{children}</View>;
}
