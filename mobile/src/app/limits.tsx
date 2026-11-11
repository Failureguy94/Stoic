import { useMemo, useState } from "react";
import { AccessibilityInfo, View } from "react-native";
import { AndroidOnly } from "@/components/AndroidOnly";
import { AppPicker } from "@/components/AppPicker";
import { BlockerSetupCard } from "@/components/BlockerSetup";
import { AppLink, Bullets, Button, Card, Chip, ChipGroup, Screen, SwitchRow, T } from "@/components/ui";
import { device, type LaunchableApp, type Rule } from "@/lib/device";
import { useForeground } from "@/lib/useForeground";
import { space } from "@/theme";

const LIMITS_MIN = [0, 15, 30, 60, 120];
const limitLabel = (m: number) => (m === 0 ? "No limit" : m < 60 ? `${m} min` : `${m / 60} h`);

export default function Limits() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [usageAccess, setUsageAccess] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [adding, setAdding] = useState(false);

  useForeground(() => {
    if (!device) return;
    setEnabled(device.isBlockerEnabled());
    setUsageAccess(device.hasUsageAccess());
    setRules(device.getRules());
  });

  const taken = useMemo(() => new Set(rules.map((r) => r.packageName)), [rules]);

  if (!device) return <AndroidOnly />;

  const save = (next: Rule[], spoken?: string) => {
    setRules(next);
    device!.setRules(next);
    if (spoken) AccessibilityInfo.announceForAccessibility(spoken);
  };
  const update = (pkg: string, patch: Partial<Rule>) => save(rules.map((r) => (r.packageName === pkg ? { ...r, ...patch } : r)));

  const add = (app: LaunchableApp) => {
    save(
      [...rules, { packageName: app.packageName, label: app.label, limitMin: 0, allowExtend: true, pause: true, blockInFocus: false }],
      `${app.label} added with a pause before opening.`,
    );
    setAdding(false);
  };

  const needsUsage = rules.some((r) => r.limitMin > 0) && !usageAccess;

  return (
    <Screen>
      <T v="lead">
        Pick the apps that pull you in, then choose a gentle pause, a daily limit, or a block during focus sessions. You are
        always the one in charge of these.
      </T>

      <BlockerSetupCard enabled={enabled} onLabel="Limits and pauses are on" />

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
          <Button label="Add an app" onPress={() => setAdding(true)} />
        ) : (
          <AppPicker exclude={taken} onPick={add} onCancel={() => setAdding(false)} />
        )}
      </View>

      <Card>
        <T v="h3">Good to know</T>
        <Bullets
          items={[
            "Limits reset at midnight.",
            "“Open anyway” appears after a short wait. Choosing it is fine: the pause is there to make it a choice, not to punish you.",
            "On some phones (Redmi, Realme, Oppo), battery saving can switch the service off. If pauses stop appearing, check Accessibility settings and allow STOIC to run in the background.",
            "Want certain hours blocked every day, like bedtime or study time? Use a schedule.",
          ]}
        />
        <AppLink href="/schedules">Schedules and bedtime</AppLink>
      </Card>
    </Screen>
  );
}
