/**
 * STOIC's day score: 0-100, built from four parts the user controls, each explained
 * in plain words. Pure functions with no imports, unit-tested in score.test.ts
 * (run with `npm test`).
 *
 * Tone: a gentle mirror, not a judge. No streaks, no red, and a low score is
 * described as a tough day, never a failure.
 */

export interface ScoreInputs {
  /** Phone use today, ms (apps with a home-screen icon). */
  screenMs: number;
  /** The user's daily screen-time goal, ms. */
  screenGoalMs: number;
  /** Pebble focus time today, ms. */
  focusMs: number;
  /** The user's daily focus goal, ms. */
  focusGoalMs: number;
  /** Pause / limit / bedtime screens today where the user chose "Go back". */
  wentBack: number;
  /** ...and where they chose "Open anyway", "5 more minutes", "Open once more" or "Keep going". */
  overrode: number;
  /** Minutes of phone use during last night's Bedtime, or null when Bedtime is off. */
  bedtimeMin: number | null;
}

export type PartId = "screen" | "focus" | "choices" | "bedtime";

export interface Part {
  id: PartId;
  label: string;
  earned: number;
  max: number;
  /** One plain sentence explaining the points. */
  why: string;
}

export interface Score {
  /** 0-100. */
  total: number;
  parts: Part[];
  word: string;
}

export const MAX = { screen: 40, focus: 25, choices: 20, bedtime: 15 } as const;

/** Minutes of bedtime use that bring the bedtime part to zero. */
export const BEDTIME_ZERO_MIN = 30;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function hm(ms: number) {
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function screenPart(screenMs: number, goalMs: number): Part {
  // Full marks up to the goal, then down to zero at twice the goal.
  const over = goalMs > 0 ? (screenMs - goalMs) / goalMs : 1;
  const earned = Math.round(MAX.screen * (1 - clamp01(over)));
  const why =
    screenMs <= goalMs
      ? `${hm(screenMs)} so far, within your ${hm(goalMs)} goal.`
      : `${hm(screenMs)} so far, ${hm(screenMs - goalMs)} over your ${hm(goalMs)} goal.`;
  return { id: "screen", label: "Screen time", earned, max: MAX.screen, why };
}

export function focusPart(focusMs: number, goalMs: number): Part {
  const earned = Math.round(MAX.focus * clamp01(goalMs > 0 ? focusMs / goalMs : 1));
  const why =
    focusMs === 0
      ? `No focus session yet. Your goal is ${hm(goalMs)}.`
      : focusMs >= goalMs
        ? `${hm(focusMs)} of focus. Goal reached!`
        : `${hm(focusMs)} of your ${hm(goalMs)} focus goal.`;
  return { id: "focus", label: "Focus", earned, max: MAX.focus, why };
}

export function choicesPart(wentBack: number, overrode: number): Part {
  const asked = wentBack + overrode;
  const earned = asked === 0 ? MAX.choices : Math.round((MAX.choices * wentBack) / asked);
  const why =
    asked === 0
      ? "No pause or limit screens today."
      : `You chose “Go back” ${wentBack} of ${asked} ${asked === 1 ? "time" : "times"} STOIC asked.`;
  return { id: "choices", label: "Choices", earned, max: MAX.choices, why };
}

export function bedtimePart(bedtimeMin: number): Part {
  const earned = Math.round(MAX.bedtime * (1 - clamp01(bedtimeMin / BEDTIME_ZERO_MIN)));
  const why =
    bedtimeMin < 1
      ? "Phone stayed down during last night's bedtime."
      : `${Math.round(bedtimeMin)} min on your phone during last night's bedtime.`;
  return { id: "bedtime", label: "Bedtime", earned, max: MAX.bedtime, why };
}

/** A kind word for the score. */
export function wordFor(total: number) {
  if (total >= 80) return "Great day";
  if (total >= 60) return "Good day";
  if (total >= 40) return "Mixed day";
  return "Tough day. Tomorrow's a fresh start";
}

export function computeScore(i: ScoreInputs): Score {
  const parts = [
    screenPart(i.screenMs, i.screenGoalMs),
    focusPart(i.focusMs, i.focusGoalMs),
    choicesPart(i.wentBack, i.overrode),
  ];
  if (i.bedtimeMin !== null) parts.push(bedtimePart(i.bedtimeMin));
  // Without Bedtime the remaining parts are scaled up to 100, so nobody loses points for a feature they don't use.
  const earned = parts.reduce((s, p) => s + p.earned, 0);
  const max = parts.reduce((s, p) => s + p.max, 0);
  const total = Math.round((100 * earned) / max);
  return { total, parts, word: wordFor(total) };
}
