// STOIC desktop: the "should this app be closed?" rules.
// Pure functions with no Electron or system calls, unit-tested in ../tests/rules.test.mjs.
// They mirror the Android app (Blocker.kt, Schedules.kt, Strict.kt) and the browser extension.

/** @typedef {{ key: string, name: string, pause: boolean, limitMin: number, blockInFocus: boolean, allowExtend: boolean }} AppRule */
/** @typedef {{ id: string, name: string, enabled: boolean, days: number[], startMin: number, endMin: number, apps: string[] }} Schedule */
/** @typedef {{ apps: AppRule[], schedules: Schedule[], focusUntil: number, strictUntil: number, openAtLogin: boolean }} Settings */
/** @typedef {{ pid: number, key: string, name: string, path: string }} Proc */

export const GRACE_MS = 3 * 60_000;
export const EXTEND_MS = 5 * 60_000;
export const PAUSE_MS = 10_000;
export const UNLOCK_WAIT_MS = 15 * 60_000;
/** Longest gap counted as "open" between two checks (the computer may have been asleep). */
export const MAX_STEP_MS = 30_000;
const DAY_MIN = 24 * 60;

/**
 * Apps STOIC never closes: the desktop, system processes and STOIC itself.
 * Keys are lower-case executable names without ".exe".
 */
export const ESSENTIAL = new Set([
  // Windows
  "explorer", "dwm", "csrss", "winlogon", "lsass", "services", "svchost", "taskmgr", "systemsettings",
  "searchhost", "startmenuexperiencehost", "shellexperiencehost", "applicationframehost", "textinputhost",
  "conhost", "runtimebroker", "sihost", "ctfmon", "smss", "wininit", "fontdrvhost", "lockapp",
  // macOS
  "finder", "dock", "windowserver", "loginwindow", "systemuiserver", "controlcenter", "system settings",
  "system preferences", "activity monitor", "spotlight", "launchd", "kernel_task",
  // Linux desktops
  "systemd", "gnome-shell", "plasmashell", "kwin_x11", "kwin_wayland", "xorg", "xwayland", "init",
  // STOIC itself
  "stoic", "electron",
]);

/** @returns {Settings} */
export function defaultSettings() {
  return { apps: [], schedules: [], focusUntil: 0, strictUntil: 0, openAtLogin: true };
}

/**
 * The key STOIC uses for an app: its executable's name, lower case, without folders or ".exe".
 * "C:\\Program Files\\Discord\\Discord.exe" -> "discord", "/Applications/Steam.app/Contents/MacOS/steam_osx" -> "steam".
 * @param {string} exeOrName
 */
export function appKey(exeOrName) {
  const s = String(exeOrName ?? "").trim();
  const mac = s.match(/\/([^/]+)\.app(\/|$)/i);
  const base = mac ? mac[1] : s.split(/[\\/]/).pop() ?? "";
  return base.replace(/\.(exe|app)$/i, "").trim().toLowerCase();
}

export const isEssential = (/** @type {string} */ key) => ESSENTIAL.has(key);

/** (ISO day 1 = Monday ... 7 = Sunday, minutes after midnight) in local time. */
export function localTime(/** @type {number} */ now) {
  const d = new Date(now);
  return { isoDay: ((d.getDay() + 6) % 7) + 1, minute: d.getHours() * 60 + d.getMinutes() };
}

export function dayKey(/** @type {number} */ now) {
  const d = new Date(now);
  const p = (/** @type {number} */ n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Is the schedule's window active? Windows that end before they start run past midnight. */
export function scheduleActive(/** @type {Schedule} */ s, /** @type {number} */ isoDay, /** @type {number} */ minute) {
  if (!s.enabled || s.days.length === 0) return false;
  const prev = isoDay === 1 ? 7 : isoDay - 1;
  if (s.startMin === s.endMin) return s.days.includes(isoDay);
  if (s.startMin < s.endMin) return s.days.includes(isoDay) && minute >= s.startMin && minute < s.endMin;
  return (s.days.includes(isoDay) && minute >= s.startMin) || (s.days.includes(prev) && minute < s.endMin);
}

/**
 * What to do about a running app.
 * @param {{
 *   key: string,
 *   settings: Settings,
 *   now: number,
 *   openTodayMs: number,
 *   graceUntil: number,
 *   extendUntil: number,
 *   justStarted: boolean,
 * }} i
 * @returns {{ kind: "ALLOW" | "FOCUS" | "SCHEDULE" | "LIMIT" | "PAUSE", rule?: AppRule, schedule?: Schedule }}
 */
export function decide({ key, settings, now, openTodayMs, graceUntil, extendUntil, justStarted }) {
  if (isEssential(key)) return { kind: "ALLOW" };
  const rule = settings.apps.find((a) => a.key === key);
  if (rule && rule.blockInFocus && settings.focusUntil > now) return { kind: "FOCUS", rule };
  const { isoDay, minute } = localTime(now);
  const schedule = settings.schedules.find((s) => s.apps.includes(key) && scheduleActive(s, isoDay, minute));
  if (schedule) return { kind: "SCHEDULE", rule, schedule };
  if (!rule) return { kind: "ALLOW" };
  if (rule.limitMin > 0 && openTodayMs >= rule.limitMin * 60_000 && extendUntil <= now) return { kind: "LIMIT", rule };
  // The pause is about opening an app, so it only applies when the app has just started.
  if (rule.pause && justStarted && graceUntil <= now) return { kind: "PAUSE", rule };
  return { kind: "ALLOW", rule };
}

/** Keep "Open anyway" alive while the app stays open; an expired grace stays expired. */
export function refreshedGrace(/** @type {number} */ graceUntil, /** @type {number} */ now) {
  return graceUntil > now ? now + GRACE_MS : graceUntil;
}

/** Time to count as "open" for one check, capped so a sleeping computer doesn't count. */
export function openStep(/** @type {number} */ since, /** @type {number} */ now) {
  return Math.max(0, Math.min(now - since, MAX_STEP_MS));
}

/**
 * Apps that appeared since the last check. An app counts as "just started" only if none of its
 * processes were running before (many apps run several processes).
 * @param {Set<string>} before @param {Proc[]} procs
 */
export function newlyStarted(before, procs) {
  return new Set(procs.map((p) => p.key).filter((k) => !before.has(k)));
}

// ---- strict mode ----

export const strictActive = (/** @type {Settings} */ s, /** @type {number} */ now) => s.strictUntil > now;

const limitLooser = (/** @type {number} */ o, /** @type {number} */ n) => (o === 0 ? false : n === 0 ? true : n > o);

/** Would replacing `old` with `next` loosen anything? A reason, or null. */
export function looserReason(/** @type {Settings} */ old, /** @type {Settings} */ next, /** @type {number} */ now) {
  for (const o of old.apps) {
    const n = next.apps.find((a) => a.key === o.key);
    if (!n) return `remove ${o.name}`;
    if (limitLooser(o.limitMin, n.limitMin)) return `raise the daily limit for ${o.name}`;
    if (o.pause && !n.pause) return `turn off the pause for ${o.name}`;
    if (o.blockInFocus && !n.blockInFocus) return `unblock ${o.name} during focus`;
    if (!o.allowExtend && n.allowExtend) return `allow going over on ${o.name}`;
  }
  for (const o of old.schedules.filter((s) => s.enabled)) {
    const n = next.schedules.find((s) => s.id === o.id);
    if (!n) return `remove ${o.name}`;
    if (!n.enabled) return `switch off ${o.name}`;
    if (!o.days.every((d) => n.days.includes(d))) return `take days off ${o.name}`;
    if (n.startMin !== o.startMin || n.endMin !== o.endMin) return `change ${o.name}'s hours`;
    if (!o.apps.every((a) => n.apps.includes(a))) return `remove apps from ${o.name}`;
  }
  if (old.focusUntil > now && next.focusUntil < old.focusUntil) return "end the focus session early";
  if (old.openAtLogin && !next.openAtLogin) return "stop STOIC opening when you log in";
  if (next.strictUntil < old.strictUntil) return "shorten strict mode";
  return null;
}

export function canUnlockEarly(/** @type {number} */ requestedAt, /** @type {number} */ now) {
  return requestedAt > 0 && now - requestedAt >= UNLOCK_WAIT_MS;
}

/** Clamp anything read from disk into valid settings. @param {any} raw @returns {Settings} */
export function sanitize(raw) {
  const d = defaultSettings();
  if (!raw || typeof raw !== "object") return d;
  const num = (/** @type {any} */ v, /** @type {number} */ min, /** @type {number} */ max) =>
    Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : 0;
  const keys = (/** @type {any} */ list) =>
    [...new Set((Array.isArray(list) ? list : []).map(appKey).filter((k) => k && !isEssential(k)))];
  return {
    apps: (Array.isArray(raw.apps) ? raw.apps : [])
      .map((/** @type {any} */ a) => {
        const key = appKey(a?.key ?? "");
        return {
          key,
          name: String(a?.name || key).slice(0, 60),
          pause: !!a?.pause,
          limitMin: num(a?.limitMin, 0, DAY_MIN),
          blockInFocus: !!a?.blockInFocus,
          allowExtend: a?.allowExtend !== false,
        };
      })
      .filter((/** @type {AppRule} */ a, /** @type {number} */ i, /** @type {AppRule[]} */ all) => a.key && !isEssential(a.key) && all.findIndex((x) => x.key === a.key) === i),
    schedules: (Array.isArray(raw.schedules) ? raw.schedules : [])
      .filter((/** @type {any} */ s) => s && typeof s.id === "string" && s.id)
      .map((/** @type {any} */ s) => ({
        id: s.id,
        name: String(s.name ?? "Schedule").slice(0, 40),
        enabled: !!s.enabled,
        days: [...new Set((Array.isArray(s.days) ? s.days : []).filter((/** @type {any} */ x) => Number.isInteger(x) && x >= 1 && x <= 7))],
        startMin: num(s.startMin, 0, DAY_MIN - 1),
        endMin: num(s.endMin, 0, DAY_MIN - 1),
        apps: keys(s.apps),
      })),
    focusUntil: num(raw.focusUntil, 0, Number.MAX_SAFE_INTEGER),
    strictUntil: num(raw.strictUntil, 0, Number.MAX_SAFE_INTEGER),
    openAtLogin: raw.openAtLogin !== false,
  };
}
