import { useMemo, useState } from "react";
import { AccessibilityInfo, Alert, Pressable, View } from "react-native";
import { AndroidOnly } from "@/components/AndroidOnly";
import { AppPicker } from "@/components/AppPicker";
import { B, Bullets, Button, Card, Chip, Screen, SwitchRow, T } from "@/components/ui";
import { device, type HeldNotification, type NotificationCount } from "@/lib/device";
import { ensureNotificationPermission } from "@/lib/notify";
import { formatMin } from "@/lib/schedules";
import { useForeground } from "@/lib/useForeground";
import { font, radius, space, useTheme } from "@/theme";

/** Summary times offered, minutes after midnight. */
const TIMES = [8 * 60, 12 * 60, 13 * 60, 17 * 60, 19 * 60, 21 * 60];

export default function Notifications() {
  const t = useTheme();
  const [access, setAccess] = useState<boolean | null>(null);
  const [counts, setCounts] = useState<NotificationCount[]>([]);
  const [held, setHeld] = useState<HeldNotification[]>([]);
  const [hold, setHold] = useState<string[]>([]);
  const [whileBlocked, setWhileBlocked] = useState(true);
  const [times, setTimes] = useState<number[]>([]);
  const [adding, setAdding] = useState(false);

  const refresh = async () => {
    if (!device) return;
    setAccess(device.hasNotificationAccess());
    setHold(device.getHoldApps());
    setWhileBlocked(device.getHoldWhileBlocked());
    setTimes(device.getSummaryTimes());
    setCounts(await device.getNotificationCounts());
    setHeld(await device.getHeld());
  };
  useForeground(() => {
    refresh();
  });

  const holdSet = useMemo(() => new Set(hold), [hold]);
  // Always show saved times, even ones that are not among the presets, so they can be switched off.
  const shownTimes = useMemo(() => [...new Set([...TIMES, ...times])].sort((a, b) => a - b), [times]);
  const labels = useMemo(() => new Map(counts.map((c) => [c.packageName, c.label])), [counts]);

  if (!device) return <AndroidOnly />;

  const saveHold = (next: string[], spoken: string) => {
    setHold(next);
    device!.setHoldApps(next);
    AccessibilityInfo.announceForAccessibility(spoken);
    // The summary is a notification from STOIC, so ask once, when it first matters.
    if (next.length > hold.length) ensureNotificationPermission();
  };
  const toggleHold = (pkg: string, label: string) =>
    holdSet.has(pkg)
      ? saveHold(hold.filter((p) => p !== pkg), `${label} notifications will show as normal.`)
      : saveHold([...hold, pkg], `${label} notifications will be held for your summary.`);

  const toggleTime = (min: number) => {
    const next = times.includes(min) ? times.filter((x) => x !== min) : [...times, min].sort((a, b) => a - b);
    setTimes(next);
    device!.setSummaryTimes(next);
  };

  const openHeld = (h: HeldNotification) => {
    device!.openHeld(h.key);
    setHeld(held.filter((x) => x.key !== h.key));
  };

  const total = counts.reduce((sum, c) => sum + c.count, 0);
  const top = counts.slice(0, 12);
  const max = top[0]?.count ?? 1;

  return (
    <Screen>
      <T v="lead">
        See which apps interrupt you most. Hold the noisy ones and get them in one summary at times you choose.
      </T>

      {access === false ? (
        <Card tint="butter">
          <T v="h2">Turn on Notification access</T>
          <T>
            To count and hold notifications, Android needs you to allow STOIC under <B>Notification access</B>. Held
            notifications stay on this phone and are deleted after three days.
          </T>
          <Button label="Open Notification access" onPress={() => device!.openNotificationAccessSettings()} />
          <T v="small">
            If Android says “Restricted setting”, open Settings, Apps, STOIC, tap the three dots at the top right, and choose
            “Allow restricted settings”. Then try again.
          </T>
        </Card>
      ) : null}

      {held.length > 0 ? (
        <Card tint="lavender">
          <T v="h2">Held for you ({held.length})</T>
          <T v="small" muted>
            Tap one to open it.
          </T>
          <View style={{ gap: space.sm }}>
            {held.slice(0, 50).map((h) => (
              <Pressable
                key={h.key}
                accessibilityRole="button"
                accessibilityLabel={`${h.label}: ${h.title}. ${h.text}. Open.`}
                onPress={() => openHeld(h)}
                style={({ pressed }) => ({
                  backgroundColor: t.surface,
                  borderRadius: radius.card,
                  padding: space.md,
                  opacity: pressed ? 0.85 : 1,
                  gap: 2,
                })}
              >
                <T v="label">
                  {h.label} · {new Date(h.postedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </T>
                {h.title ? <T style={{ fontFamily: font.bold }}>{h.title}</T> : null}
                {h.text ? <T v="small">{h.text}</T> : null}
              </Pressable>
            ))}
          </View>
          <Button
            kind="quiet"
            label="Clear all"
            onPress={() =>
              Alert.alert(`Clear ${held.length} held notifications?`, "They will be deleted from STOIC. This can't be undone.", [
                { text: "Keep them", style: "cancel" },
                {
                  text: "Clear",
                  style: "destructive",
                  onPress: () => {
                    device!.clearHeld();
                    setHeld([]);
                    AccessibilityInfo.announceForAccessibility("Held notifications cleared.");
                  },
                },
              ])
            }
          />
        </Card>
      ) : null}

      <Card tint="sky">
        <T v="h2">Today</T>
        {access && counts.length === 0 ? <T muted>No notifications counted yet today.</T> : null}
        {total > 0 ? (
          <T>
            <B>{total}</B> notifications so far. Tap “Hold” on the ones that can wait.
          </T>
        ) : null}
        <View style={{ gap: space.md }}>
          {top.map((c) => (
            <View key={c.packageName} style={{ gap: space.xs }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <View style={{ flex: 1 }}>
                  <T v="label">{c.label}</T>
                  <T v="small" muted>
                    {c.count} {c.count === 1 ? "notification" : "notifications"}
                  </T>
                </View>
                <Chip
                  role="checkbox"
                  label={holdSet.has(c.packageName) ? "Holding" : "Hold"}
                  accessibilityLabel={`Hold ${c.label} notifications`}
                  selected={holdSet.has(c.packageName)}
                  onPress={() => toggleHold(c.packageName, c.label)}
                />
              </View>
              <View
                importantForAccessibility="no-hide-descendants"
                style={{ height: 8, borderRadius: 4, backgroundColor: t.surface, overflow: "hidden" }}
              >
                <View style={{ width: `${(c.count / max) * 100}%`, height: "100%", backgroundColor: t.brand }} />
              </View>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <T v="h2">Apps I hold</T>
        {hold.length === 0 ? <T muted>None yet. Their notifications show as normal.</T> : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {hold.map((pkg) => {
            const label = labels.get(pkg) ?? pkg;
            return (
              <Chip
                key={pkg}
                role="button"
                label={`${label}  ✕`}
                accessibilityLabel={`Stop holding ${label}`}
                selected={false}
                onPress={() => toggleHold(pkg, label)}
              />
            );
          })}
        </View>
        {adding ? (
          <AppPicker
            title="Hold notifications from"
            exclude={holdSet}
            onPick={(app) => {
              saveHold([...hold, app.packageName], `${app.label} notifications will be held for your summary.`);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <Button kind="outline" label="Hold another app" onPress={() => setAdding(true)} />
        )}

        <T v="label" style={{ marginTop: space.md }}>
          Send my summary at
        </T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {shownTimes.map((m) => (
            <Chip key={m} role="checkbox" label={formatMin(m)} selected={times.includes(m)} onPress={() => toggleTime(m)} />
          ))}
        </View>
        {times.length === 0 ? <T v="small">No times picked: held notifications wait here until you look.</T> : null}

        <SwitchRow
          label="Hold notifications from blocked apps"
          hint="During focus, bedtime and schedules. You get a summary when it ends."
          value={whileBlocked}
          onChange={(on) => {
            setWhileBlocked(on);
            device!.setHoldWhileBlocked(on);
          }}
        />
      </Card>

      <Card>
        <T v="h3">Good to know</T>
        <Bullets
          items={[
            "Calls, alarms, navigation, music and your phone and messages apps are never held.",
            "Android lets STOIC hide a notification only after it arrives, so you may still hear the first sound. Bedtime's Do Not Disturb keeps nights fully quiet.",
            "Held notifications stay on this phone and are deleted when you open or clear them, or after three days.",
          ]}
        />
      </Card>
    </Screen>
  );
}
