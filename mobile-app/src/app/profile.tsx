import { useState } from "react";
import { Pressable, View } from "react-native";
import { ChevronRight, Clock, ShieldCheck, UserPlus } from "@/lib/icons";
import { Button, Card, Heading, Input, LinkBlock, PopIn, Screen, SwitchRow, Text } from "@/components/ui";
import type { Lang } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { colors, radius, shadows } from "@/lib/theme";

const langs: { id: Lang; label: string }[] = [{ id: "fi", label: "Suomi" }, { id: "sv", label: "Svenska" }, { id: "en", label: "English" }];
const notifKeys = ["seasonal", "weather", "progress"] as const;

export default function Profile() {
  const { t, lang, setLang } = useStore();
  const [notif, setNotif] = useState({ seasonal: true, weather: true, progress: false });
  const [invite, setInvite] = useState<"idle" | "form" | "sent">("idle");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <Screen title={t("s.title")}>
      <Card>
        <Heading size="lg">{t("s.language")}</Heading>
        <View accessibilityRole="radiogroup" style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
          {langs.map((l) => (
            <Pressable
              key={l.id}
              accessibilityRole="radio"
              aria-checked={lang === l.id}
              onPress={() => setLang(l.id)}
              style={({ pressed }) => [{ flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.xl, backgroundColor: lang === l.id ? colors.primary : colors.muted }, pressed && lang !== l.id && { backgroundColor: colors.accent }]}
            >
              <Text weight={600} color={lang === l.id ? "primaryForeground" : "foreground"}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Heading size="lg">{t("s.notifications")}</Heading>
        {notifKeys.map((k, i) => (
          <SwitchRow
            key={k}
            label={t(`s.${k}`)}
            value={notif[k]}
            onValueChange={(v) => setNotif({ ...notif, [k]: v })}
            style={[{ minHeight: 56 }, i < notifKeys.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
          >
            <Text>{t(`s.${k}`)}</Text>
          </SwitchRow>
        ))}
      </Card>

      <Card>
        <Heading size="lg">{t("s.family")}</Heading>
        <Text color="mutedForeground" style={{ marginTop: 4 }}>{t("s.familySub")}</Text>
        {invite === "idle" && (
          <Button big variant="outline" icon={UserPlus} style={{ marginTop: 16 }} onPress={() => setInvite("form")}>
            {t("s.invite")}
          </Button>
        )}
        {invite === "form" && (
          <View style={{ marginTop: 16, gap: 12 }}>
            <Input placeholder={t("s.name")} accessibilityLabel={t("s.name")} value={name} onChangeText={setName} />
            <Input placeholder={t("s.phone")} accessibilityLabel={t("s.phone")} value={phone} onChangeText={setPhone} keyboardType="phone-pad" textContentType="telephoneNumber" />
            <View style={{ flexDirection: "row", gap: 8, borderRadius: radius.xl, backgroundColor: colors.accent, padding: 12 }}>
              <ShieldCheck size={20} color={colors.accentForeground} />
              <Text size="sm" color="accentForeground" style={{ flex: 1 }}>{t("s.inviteNote")}</Text>
            </View>
            <Button big onPress={() => setInvite("sent")}>{t("s.sendInvite")}</Button>
            <Button variant="ghost" style={{ height: 48 }} onPress={() => setInvite("idle")}>{t("s.cancel")}</Button>
          </View>
        )}
        {invite === "sent" && (
          <PopIn style={{ marginTop: 16, borderRadius: radius.xl, backgroundColor: colors.muted, padding: 16 }}>
            <Text weight={600}>{t("s.inviteSent")}: {name || "Mikko"}</Text>
            <View style={{ marginTop: 4, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Clock size={16} color={colors.mutedForeground} />
              <Text color="mutedForeground">{t("s.pending")}</Text>
            </View>
          </PopIn>
        )}
      </Card>

      <LinkBlock href="/score" style={{ minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: radius["2xl"], backgroundColor: colors.card, paddingHorizontal: 20, boxShadow: shadows.soft }}>
        <Text weight={500}>{t("s.scoreLink")}</Text>
        <ChevronRight size={20} color={colors.foreground} />
      </LinkBlock>
    </Screen>
  );
}
