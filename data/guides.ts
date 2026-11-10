/**
 * Guide details shared by the website and the mobile app (pure data, no imports).
 * The guide text itself lives in content/guides/<slug>.mdx.
 */
export interface GuideMeta {
  slug: string;
  title: string;
  /** One line for the guides index. */
  summary: string;
  whoFor: string;
  /** e.g. "10 minutes". Fill in after you time yourself. */
  timeNeeded: string;
  devices: string;
  /** Tool ids from data/tools.ts covered by this guide. */
  toolIds: string[];
  author: string;
  /** ISO date the steps were last tested. Empty until tested. */
  lastTested: string;
}

export const GUIDE_META: GuideMeta[] = [
  {
    slug: "android-digital-wellbeing",
    title: "Set up Android Digital Wellbeing: app timers, Focus mode and Bedtime mode",
    summary: "Use the free tool already on your Android phone to limit apps, pause distractions and wind down at night.",
    whoFor: "Android users who lose time to one or two apps, or stay on their phone late.",
    timeNeeded: "[ADD TIME, e.g. 10 minutes]",
    devices: "Android phone",
    toolIds: ["android-digital-wellbeing"],
    author: "[ADD MY NAME]",
    lastTested: "",
  },
  {
    slug: "notification-cleanup",
    title: "Clean up your phone notifications",
    summary: "Find the apps that interrupt you most and quieten them, without missing the messages that matter.",
    whoFor: "Anyone whose phone buzzes during study and pulls them in.",
    timeNeeded: "[ADD TIME]",
    devices: "Android or iPhone",
    toolIds: ["android-digital-wellbeing", "iphone-focus"],
    author: "[ADD MY NAME]",
    lastTested: "",
  },
  {
    slug: "reduce-youtube-distraction",
    title: "Reduce YouTube and reels distraction",
    summary: "Hide YouTube's endless feed on your laptop, or put a daily limit on reels on your phone.",
    whoFor: "Anyone who opens YouTube or Instagram for one video and loses an hour.",
    timeNeeded: "[ADD TIME]",
    devices: "Laptop browser or phone",
    toolIds: ["unhook", "android-digital-wellbeing"],
    author: "[ADD MY NAME]",
    lastTested: "",
  },
];
