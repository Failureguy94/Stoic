/**
 * STOIC's how-to docs (pure data, no imports), shared by the app and the website.
 * The text lives in content/docs/<slug>.mdx.
 */
export interface DocMeta {
  slug: string;
  title: string;
  /** One line for the docs list. */
  summary: string;
  icon: string;
  minutes: number;
  /** The app screen this doc is about, if any. */
  screen?: { href: string; label: string };
}

export const DOCS: DocMeta[] = [
  {
    slug: "getting-started",
    title: "Set up STOIC",
    summary: "What STOIC needs, why, and a five-minute setup.",
    icon: "🌱",
    minutes: 5,
  },
  {
    slug: "limits",
    title: "Limits, pauses and check-ins",
    summary: "A pause before opening, daily limits, opens per day and “Still worth it?” check-ins.",
    icon: "✋",
    minutes: 3,
    screen: { href: "/limits", label: "Open Limits and pauses" },
  },
  {
    slug: "schedules",
    title: "Bedtime and schedules",
    summary: "Hours when apps stay closed, with Do Not Disturb if you like.",
    icon: "🌙",
    minutes: 3,
    screen: { href: "/schedules", label: "Open Schedules and bedtime" },
  },
  {
    slug: "focus",
    title: "Focus with Pebble",
    summary: "A timer that grows Pebble, and can block apps or switch the internet off.",
    icon: "⏱️",
    minutes: 2,
    screen: { href: "/focus", label: "Open Focus" },
  },
  {
    slug: "notifications",
    title: "Notifications",
    summary: "See who interrupts you, and get the noisy ones in one summary.",
    icon: "🔔",
    minutes: 3,
    screen: { href: "/notifications", label: "Open Notifications" },
  },
  {
    slug: "websites",
    title: "Websites and internet",
    summary: "Block sites in every browser, or take the phone offline while you focus.",
    icon: "🌐",
    minutes: 3,
    screen: { href: "/sites", label: "Open Websites and internet" },
  },
  {
    slug: "strict",
    title: "Strict mode",
    summary: "Make your own rules firm for a while, so a weak moment can't undo them.",
    icon: "🔒",
    minutes: 2,
    screen: { href: "/strict", label: "Open Strict mode" },
  },
  {
    slug: "day-score",
    title: "Your day score",
    summary: "How the number is worked out, and how to set your goals.",
    icon: "🌟",
    minutes: 2,
    screen: { href: "/score", label: "Open My day score" },
  },
  {
    slug: "screen-time",
    title: "Screen time and your own record",
    summary: "Your real per-app time, and a record that survives uninstalls.",
    icon: "📊",
    minutes: 2,
    screen: { href: "/screen-time", label: "Open My screen time" },
  },
  {
    slug: "troubleshooting",
    title: "If STOIC stops working",
    summary: "Battery savers, restricted settings, Private DNS and other fixes.",
    icon: "🛠️",
    minutes: 3,
  },
];
