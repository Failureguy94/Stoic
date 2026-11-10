import { shiftWeek, weekOf } from "@/lib/week";

/**
 * Weekly pledge rules (pure functions, unit-tested).
 * Tone rules from the brief: no shame, a missed week never resets anything.
 */

export type Outcome = "kept" | "partly" | "rest";

export interface CheckIn {
  outcome: Outcome;
  /** Total screen time that week in ms, when the phone measured it. Absent = self-reported only. */
  measuredMs?: number;
}

export interface Pledge {
  goal: string;
  startedWeek: string; // Monday, YYYY-MM-DD
  checkIns: Record<string, CheckIn>; // keyed by Monday of the week
}

export const GOAL_IDEAS = [
  "No phone for the first 30 minutes of study",
  "Phone in another room while I study",
  "No reels or shorts after 11 pm",
  "Notifications off during lectures and study",
  "One app timer, and I don't delete it",
];

export const MAX_GOAL_LENGTH = 120;

export function startPledge(goal: string, now = new Date()): Pledge {
  return { goal: cleanGoal(goal), startedWeek: weekOf(now), checkIns: {} };
}

export function cleanGoal(goal: string) {
  return goal.trim().slice(0, MAX_GOAL_LENGTH);
}

export function checkIn(pledge: Pledge, outcome: Outcome, now = new Date(), measuredMs?: number): Pledge {
  const entry: CheckIn = measuredMs === undefined ? { outcome } : { outcome, measuredMs };
  return { ...pledge, checkIns: { ...pledge.checkIns, [weekOf(now)]: entry } };
}

/** Weeks kept or partly kept. Rest weeks never subtract, so this only goes up. */
export function weeksKept(pledge: Pledge) {
  return Object.values(pledge.checkIns).filter((c) => c.outcome !== "rest").length;
}

export function totalCheckIns(pledge: Pledge) {
  return Object.keys(pledge.checkIns).length;
}

/** Up to the last `count` weeks, oldest first, never before the pledge started. */
export function recentWeeks(pledge: Pledge, now = new Date(), count = 8) {
  const thisWeek = weekOf(now);
  return Array.from({ length: count }, (_, i) => shiftWeek(thisWeek, i - (count - 1))).filter((k) => k >= pledge.startedWeek);
}

export const REPLIES: Record<Outcome, string> = {
  kept: "Yay! That's one more week kept.",
  partly: "Partly counts! Some days are harder, and you still showed up.",
  rest: "Thanks for being honest. Call it a rest week. Nothing is lost, and next week is a fresh start.",
};
