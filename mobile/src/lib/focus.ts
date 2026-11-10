import { weekOf } from "@/lib/week";

/**
 * Focus-session rules (pure functions, unit-tested).
 * Sessions are based on timestamps, so they keep counting when the app is closed.
 * Ending early is fine: the minutes you did still count. No failure state.
 */

export interface ActiveSession {
  startedAt: number; // ms since epoch
  durationMs: number;
  /** Block the apps chosen on the Limits screen while this session runs (Android). */
  blockApps: boolean;
  /** Scheduled end-of-session notification, if the user asked for one. */
  notificationId?: string;
}

export interface FinishedSession {
  startedAt: number;
  endedAt: number;
  plannedMs: number;
  focusedMs: number;
}

export const LENGTHS_MIN = [15, 25, 45] as const;

export function remainingMs(s: ActiveSession, now: number) {
  return Math.max(0, s.startedAt + s.durationMs - now);
}

/** 0 at the start, 1 when finished. */
export function progress(s: ActiveSession, now: number) {
  if (s.durationMs <= 0) return 1;
  return Math.min(1, Math.max(0, (now - s.startedAt) / s.durationMs));
}

export function isDone(s: ActiveSession, now: number) {
  return remainingMs(s, now) === 0;
}

/** Close a session, whether it ran to the end or was stopped early. */
export function finish(s: ActiveSession, now: number): FinishedSession {
  const endedAt = Math.min(now, s.startedAt + s.durationMs);
  return { startedAt: s.startedAt, endedAt, plannedMs: s.durationMs, focusedMs: Math.max(0, endedAt - s.startedAt) };
}

export function sessionsInWeek(log: FinishedSession[], now = new Date()) {
  const week = weekOf(now);
  return log.filter((s) => weekOf(new Date(s.startedAt)) === week);
}

export function focusedMsInWeek(log: FinishedSession[], now = new Date()) {
  return sessionsInWeek(log, now).reduce((sum, s) => sum + s.focusedMs, 0);
}

/** mm:ss for the countdown. */
export function clock(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Friendly stage text as Pebble grows. */
export function stage(p: number) {
  if (p >= 1) return "Pebble is fully grown. Nice work!";
  if (p >= 0.75) return "Almost there. Pebble is nearly full size.";
  if (p >= 0.4) return "Pebble is growing nicely.";
  if (p > 0) return "Pebble is settling in.";
  return "Pebble is ready when you are.";
}

/** Keep the log from growing forever (about a year of daily sessions). */
export function appendSession(log: FinishedSession[], s: FinishedSession, max = 400) {
  return [...log, s].slice(-max);
}
