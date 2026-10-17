import { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { useStore } from "@/lib/store";
import { colors, fontFamily, sizes } from "@/lib/theme";
import { Heading, RingOverlay, ScoreRing, Text, useReducedMotion } from "./ui";

export function RiskScorePreview({ score, addedPoints }: { score: number; addedPoints: number }) {
  const { t } = useStore();
  const reducedMotion = useReducedMotion();
  const projectedScore = Math.min(1000, score + addedPoints);
  const [previewScore, setPreviewScore] = useState(score);

  useEffect(() => {
    setPreviewScore(score);
    if (projectedScore === score) return;
    if (reducedMotion) {
      setPreviewScore(projectedScore);
      return;
    }
    let frame = 0;
    let startedAt: number | undefined;
    const animate = (now: number) => {
      startedAt ??= now;
      const progress = Math.min(1, Math.max(0, (now - startedAt - 450) / 1400));
      const eased = 1 - Math.pow(1 - progress, 3);
      setPreviewScore(Math.round(score + (projectedScore - score) * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score, projectedScore, reducedMotion]);

  // Once the preview starts rising: the number turns light blue, "+N" grows in and "/ 1000" slides down.
  const rising = previewScore > score;
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
    <View accessibilityLabel={t("rd.safetyScore")} style={{ alignItems: "center", paddingVertical: 8 }}>
      <Heading size="lg" style={{ alignSelf: "flex-start" }}>{t("rd.safetyScore")}</Heading>
      <View style={{ maxWidth: "100%" }}>
        <ScoreRing score={score} projectedScore={previewScore} thresholdScore={score} showThresholds />
        <RingOverlay>
          <Animated.Text
            style={{
              fontFamily: fontFamily(true, 600),
              fontSize: bigSize,
              lineHeight: bigLine,
              fontVariant: ["tabular-nums"],
              color: tint.interpolate({ inputRange: [0, 1], outputRange: [colors.foreground, colors.primaryLight] }),
            }}
          >
            {previewScore}
          </Animated.Text>
          {addedPoints > 0 && (
            <Animated.Text
              style={{
                fontFamily: fontFamily(true, 600),
                fontSize: plusSize,
                lineHeight: plusLine,
                fontVariant: ["tabular-nums"],
                color: colors.primaryLight,
                opacity: reveal,
                transform: [{ scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
              }}
            >
              +{addedPoints}
            </Animated.Text>
          )}
          <Animated.View style={{ transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [0, 12] }) }] }}>
            <Text size="sm" color="mutedForeground">/ 1000</Text>
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
    </View>
  );
}
