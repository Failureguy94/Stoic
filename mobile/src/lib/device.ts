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
    /** Block "blockInFocus" apps until this time (ms since epoch). 0 clears it. */
    setFocusBlockUntil: (untilMs: number) => n.setFocusBlockUntil(untilMs),

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
