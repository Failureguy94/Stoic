import { useEffect, useEffectEvent, useState } from "react";
import { AccessibilityInfo, AppState, View } from "react-native";
import { Pebble } from "@/components/Pebble";
import { TourTarget } from "@/components/Tour";
import { AppLink, B, Button, Card, Chip, ChipGroup, Screen, SwitchRow, T } from "@/components/ui";
import { device } from "@/lib/device";
import {
  LENGTHS_MIN,
  appendSession,
  clock,
  finish,
  focusedMsInWeek,
  isDone,
  progress,
  remainingMs,
  sessionsInWeek,
  stage,
  type ActiveSession,
  type FinishedSession,
} from "@/lib/focus";
import { cancelSessionEnd, ensureNotificationPermission, scheduleSessionEnd } from "@/lib/notify";
import { KEYS, useStored } from "@/lib/storage";
import { tryStrictSave } from "@/lib/strict";
import { formatDuration } from "@/lib/week";
import { font, space } from "@/theme";

interface Prefs {
  minutes: number;
  notify: boolean;
  blockApps: boolean;
}
const DEFAULT_PREFS: Prefs = { minutes: 25, notify: false, blockApps: false };
const NO_LOG: FinishedSession[] = [];

export default function Focus() {
  const [active, setActive] = useStored<ActiveSession | null>(KEYS.focusActive, null);
  const [log, setLog] = useStored<FinishedSession[]>(KEYS.focusLog, NO_LOG);
  const [prefs, setPrefs] = useStored<Prefs>(KEYS.focusPrefs, DEFAULT_PREFS);
  const [now, setNow] = useState(() => Date.now());
  const [message, setMessage] = useState("");

  const say = (text: string) => {
    setMessage(text);
    AccessibilityInfo.announceForAccessibility(text);
  };

  const close = (session: ActiveSession, at: number, early: boolean) => {
    // Strict mode refuses to lift a running app block early; then the session simply goes on.
    if (device && !tryStrictSave(() => device!.setFocusBlockUntil(0), () => {})) return;
    device?.setFocusSessionUntil(0);
    const done = finish(session, at);
    setLog(appendSession(log ?? [], done));
    setActive(null);
    if (early) cancelSessionEnd(session.notificationId);
    say(
      early
        ? `You focused for ${formatDuration(done.focusedMs)}. That counts.`
        : `Session finished: ${formatDuration(done.focusedMs)} of focus. Pebble is fully grown!`,
    );
  };

  // Tick once a second while a session runs, and catch up when the app comes back to the front.
  // Each tick also finishes the session once time is up (this covers sessions that ended while
  // the app was closed: the first tick after loading closes them).
  const onTick = useEffectEvent((t: number) => {
    setNow(t);
    if (active && log !== undefined && isDone(active, t)) close(active, t, false);
  });
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => onTick(Date.now()), 1000);
    const sub = AppState.addEventListener("change", (s) => s === "active" && onTick(Date.now()));
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [active]);

  if (active === undefined || log === undefined || prefs === undefined) {
    return (
      <Screen tab>
        <T muted>Loading…</T>
      </Screen>
    );
  }

  const start = async () => {
    const durationMs = prefs.minutes * 60_000;
    let notificationId: string | undefined;
    if (prefs.notify) notificationId = await scheduleSessionEnd(durationMs / 1000);
    const startedAt = Date.now();
    const blockApps = prefs.blockApps && !!device?.isBlockerEnabled();
    if (blockApps) device?.setFocusBlockUntil(startedAt + durationMs);
    device?.setFocusSessionUntil(startedAt + durationMs);
    setNow(startedAt);
    setActive({ startedAt, durationMs, blockApps, notificationId });
    say(`Focus session started: ${prefs.minutes} minutes.`);
  };

  const toggleNotify = async (on: boolean) => {
    if (on && !(await ensureNotificationPermission())) {
      say("Notifications are off for STOIC, so there will be no reminder. The timer still works.");
      setPrefs({ ...prefs, notify: false });
      return;
    }
    setPrefs({ ...prefs, notify: on });
  };

  const p = active ? progress(active, now) : 0;
  const weekSessions = sessionsInWeek(log);
  const blockerReady = !!device?.isBlockerEnabled();

  return (
    <Screen tab>
      <View style={{ gap: space.sm }}>
        <T v="h1">Focus with Pebble</T>
        <T v="lead">Start a timer and put the phone down. Pebble grows while you focus.</T>
      </View>

      <Card tint="lavender" style={{ alignItems: "center" }}>
        <View style={{ height: 190, justifyContent: "flex-end" }}>
          <Pebble mood={active ? (p > 0.75 ? "happy" : "calm") : message ? "cheer" : "sleepy"} size={90 + p * 110} float={!!active} />
        </View>
        {active ? (
          <>
            <T
              v="h1"
              style={{ fontSize: 52, lineHeight: 60, fontVariant: ["tabular-nums"] }}
              accessibilityRole="timer"
              accessibilityLabel={`${Math.ceil(remainingMs(active, now) / 60000)} minutes left`}
            >
              {clock(remainingMs(active, now))}
            </T>
            <T style={{ textAlign: "center" }}>{stage(p)}</T>
            {active.blockApps ? (
              <T v="small" muted style={{ textAlign: "center" }}>
                Your chosen apps are blocked until this session ends.
              </T>
            ) : null}
            <Button kind="outline" label="End session early" onPress={() => close(active, Date.now(), true)} />
            <T v="small" muted style={{ textAlign: "center" }}>
              Ending early is fine. The minutes you did still count.
            </T>
          </>
        ) : (
          <>
            <T style={{ textAlign: "center" }}>{stage(0)}</T>
            <T v="label" style={{ alignSelf: "flex-start", marginTop: space.sm }}>
              How long?
            </T>
            <View style={{ alignSelf: "flex-start" }}>
              <ChipGroup label="Session length">
                {LENGTHS_MIN.map((m) => (
                  <Chip key={m} label={`${m} min`} selected={prefs.minutes === m} onPress={() => setPrefs({ ...prefs, minutes: m })} />
                ))}
              </ChipGroup>
            </View>
            <View style={{ alignSelf: "stretch", gap: space.sm, marginTop: space.sm }}>
              <SwitchRow label="Tell me when it ends" hint="Sends one notification from this phone" value={prefs.notify} onChange={toggleNotify} />
              {device ? (
                <SwitchRow
                  label="Block my chosen apps while I focus"
                  hint={blockerReady ? "Uses the apps you picked on the Limits screen" : "Turn on blocking in Limits and pauses first"}
                  value={prefs.blockApps && blockerReady}
                  disabled={!blockerReady}
                  onChange={(on) => setPrefs({ ...prefs, blockApps: on })}
                />
              ) : null}
            </View>
            <TourTarget id="focus.start" style={{ marginTop: space.sm }}>
              <Button label={`Start ${prefs.minutes} minute session`} onPress={start} />
            </TourTarget>
          </>
        )}
      </Card>

      <View accessibilityLiveRegion="polite" style={{ minHeight: 24 }}>
        {message ? (
          <T v="h3" style={{ fontFamily: font.display }}>
            {message}
          </T>
        ) : null}
      </View>

      <Card tint="mint">
        <T v="h2">This week</T>
        <T v="lead">
          <B>{weekSessions.length}</B> {weekSessions.length === 1 ? "session" : "sessions"}, {formatDuration(focusedMsInWeek(log))} of focus.
        </T>
        <AppLink href="/circle">My weekly pledge</AppLink>
      </Card>

    </Screen>
  );
}
