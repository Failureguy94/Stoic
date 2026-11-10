import { useMemo, useState } from "react";
import { AccessibilityInfo, TextInput, View } from "react-native";
import { AndroidOnly } from "@/components/AndroidOnly";
import { AppLink, B, Bullets, Button, Card, Chip, ChipGroup, Screen, SwitchRow, T } from "@/components/ui";
import { device, type LaunchableApp, type Rule } from "@/lib/device";
import { useForeground } from "@/lib/useForeground";
import { font, radius, space, useTheme } from "@/theme";

const LIMITS_MIN = [0, 15, 30, 60, 120];
const limitLabel = (m: number) => (m === 0 ? "No limit" : m < 60 ? `${m} min` : `${m / 60} h`);

export default function Limits() {
  const t = useTheme();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [usageAccess, setUsageAccess] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [apps, setApps] = useState<LaunchableApp[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");

  useForeground(() => {
    if (!device) return;
    setEnabled(device.isBlockerEnabled());
    setUsageAccess(device.hasUsageAccess());
    setRules(device.getRules());
  });

  const available = useMemo(() => {
    const taken = new Set(rules.map((r) => r.packageName));
    const q = query.trim().toLowerCase();
    return (apps ?? []).filter((a) => !taken.has(a.packageName) && (!q || a.label.toLowerCase().includes(q)));
  }, [apps, rules, query]);

  if (!device) return <AndroidOnly />;

  const save = (next: Rule[], spoken?: string) => {
    setRules(next);
    device!.setRules(next);
    if (spoken) AccessibilityInfo.announceForAccessibility(spoken);
  };
  const update = (pkg: string, patch: Partial<Rule>) => save(rules.map((r) => (r.packageName === pkg ? { ...r, ...patch } : r)));

  const startAdding = async () => {
    setAdding(true);
    if (!apps) setApps(await device!.getLaunchableApps());
  };

  const add = (app: LaunchableApp) => {
    save(
      [...rules, { packageName: app.packageName, label: app.label, limitMin: 0, allowExtend: true, pause: true, blockInFocus: false }],
      `${app.label} added with a pause before opening.`,
    );
    setAdding(false);
    setQuery("");
  };

  const needsUsage = rules.some((r) => r.limitMin > 0) && !usageAccess;

  return (
    <Screen>
      <T v="lead">
        Pick the apps that pull you in, then choose a gentle pause, a daily limit, or a block during focus sessions. You are
        always the one in charge of these.
      </T>

      {enabled === false ? (
        <Card tint="butter">
          <T v="h2">Turn on STOIC in Accessibility</T>
          <T>
            To show a pause or time&apos;s-up screen, Android needs you to switch on STOIC under <B>Accessibility</B>. STOIC
            uses it only to see <B>which app is in front</B>. It cannot read what is on your screen or what you type, and
            nothing leaves your phone.
          </T>
          <Bullets
            items={[
              "Tap the button below.",
              "Under “Downloaded apps” (or “Installed apps”), tap “STOIC limits and pauses”.",
              "Switch it on and confirm.",
              "Come back here.",
            ]}
          />
          <Button label="Open Accessibility settings" onPress={() => device!.openAccessibilitySettings()} />
          <T v="small">
            If Android says “Restricted setting”, open Settings, Apps, STOIC, tap the three dots at the top right, and choose
            “Allow restricted settings”. Then try again. Android does this for apps installed from a file.
          </T>
          <T v="small">You can set up your apps below first. Rules start working once this is on.</T>
        </Card>
      ) : null}

      {enabled ? (
        <Card tint="mint">
          <T v="label" color={t.goodInk}>
            ✓ Limits and pauses are on
          </T>
          <T v="small">To switch everything off at once, turn STOIC off in Android&apos;s Accessibility settings.</T>
        </Card>
      ) : null}

      {needsUsage ? (
        <Card tint="butter">
          <T v="h3">Daily limits also need Usage access</T>
          <T>Without it STOIC can&apos;t tell how long an app was open today, so limits are skipped. Pauses still work.</T>
          <Button kind="outline" label="Open Usage access settings" onPress={() => device!.openUsageAccessSettings()} />
        </Card>
      ) : null}

      <View style={{ gap: space.md }}>
        <T v="h2">My apps</T>
        {rules.length === 0 ? <T muted>No apps yet. Add the one or two that distract you most.</T> : null}
        {rules.map((r) => (
          <Card key={r.packageName}>
            <T v="h3">{r.label}</T>

            <SwitchRow
              label="Pause before opening"
              hint="A 10 second pause with “Is this important?”"
              value={r.pause}
              onChange={(on) => update(r.packageName, { pause: on })}
            />

            <T v="label" style={{ marginTop: space.sm }}>
              Daily limit
            </T>
            <ChipGroup label={`Daily limit for ${r.label}`}>
              {LIMITS_MIN.map((m) => (
                <Chip key={m} label={limitLabel(m)} selected={r.limitMin === m} onPress={() => update(r.packageName, { limitMin: m })} />
              ))}
            </ChipGroup>
            {r.limitMin > 0 ? (
              <SwitchRow
                label="Let me add 5 more minutes"
                hint="Off makes the limit strict until midnight"
                value={r.allowExtend}
                onChange={(on) => update(r.packageName, { allowExtend: on })}
              />
            ) : null}

            <SwitchRow
              label="Block during focus sessions"
              hint="While a Pebble timer is running"
              value={r.blockInFocus}
              onChange={(on) => update(r.packageName, { blockInFocus: on })}
            />

            <Button
              kind="quiet"
              label={`Remove ${r.label}`}
              onPress={() => save(rules.filter((x) => x.packageName !== r.packageName), `${r.label} removed.`)}
            />
          </Card>
        ))}

        {!adding ? (
          <Button label="Add an app" onPress={startAdding} />
        ) : (
          <Card tint="lavender">
            <T v="h3">Choose an app</T>
            <TextInput
              accessibilityLabel="Search apps"
              placeholder="Search apps"
              placeholderTextColor={t.muted}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              style={{
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
            {apps === null ? <T muted>Loading your apps…</T> : null}
            {apps && available.length === 0 ? <T>No matching apps.</T> : null}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
              {available.slice(0, 40).map((a) => (
                <Chip key={a.packageName} role="checkbox" label={a.label} selected={false} onPress={() => add(a)} />
              ))}
            </View>
            {available.length > 40 ? (
              <T v="small" muted>
                Showing the first 40. Type to narrow the list.
              </T>
            ) : null}
            <Button
              kind="quiet"
              label="Cancel"
              onPress={() => {
                setAdding(false);
                setQuery("");
              }}
            />
          </Card>
        )}
      </View>

      <Card>
        <T v="h3">Good to know</T>
        <Bullets
          items={[
            "Limits reset at midnight.",
            "“Open anyway” appears after a short wait. Choosing it is fine: the pause is there to make it a choice, not to punish you.",
            "On some phones (Redmi, Realme, Oppo), battery saving can switch the service off. If pauses stop appearing, check Accessibility settings and allow STOIC to run in the background.",
            "This is a high-permission feature. If you'd rather not grant it, Android's own Digital Wellbeing app timers need no extra permission.",
          ]}
        />
        <AppLink href="/tools">Compare other tools</AppLink>
      </Card>
    </Screen>
  );
}
