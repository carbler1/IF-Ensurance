import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bath, Camera, Check, CircleHelp, Droplets, FileText, House, MapPin, X, Zap } from "lucide-react-native";
import { questions } from "@/data/mock";
import { useStore } from "@/lib/store";
import { colors, radius, shadows } from "@/lib/theme";
import { Button, Card, Heading, Input, PressCard, Spinner, Text, Wordmark, useReducedMotion } from "./ui";

const bigBottom = { marginTop: "auto" } as const;

// What each question is about, and how each answer looks.
const questionIcon = { q1: Bath, q2: Zap, q3: Droplets, q4: House } as const;
const answerLook = {
  yes: { Icon: Check, solid: colors.success, soft: colors.successSoft },
  no: { Icon: X, solid: colors.destructive, soft: colors.dangerSoft },
  unsure: { Icon: CircleHelp, solid: colors.mutedForeground, soft: colors.secondary },
} as const;

// Each new question slides in from the right.
function SlideIn({ children }: { children: ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: reduced ? 0 : 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v, reduced]);
  return <Animated.View style={{ opacity: v, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>{children}</Animated.View>;
}

export function Onboarding() {
  const { t, finishOnboarding, home } = useStore();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<
    "address" | "found" | "q" | "photos" | "analysing"
  >("address");
  const [addr, setAddr] = useState(home.address);
  const [qi, setQi] = useState(0);
  const [added, setAdded] = useState<string[]>([]);

  useEffect(() => {
    if (step !== "analysing") return;
    const id = setTimeout(finishOnboarding, 2400);
    return () => clearTimeout(id);
  }, [step, finishOnboarding]);

  const progress = useRef(
    new Animated.Value((qi + 1) / questions.length),
  ).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: (qi + 1) / questions.length,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [qi, progress]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {/* Scrolls when a step is taller than the screen; flexGrow keeps the buttons pinned to the bottom otherwise. */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 32 + insets.top,
          paddingBottom: Math.max(insets.bottom, 20),
        }}
      >
        <Wordmark />
        <View style={{ marginTop: 40, flex: 1 }}>
          {step === "address" && (
            <>
              <Heading center>{t("ob.welcome")}</Heading>
              <Text color="mutedForeground" center style={{ marginTop: 12 }}>
                {t("ob.welcomeSub")}
              </Text>
              <Text weight={500} style={{ marginTop: 32, marginBottom: 8 }}>
                {t("ob.address")}
              </Text>
              <Input
                value={addr}
                onChangeText={setAddr}
                accessibilityLabel={t("ob.address")}
                style={{ backgroundColor: colors.card }}
              />
              <Button big style={bigBottom} onPress={() => setStep("found")}>
                {t("ob.find")}
              </Button>
            </>
          )}
          {step === "found" && (
            <>
              <Heading center>{t("ob.found")}</Heading>
              <Card style={{ marginTop: 24, gap: 12 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <MapPin size={20} color={colors.primary} />
                  <Text weight={600} style={{ flexShrink: 1 }}>
                    {addr}
                  </Text>
                </View>
                <Text color="mutedForeground">{home.type}</Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    rowGap: 12,
                    paddingTop: 8,
                  }}
                >
                  <View style={{ width: "50%" }}>
                    <Text size="sm" color="mutedForeground">
                      {t("ob.year")}
                    </Text>
                    <Text size="lg" weight={600}>
                      {home.year}
                    </Text>
                  </View>
                  <View style={{ width: "50%", paddingLeft: 6 }}>
                    <Text size="sm" color="mutedForeground">
                      {t("ob.size")}
                    </Text>
                    <Text size="lg" weight={600}>
                      {home.size} m²
                    </Text>
                  </View>
                  <View style={{ width: "100%" }}>
                    <Text size="sm" color="mutedForeground">
                      {t("ob.heating")}
                    </Text>
                    <Text size="lg" weight={600}>
                      {home.heating}
                    </Text>
                  </View>
                </View>
              </Card>
              <Button big style={bigBottom} onPress={() => setStep("q")}>
                {t("ob.looksRight")}
              </Button>
            </>
          )}
          {step === "q" && (
            <>
              <Text weight={500} color="mutedForeground" center>
                {t("ob.question")} {qi + 1} {t("ob.of")} {questions.length}
              </Text>
              <View
                style={{
                  marginTop: 8,
                  height: 8,
                  borderRadius: radius.full,
                  backgroundColor: colors.muted,
                }}
              >
                <Animated.View
                  style={{
                    height: 8,
                    borderRadius: radius.full,
                    backgroundColor: colors.primary,
                    width: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  }}
                />
              </View>
              <SlideIn key={qi}>
                {(() => {
                  const QIcon = questionIcon[questions[qi]!.id];
                  return (
                    <View style={{ marginTop: 32, alignSelf: "center", height: 64, width: 64, alignItems: "center", justifyContent: "center", borderRadius: radius["2xl"], backgroundColor: colors.accent }}>
                      <QIcon size={32} color={colors.primary} />
                    </View>
                  );
                })()}
                <Heading size="2xl" center style={{ marginTop: 20 }}>
                  {t(`ob.${questions[qi]!.id}` as "ob.q1")}
                </Heading>
              </SlideIn>
              <View style={{ marginTop: "auto", paddingTop: 24, gap: 12 }}>
                {questions[qi]!.options.map((o) => {
                  const { Icon, solid, soft } = answerLook[o];
                  return (
                    <PressCard
                      key={`${qi}-${o}`}
                      accessibilityRole="button"
                      onPress={() =>
                        qi < questions.length - 1
                          ? setQi(qi + 1)
                          : setStep("photos")
                      }
                      style={{
                        minHeight: 64,
                        paddingVertical: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 14,
                        borderRadius: radius["2xl"],
                        backgroundColor: colors.card,
                        paddingHorizontal: 12,
                        boxShadow: shadows.soft,
                      }}
                    >
                      <View style={{ height: 40, width: 40, alignItems: "center", justifyContent: "center", borderRadius: radius.full, backgroundColor: soft }}>
                        <Icon size={20} color={solid} />
                      </View>
                      <Text size="lg" weight={500}>{t(`ob.${o}`)}</Text>
                    </PressCard>
                  );
                })}
              </View>
            </>
          )}
          {step === "photos" && (
            <>
              <Heading center>{t("ob.photos")}</Heading>
              <Text color="mutedForeground" center style={{ marginTop: 12 }}>
                {t("ob.photosSub")}
              </Text>
              <View style={{ marginTop: 24, gap: 12 }}>
                {(
                  [
                    ["panel", Camera],
                    ["pipes", Camera],
                    ["report", FileText],
                  ] as const
                ).map(([k, Icon]) => {
                  const on = added.includes(k);
                  return (
                    <Pressable
                      key={k}
                      accessibilityRole="button"
                      onPress={() =>
                        setAdded(
                          on ? added.filter((x) => x !== k) : [...added, k],
                        )
                      }
                      style={{
                        minHeight: 64,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 16,
                        borderRadius: radius["2xl"],
                        borderWidth: 2,
                        borderStyle: "dashed",
                        borderColor: colors.border,
                        backgroundColor: colors.card,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                      }}
                    >
                      <View
                        style={{
                          height: 44,
                          width: 44,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: radius.xl,
                          backgroundColor: colors.secondary,
                        }}
                      >
                        {on ? (
                          <Check size={24} color={colors.secondaryForeground} />
                        ) : (
                          <Icon size={24} color={colors.secondaryForeground} />
                        )}
                      </View>
                      <Text weight={500} style={{ flex: 1 }}>
                        {t(`ob.${k}`)}
                      </Text>
                      {on && (
                        <Text size="sm" weight={600} color="success">
                          {t("ob.added")}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ marginTop: "auto", gap: 8 }}>
                <Button big onPress={() => setStep("analysing")}>
                  {t("ob.continue")}
                </Button>
                {added.length === 0 && (
                  <Button
                    big
                    variant="ghost"
                    onPress={() => setStep("analysing")}
                  >
                    {t("ob.skip")}
                  </Button>
                )}
              </View>
            </>
          )}
          {step === "analysing" && (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Spinner size={56} color={colors.primary} />
              <Heading size="2xl" center style={{ marginTop: 24 }}>
                {t("ob.analysing")}
              </Heading>
              <Text color="mutedForeground" center style={{ marginTop: 8 }}>
                {t("ob.analysingSub")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
