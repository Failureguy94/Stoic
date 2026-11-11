// STOIC browser extension: the "should this page be interrupted?" rules.
// Pure functions with no browser APIs, unit-tested in ../tests/rules.test.mjs.
// They mirror the Android app's Blocker.kt, Schedules.kt, Sites.kt and Strict.kt.

/** @typedef {{ domain: string, pause: boolean, limitMin: number, blockInFocus: boolean, allowExtend: boolean }} SiteRule */
/** @typedef {{ id: string, name: string, enabled: boolean, days: number[], startMin: number, endMin: number, domains: string[] }} Schedule */
/** @typedef {{ feed: boolean, shorts: boolean, sidebar: boolean, endscreen: boolean, comments: boolean }} YouTubeOptions */
/**
 * @typedef {{
 *   sites: SiteRule[],
 *   schedules: Schedule[],
 *   youtube: YouTubeOptions,
 *   focusUntil: number,
 *   strictUntil: number,
 *   lockExtensionsPage: boolean,
 * }} Settings
 */

export const GRACE_MS = 3 * 60_000;
export const EXTEND_MS = 5 * 60_000;
export const PAUSE_MS = 10_000;
export const UNLOCK_WAIT_MS = 15 * 60_000;
const DAY_MIN = 24 * 60;

/** @returns {Settings} */
export function defaultSettings() {
  return {
    sites: [],
    schedules: [],
    youtube: { feed: true, shorts: true, sidebar: true, endscreen: true, comments: false },
    focusUntil: 0,
    strictUntil: 0,
    lockExtensionsPage: false,
  };
}

/**
 * "https://www.YouTube.com/watch?v=1" -> "youtube.com". Null for anything that is not a domain.
 * Only "www." and "m." are stripped, so "music.youtube.com" can be blocked on its own.
 * @param {string} input
 */
export function normalizeSite(input) {
  let s = String(input ?? "").trim().toLowerCase();
  s = s.includes("://") ? s.slice(s.indexOf("://") + 3) : s;
  s = s.split("/")[0].split("?")[0].split("#")[0].split(":")[0].replace(/\.+$/, "");
  for (const prefix of ["www.", "m."]) if (s.startsWith(prefix)) s = s.slice(prefix.length);
  const parts = s.split(".");
  const label = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
  if (parts.length < 2 || parts.some((p) => !label.test(p))) return null;
  return s;
}

/** The host of a web URL, or null for browser pages, files and the like. @param {string} url */
export function hostOf(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return null;
  }
}

/** The listed domain that `host` is, or is a subdomain of. @param {string} host @param {string[]} domains */
export function matchDomain(host, domains) {
  let h = host.toLowerCase().replace(/\.$/, "");
  for (;;) {
    if (domains.includes(h)) return h;
    const dot = h.indexOf(".");
    if (dot < 0) return null;
    h = h.slice(dot + 1);
  }
}

/** (ISO day 1 = Monday ... 7 = Sunday, minutes after midnight) in local time. @param {number} now */
export function localTime(now) {
  const d = new Date(now);
  return { isoDay: ((d.getDay() + 6) % 7) + 1, minute: d.getHours() * 60 + d.getMinutes() };
}

/** Is the schedule's window active? Windows that end before they start run past midnight. */
export function scheduleActive(/** @type {Schedule} */ s, /** @type {number} */ isoDay, /** @type {number} */ minute) {
  if (!s.enabled || s.days.length === 0) return false;
  const prev = isoDay === 1 ? 7 : isoDay - 1;
  if (s.startMin === s.endMin) return s.days.includes(isoDay);
  if (s.startMin < s.endMin) return s.days.includes(isoDay) && minute >= s.startMin && minute < s.endMin;
  return (s.days.includes(isoDay) && minute >= s.startMin) || (s.days.includes(prev) && minute < s.endMin);
}

/** The local date key, e.g. "2026-11-11". @param {number} now */
export function dayKey(now) {
  const d = new Date(now);
  const p = (/** @type {number} */ n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * What to do with a page.
 * @param {{
 *   host: string,
 *   settings: Settings,
 *   now: number,
 *   usedTodayMs: number,
 *   graceUntil: number,
 *   extendUntil: number,
 * }} i
 * @returns {{ kind: "ALLOW" | "FOCUS" | "SCHEDULE" | "LIMIT" | "PAUSE", domain?: string, schedule?: Schedule, rule?: SiteRule }}
 */
export function decide({ host, settings, now, usedTodayMs, graceUntil, extendUntil }) {
  const ruleDomain = matchDomain(host, settings.sites.map((r) => r.domain));
  const rule = settings.sites.find((r) => r.domain === ruleDomain);
  // A focus session is the strictest: the user started it on purpose.
  if (rule && rule.blockInFocus && settings.focusUntil > now) return { kind: "FOCUS", domain: rule.domain, rule };
  const { isoDay, minute } = localTime(now);
  for (const s of settings.schedules) {
    const d = matchDomain(host, s.domains);
    if (d && scheduleActive(s, isoDay, minute)) return { kind: "SCHEDULE", domain: d, schedule: s, rule };
  }
  if (!rule) return { kind: "ALLOW" };
  if (rule.limitMin > 0 && usedTodayMs >= rule.limitMin * 60_000 && extendUntil <= now) {
    return { kind: "LIMIT", domain: rule.domain, rule };
  }
  if (rule.pause && graceUntil <= now) return { kind: "PAUSE", domain: rule.domain, rule };
  return { kind: "ALLOW", domain: rule.domain, rule };
}

/** Longest gap counted as use between two checks (the computer may have been asleep). */
export const MAX_STEP_MS = 90_000;

/**
 * Is the person using the browser? Only while its window is focused and the screen isn't locked.
 * "idle" still counts: watching a video doesn't touch the keyboard or mouse.
 * @param {"active" | "idle" | "locked"} idleState @param {boolean} windowFocused
 */
export function countsAsUse(idleState, windowFocused) {
  return windowFocused && idleState !== "locked";
}

/** Time to add for one check, capped so a sleeping computer doesn't count as use. */
export function usageStep(/** @type {number} */ since, /** @type {number} */ now) {
  return Math.max(0, Math.min(now - since, MAX_STEP_MS));
}

/** Keep "Open anyway" alive while the site stays open; an expired grace stays expired. */
export function refreshedGrace(/** @type {number} */ graceUntil, /** @type {number} */ now) {
  return graceUntil > now ? now + GRACE_MS : graceUntil;
}

// ---- strict mode ----

export const strictActive = (/** @type {Settings} */ s, /** @type {number} */ now) => s.strictUntil > now;

const limitLooser = (/** @type {number} */ o, /** @type {number} */ n) => (o === 0 ? false : n === 0 ? true : n > o);

/**
 * Would replacing `old` with `next` loosen anything? Returns a reason ("remove youtube.com") or null.
 * @param {Settings} old @param {Settings} next @param {number} now
 */
export function looserReason(old, next, now) {
  for (const o of old.sites) {
    const n = next.sites.find((r) => r.domain === o.domain);
    if (!n) return `remove ${o.domain}`;
    if (limitLooser(o.limitMin, n.limitMin)) return `raise the daily limit for ${o.domain}`;
    if (o.pause && !n.pause) return `turn off the pause for ${o.domain}`;
    if (o.blockInFocus && !n.blockInFocus) return `unblock ${o.domain} during focus`;
    if (!o.allowExtend && n.allowExtend) return `allow going over on ${o.domain}`;
  }
  for (const o of old.schedules.filter((s) => s.enabled)) {
    const n = next.schedules.find((s) => s.id === o.id);
    if (!n) return `remove ${o.name}`;
    if (!n.enabled) return `switch off ${o.name}`;
    if (!o.days.every((d) => n.days.includes(d))) return `take days off ${o.name}`;
    if (n.startMin !== o.startMin || n.endMin !== o.endMin) return `change ${o.name}'s hours`;
    if (!o.domains.every((d) => n.domains.includes(d))) return `remove sites from ${o.name}`;
  }
  for (const k of /** @type {(keyof YouTubeOptions)[]} */ (Object.keys(old.youtube))) {
    if (old.youtube[k] && !next.youtube[k]) return "show hidden parts of YouTube again";
  }
  if (old.focusUntil > now && next.focusUntil < old.focusUntil) return "end the focus session early";
  if (old.lockExtensionsPage && !next.lockExtensionsPage) return "unlock the extensions page";
  if (next.strictUntil < old.strictUntil) return "shorten strict mode";
  return null;
}

export function canUnlockEarly(/** @type {number} */ requestedAt, /** @type {number} */ now) {
  return requestedAt > 0 && now - requestedAt >= UNLOCK_WAIT_MS;
}

/** Browser pages where an extension can be switched off or removed. @param {string} url */
export function isExtensionsPage(url) {
  return /^(chrome|edge|brave|opera|vivaldi):\/\/extensions/i.test(url) || /^about:addons/i.test(url);
}

/** Clamp anything read from storage into valid settings. @param {any} raw @returns {Settings} */
export function sanitize(raw) {
  const d = defaultSettings();
  if (!raw || typeof raw !== "object") return d;
  const num = (/** @type {any} */ v, /** @type {number} */ min, /** @type {number} */ max) =>
    Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : 0;
  const domains = (/** @type {any} */ list) =>
    [...new Set((Array.isArray(list) ? list : []).map(normalizeSite).filter(Boolean))].map(String);
  return {
    sites: (Array.isArray(raw.sites) ? raw.sites : [])
      .map((/** @type {any} */ r) => ({
        domain: normalizeSite(r?.domain) ?? "",
        pause: !!r?.pause,
        limitMin: num(r?.limitMin, 0, DAY_MIN),
        blockInFocus: !!r?.blockInFocus,
        allowExtend: r?.allowExtend !== false,
      }))
      .filter((/** @type {SiteRule} */ r, /** @type {number} */ i, /** @type {SiteRule[]} */ a) => r.domain && a.findIndex((x) => x.domain === r.domain) === i),
    schedules: (Array.isArray(raw.schedules) ? raw.schedules : [])
      .filter((/** @type {any} */ s) => s && typeof s.id === "string" && s.id)
      .map((/** @type {any} */ s) => ({
        id: s.id,
        name: String(s.name ?? "Schedule").slice(0, 40),
        enabled: !!s.enabled,
        days: [...new Set((Array.isArray(s.days) ? s.days : []).filter((/** @type {any} */ x) => Number.isInteger(x) && x >= 1 && x <= 7))],
        startMin: num(s.startMin, 0, DAY_MIN - 1),
        endMin: num(s.endMin, 0, DAY_MIN - 1),
        domains: domains(s.domains),
      })),
    youtube: { ...d.youtube, ...Object.fromEntries(Object.keys(d.youtube).map((k) => [k, raw.youtube?.[k] ?? d.youtube[/** @type {keyof YouTubeOptions} */ (k)]]).map(([k, v]) => [k, !!v])) },
    focusUntil: num(raw.focusUntil, 0, Number.MAX_SAFE_INTEGER),
    strictUntil: num(raw.strictUntil, 0, Number.MAX_SAFE_INTEGER),
    lockExtensionsPage: !!raw.lockExtensionsPage,
  };
}
