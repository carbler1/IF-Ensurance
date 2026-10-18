import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { api, type Hit } from "@/lib/api";
import type { Choice } from "@/lib/choice";
import { useStore } from "@/lib/store";
import { colors, radius } from "@/lib/theme";
import { Button, Heading, Input, PressCard, Screen, Text } from "./ui";

const MIN = 4; // characters, spaces and dashes not counted (the backend's rule)
const DEBOUNCE_MS = 300;

// After the entry icon: search the profile by its key, pick the masked hit, then set or enter the password.
export function Login({ choice, onBack, onDone }: { choice: Choice; onBack: () => void; onDone: () => void }) {
  const { t } = useStore();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [chosen, setChosen] = useState<Hit | null>(null);
  const [password, setPassword] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const latest = useRef(0);
  const tRef = useRef(t); // the search effect must not restart when t changes
  tRef.current = t;

  useEffect(() => {
    const mine = ++latest.current; // only the latest search applies
    setHits(null);
    setProblem(null);
    if (q.replace(/[\s-]/g, "").length < MIN) return;
    const id = setTimeout(() => {
      api.search(choice, q.trim()).then(
        (h) => { if (mine === latest.current) setHits(h); },
        (e: Error & { status?: number }) => { if (mine === latest.current) setProblem(e.status ? e.message : tRef.current("login.network")); },
      );
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [q, choice]);

  const submit = () => {
    if (!chosen || busy || !password) return;
    setBusy(true);
    setProblem(null);
    api.claim(chosen.customer_id, password).then(onDone, (e: Error & { status?: number }) => {
      setBusy(false);
      setProblem(e.status === 401 ? t("login.wrong") : e.status === 429 ? t("login.locked") : e.status ? e.message : t("login.network"));
    });
  };

  const hint = t(`login.hint.${choice}`);
  const passwordLabel = chosen?.taken ? t("login.passwordTaken") : t("login.passwordNew");
  return (
    <Screen>
      <Heading size="2xl" center style={{ marginTop: 24 }}>{t("login.title")}</Heading>
      {chosen ? (
        <View style={{ marginTop: 24, gap: 12 }}>
          <Text weight={600} center>{chosen.label}</Text>
          <Text weight={500}>{passwordLabel}</Text>
          <Input
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={submit}
            accessibilityLabel={passwordLabel}
            style={{ backgroundColor: colors.card }}
          />
          {problem && <Text color="mutedForeground">{problem}</Text>}
          <Button big disabled={busy} onPress={submit}>{t("login.continue")}</Button>
          <Button big variant="ghost" onPress={() => { setChosen(null); setPassword(""); setProblem(null); }}>{t("login.back")}</Button>
        </View>
      ) : (
        <View style={{ marginTop: 24, gap: 12 }}>
          <Input
            value={q}
            onChangeText={setQ}
            placeholder={hint}
            accessibilityLabel={hint}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ backgroundColor: colors.card }}
          />
          {problem && <Text color="mutedForeground">{problem}</Text>}
          {hits?.length === 0 && <Text color="mutedForeground">{t("login.none")}</Text>}
          {hits?.map((h) => (
            <PressCard
              key={h.customer_id}
              accessibilityRole="button"
              onPress={() => { setChosen(h); setPassword(""); setProblem(null); }}
              style={{ padding: 16, backgroundColor: colors.card, borderRadius: radius["2xl"] }}
            >
              <Text>{h.label}</Text>
            </PressCard>
          ))}
          <Button big variant="ghost" onPress={onBack}>{t("login.back")}</Button>
        </View>
      )}
    </Screen>
  );
}
