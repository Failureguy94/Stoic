import { useMemo, useState } from "react";
import { AccessibilityInfo, View } from "react-native";
import { AndroidOnly } from "@/components/AndroidOnly";
import { AppPicker } from "@/components/AppPicker";
import { BlockerSetupCard } from "@/components/BlockerSetup";
import { StrictBanner } from "@/components/StrictBanner";
import { TourTarget } from "@/components/Tour";
import { Button, Card, Chip, ChipGroup, Screen, SwitchRow, T } from "@/components/ui";
import { device, type LaunchableApp, type Rule } from "@/lib/device";
import { tryStrictSave } from "@/lib/strict";
import { useForeground } from "@/lib/useForeground";
import { space } from "@/theme";

const LIMITS_MIN = [0, 15, 30, 60, 120];
const limitLabel = (m: number) => (m === 0 ? "No limit" : m < 60 ? `${m} min` : `${m / 60} h`);
const OPENS = [0, 5, 10, 20, 40];
const CHECK_IN_MIN = [0, 10, 20, 30];

export default function Limits() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [usageAccess, setUsageAccess] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [adding, setAdding] = useState(false);
  const [opens, setOpens] = useState<Record<string, number>>({});

  useForeground(() => {
    if (!device) return;
    setEnabled(device.isBlockerEnabled());
    setUsageAccess(device.hasUsageAccess());
    setRules(device.getRules());
    setOpens(device.getOpensToday());
  });

  const taken = useMemo(() => new Set(rules.map((r) => r.packageName)), [rules]);

  if (!device) return <AndroidOnly />;

  const save = (next: Rule[], spoken?: string) => {
    if (!tryStrictSave(() => device!.setRules(next), () => setRules(device!.getRules()))) return;
    setRules(next);
    if (spoken) AccessibilityInfo.announceForAccessibility(spoken);
  };
  const update = (pkg: string, patch: Partial<Rule>) => save(rules.map((r) => (r.packageName === pkg ? { ...r, ...patch } : r)));

  const add = (app: LaunchableApp) => {
    save(
      [
        ...rules,
        {
          packageName: app.packageName,
          label: app.label,
          limitMin: 0,
          allowExtend: true,
          pause: true,
          blockInFocus: false,
          maxOpens: 0,
          checkInMin: 0,
        },
      ],
      `${app.label} added with a pause before opening.`,
    );
    setAdding(false);
  };

  const needsUsage = rules.some((r) => r.limitMin > 0) && !usageAccess;

  return (
    <Screen>
      <T v="lead">Pick the apps that pull you in, then choose a pause, a daily limit or fewer opens.</T>

      <BlockerSetupCard enabled={enabled} onLabel="Limits and pauses are on" />
      <StrictBanner />

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
            <T v="label" style={{ marginTop: space.sm }}>
              Opens per day
            </T>
            <ChipGroup label={`Opens per day for ${r.label}`}>
              {OPENS.map((n) => (
                <Chip
                  key={n}
                  label={n === 0 ? "Any" : `${n}`}
                  accessibilityLabel={n === 0 ? "Any number of opens" : `${n} opens`}
                  selected={(r.maxOpens ?? 0) === n}
                  onPress={() => update(r.packageName, { maxOpens: n })}
                />
              ))}
            </ChipGroup>
            {(r.maxOpens ?? 0) > 0 ? (
              <T v="small" muted>
                Opened {opens[r.packageName] ?? 0} of {r.maxOpens} times today. Coming back within 30 seconds doesn&apos;t count.
              </T>
            ) : null}

            {r.limitMin > 0 || (r.maxOpens ?? 0) > 0 ? (
              <SwitchRow
                label="Let me go a little over"
                hint="Offers “5 more minutes” or “Open once more”. Off makes limits strict until midnight"
                value={r.allowExtend}
                onChange={(on) => update(r.packageName, { allowExtend: on })}
              />
            ) : null}

            <T v="label" style={{ marginTop: space.sm }}>
              Check in after
            </T>
            <ChipGroup label={`Check in after minutes in a row on ${r.label}`}>
              {CHECK_IN_MIN.map((m) => (
                <Chip
                  key={m}
                  label={m === 0 ? "Never" : `${m} min`}
                  accessibilityLabel={m === 0 ? "Never check in" : `${m} minutes in a row`}
                  selected={(r.checkInMin ?? 0) === m}
                  onPress={() => update(r.packageName, { checkInMin: m })}
                />
              ))}
            </ChipGroup>
            {(r.checkInMin ?? 0) > 0 ? (
              <T v="small" muted>
                After {r.checkInMin} minutes in a row, STOIC asks “Still worth it?”. You can keep going.
              </T>
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

        <TourTarget id="limits.add" style={{ alignSelf: adding ? "stretch" : "flex-start" }}>
          {!adding ? (
            <Button label="Add an app" onPress={() => setAdding(true)} />
          ) : (
            <AppPicker exclude={taken} onPick={add} onCancel={() => setAdding(false)} />
          )}
        </TourTarget>
      </View>

      <T v="small" muted>
        Limits reset at midnight. Pauses stopped appearing? Battery savers can switch STOIC off: check Accessibility, and let
        STOIC run in the background.
      </T>
    </Screen>
  );
}
