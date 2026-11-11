import type { Schedule } from "@/lib/device";

/** Helpers for Bedtime and other schedules (pure; the blocking itself happens in Schedules.kt). */

export const BEDTIME_ID = "bedtime";
export const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];
export const WEEKDAYS = [1, 2, 3, 4, 5];

export const DAY_SHORT = ["M", "T", "W", "T", "F", "S", "S"];
export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function defaultBedtime(): Schedule {
  return {
    id: BEDTIME_ID,
    name: "Bedtime",
    kind: "bedtime",
    enabled: false,
    days: ALL_DAYS,
    startMin: 23 * 60,
    endMin: 7 * 60,
    allApps: true,
    packages: [],
    dnd: true,
    allowSnooze: true,
  };
}

export function newSchedule(existing: Schedule[]): Schedule {
  return {
    id: `s${Date.now().toString(36)}`,
    name: existing.some((s) => s.name === "Study hours") ? "New schedule" : "Study hours",
    kind: "custom",
    enabled: true,
    days: WEEKDAYS,
    startMin: 9 * 60,
    endMin: 17 * 60,
    allApps: false,
    packages: [],
    dnd: false,
    allowSnooze: true,
  };
}

/** "11:00 PM" or "23:00", following the phone's locale. */
export function formatMin(min: number) {
  const d = new Date(2000, 0, 1, Math.floor(min / 60), min % 60);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** "Every day", "Weekdays", "Weekends" or "Mon, Wed, Fri". */
export function describeDays(days: number[]) {
  const set = new Set(days);
  const has = (list: number[]) => list.length === set.size && list.every((d) => set.has(d));
  if (set.size === 0) return "No days";
  if (has(ALL_DAYS)) return "Every day";
  if (has(WEEKDAYS)) return "Weekdays";
  if (has([6, 7])) return "Weekends";
  return [...set].sort().map((d) => DAY_NAMES[d - 1].slice(0, 3)).join(", ");
}

/** "11:00 PM – 7:00 AM (next day)". */
export function describeWindow(s: Pick<Schedule, "startMin" | "endMin">) {
  if (s.startMin === s.endMin) return "All day";
  const next = s.endMin < s.startMin ? " (next day)" : "";
  return `${formatMin(s.startMin)} – ${formatMin(s.endMin)}${next}`;
}

/** Make sure Bedtime exists and comes first. */
export function withBedtime(list: Schedule[]): Schedule[] {
  const bed = list.find((s) => s.id === BEDTIME_ID) ?? defaultBedtime();
  return [bed, ...list.filter((s) => s.id !== BEDTIME_ID)];
}
