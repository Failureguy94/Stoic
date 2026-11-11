import { useState } from "react";
import { AccessibilityInfo, View } from "react-native";
import { AndroidOnly } from "@/components/AndroidOnly";
import { AppLink, B, Bullets, Button, Card, Screen, SwitchRow, T } from "@/components/ui";
import { device, type AppUsage, type DayRecord } from "@/lib/device";
import { useForeground } from "@/lib/useForeground";
import { STATUS_TEXT, dayStatus, longestGapHours, type DayStatus } from "@/lib/usageLog";
import { dayKey, formatDuration, shortDate, weekday } from "@/lib/week";
import { radius, space, useTheme } from "@/theme";

interface Day {
  day: string;
  totalMs: number;
  apps: AppUsage[];
}

export default function ScreenTime() {
  const [access, setAccess] = useState<boolean | null>(null);
  const [logOn, setLogOn] = useState(false);
  const [days, setDays] = useState<Day[] | null>(null);
  const [beats, setBeats] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);

  const load = async () => {
    if (!device) return;
    const ok = device.hasUsageAccess();
    setAccess(ok);
    const on = device.isLogEnabled();
    setLogOn(on);
    if (!ok) {
      // Past days already in STOIC's log stay visible even with access off.
      setDays(on ? await device.getDayRecords() : []);
      setBeats(device.getHeartbeats());
      return;
    }
    if (on) {
      await device.recordSnapshotNow();
      const records: DayRecord[] = await device.getDayRecords();
      setDays(records.slice(0, 14));
    } else {
      setDays(await device.getUsageByDay(7));
    }
    setBeats(device.getHeartbeats());
  };

  useForeground(load);

  if (!device) return <AndroidOnly />;

  const today = days?.find((d) => d.day === dayKey());
  const earlier = (days ?? []).filter((d) => d.day !== dayKey());

  const toggleLog = async (on: boolean) => {
    device!.setLogEnabled(on);
    AccessibilityInfo.announceForAccessibility(on ? "STOIC will keep its own record from now on." : "Recording stopped. Days already recorded are kept.");
    await load();
  };

  return (
    <Screen>
      <T v="lead">Your real per-app screen time, read from Android on this phone. Nothing is sent anywhere.</T>

      {access === false ? (
        <Card tint="butter">
          <T v="h2">Turn on Usage access</T>
          <T>
            To show your screen time, Android needs you to allow <B>Usage access</B> for STOIC. It lets the app see how long
            each app was open. It does not show what you did inside them.
          </T>
          <Bullets
            items={[
              "Tap the button below.",
              "Find STOIC in the list and switch on “Permit usage access”.",
              "Come back here. The numbers appear straight away.",
            ]}
          />
          <Button label="Open Usage access settings" onPress={() => device!.openUsageAccessSettings()} />
          <T v="small">
            If Android says “Restricted setting”, open Settings, Apps, STOIC, tap the three dots at the top right, and choose
            “Allow restricted settings”. Then try again.
          </T>
        </Card>
      ) : null}

      {access && days ? (
        <Card tint="sky">
          <T v="h2">Today</T>
          <T v="h1">{formatDuration(today?.totalMs ?? 0)}</T>
          {today && today.apps.length > 0 ? (
            <>
              <AppBars apps={showAll ? today.apps : today.apps.slice(0, 6)} />
              {today.apps.length > 6 ? (
                <Button
                  kind="quiet"
                  label={showAll ? "Show fewer apps" : `Show all ${today.apps.length} apps`}
                  onPress={() => setShowAll((s) => !s)}
                />
              ) : null}
            </>
          ) : (
            <T>No app use recorded yet today.</T>
          )}
          <T v="small">Counts apps with an icon on your home screen. System screens and the launcher are left out.</T>
        </Card>
      ) : null}

      {access === null || (access && !days) ? <T muted>Reading your screen time…</T> : null}

      {earlier.length > 0 ? (
        <View style={{ gap: space.md }}>
          <T v="h2">{logOn ? "STOIC's record" : "Earlier this week"}</T>
          {!logOn ? (
            <T v="small" muted>
              Read live from Android, which keeps detailed history for only a few days and drops apps you uninstall.
            </T>
          ) : null}
          {earlier.map((d) => (
            <DayRow key={d.day} day={d} status={logOn ? dayStatus(d.day, beats) : undefined} />
          ))}
        </View>
      ) : null}

      <Card>
        <T v="h2">Keep my own record</T>
        <SwitchRow
          label="Record my daily screen time in STOIC"
          hint="Saved on this phone only"
          value={logOn}
          disabled={!access && !logOn}
          onChange={toggleLog}
        />
        <T>
          When this is on, STOIC copies each day&apos;s totals into its own storage every few hours. Once a day is recorded,
          uninstalling another app can&apos;t erase it. Days where STOIC couldn&apos;t check in are marked <B>unverified</B>,
          not zero.
        </T>
        {logOn ? (
          <T v="small" muted>
            {beats.length === 0
              ? "No check-ins yet."
              : `Checked in ${beats.length} ${beats.length === 1 ? "time" : "times"}. Longest gap in the last 7 days: ${gapText(longestGapHours(beats))}.`}{" "}
            Battery savers on some phones (Redmi, Realme, Oppo) can stop background check-ins. Opening STOIC also records a
            check-in.
          </T>
        ) : null}
        <AppLink href="/design-note">What this can and can&apos;t prove</AppLink>
      </Card>

      {access ? (
        <Card tint="peach">
          <T v="h3">Want a nudge when it adds up?</T>
          <AppLink href="/limits">Set a daily limit or a pause</AppLink>
        </Card>
      ) : null}
    </Screen>
  );
}

function AppBars({ apps }: { apps: AppUsage[] }) {
  const t = useTheme();
  const max = Math.max(...apps.map((a) => a.ms), 1);
  return (
    <View style={{ gap: space.sm }}>
      {apps.map((a) => (
        <View key={a.packageName} accessible accessibilityLabel={`${a.label}: ${formatDuration(a.ms)}`} style={{ gap: 2 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.sm }}>
            <T v="label" style={{ flex: 1 }} numberOfLines={1}>
              {a.label}
            </T>
            <T v="label">{formatDuration(a.ms)}</T>
          </View>
          <View style={{ height: 12, borderRadius: radius.pill, backgroundColor: t.surface }}>
            <View style={{ height: 12, borderRadius: radius.pill, backgroundColor: t.brand, width: `${(a.ms / max) * 100}%`, minWidth: 8 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

function DayRow({ day, status }: { day: Day; status?: DayStatus }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const info = status ? STATUS_TEXT[status] : undefined;
  const top = day.apps.slice(0, 3).map((a) => a.label).join(", ");
  return (
    <Card style={{ padding: space.lg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <View style={{ flex: 1 }}>
          <T v="label">
            {weekday(day.day)} {shortDate(day.day)}
          </T>
          <T v="h3">{formatDuration(day.totalMs)}</T>
        </View>
        {info ? (
          <View
            accessible
            accessibilityLabel={`${info.label}. ${info.explain}`}
            style={{
              borderRadius: radius.pill,
              paddingHorizontal: 12,
              paddingVertical: 3,
              backgroundColor: status === "verified" ? t.mint : t.butter,
            }}
          >
            <T v="small" color={status === "verified" ? t.goodInk : t.warnInk} style={{ fontFamily: "Nunito_800ExtraBold" }}>
              {info.symbol} {info.label}
            </T>
          </View>
        ) : null}
      </View>
      {status === "unverified" ? <T v="small">{STATUS_TEXT.unverified.explain}</T> : null}
      {top ? (
        <T v="small" muted>
          Most used: {top}
        </T>
      ) : null}
      {day.apps.length > 0 ? (
        <Button
          kind="quiet"
          label={open ? "Hide apps" : "Show apps"}
          accessibilityHint={`Apps used on ${weekday(day.day)} ${shortDate(day.day)}`}
          onPress={() => setOpen((o) => !o)}
        />
      ) : null}
      {open ? (
        <View style={{ backgroundColor: t.sky, borderRadius: radius.card, padding: space.md }}>
          <AppBars apps={day.apps.slice(0, 12)} />
        </View>
      ) : null}
    </Card>
  );
}

function gapText(hours: number) {
  if (hours < 1) return "under an hour";
  return `about ${hours} ${hours === 1 ? "hour" : "hours"}`;
}
