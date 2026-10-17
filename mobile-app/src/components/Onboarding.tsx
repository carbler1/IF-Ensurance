import { useEffect, useRef, useState } from "react";
import { Animated, KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, Check, FileText, MapPin } from "lucide-react-native";
import { home, questions } from "@/data/mock";
import { useStore } from "@/lib/store";
import { colors, radius } from "@/lib/theme";
import { Button, Card, Heading, Input, Spinner, Text, Wordmark } from "./ui";

const bigBottom = { marginTop: "auto" } as const;

export function Onboarding() {
  const { t, finishOnboarding } = useStore();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<"address" | "found" | "q" | "photos" | "analysing">("address");
  const [addr, setAddr] = useState(home.address);
  const [qi, setQi] = useState(0);
  const [added, setAdded] = useState<string[]>([]);

  useEffect(() => {
    if (step !== "analysing") return;
    const id = setTimeout(finishOnboarding, 2400);
    return () => clearTimeout(id);
  }, [step, finishOnboarding]);

  const progress = useRef(new Animated.Value((qi + 1) / questions.length)).current;
  useEffect(() => {
    Animated.timing(progress, { toValue: (qi + 1) / questions.length, duration: 150, useNativeDriver: false }).start();
  }, [qi, progress]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, paddingTop: 32 + insets.top, paddingBottom: 40 + insets.bottom }}>
      <Wordmark />
      <View style={{ marginTop: 40, flex: 1 }}>
        {step === "address" && (
          <>
            <Heading>{t("ob.welcome")}</Heading>
            <Text color="mutedForeground" style={{ marginTop: 12 }}>{t("ob.welcomeSub")}</Text>
            <Text weight={500} style={{ marginTop: 32, marginBottom: 8 }}>{t("ob.address")}</Text>
            <Input value={addr} onChangeText={setAddr} accessibilityLabel={t("ob.address")} style={{ backgroundColor: colors.card }} />
            <Button big style={bigBottom} onPress={() => setStep("found")}>{t("ob.find")}</Button>
          </>
        )}
        {step === "found" && (
          <>
            <Heading>{t("ob.found")}</Heading>
            <Card style={{ marginTop: 24, gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MapPin size={20} color={colors.primary} />
                <Text weight={600} style={{ flexShrink: 1 }}>{addr}</Text>
              </View>
              <Text color="mutedForeground">{home.type}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 12, paddingTop: 8 }}>
                <View style={{ width: "50%" }}><Text size="sm" color="mutedForeground">{t("ob.year")}</Text><Text size="lg" weight={600}>{home.year}</Text></View>
                <View style={{ width: "50%", paddingLeft: 6 }}><Text size="sm" color="mutedForeground">{t("ob.size")}</Text><Text size="lg" weight={600}>{home.size} m²</Text></View>
                <View style={{ width: "100%" }}><Text size="sm" color="mutedForeground">{t("ob.heating")}</Text><Text size="lg" weight={600}>{home.heating}</Text></View>
              </View>
            </Card>
            <Button big style={bigBottom} onPress={() => setStep("q")}>{t("ob.looksRight")}</Button>
          </>
        )}
        {step === "q" && (
          <>
            <Text weight={500} color="mutedForeground">{t("ob.question")} {qi + 1} {t("ob.of")} {questions.length}</Text>
            <View style={{ marginTop: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.muted }}>
              <Animated.View style={{ height: 8, borderRadius: radius.full, backgroundColor: colors.primary, width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }} />
            </View>
            <Heading size="2xl" style={{ marginTop: 32 }}>{t(`ob.${questions[qi]!.id}` as "ob.q1")}</Heading>
            <View style={{ marginTop: "auto", gap: 12 }}>
              {questions[qi]!.options.map((o) => (
                <Button key={o} big variant="outline" style={{ backgroundColor: colors.card }} onPress={() => (qi < questions.length - 1 ? setQi(qi + 1) : setStep("photos"))}>
                  {t(`ob.${o}`)}
                </Button>
              ))}
            </View>
          </>
        )}
        {step === "photos" && (
          <>
            <Heading>{t("ob.photos")}</Heading>
            <Text color="mutedForeground" style={{ marginTop: 12 }}>{t("ob.photosSub")}</Text>
            <View style={{ marginTop: 24, gap: 12 }}>
              {([["panel", Camera], ["pipes", Camera], ["report", FileText]] as const).map(([k, Icon]) => {
                const on = added.includes(k);
                return (
                  <Pressable
                    key={k}
                    accessibilityRole="button"
                    onPress={() => setAdded(on ? added.filter((x) => x !== k) : [...added, k])}
                    style={{ minHeight: 64, flexDirection: "row", alignItems: "center", gap: 16, borderRadius: radius["2xl"], borderWidth: 2, borderStyle: "dashed", borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 12 }}
                  >
                    <View style={{ height: 44, width: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.xl, backgroundColor: colors.secondary }}>
                      {on ? <Check size={24} color={colors.secondaryForeground} /> : <Icon size={24} color={colors.secondaryForeground} />}
                    </View>
                    <Text weight={500} style={{ flex: 1 }}>{t(`ob.${k}`)}</Text>
                    {on && <Text size="sm" weight={600} color="success">{t("ob.added")}</Text>}
                  </Pressable>
                );
              })}
            </View>
            <View style={{ marginTop: "auto", gap: 8 }}>
              <Button big onPress={() => setStep("analysing")}>{t("ob.continue")}</Button>
              {added.length === 0 && <Button big variant="ghost" onPress={() => setStep("analysing")}>{t("ob.skip")}</Button>}
            </View>
          </>
        )}
        {step === "analysing" && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Spinner size={56} color={colors.primary} />
            <Heading size="2xl" center style={{ marginTop: 24 }}>{t("ob.analysing")}</Heading>
            <Text color="mutedForeground" center style={{ marginTop: 8 }}>{t("ob.analysingSub")}</Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
