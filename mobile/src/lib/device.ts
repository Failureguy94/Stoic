import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";

/**
 * Typed wrapper around the Android-only native module (modules/stoic-device).
 * On iPhone, and in Expo Go, the module does not exist: `device` is null and
 * screens show an honest "Android only" card instead.
 */

export interface AppUsage {
  packageName: string;
  label: string;
  /** Foreground time in ms. */
  ms: number;
}

export interface LaunchableApp {
  packageName: string;
  label: string;
}

export interface Rule {
  packageName: string;
  label: string;
  /** Daily limit in minutes. 0 = no limit. */
  limitMin: number;
  /** Let me add 5 more minutes from the "time's up" screen. */
  allowExtend: boolean;
  /** Show a short pause screen before the app opens. */
  pause: boolean;
  /** Block while a Pebble focus session runs. */
  blockInFocus: boolean;
  /** Most opens per day. 0 or missing = no limit. */
  maxOpens?: number;
  /** Check in after this many minutes in a row. 0 or missing = never. */
  checkInMin?: number;
}

/** A repeating time window that blocks apps. Mirrors Schedule in Schedules.kt. */
export interface Schedule {
  id: string;
  name: string;
  kind: "bedtime" | "custom";
  enabled: boolean;
  /** ISO days the window starts on: 1 = Monday ... 7 = Sunday. */
  days: number[];
  /** Minutes after midnight. If end <= start the window runs past midnight. */
  startMin: number;
  endMin: number;
  /** true: every app except essentials and the always-allowed list. false: only `packages`. */
  allApps: boolean;
  packages: string[];
  /** Turn on Do Not Disturb while active (needs Do Not Disturb access). */
  dnd: boolean;
  /** Offer "5 more minutes" on the block screen. */
  allowSnooze: boolean;
}

export interface NotificationCount {
  packageName: string;
  label: string;
  count: number;
}

/** A notification STOIC is holding for later. */
export interface HeldNotification {
  key: string;
  packageName: string;
  label: string;
  title: string;
  text: string;
  postedAt: number;
  /** "app": you hold this app. "blocked": the app was blocked (focus, bedtime, schedule) at the time. */
  reason: "app" | "blocked";
}

export interface StrictState {
  /** Strict mode is on until this time (ms since epoch); 0 when off. */
  until: number;
  lockSettings: boolean;
  /** When "Unlock early" was asked for; 0 if not. */
  unlockRequestedAt: number;
  unlockWaitMs: number;
}

/** Website and internet blocking. Mirrors SiteSettings in Sites.kt. */
export interface SiteSettings {
  enabled: boolean;
  /** Domains, e.g. "youtube.com"; subdomains are blocked too. */
  sites: string[];
  /** true: always. false: only during focus sessions and schedules. */
  always: boolean;
  /** During focus and schedules, no internet except essential and always-allowed apps. */
  internetOff: boolean;
}

export interface ReelsState {
  youtube: boolean;
  instagram: boolean;
  /** Is the separate "STOIC Shorts and Reels blocker" switched on in Accessibility settings? */
  serviceOn: boolean;
  blockedToday: number;
}

export interface DayRecord {
  /** YYYY-MM-DD */
  day: string;
  /** When this day's totals were last recorded (ms since epoch). */
  recordedAt: number;
  totalMs: number;
  apps: AppUsage[];
}

/** Raw native functions. Lists cross the bridge as JSON strings; see StoicDeviceModule.kt. */
interface Native {
  hasUsageAccess(): boolean;
  openUsageAccessSettings(): void;
  getUsageTodayJson(): Promise<string>;
  getUsageByDayJson(days: number): Promise<string>;
  getLaunchableAppsJson(): Promise<string>;
  isBlockerEnabled(): boolean;
  openAccessibilitySettings(): void;
  getRulesJson(): string;
  setRulesJson(json: string): void;
  setFocusBlockUntil(untilMs: number): void;
  setFocusSessionUntil(untilMs: number): void;
  getChoicesTodayJson(): string;
  getBedtimeUseJson(): Promise<string>;
  getOpensTodayJson(): string;
  getSchedulesJson(): string;
  setSchedulesJson(json: string): void;
  getAlwaysAllowedJson(): string;
  setAlwaysAllowedJson(json: string): void;
  getEssentialAppsJson(): Promise<string>;
  hasDndAccess(): boolean;
  openDndAccessSettings(): void;
  getSitesJson(): string;
  setSitesJson(json: string): void;
  normalizeSite(input: string): string | null;
  isVpnAllowed(): boolean;
  isVpnRunning(): boolean;
  requestVpnPermission(): boolean;
  getReelsJson(): string;
  setReels(youtube: boolean, instagram: boolean): void;
  getStrictJson(): string;
  startStrict(untilMs: number, lockSettings: boolean): void;
  requestUnlock(): void;
  cancelUnlock(): void;
  unlockNow(): boolean;
  hasNotificationAccess(): boolean;
  openNotificationAccessSettings(): void;
  getNotificationCountsJson(): Promise<string>;
  getHeldJson(): Promise<string>;
  openHeld(key: string): boolean;
  clearHeld(): void;
  getHoldAppsJson(): string;
  setHoldAppsJson(json: string): void;
  getHoldWhileBlocked(): boolean;
  setHoldWhileBlocked(on: boolean): void;
  getSummaryTimesJson(): string;
  setSummaryTimesJson(json: string): void;
  isLogEnabled(): boolean;
  setLogEnabled(enabled: boolean): void;
  recordSnapshotNow(): Promise<boolean>;
  getDayRecordsJson(): Promise<string>;
  getHeartbeatsJson(): string;
}

const native: Native | null = Platform.OS === "android" ? requireOptionalNativeModule<Native>("StoicDevice") : null;

function parse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function wrap(n: Native) {
  return {
    /** Has the user granted "Usage access" in Settings? */
    hasUsageAccess: () => n.hasUsageAccess(),
    openUsageAccessSettings: () => n.openUsageAccessSettings(),
    getUsageToday: async () => parse<AppUsage[]>(await n.getUsageTodayJson(), []),
    /** Newest day first. Android keeps detailed events for only a few days. */
    getUsageByDay: async (days: number) =>
      parse<{ day: string; totalMs: number; apps: AppUsage[] }[]>(await n.getUsageByDayJson(days), []),
    getLaunchableApps: async () => parse<LaunchableApp[]>(await n.getLaunchableAppsJson(), []),

    /** Is STOIC's accessibility service switched on? */
    isBlockerEnabled: () => n.isBlockerEnabled(),
    openAccessibilitySettings: () => n.openAccessibilitySettings(),
    getRules: () => parse<Rule[]>(n.getRulesJson(), []),
    setRules: (rules: Rule[]) => n.setRulesJson(JSON.stringify(rules)),
    /** Block-screen outcomes today: chose "Go back" vs went past the screen. */
    getChoicesToday: () => parse<{ wentBack: number; overrode: number }>(n.getChoicesTodayJson(), { wentBack: 0, overrode: 0 }),
    /** Phone use during the last finished Bedtime (essential apps excluded), or null if Bedtime is off. */
    getBedtimeUse: async () => parse<{ minutes: number; start: number; end: number } | null>(await n.getBedtimeUseJson(), null),
    /** Opens counted today for each app with a rule. */
    getOpensToday: () => parse<Record<string, number>>(n.getOpensTodayJson(), {}),
    /** End of the running focus session (any session), 0 when none. "During focus" settings follow it. */
    setFocusSessionUntil: (untilMs: number) => n.setFocusSessionUntil(untilMs),
    /** Block "blockInFocus" apps until this time (ms since epoch). 0 clears it. */
    setFocusBlockUntil: (untilMs: number) => n.setFocusBlockUntil(untilMs),

    getSchedules: () => parse<Schedule[]>(n.getSchedulesJson(), []),
    setSchedules: (list: Schedule[]) => n.setSchedulesJson(JSON.stringify(list)),
    /** Package names that "all apps" schedules skip, chosen by the user. */
    getAlwaysAllowed: () => parse<string[]>(n.getAlwaysAllowedJson(), []),
    setAlwaysAllowed: (pkgs: string[]) => n.setAlwaysAllowedJson(JSON.stringify(pkgs)),
    /** Phone, messages, alarm clock, home screen, Settings: never blocked by schedules. */
    getEssentialApps: async () => parse<LaunchableApp[]>(await n.getEssentialAppsJson(), []),
    hasDndAccess: () => n.hasDndAccess(),
    openDndAccessSettings: () => n.openDndAccessSettings(),

    getSites: () => parse<SiteSettings>(n.getSitesJson(), { enabled: false, sites: [], always: true, internetOff: false }),
    setSites: (s: SiteSettings) => n.setSitesJson(JSON.stringify(s)),
    /** "youtube.com" from whatever was typed (a link, "www.…"), or null if it isn't a website. */
    normalizeSite: (input: string) => n.normalizeSite(input),
    /** Has the user allowed STOIC's on-phone VPN? */
    isVpnAllowed: () => n.isVpnAllowed(),
    isVpnRunning: () => n.isVpnRunning(),
    /** Shows Android's VPN permission dialog. */
    requestVpnPermission: () => n.requestVpnPermission(),
    getReels: () => parse<ReelsState>(n.getReelsJson(), { youtube: false, instagram: false, serviceOn: false, blockedToday: 0 }),
    setReels: (youtube: boolean, instagram: boolean) => n.setReels(youtube, instagram),
    getStrict: () => parse<StrictState>(n.getStrictJson(), { until: 0, lockSettings: false, unlockRequestedAt: 0, unlockWaitMs: 0 }),
    /** Start or extend strict mode. It can never be shortened. */
    startStrict: (untilMs: number, lockSettings: boolean) => n.startStrict(untilMs, lockSettings),
    requestUnlock: () => n.requestUnlock(),
    cancelUnlock: () => n.cancelUnlock(),
    /** False if the unlock wait is not over yet. */
    unlockNow: () => n.unlockNow(),
    hasNotificationAccess: () => n.hasNotificationAccess(),
    openNotificationAccessSettings: () => n.openNotificationAccessSettings(),
    /** Today's notifications per app, most first. */
    getNotificationCounts: async () => parse<NotificationCount[]>(await n.getNotificationCountsJson(), []),
    /** Newest first. */
    getHeld: async () => parse<HeldNotification[]>(await n.getHeldJson(), []),
    /** Opens it like a tap on the original notification, and removes it from the list. */
    openHeld: (key: string) => n.openHeld(key),
    clearHeld: () => n.clearHeld(),
    getHoldApps: () => parse<string[]>(n.getHoldAppsJson(), []),
    setHoldApps: (pkgs: string[]) => n.setHoldAppsJson(JSON.stringify(pkgs)),
    getHoldWhileBlocked: () => n.getHoldWhileBlocked(),
    setHoldWhileBlocked: (on: boolean) => n.setHoldWhileBlocked(on),
    /** Minutes after midnight. */
    getSummaryTimes: () => parse<number[]>(n.getSummaryTimesJson(), []),
    setSummaryTimes: (times: number[]) => n.setSummaryTimesJson(JSON.stringify(times)),

    isLogEnabled: () => n.isLogEnabled(),
    setLogEnabled: (enabled: boolean) => n.setLogEnabled(enabled),
    /** Copy recent usage into STOIC's own log now. False when Usage access is off. */
    recordSnapshotNow: () => n.recordSnapshotNow(),
    /** Newest day first. */
    getDayRecords: async () => parse<DayRecord[]>(await n.getDayRecordsJson(), []),
    getHeartbeats: () => parse<number[]>(n.getHeartbeatsJson(), []),
  };
}

export type Device = ReturnType<typeof wrap>;

/** null on iPhone, in Expo Go, and anywhere the native module is missing. */
export const device: Device | null = native ? wrap(native) : null;

export const isAndroid = Platform.OS === "android";
