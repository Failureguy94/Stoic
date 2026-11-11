import { dayKey, parseKey } from "@/lib/week";

/**
 * Is a recorded day trustworthy? (Pure functions.)
 *
 * A "heartbeat" is a moment when STOIC's background job ran with Usage access on.
 * - today:      still in progress.
 * - verified:   STOIC checked in during that day AND again within a day after it ended,
 *               so the whole day was captured before Android could drop its details.
 * - unverified: STOIC was not running, or Usage access was off, for part of that day.
 *               The number may be too low. This is a gap, not a failure.
 */
export type DayStatus = "today" | "verified" | "unverified";

const DAY_MS = 24 * 60 * 60 * 1000;

export function dayStatus(day: string, heartbeats: number[], now = new Date()): DayStatus {
  if (day === dayKey(now)) return "today";
  const start = parseKey(day).getTime();
  const end = start + DAY_MS;
  const during = heartbeats.some((h) => h >= start && h < end);
  const after = heartbeats.some((h) => h >= end && h < end + DAY_MS);
  return during && after ? "verified" : "unverified";
}

export const STATUS_TEXT: Record<DayStatus, { label: string; symbol: string; explain: string }> = {
  today: { label: "Today so far", symbol: "◔", explain: "Still counting." },
  verified: { label: "Recorded", symbol: "✓", explain: "STOIC checked in during and after this day." },
  unverified: {
    label: "Unverified",
    symbol: "?",
    explain: "STOIC wasn't running or Usage access was off for part of this day, so the total may be too low.",
  },
};

/**
 * Longest stretch with no heartbeat in the last `days` days, in hours (for the status line).
 * Counts from the first heartbeat ever if that is more recent: before recording was switched
 * on there was nothing to miss, so that time is not a gap.
 */
export function longestGapHours(heartbeats: number[], now = Date.now(), days = 7) {
  if (heartbeats.length === 0) return 0;
  const from = Math.max(now - days * DAY_MS, Math.min(...heartbeats));
  const beats = heartbeats.filter((h) => h >= from).sort((a, b) => a - b);
  let last = from;
  let gap = 0;
  for (const h of [...beats, now]) {
    gap = Math.max(gap, h - last);
    last = h;
  }
  return Math.round(gap / 3_600_000);
}
