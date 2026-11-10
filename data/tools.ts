/**
 * Curated tool list for the hub.
 *
 * HONESTY RULES (from the project brief):
 * - Every fact below was read from the official page / official store listing
 *   linked in `sources` on the date in `dateChecked`.
 * - Anything we could not confirm says "Not confirmed" — never a guess.
 * - If essential features need payment, cost is "freemium" (never "free"),
 *   and `paidFeatures` lists what is paid.
 *
 * Candidates dropped during research (2026-11-10):
 * - StayFocusd: official site returned no readable content and the Chrome Web
 *   Store listing could not be loaded, so nothing could be verified.
 */

export type Platform = "android" | "iphone" | "windows" | "mac" | "browser";

export type Purpose =
  | "app-limits"
  | "website-blocking"
  | "focus-sessions"
  | "notifications"
  | "sleep"
  | "youtube";

export type Cost = "free" | "freemium" | "paid";

/**
 * built-in: part of the operating system, no extra app permissions.
 * low:      access limited to one site or narrow scope.
 * high:     broad access, e.g. Android Accessibility Service, device admin,
 *           or "read and change data on all websites".
 * not-confirmed: we could not find the permission list on an official page.
 */
export type PermissionLevel = "built-in" | "low" | "high" | "not-confirmed";

/**
 * automatic: once set up, it works on a schedule or limit without you starting it.
 * needs-you: you must remember to start a session each time.
 */
export type Effort = "automatic" | "needs-you";

export interface Tool {
  id: string;
  name: string;
  /** One-sentence plain-language description. */
  summary: string;
  purpose: Purpose[];
  platforms: Platform[];
  cost: Cost;
  /** Exact price text as shown officially, or "Not confirmed". */
  priceNote: string;
  /** What is behind the paywall (empty for fully free tools). */
  paidFeatures: string[];
  permissionLevel: PermissionLevel;
  permissions: string;
  privacyNotes: string;
  effort: Effort;
  effortNote: string;
  /**
   * Accessibility notes. We have NOT tested these tools with screen readers;
   * notes describe interaction patterns that may matter to some users.
   */
  accessibilityNotes: string;
  limitations: string[];
  officialUrl: string;
  /** Every page read to fill this entry. */
  sources: { label: string; url: string }[];
  /** ISO date (YYYY-MM-DD) the sources were read. */
  dateChecked: string;
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  android: "Android",
  iphone: "iPhone",
  windows: "Windows",
  mac: "Mac",
  browser: "Browser extension",
};

export const PURPOSE_LABELS: Record<Purpose, string> = {
  "app-limits": "App time limits",
  "website-blocking": "Website blocking",
  "focus-sessions": "Focus sessions",
  notifications: "Notifications",
  sleep: "Sleep / late night",
  youtube: "YouTube / reels",
};

export const COST_LABELS: Record<Cost, string> = {
  free: "Free",
  freemium: "Freemium",
  paid: "Paid",
};

export const PERMISSION_LABELS: Record<PermissionLevel, string> = {
  "built-in": "Built in",
  low: "Low permissions",
  high: "High permissions",
  "not-confirmed": "Permissions not confirmed",
};

export const EFFORT_LABELS: Record<Effort, string> = {
  automatic: "Automatic",
  "needs-you": "Needs you to remember",
};

const CHECKED = "2026-11-10";

export const tools: Tool[] = [
  {
    id: "android-digital-wellbeing",
    name: "Android Digital Wellbeing",
    summary:
      "Built into Android Settings: a usage dashboard, daily app timers, Focus mode to pause chosen apps, and Bedtime mode.",
    purpose: ["app-limits", "focus-sessions", "notifications", "sleep", "youtube"],
    platforms: ["android"],
    cost: "free",
    priceNote: "Built into Android Settings on supported phones; no purchase.",
    paidFeatures: [],
    permissionLevel: "built-in",
    permissions:
      "Part of Android Settings, so you do not grant extra permissions to a third-party app.",
    privacyNotes:
      "Google Play's data-safety label says no data is shared with third parties; it may collect personal info and app activity. Data is encrypted in transit.",
    effort: "automatic",
    effortNote:
      "App timers apply every day, and Focus mode and Bedtime mode can run on a schedule.",
    accessibilityNotes:
      "Bedtime mode offers grayscale, a dark screen and dark theme. Uses standard Android Settings screens. Screen-reader use not tested by us.",
    limitations: [
      "Features and menu names vary by phone maker. Google says some steps 'may vary based on your device'.",
      "App timers reset at midnight. To use an app again sooner you delete the timer, so it is easy to switch off.",
      "Some work or school accounts may not work with app timers.",
      "Usage history for an app can disappear when that app is uninstalled (see our design note).",
    ],
    officialUrl: "https://support.google.com/android/answer/9346420",
    sources: [
      { label: "Google Android Help: Digital Wellbeing", url: "https://support.google.com/android/answer/9346420" },
      { label: "Google Play listing (data safety)", url: "https://play.google.com/store/apps/details?id=com.google.android.apps.wellbeing" },
    ],
    dateChecked: CHECKED,
  },
  {
    id: "iphone-screen-time",
    name: "iPhone Screen Time",
    summary:
      "Built into iPhone Settings: daily Time Allowances for app categories, Schedules for when apps can be used, and an Always Allowed list.",
    purpose: ["app-limits", "sleep", "youtube"],
    platforms: ["iphone"],
    cost: "free",
    priceNote: "Built into iOS; no purchase.",
    paidFeatures: [],
    permissionLevel: "built-in",
    permissions: "Part of iOS Settings, so you do not grant permissions to a third-party app.",
    privacyNotes:
      "Not confirmed: Apple's Screen Time setup page does not describe what usage data is stored or synced.",
    effort: "automatic",
    effortNote: "Allowances and Schedules apply automatically once set.",
    accessibilityNotes:
      "Uses standard iOS Settings screens. Screen-reader use not tested by us.",
    limitations: [
      "Names changed in iOS 27: 'Time Allowances' and 'Screen Time Schedules' replace the older 'App Limits' and 'Downtime'. Older iPhones still show the old names.",
      "Schedules and Time Allowances need iOS 27 or later on all your Apple devices.",
      "Apps on the Always Allowed list are never limited.",
    ],
    officialUrl: "https://support.apple.com/guide/iphone/set-schedules-and-limits-iphb0c7313c9/ios",
    sources: [
      {
        label: "Apple iPhone User Guide: Screen Time Schedules and Time Allowances",
        url: "https://support.apple.com/guide/iphone/set-schedules-and-limits-iphb0c7313c9/ios",
      },
    ],
    dateChecked: CHECKED,
  },
  {
    id: "iphone-focus",
    name: "iPhone Focus (Do Not Disturb)",
    summary:
      "Built into iPhone: silence all notifications or allow only chosen people and apps, on a schedule or by hand.",
    purpose: ["notifications", "sleep", "focus-sessions"],
    platforms: ["iphone"],
    cost: "free",
    priceNote: "Built into iOS; no purchase.",
    paidFeatures: [],
    permissionLevel: "built-in",
    permissions: "Part of iOS Settings.",
    privacyNotes: "Not confirmed: Apple's Focus setup page does not discuss data use.",
    effort: "automatic",
    effortNote:
      "Can turn on automatically at a set time, at a location, or while using a certain app. You can also switch it on by hand.",
    accessibilityNotes:
      "Can switch to a simpler Lock Screen or Home Screen page while on. Screen-reader use not tested by us.",
    limitations: [
      "Only silences notifications. It does not stop you opening an app.",
      "The AI 'Reduce Interruptions' Focus needs an Apple Intelligence-capable iPhone (iPhone 15 Pro or newer).",
    ],
    officialUrl: "https://support.apple.com/guide/iphone/set-up-a-focus-iphd6288a67f/ios",
    sources: [
      { label: "Apple iPhone User Guide: Set up a Focus", url: "https://support.apple.com/guide/iphone/set-up-a-focus-iphd6288a67f/ios" },
    ],
    dateChecked: CHECKED,
  },
  {
    id: "windows-focus",
    name: "Windows Focus sessions",
    summary:
      "Built into Windows 11 and 10: a focus timer that turns on Do not disturb and hides taskbar badges and flashing apps during a session.",
    purpose: ["focus-sessions", "notifications"],
    platforms: ["windows"],
    cost: "free",
    priceNote: "Part of Windows Settings and the Clock app; no purchase.",
    paidFeatures: [],
    permissionLevel: "built-in",
    permissions: "Part of Windows; needs the built-in Clock app.",
    privacyNotes:
      "Not confirmed. Optional Spotify and Microsoft To Do links need their own accounts.",
    effort: "needs-you",
    effortNote: "You start each session yourself.",
    accessibilityNotes:
      "Shows a timer on screen and a notification when the session ends. Screen-reader use not tested by us.",
    limitations: [
      "Does not block websites or apps. It only reduces notifications and badges.",
      "Needs the Clock app. If you uninstalled it, reinstall it from the Microsoft Store.",
      "If Do not disturb was already on before a session, it stays on after.",
    ],
    officialUrl:
      "https://support.microsoft.com/en-us/windows/how-to-use-focus-in-windows-11-cbcc9ddb-8164-43fa-8919-b9a2af072382",
    sources: [
      {
        label: "Microsoft Support: How to use Focus in Windows",
        url: "https://support.microsoft.com/en-us/windows/how-to-use-focus-in-windows-11-cbcc9ddb-8164-43fa-8919-b9a2af072382",
      },
    ],
    dateChecked: CHECKED,
  },
  {
    id: "screenzen",
    name: "ScreenZen",
    summary:
      "Adds a pause before a distracting app or website opens, limits how often you open it, and can interrupt long scrolling.",
    purpose: ["app-limits", "website-blocking", "youtube"],
    platforms: ["android", "iphone", "windows", "mac"],
    cost: "free",
    priceNote:
      "Official site: 'ScreenZen is completely free', supported by optional donations. The Play listing shows in-app purchases, which the site describes as donations.",
    paidFeatures: [],
    permissionLevel: "high",
    permissions:
      "On Android, the Play listing says it 'uses Accessibility permissions to block websites'.",
    privacyNotes:
      "Play data-safety label: may share app activity, app info and performance, and device IDs with third parties; may collect photos and videos, app activity and more; data can't be deleted.",
    effort: "automatic",
    effortNote:
      "Once set, the pause and limits trigger on their own when you open a chosen app. A lock mode makes it harder to bypass.",
    accessibilityNotes:
      "Relies on timed waits and prompts before an app opens, which may frustrate users who need extra time. Screen-reader use not tested by us.",
    limitations: [
      "Accessibility permission is powerful. Only grant it if you are comfortable with that.",
      "Its privacy label lists third-party sharing (see privacy notes).",
      "The official homepage gives few feature details; many come from the Play listing.",
    ],
    officialUrl: "https://www.screenzen.co/",
    sources: [
      { label: "ScreenZen official site", url: "https://www.screenzen.co/" },
      { label: "Google Play listing", url: "https://play.google.com/store/apps/details?id=com.screenzen" },
    ],
    dateChecked: CHECKED,
  },
  {
    id: "forest",
    name: "Forest",
    summary:
      "A focus timer that grows a virtual tree while you stay off your phone. Leaving for a blocked app can make the tree wither.",
    purpose: ["focus-sessions", "app-limits"],
    platforms: ["android", "iphone", "browser"],
    cost: "freemium",
    priceNote:
      "Free tier with occasional ads ('never during active focus sessions'). Plus is a subscription; price 'varies by region and platform', so it is not confirmed here.",
    paidFeatures: ["Custom app allowlist", "Focus analytics", "Real-tree planting", "Ad-free"],
    permissionLevel: "not-confirmed",
    permissions: "Not confirmed: the official site does not list the permissions it needs.",
    privacyNotes:
      "Play data-safety label: may share personal info with third parties; may collect location, personal info and more; you can request deletion.",
    effort: "needs-you",
    effortNote: "You start each focus session.",
    accessibilityNotes:
      "The progress meaning is mainly visual (a growing tree). Screen-reader use not tested by us.",
    limitations: [
      "The free tier shows ads.",
      "Only works when you remember to start a session.",
    ],
    officialUrl: "https://www.forestapp.cc/",
    sources: [
      { label: "Forest official site", url: "https://www.forestapp.cc/" },
      { label: "Google Play listing", url: "https://play.google.com/store/apps/details?id=cc.forestapp" },
    ],
    dateChecked: CHECKED,
  },
  {
    id: "opal",
    name: "Opal",
    summary:
      "Screen time app with blocking rules, focus timers and a daily 'Opal Score'. The free tier allows one rule.",
    purpose: ["app-limits", "focus-sessions", "sleep"],
    platforms: ["android", "iphone", "mac"],
    cost: "freemium",
    priceNote:
      "Free tier: 1 rule. Pro: $99.99/year, $19.99/month, or $399 lifetime (USD shown on the official pricing page). Students can apply for up to 50% off.",
    paidFeatures: [
      "Unlimited rules (free is 1 rule)",
      "Hard Mode (cannot turn Opal off)",
      "Allow Only mode",
      "Advanced timers and soundscapes",
      "Opal Score history",
    ],
    permissionLevel: "high",
    permissions:
      "On Android 14 and above, the Play listing says it uses the AccessibilityService API to manage blocked apps.",
    privacyNotes:
      "Play data-safety label: may share location with third parties; says 'Data isn't encrypted'; you can request deletion.",
    effort: "automatic",
    effortNote: "Rules can run on a schedule or time limit.",
    accessibilityNotes: "Screen-reader use not tested by us.",
    limitations: [
      "Only one rule on the free tier.",
      "Pro is expensive for students, even with the discount.",
      "iPhone purchases are refunded through Apple, not Opal.",
    ],
    officialUrl: "https://opalapp.com/",
    sources: [
      { label: "Opal official site", url: "https://opalapp.com/" },
      { label: "Opal pricing", url: "https://opalapp.com/pricing" },
      { label: "Google Play listing", url: "https://play.google.com/store/apps/details?id=com.withopal.opal" },
    ],
    dateChecked: CHECKED,
  },
  {
    id: "leechblock-ng",
    name: "LeechBlock NG",
    summary:
      "A browser extension that blocks or time-limits sites you choose, on the days and hours you choose. Up to 30 block sets.",
    purpose: ["website-blocking", "youtube", "sleep"],
    platforms: ["browser"],
    cost: "free",
    priceNote: "Free ('A Simple Free Productivity Tool'); optional contributions.",
    paidFeatures: [],
    permissionLevel: "high",
    permissions:
      "Firefox Add-ons lists: access browser tabs, browser activity during navigation, and your data for all websites.",
    privacyNotes:
      "Firefox Add-ons: 'The developer says this extension doesn't require data collection.' Open source (Mozilla Public License 2.0).",
    effort: "automatic",
    effortNote: "Block sets run on the schedule you set. Lockdown blocks immediately.",
    accessibilityNotes:
      "The options page is a long form with many settings, which can feel complex at first. Screen-reader use not tested by us.",
    limitations: [
      "Browser only: it cannot block phone apps or desktop apps.",
      "It can be disabled from the browser's extensions page unless you add a password.",
      "Works in Firefox, Chrome and Edge (and other Chromium browsers); each browser needs its own install.",
    ],
    officialUrl: "https://www.proginosko.com/leechblock/",
    sources: [
      { label: "LeechBlock official site", url: "https://www.proginosko.com/leechblock/" },
      { label: "Firefox Add-ons listing", url: "https://addons.mozilla.org/en-US/firefox/addon/leechblock-ng/" },
    ],
    dateChecked: CHECKED,
  },
  {
    id: "unhook",
    name: "Unhook",
    summary:
      "A browser extension that hides YouTube's home feed, Shorts, sidebar recommendations, end-screen videos and comments.",
    purpose: ["youtube"],
    platforms: ["browser"],
    cost: "free",
    priceNote: "No price shown on the official site or Chrome Web Store; optional donations.",
    paidFeatures: [],
    permissionLevel: "low",
    permissions: "Firefox Add-ons lists access to your data for www.youtube.com.",
    privacyNotes:
      "Chrome Web Store: the developer says it 'will not collect or use your data'.",
    effort: "automatic",
    effortNote: "Once installed, YouTube simply loads without the distracting parts.",
    accessibilityNotes:
      "Removes page clutter, which may make YouTube easier to navigate. Screen-reader use not tested by us.",
    limitations: [
      "Desktop browsers only. It does not change the YouTube phone app.",
      "Does not limit time. You can still search and watch.",
      "Not open source ('All Rights Reserved' licence on Firefox Add-ons).",
    ],
    officialUrl: "https://unhook.app/",
    sources: [
      { label: "Unhook official site", url: "https://unhook.app/" },
      {
        label: "Chrome Web Store listing",
        url: "https://chromewebstore.google.com/detail/unhook-remove-youtube-rec/khncfooichmfjbepaaaebmommgaepoid",
      },
      { label: "Firefox Add-ons listing", url: "https://addons.mozilla.org/en-US/firefox/addon/youtube-recommended-videos/" },
    ],
    dateChecked: CHECKED,
  },
  {
    id: "cold-turkey",
    name: "Cold Turkey Blocker",
    summary:
      "A strict Windows and Mac blocker for websites and, with Pro, desktop apps and games. Locked blocks are very hard to undo.",
    purpose: ["website-blocking", "app-limits", "focus-sessions"],
    platforms: ["windows", "mac"],
    cost: "freemium",
    priceNote:
      "Free version + one-time Pro purchase ('Pay once, own forever'). Exact Pro price not confirmed: it is not readable on the official pricing page. 7-day Pro trial; 30-day refund.",
    paidFeatures: [
      "Block applications and games",
      "Scheduled blocks",
      "All locking features",
      "Breaks and allowances",
      "Application password",
    ],
    permissionLevel: "not-confirmed",
    permissions:
      "Not confirmed: the official site does not list system permissions. It installs desktop software and says you can't simply uninstall it during a locked block.",
    privacyNotes: "Not confirmed: no privacy statement on the pages we checked.",
    effort: "needs-you",
    effortNote:
      "Free version: you start timed blocks yourself. Scheduled (automatic) blocks need Pro.",
    accessibilityNotes: "Screen-reader use not tested by us.",
    limitations: [
      "Free version blocks websites only. App and game blocking is Pro.",
      "Locked blocks are 'almost impossible to stop'. Test with a short block first.",
      "Desktop only (Windows, macOS).",
    ],
    officialUrl: "https://getcoldturkey.com/",
    sources: [
      { label: "Cold Turkey official site", url: "https://getcoldturkey.com/" },
      { label: "Cold Turkey pricing", url: "https://getcoldturkey.com/pricing/" },
    ],
    dateChecked: CHECKED,
  },
  {
    id: "freedom",
    name: "Freedom",
    summary:
      "Blocks chosen websites, apps or the whole internet across your devices at the same time.",
    purpose: ["website-blocking", "app-limits", "focus-sessions"],
    platforms: ["windows", "mac", "android", "iphone"],
    cost: "freemium",
    priceNote:
      "Free tier. Premium: $8.99/month or $3.33/month billed yearly. 'Forever': $99.50 one-time (shown as 50% off $199). Prices in USD on the official pricing page; 7-day Premium trial.",
    paidFeatures: [
      "Scheduling and recurring sessions",
      "Locked Mode",
      "Unlimited sessions",
      "Advance sessions",
    ],
    permissionLevel: "high",
    permissions:
      "On Android the Play listing names Device Administrator (to prevent uninstalling) and the Accessibility API (to block apps and websites).",
    privacyNotes:
      "Play listing: 'We do not collect or share any personal or sensitive information provided by Device Administrator or Accessibility API.' Data-safety label: no data shared with third parties; you can request deletion.",
    effort: "needs-you",
    effortNote:
      "Free tier: you start sessions yourself. Scheduled (automatic) sessions need Premium.",
    accessibilityNotes: "Screen-reader use not tested by us.",
    limitations: [
      "Scheduling, the most useful feature for habits, is Premium only.",
      "Free tier has a limit on sessions (Premium adds 'unlimited sessions'). The exact free limit is not confirmed.",
      "Chromebook: websites only, no app blocking.",
    ],
    officialUrl: "https://freedom.to/",
    sources: [
      { label: "Freedom pricing", url: "https://freedom.to/pricing" },
      { label: "Google Play listing", url: "https://play.google.com/store/apps/details?id=to.freedom.android2" },
    ],
    dateChecked: CHECKED,
  },
];

export function getTool(id: string): Tool {
  const tool = tools.find((t) => t.id === id);
  if (!tool) throw new Error(`Unknown tool id: ${id}`);
  return tool;
}
