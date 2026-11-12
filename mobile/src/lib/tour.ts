/**
 * The first-run tour: one short stop per feature. Each stop opens a screen, highlights
 * the control to use (a <TourTarget id=…>), and says what it's for in a line or two.
 * Pure data and maths only, so it can be unit-tested (tour.test.ts).
 */

export interface TourStep {
  /** Screen to open. */
  route: string;
  /** TourTarget id to highlight. None: the bubble sits in the middle of the screen. */
  target?: string;
  icon: string;
  title: string;
  body: string;
  /** Needs STOIC's Android features. */
  android?: boolean;
  /** Skipped when the target isn't on screen (e.g. Set up is hidden once everything is on). */
  optional?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
  {
    route: "/",
    icon: "👋",
    title: "Welcome to STOIC",
    body: "A one-minute tour of everything STOIC can do. Tap Next to move on, or Skip any time.",
  },
  {
    route: "/",
    target: "today.setup",
    icon: "🔑",
    title: "Start here",
    body: "These two switches let STOIC see your screen time and pause apps. Tap Turn on for each one.",
    android: true,
    optional: true,
  },
  {
    route: "/controls",
    target: "controls.list",
    icon: "🎛️",
    title: "All your controls",
    body: "Every rule lives here, with what's on right now. Tap any card to change it.",
    android: true,
  },
  {
    route: "/limits",
    target: "limits.add",
    icon: "✋",
    title: "Limits and pauses",
    body: "Tap Add an app and pick one that distracts you. Then choose a pause, a daily limit or fewer opens.",
    android: true,
  },
  {
    route: "/schedules",
    target: "schedules.bedtime",
    icon: "🌙",
    title: "Bedtime",
    body: "Switch on Bedtime and pick your hours. Apps stay closed; calls, messages and alarms still work.",
    android: true,
  },
  {
    route: "/focus",
    target: "focus.start",
    icon: "⏱️",
    title: "Focus with Pebble",
    body: "Pick a length and tap Start. Pebble grows while you stay off your phone.",
  },
  {
    route: "/notifications",
    target: "notifications.hold",
    icon: "🔔",
    title: "Notifications",
    body: "Pick a noisy app to hold. Its notifications wait and arrive together at the times you choose.",
    android: true,
  },
  {
    route: "/sites",
    target: "sites.presets",
    icon: "🌐",
    title: "Websites",
    body: "Tap a site to block it in every browser on this phone, always or only while you focus.",
    android: true,
  },
  {
    route: "/reels",
    target: "reels.switches",
    icon: "🎞️",
    title: "Shorts and Reels",
    body: "Switch these on and STOIC closes Shorts and Reels for you. Normal videos still work.",
    android: true,
  },
  {
    route: "/strict",
    target: "strict.start",
    icon: "🔒",
    title: "Strict mode",
    body: "For exam weeks: pick how long, and your rules can't be loosened until then.",
    android: true,
  },
  {
    route: "/score",
    target: "score.goals",
    icon: "🌟",
    title: "Your day score",
    body: "Set your goals here. Your score out of 100 shows on Today.",
    android: true,
  },
  {
    route: "/screen-time",
    target: "screentime.top",
    icon: "📊",
    title: "Screen time",
    body: "Your real time in each app, today and this week.",
    android: true,
  },
  {
    route: "/circle",
    target: "circle.pledge",
    icon: "🤝",
    title: "Weekly pledge",
    body: "Pick one small goal for the week and check in. No streaks, no leaderboards.",
  },
  {
    route: "/",
    icon: "🎉",
    title: "You're all set",
    body: "Start with the Set up card on Today. You can replay this tour from More.",
  },
];

export const stepsFor = (android: boolean) => TOUR_STEPS.filter((s) => android || !s.android);

/** Screens that are tabs (switched to), rather than pages opened on top. */
export const TAB_ROUTES = new Set(["/", "/controls", "/focus", "/circle", "/more"]);

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Placement {
  top: number;
  /** Which way the bubble's pointer faces, if it sits next to the highlight. */
  arrow: "up" | "down" | null;
}

/**
 * Where the bubble goes: under the highlight if it fits, else above it. If neither fits
 * (a tall highlight), it is pinned to whichever edge has more room, overlapping it.
 * `minTop`/`maxBottom` keep it clear of the status bar and the gesture bar.
 */
export function placeBubble(hole: Rect | null, bubbleH: number, minTop: number, maxBottom: number, gap = 14): Placement {
  if (!hole) return { top: Math.max(minTop, (minTop + maxBottom - bubbleH) / 2), arrow: null };
  const below = hole.y + hole.height + gap;
  if (below + bubbleH <= maxBottom) return { top: below, arrow: "up" };
  const above = hole.y - gap - bubbleH;
  if (above >= minTop) return { top: above, arrow: "down" };
  const roomAbove = hole.y - minTop;
  const roomBelow = maxBottom - (hole.y + hole.height);
  return { top: roomBelow >= roomAbove ? maxBottom - bubbleH : minTop, arrow: null };
}

export const sameRect = (a: Rect | null, b: Rect | null) =>
  !!a && !!b && Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1;
