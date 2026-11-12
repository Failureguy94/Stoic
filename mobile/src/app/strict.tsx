import { useEffect, useState } from "react";
import { AccessibilityInfo, Alert, View } from "react-native";
import { AndroidOnly } from "@/components/AndroidOnly";
import { BlockerSetupCard } from "@/components/BlockerSetup";
import { TourTarget } from "@/components/Tour";
import { B, Bullets, Button, Card, Chip, ChipGroup, Screen, SwitchRow, T } from "@/components/ui";
import { device, type StrictState } from "@/lib/device";
import { clock } from "@/lib/focus";
import { untilText } from "@/lib/strict";
import { useForeground } from "@/lib/useForeground";
import { space } from "@/theme";

const HOUR = 3_600_000;

interface Length {
  id: string;
  label: string;
  until: (now: Date) => number;
}

const LENGTHS: Length[] = [
  { id: "1h", label: "1 hour", until: (n) => n.getTime() + HOUR },
  { id: "4h", label: "4 hours", until: (n) => n.getTime() + 4 * HOUR },
  {
    id: "morning",
    label: "Until 7 AM",
    until: (n) => {
      const d = new Date(n.getFullYear(), n.getMonth(), n.getDate(), 7, 0);
      if (d.getTime() <= n.getTime()) d.setDate(d.getDate() + 1);
      return d.getTime();
    },
  },
  { id: "1d", label: "1 day", until: (n) => n.getTime() + 24 * HOUR },
  { id: "1w", label: "1 week", until: (n) => n.getTime() + 7 * 24 * HOUR },
];

const OFF: StrictState = { until: 0, lockSettings: false, unlockRequestedAt: 0, unlockWaitMs: 0 };

export default function Strict() {
  const [state, setState] = useState<StrictState>(OFF);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [length, setLength] = useState("4h");
  const [lockSettings, setLockSettings] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = () => {
    if (!device) return;
    setState(device.getStrict());
    setEnabled(device.isBlockerEnabled());
    setNow(Date.now());
  };
  useForeground(load);

  // Tick while strict mode is on, so the unlock wait counts down and the screen notices when it ends.
  const on = state.until > now;
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [on]);

  if (!device) return <AndroidOnly />;

  const start = () => {
    const chosen = LENGTHS.find((l) => l.id === length)!;
    const until = chosen.until(new Date());
    Alert.alert(
      "Start strict mode?",
      `${untilText(until).replace(/^until/, "Until")}, you won't be able to loosen your limits, schedules or focus sessions.` +
        (lockSettings ? " Settings will be locked too." : "") +
        " If you really need to, “Unlock early” takes 15 minutes.",
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Start",
          onPress: () => {
            device!.startStrict(until, lockSettings);
            load();
            AccessibilityInfo.announceForAccessibility(`Strict mode is on ${untilText(until)}.`);
          },
        },
      ],
    );
  };

  const waitLeft = state.unlockRequestedAt ? state.unlockRequestedAt + state.unlockWaitMs - now : 0;

  return (
    <Screen>
      <T v="lead">Until the time you pick, your rules can get stricter but never looser.</T>

      <BlockerSetupCard enabled={enabled} onLabel="Limits, schedules and strict mode can work" />

      {on ? (
        <Card tint="rose">
          <T v="h2">🔒 Strict mode is on</T>
          <T>
            <B>{untilText(state.until).replace(/^until/, "Until")}.</B> You can add apps, lower limits and add schedule days,
            but not undo them.
          </T>
          <Bullets
            items={[
              "No “5 more minutes”, “Open once more” or schedule snooze.",
              "Limits, schedules and always-allowed apps can't be loosened.",
              "A focus session that blocks apps can't be ended early.",
              "Uninstalling apps is blocked.",
              ...(state.lockSettings ? ["Settings is locked."] : []),
            ]}
          />

          <View style={{ gap: space.sm, marginTop: space.sm }}>
            <T v="h3">Need out?</T>
            {state.unlockRequestedAt === 0 ? (
              <>
                <T v="small">“Unlock early” asks you to wait 15 minutes first. Often the urge passes by then.</T>
                <Button
                  kind="outline"
                  label="Unlock early"
                  onPress={() => {
                    device!.requestUnlock();
                    load();
                    AccessibilityInfo.announceForAccessibility("Unlock requested. You can unlock in 15 minutes.");
                  }}
                />
              </>
            ) : waitLeft > 0 ? (
              <>
                <T accessibilityLiveRegion="polite">You can unlock in {clock(waitLeft)}.</T>
                <Button
                  kind="quiet"
                  label="Never mind, stay strict"
                  onPress={() => {
                    device!.cancelUnlock();
                    load();
                  }}
                />
              </>
            ) : (
              <>
                <T>The wait is over. Still want to unlock?</T>
                <Button
                  label="Unlock now"
                  onPress={() => {
                    device!.unlockNow();
                    load();
                    AccessibilityInfo.announceForAccessibility("Strict mode is off.");
                  }}
                />
                <Button
                  kind="quiet"
                  label="Stay strict"
                  onPress={() => {
                    device!.cancelUnlock();
                    load();
                  }}
                />
              </>
            )}
          </View>
        </Card>
      ) : (
        <TourTarget id="strict.start">
        <Card tint="lavender">
          <T v="h2">Start strict mode</T>
          <T v="label">How long</T>
          <ChipGroup label="How long strict mode lasts">
            {LENGTHS.map((l) => (
              <Chip key={l.id} label={l.label} selected={length === l.id} onPress={() => setLength(l.id)} />
            ))}
          </ChipGroup>
          <SwitchRow
            label="Also lock Settings"
            hint="Strongest: stops switching STOIC off or clearing its data. Wi-Fi and other settings are locked too"
            value={lockSettings}
            onChange={setLockSettings}
          />
          <Button label="Start strict mode" onPress={start} />
        </Card>
        </TourTarget>
      )}

      <T v="small" muted>
        Set up your limits and schedules first: strict mode locks them, it doesn&apos;t add new ones.
      </T>
    </Screen>
  );
}
