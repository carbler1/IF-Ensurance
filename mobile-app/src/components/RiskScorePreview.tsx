import { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { useStore } from "@/lib/store";
import { colors, fontFamily, sizes } from "@/lib/theme";
import { fmt } from "@/lib/i18n";
import { Heading, RingOverlay, ScoreRing, Text, bandSegmentsOf, useReducedMotion } from "./ui";

// The counting number re-renders alone; the ring around it is driven by the same Animated value.
function RisingNumber({ from, to, progress, style }: { from: number; to: number; progress: Animated.Value; style: object }) {
  const [shown, setShown] = useState(from);
  useEffect(() => {
    const id = progress.addListener(({ value }) => setShown(Math.round(from + (to - from) * value)));
    return () => progress.removeListener(id);
  }, [progress, from, to]);
  return <Animated.Text maxFontSizeMultiplier={1.2} style={style}>{shown}</Animated.Text>;
}

/** An insurance score now and after one fix, on the discount band ring. label: "House score" etc. */
export function RiskScorePreview({ score, addedPoints, label }: { score: number; addedPoints: number; label: string }) {
  const { t, getBand, bands, model } = useStore();
  const reducedMotion = useReducedMotion();
  const projectedScore = Math.min(model.maxScore, score + addedPoints);
  const progress = useRef(new Animated.Value(0)).current;
  const [rising, setRising] = useState(false);

  // The preview waits a beat, then rises to the projected score.
  useEffect(() => {
    progress.setValue(0);
    setRising(false);
    if (projectedScore === score) return;
    if (reducedMotion) {
      progress.setValue(1);
      setRising(true);
      return;
    }
    const run = Animated.timing(progress, { toValue: 1, delay: 450, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    const started = setTimeout(() => setRising(true), 450);
    run.start();
    return () => { run.stop(); clearTimeout(started); };
  }, [score, projectedScore, reducedMotion, progress]);

  // Once the preview starts rising: the number turns light blue, "+N" grows in and "/ max" slides down.
  const tint = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const easeOut = Easing.bezier(0, 0, 0.2, 1);
    Animated.timing(tint, { toValue: rising ? 1 : 0, duration: reducedMotion ? 0 : 500, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: false }).start();
    Animated.timing(reveal, { toValue: rising ? 1 : 0, duration: reducedMotion ? 0 : 700, easing: easeOut, useNativeDriver: true }).start();
  }, [rising, reducedMotion, tint, reveal]);

  const [bigSize, bigLine] = sizes["5xl"];
  const [plusSize, plusLine] = sizes["2xl"];

  return (
    <View accessibilityLabel={label} style={{ alignItems: "center", paddingVertical: 8 }}>
      <Heading size="lg" center>{label}</Heading>
      <View style={{ maxWidth: "100%" }}>
        <ScoreRing score={score} max={model.maxScore} projectedScore={projectedScore} projectedProgress={progress} thresholdScore={score} showThresholds segments={bandSegmentsOf(bands)} surface={colors.background} />
        <RingOverlay>
          <RisingNumber
            from={score}
            to={projectedScore}
            progress={progress}
            style={{
              fontFamily: fontFamily(true, 600),
              fontSize: bigSize,
              lineHeight: bigLine,
              fontVariant: ["tabular-nums"],
              color: tint.interpolate({ inputRange: [0, 1], outputRange: [colors.foreground, colors.primary] }),
            }}
          />
          {addedPoints > 0 && (
            <Animated.Text
              maxFontSizeMultiplier={1.2}
              style={{
                fontFamily: fontFamily(false, 700),
                fontSize: plusSize,
                lineHeight: plusLine,
                fontVariant: ["tabular-nums"],
                color: colors.primary,
                opacity: reveal,
                transform: [{ scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
              }}
            >
              +{addedPoints}
            </Animated.Text>
          )}
          <Animated.View style={{ transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [0, 12] }) }] }}>
            <Text size="sm" color="mutedForeground" maxFontSizeMultiplier={1.3}>/ {model.maxScore}</Text>
          </Animated.View>
        </RingOverlay>
      </View>
      {addedPoints > 0 && (
        <View style={{ marginTop: -24, flexDirection: "row", flexWrap: "wrap", justifyContent: "center", columnGap: 20, rowGap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ height: 8, width: 8, borderRadius: 4, backgroundColor: colors.primary }} />
            <Text size="xs" color="mutedForeground">{t("rd.currentScore")}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ height: 8, width: 8, borderRadius: 4, backgroundColor: colors.primaryLight }} />
            <Text size="xs" color="mutedForeground">{t("rd.afterFix")}</Text>
          </View>
        </View>
      )}
      {/* The discount this insurance earns, and the higher one once the fix lands in a new band. */}
      <View style={{ marginTop: 12, borderRadius: 999, backgroundColor: getBand(score) || (rising && getBand(projectedScore)) ? colors.successSoft : colors.secondary, paddingHorizontal: 14, paddingVertical: 4, maxWidth: "100%" }}>
        <Text size="sm" weight={600} center color={getBand(score) || (rising && getBand(projectedScore)) ? "success" : "mutedForeground"}>
          {getBand(score) ? fmt(t("band.off"), { pct: getBand(score) }) : t("band.none")}
          {getBand(projectedScore) > getBand(score) ? ` → ${fmt(t("band.off"), { pct: getBand(projectedScore) })}` : ""}
        </Text>
      </View>
    </View>
  );
}
