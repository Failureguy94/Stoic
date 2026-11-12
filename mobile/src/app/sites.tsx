import { useMemo, useState } from "react";
import { AccessibilityInfo, Alert, TextInput, View } from "react-native";
import { AndroidOnly } from "@/components/AndroidOnly";
import { StrictBanner } from "@/components/StrictBanner";
import { TourTarget } from "@/components/Tour";
import { B, Button, Card, Chip, ChipGroup, Screen, SwitchRow, T } from "@/components/ui";
import { device, type SiteSettings } from "@/lib/device";
import { tryStrictSave } from "@/lib/strict";
import { useForeground } from "@/lib/useForeground";
import { font, radius, space, useTheme } from "@/theme";

/** Common distractions, each with every address the site and its app use. */
const PRESETS: { label: string; icon: string; domains: string[] }[] = [
  { label: "YouTube", icon: "📺", domains: ["youtube.com", "youtu.be"] },
  { label: "Instagram", icon: "📷", domains: ["instagram.com"] },
  { label: "TikTok", icon: "🎵", domains: ["tiktok.com", "tiktokv.com"] },
  { label: "Reddit", icon: "👽", domains: ["reddit.com", "redd.it"] },
  { label: "X / Twitter", icon: "🐦", domains: ["x.com", "twitter.com"] },
  { label: "Facebook", icon: "👍", domains: ["facebook.com", "fb.com"] },
  { label: "Netflix", icon: "🎬", domains: ["netflix.com"] },
  { label: "Snapchat", icon: "👻", domains: ["snapchat.com"] },
];

const EMPTY: SiteSettings = { enabled: false, sites: [], always: true, internetOff: false };

export default function Sites() {
  const t = useTheme();
  const [s, setS] = useState<SiteSettings>(EMPTY);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [running, setRunning] = useState(false);
  const [typed, setTyped] = useState("");

  const load = () => {
    if (!device) return;
    setS(device.getSites());
    setAllowed(device.isVpnAllowed());
    setRunning(device.isVpnRunning());
  };
  useForeground(load);

  const set = useMemo(() => new Set(s.sites), [s.sites]);

  if (!device) return <AndroidOnly />;

  const save = (next: SiteSettings, spoken?: string) => {
    if (!tryStrictSave(() => device!.setSites(next), load)) return;
    setS(next);
    if (spoken) AccessibilityInfo.announceForAccessibility(spoken);
    // The VPN starts or stops in the background; check again shortly.
    setTimeout(() => device && setRunning(device.isVpnRunning()), 1500);
  };

  const togglePreset = (p: (typeof PRESETS)[number]) => {
    const on = p.domains.every((d) => set.has(d));
    const sites = on ? s.sites.filter((d) => !p.domains.includes(d)) : [...new Set([...s.sites, ...p.domains])];
    save({ ...s, sites, enabled: sites.length > 0 ? s.enabled || !on : s.enabled }, on ? `${p.label} unblocked.` : `${p.label} blocked.`);
  };

  const addTyped = () => {
    const domain = device!.normalizeSite(typed);
    if (!domain) {
      Alert.alert("That doesn't look like a website", "Try something like example.com.");
      return;
    }
    setTyped("");
    if (set.has(domain)) return;
    save({ ...s, enabled: true, sites: [...s.sites, domain] }, `${domain} blocked.`);
  };

  const presetDomains = new Set(PRESETS.flatMap((p) => p.domains));
  const custom = s.sites.filter((d) => !presetDomains.has(d));
  const wantsVpn = (s.enabled && s.sites.length > 0) || s.internetOff;

  return (
    <Screen>
      <T v="lead">Block websites in every browser on this phone, always or only while you focus.</T>

      <StrictBanner />

      {allowed === false ? (
        <Card tint="butter">
          <T v="h2">Allow STOIC&apos;s VPN</T>
          <T>
            Android blocks sites through a <B>VPN</B>. STOIC&apos;s stays on your phone and never sees what you read.
          </T>
          <Button label="Allow" onPress={() => device!.requestVpnPermission()} />
        </Card>
      ) : null}

      {allowed && wantsVpn ? (
        <Card tint={running ? "mint" : "butter"}>
          <T v="label" color={running ? t.goodInk : t.ink}>
            {running ? "✓ Blocking is running" : "Blocking isn't running"}
          </T>
          {!running ? (
            <>
              <T v="small">Another VPN app may have taken over, or Android stopped it. Starting it again usually helps.</T>
              <Button kind="outline" label="Start again" onPress={() => save(s)} />
            </>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <SwitchRow
          label="Block websites"
          hint={s.sites.length === 0 ? "Pick some below first" : `${s.sites.length} ${s.sites.length === 1 ? "address" : "addresses"}`}
          value={s.enabled}
          disabled={s.sites.length === 0 && !s.enabled}
          onChange={(on) => save({ ...s, enabled: on }, on ? "Website blocking is on." : "Website blocking is off.")}
        />
        <T v="label" style={{ marginTop: space.sm }}>
          When
        </T>
        <ChipGroup label="When websites are blocked">
          <Chip label="Always" selected={s.always} onPress={() => save({ ...s, always: true })} />
          <Chip label="During focus & schedules" selected={!s.always} onPress={() => save({ ...s, always: false })} />
        </ChipGroup>

        <T v="label" style={{ marginTop: space.sm }}>
          Popular
        </T>
        <TourTarget id="sites.presets" style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {PRESETS.map((p) => (
            <Chip
              key={p.label}
              role="checkbox"
              icon={p.icon}
              label={p.label}
              selected={p.domains.every((d) => set.has(d))}
              onPress={() => togglePreset(p)}
            />
          ))}
        </TourTarget>
        <T v="small" muted>
          This also stops the site&apos;s app.
        </T>

        <T v="label" style={{ marginTop: space.sm }}>
          Add your own
        </T>
        <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
          <TextInput
            accessibilityLabel="Website to block"
            placeholder="example.com"
            placeholderTextColor={t.muted}
            value={typed}
            onChangeText={setTyped}
            onSubmitEditing={addTyped}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
            style={{
              flex: 1,
              minHeight: 48,
              borderWidth: 2,
              borderColor: t.field,
              borderRadius: radius.pill,
              paddingHorizontal: space.lg,
              fontFamily: font.body,
              fontSize: 16,
              color: t.ink,
              backgroundColor: t.surface,
            }}
          />
          <Button kind="outline" label="Add" onPress={addTyped} />
        </View>
        {custom.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {custom.map((d) => (
              <Chip
                key={d}
                role="button"
                label={`${d}  ✕`}
                accessibilityLabel={`Unblock ${d}`}
                selected={false}
                onPress={() => save({ ...s, sites: s.sites.filter((x) => x !== d) }, `${d} unblocked.`)}
              />
            ))}
          </View>
        ) : null}
      </Card>

      <Card tint="lavender">
        <SwitchRow
          label="Internet off during focus & schedules"
          hint="Every app goes offline, except calls, messages, alarms and your always-allowed apps"
          value={s.internetOff}
          onChange={(on) => save({ ...s, internetOff: on }, on ? "Internet will switch off during focus." : "Internet stays on during focus.")}
        />
      </Card>

      <T v="small" muted>
        Not working? Set Private DNS to “Automatic”, and turn off other VPN apps. Open sites can take a minute to stop.
      </T>
    </Screen>
  );
}
