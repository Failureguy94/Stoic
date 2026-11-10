/**
 * "Find your fix" recommendations.
 * Hand-curated: for each problem x device we pick 1-3 tools from data/tools.ts
 * and write one honest line on why. Where only one tool truly fits, we show one
 * (plus a guide) rather than padding the list.
 */

export type Problem = "youtube-reels" | "social-media" | "notifications" | "late-night" | "games";
export type Device = "android" | "iphone" | "laptop";

export const PROBLEMS: { id: Problem; label: string }[] = [
  { id: "youtube-reels", label: "YouTube / reels" },
  { id: "social-media", label: "Social media" },
  { id: "notifications", label: "Notifications" },
  { id: "late-night", label: "Late-night phone use" },
  { id: "games", label: "Games" },
];

export const DEVICES: { id: Device; label: string; hint: string }[] = [
  { id: "android", label: "Android phone", hint: "Including Redmi, Samsung, Realme, OnePlus, Pixel" },
  { id: "iphone", label: "iPhone", hint: "" },
  { id: "laptop", label: "Windows laptop / browser", hint: "Browser extensions also work on Mac" },
];

export interface Recommendation {
  toolId: string;
  reason: string;
}

export interface PickerResult {
  picks: Recommendation[];
  /** Optional link to one of our setup guides. */
  guide?: { slug: string; label: string };
}

const GUIDE_WELLBEING = { slug: "android-digital-wellbeing", label: "Set up Digital Wellbeing (Android)" };
const GUIDE_NOTIFICATIONS = { slug: "notification-cleanup", label: "Clean up your phone notifications" };
const GUIDE_YOUTUBE = { slug: "reduce-youtube-distraction", label: "Reduce YouTube and reels distraction" };

export const PICKER: Record<Problem, Record<Device, PickerResult>> = {
  "youtube-reels": {
    android: {
      picks: [
        { toolId: "android-digital-wellbeing", reason: "Set a daily app timer on YouTube or Instagram. It's already on your phone, free, and needs no new permissions." },
        { toolId: "screenzen", reason: "Adds a short pause before YouTube opens and can interrupt long scrolling. Needs Accessibility permission." },
      ],
      guide: GUIDE_YOUTUBE,
    },
    iphone: {
      picks: [
        { toolId: "iphone-screen-time", reason: "Give the Entertainment or Social Media category a daily Time Allowance. Built in and free." },
        { toolId: "screenzen", reason: "Adds a pause and a question before a reels app opens, so opening it is a choice, not a reflex." },
      ],
      guide: GUIDE_YOUTUBE,
    },
    laptop: {
      picks: [
        { toolId: "unhook", reason: "Hides YouTube's home feed, Shorts and recommendations, so you see only what you searched for. Only needs access to youtube.com." },
        { toolId: "leechblock-ng", reason: "Time-limit or block youtube.com during your study hours. Free and open source." },
      ],
      guide: GUIDE_YOUTUBE,
    },
  },
  "social-media": {
    android: {
      picks: [
        { toolId: "android-digital-wellbeing", reason: "Daily app timers for Instagram, Snapchat and others. Free and already installed." },
        { toolId: "screenzen", reason: "Limits how many times a day you can open an app, with a pause first. Free (donation-supported)." },
        { toolId: "opal", reason: "Schedule-based blocking. The free tier allows one rule, which is enough for one problem app." },
      ],
      guide: GUIDE_WELLBEING,
    },
    iphone: {
      picks: [
        { toolId: "iphone-screen-time", reason: "A daily Time Allowance for the Social Media category, applied automatically." },
        { toolId: "screenzen", reason: "A pause before opening and a limit on opens per day." },
        { toolId: "opal", reason: "One free blocking rule, for example social apps blocked 9 am to 1 pm." },
      ],
    },
    laptop: {
      picks: [
        { toolId: "leechblock-ng", reason: "Block social sites on a schedule. Free, no account, and the developer says no data collection." },
        { toolId: "cold-turkey", reason: "Free version blocks websites during a timed block. Very hard to undo once locked (locking is Pro)." },
      ],
    },
  },
  notifications: {
    android: {
      picks: [
        { toolId: "android-digital-wellbeing", reason: "Focus mode pauses chosen apps and their notifications, by hand or on a schedule." },
      ],
      guide: GUIDE_NOTIFICATIONS,
    },
    iphone: {
      picks: [
        { toolId: "iphone-focus", reason: "Allow notifications only from the people and apps you choose, and turn it on automatically at study times." },
      ],
      guide: GUIDE_NOTIFICATIONS,
    },
    laptop: {
      picks: [
        { toolId: "windows-focus", reason: "Starts a timer, turns on Do not disturb and hides taskbar badges. Built into Windows." },
      ],
      guide: GUIDE_NOTIFICATIONS,
    },
  },
  "late-night": {
    android: {
      picks: [
        { toolId: "android-digital-wellbeing", reason: "Bedtime mode turns the screen grayscale and silences the phone on a schedule. It's free and already on your phone." },
        { toolId: "screenzen", reason: "Scheduled blocks for your most tempting apps after a set time." },
      ],
      guide: GUIDE_WELLBEING,
    },
    iphone: {
      picks: [
        { toolId: "iphone-screen-time", reason: "Use a Screen Time Schedule with an evening window where only Always Allowed apps work." },
        { toolId: "iphone-focus", reason: "A Sleep Focus that silences notifications at night, on a schedule." },
      ],
    },
    laptop: {
      picks: [
        { toolId: "leechblock-ng", reason: "Block distracting sites after, say, 11 pm on weeknights. Free scheduling." },
        { toolId: "freedom", reason: "Can block the same sites on phone and laptop together. Scheduling needs Premium." },
      ],
    },
  },
  games: {
    android: {
      picks: [
        { toolId: "android-digital-wellbeing", reason: "An app timer on each game. The game closes and its icon dims when time is up." },
        { toolId: "forest", reason: "Grows a tree while you study and blocks other apps in Deep Focus. Free tier available." },
      ],
      guide: GUIDE_WELLBEING,
    },
    iphone: {
      picks: [
        { toolId: "iphone-screen-time", reason: "A daily Time Allowance for the Games category." },
        { toolId: "forest", reason: "A focus timer that rewards staying off your phone during study blocks." },
      ],
    },
    laptop: {
      picks: [
        { toolId: "freedom", reason: "The free tier includes desktop app blocking. You start each session yourself." },
        { toolId: "cold-turkey", reason: "Blocking desktop games needs Cold Turkey Pro (one-time purchase). Strongest option if you keep 'just one more match'-ing." },
      ],
    },
  },
};
