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
import Svg, { Path } from "react-native-svg";
import { Bath, Camera, Check, Droplets, FileText, House, MapPin, X, Zap } from "@/lib/icons";
import { questions } from "@/data/mock";
import { api, type HomeOption } from "@/lib/api";
import { useStore } from "@/lib/store";
import { colors, radius, shadows } from "@/lib/theme";
import { Button, Card, Heading, Input, PressCard, Spinner, Text, Wordmark, useReducedMotion } from "./ui";

const bigBottom = { marginTop: "auto" } as const;

// What each question is about, and how each answer looks.
const questionIcon = { q1: Bath, q2: Zap, q3: Droplets, q4: House } as const;
// The bare "?" from Lucide's circle-question-mark (its circle left out), so it sits in the same 2 px stroke family as Check and X.
function QuestionMark({ size, color }: { size: number; color: string }) {
  return (
    // Lucide drew this "?" to sit inside a circle; a 1.3x crop brings it to the height of Check and X, with the stroke kept at 2 px.
    <Svg width={size} height={size} viewBox="2.75 3.25 18.5 18.5" fill="none" stroke={color} strokeWidth={2 / 1.3} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <Path d="M12 17h.01" />
    </Svg>
  );
}

// One hue, three weights: a definite yes is filled, a no is outlined, an unsure answer has a broken outline.
const answerLook = {
  yes: { Icon: Check, badge: { backgroundColor: colors.primary }, ink: colors.primaryForeground },
  no: { Icon: X, badge: { borderWidth: 1.5, borderColor: colors.primary }, ink: colors.primary },
  unsure: { Icon: QuestionMark, badge: { borderWidth: 1.5, borderColor: colors.primary, borderStyle: "dashed" }, ink: colors.primary },
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
  const { t, finishOnboarding, claimHome, home } = useStore();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<
    "address" | "password" | "found" | "q" | "photos" | "analysing"
  >("address");
  const [homes, setHomes] = useState<HomeOption[] | null>(null);
  const [chosen, setChosen] = useState<HomeOption | null>(null);
  const [password, setPassword] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.homes().then(setHomes, (e: Error) => { setHomes([]); setProblem(e.message); });
  }, []);
  const submit = () => {
    if (!chosen || busy) return;
    setBusy(true);
    setProblem(null);
    claimHome(chosen.home_id, password).then(
      () => setStep("found"),
      (e: Error) => setProblem(e.message),
    ).finally(() => setBusy(false));
  };
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
              {homes === null && <Spinner size={32} color={colors.primary} />}
              {problem && <Text color="mutedForeground">{problem}</Text>}
              <View style={{ gap: 8 }}>
                {homes?.map((h) => (
                  <PressCard
                    key={h.home_id}
                    accessibilityRole="button"
                    onPress={() => { setChosen(h); setPassword(""); setProblem(null); setStep("password"); }}
                    style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: colors.card, borderRadius: radius["2xl"] }}
                  >
                    <MapPin size={20} color={h.taken ? colors.mutedForeground : colors.primary} />
                    <Text style={{ flex: 1 }}>{h.address}</Text>
                    <Text size="sm" weight={600} color={h.taken ? "mutedForeground" : "primary"}>
                      {h.taken ? t("ob.taken") : t("ob.free")}
                    </Text>
                  </PressCard>
                ))}
              </View>
            </>
          )}
          {step === "password" && chosen && (
            <>
              <Heading center>{chosen.address}</Heading>
              <Text color="mutedForeground" center style={{ marginTop: 12 }}>
                {chosen.taken ? t("ob.passwordTaken") : t("ob.passwordNew")}
              </Text>
              <Text weight={500} style={{ marginTop: 32, marginBottom: 8 }}>
                {t("ob.password")}
              </Text>
              <Input
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={submit}
                accessibilityLabel={t("ob.password")}
                style={{ backgroundColor: colors.card }}
              />
              {problem && <Text color="mutedForeground" style={{ marginTop: 8 }}>{problem}</Text>}
              <Button big style={bigBottom} onPress={submit}>
                {t("ob.continue")}
              </Button>
              <Button big variant="ghost" onPress={() => { setProblem(null); setStep("address"); }}>
                {t("ob.back")}
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
                    {home.address}
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
                  const { Icon, badge, ink } = answerLook[o];
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
                      <View style={[{ height: 40, width: 40, alignItems: "center", justifyContent: "center", borderRadius: radius.full }, badge]}>
                        <Icon size={20} color={ink} />
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
                      accessibilityRole="checkbox"
                      aria-checked={on}
                      onPress={() =>
                        setAdded(
                          on ? added.filter((x) => x !== k) : [...added, k],
                        )
                      }
                      style={({ pressed }) => [{
                        minHeight: 64,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 16,
                        borderRadius: radius["2xl"],
                        borderWidth: 2,
                        // Dashed while empty, solid blue once added: the same outline language as the answers.
                        borderStyle: on ? "solid" : "dashed",
                        borderColor: on ? colors.primary : colors.control,
                        backgroundColor: colors.card,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                      }, pressed && { opacity: 0.8 }]}
                    >
                      <View
                        style={{
                          height: 44,
                          width: 44,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: radius.xl,
                          ...(on ? { backgroundColor: colors.primary } : { borderWidth: 1.5, borderColor: colors.primary }),
                        }}
                      >
                        {on ? (
                          <Check size={24} color={colors.primaryForeground} />
                        ) : (
                          <Icon size={24} color={colors.primary} />
                        )}
                      </View>
                      <Text weight={500} style={{ flex: 1 }}>
                        {t(`ob.${k}`)}
                      </Text>
                      {on && (
                        <Text size="sm" weight={600} color="primary">
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
