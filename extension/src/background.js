// STOIC browser extension: background service worker.
// Watches which page each tab shows, counts time on sites that have rules, and sends a tab to
// STOIC's pause / limit / focus / schedule page when one of the user's own rules says so.
// Nothing leaves the browser: no network requests, no analytics.

import {
  EXTEND_MS,
  GRACE_MS,
  canUnlockEarly,
  countsAsUse,
  dayKey,
  decide,
  hostOf,
  isExtensionsPage,
  looserReason,
  matchDomain,
  normalizeSite,
  refreshedGrace,
  sanitize,
  strictActive,
  usageStep,
} from "./rules.js";

const BLOCK_PAGE = chrome.runtime.getURL("src/blocked.html");

// ---- storage ----

async function getSettings() {
  const { settings } = await chrome.storage.local.get("settings");
  return sanitize(settings);
}

async function setSettings(/** @type {any} */ s) {
  await chrome.storage.local.set({ settings: sanitize(s) });
}

/** Short-lived state: grace and "5 more minutes" per domain, today's usage, unlock request. */
async function getState() {
  const { state } = await chrome.storage.local.get("state");
  const s = state && typeof state === "object" ? state : {};
  const today = dayKey(Date.now());
  return {
    grace: s.grace ?? {},
    extend: s.extend ?? {},
    usage: s.usage?.day === today ? s.usage : { day: today, ms: {} },
    unlockRequestedAt: s.unlockRequestedAt ?? 0,
  };
}

async function setState(/** @type {any} */ s) {
  await chrome.storage.local.set({ state: s });
}

// ---- time tracking ----
// "tracking" = { tabId, domain, since } for the site in the focused window's active tab, kept in
// session storage because the service worker can be stopped between events.

async function flushUsage() {
  const now = Date.now();
  const { tracking } = await chrome.storage.session.get("tracking");
  if (!tracking) return;
  const step = usageStep(tracking.since, now);
  if (step > 0) {
    const state = await getState();
    state.usage.ms[tracking.domain] = (state.usage.ms[tracking.domain] ?? 0) + step;
    await setState(state);
  }
  await chrome.storage.session.set({ tracking: { ...tracking, since: now } });
}

async function retrack() {
  await flushUsage();
  const settings = await getSettings();
  const idle = await chrome.idle.queryState(60);
  const win = await chrome.windows.getLastFocused({ populate: true }).catch(() => null);
  let next = null;
  if (win && countsAsUse(idle, !!win.focused)) {
    const tab = win.tabs?.find((t) => t.active);
    const host = tab?.url ? hostOf(tab.url) : null;
    const domain = host ? matchDomain(host, settings.sites.map((r) => r.domain)) : null;
    if (tab?.id !== undefined && domain) next = { tabId: tab.id, domain, since: Date.now() };
  }
  await chrome.storage.session.set({ tracking: next });
}

// ---- enforcement ----

/** Decide about one tab and send it to STOIC's page if needed. */
async function check(/** @type {number} */ tabId, /** @type {string} */ url) {
  if (!url || url.startsWith(BLOCK_PAGE)) return;
  const settings = await getSettings();
  const now = Date.now();

  if (strictActive(settings, now) && settings.lockExtensionsPage && isExtensionsPage(url)) {
    await show(tabId, { kind: "STRICT", until: settings.strictUntil, url: "" });
    return;
  }

  const host = hostOf(url);
  if (!host) return;
  const state = await getState();
  const ruleDomain = matchDomain(host, settings.sites.map((r) => r.domain));
  const d = decide({
    host,
    settings,
    now,
    usedTodayMs: ruleDomain ? state.usage.ms[ruleDomain] ?? 0 : 0,
    graceUntil: ruleDomain ? state.grace[ruleDomain] ?? 0 : 0,
    extendUntil: ruleDomain ? state.extend[ruleDomain] ?? 0 : 0,
  });
  if (d.kind === "ALLOW") {
    // Still on a site the user chose to open: keep "Open anyway" alive.
    if (ruleDomain && state.grace[ruleDomain]) {
      state.grace[ruleDomain] = refreshedGrace(state.grace[ruleDomain], now);
      await setState(state);
    }
    return;
  }
  const strict = strictActive(settings, now);
  await show(tabId, {
    kind: d.kind,
    url,
    domain: d.domain ?? host,
    until: d.kind === "FOCUS" ? settings.focusUntil : 0,
    limitMin: d.rule?.limitMin ?? 0,
    // Strict mode hides every "go a little over" option.
    allowExtend: !strict && !!d.rule?.allowExtend,
    schedule: d.schedule?.name ?? "",
    endMin: d.schedule?.endMin ?? 0,
  });
}

async function show(/** @type {number} */ tabId, /** @type {Record<string, any>} */ info) {
  const q = new URLSearchParams(Object.entries(info).map(([k, v]) => [k, String(v)]));
  await chrome.tabs.update(tabId, { url: `${BLOCK_PAGE}?${q}` }).catch(() => {});
}

/** Check every open tab, e.g. when a focus session starts or a schedule may have begun. */
async function checkAllTabs() {
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((t) => (t.id !== undefined && t.url ? check(t.id, t.url) : null)));
}

// ---- events ----

chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
  if (change.url) check(tabId, change.url);
  if (change.url || change.status === "complete") retrack();
  if (tab.active && change.status === "loading" && tab.url) check(tabId, tab.url);
});
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  await retrack();
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (tab?.url) await check(tabId, tab.url);
});
chrome.windows.onFocusChanged.addListener(() => retrack());
chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener(() => retrack());

// Every 30 seconds: count time, then re-check the active tabs (a limit can run out, a schedule start
// or a focus session end while a page stays open).
chrome.alarms.create("tick", { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener(async (a) => {
  if (a.name !== "tick") return;
  await retrack();
  const active = await chrome.tabs.query({ active: true });
  for (const t of active) if (t.id !== undefined && t.url) await check(t.id, t.url);
  // Tidy up a finished focus session.
  const s = await getSettings();
  if (s.focusUntil && s.focusUntil <= Date.now()) await setSettings({ ...s, focusUntil: 0 });
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") chrome.runtime.openOptionsPage();
});

// ---- messages from the popup, options and STOIC pages ----

/** Save new settings unless strict mode forbids loosening them. */
async function save(/** @type {any} */ next) {
  const old = await getSettings();
  const clean = sanitize(next);
  // Strict mode itself is only changed through its own messages.
  clean.strictUntil = old.strictUntil;
  if (strictActive(old, Date.now())) {
    const reason = looserReason(old, clean, Date.now());
    if (reason) return { error: `Strict mode is on, so you can't ${reason} until it ends.` };
    // Locking the extensions page can be added during strict mode, not removed.
    clean.lockExtensionsPage = old.lockExtensionsPage || clean.lockExtensionsPage;
  }
  await setSettings(clean);
  await checkAllTabs();
  return { ok: true };
}

/** @type {Record<string, (msg: any) => Promise<any>>} */
const handlers = {
  async getAll() {
    await flushUsage();
    return { settings: await getSettings(), state: await getState(), now: Date.now() };
  },
  save: (msg) => save(msg.settings),
  async addSite(msg) {
    const domain = normalizeSite(msg.domain);
    if (!domain) return { error: "That doesn't look like a website." };
    const s = await getSettings();
    if (s.sites.some((r) => r.domain === domain)) return { ok: true, domain };
    const r = await save({ ...s, sites: [...s.sites, { domain, pause: true, limitMin: 0, blockInFocus: true, allowExtend: true }] });
    return { ...r, domain };
  },
  async startFocus(msg) {
    const s = await getSettings();
    const until = Date.now() + Math.max(1, Math.min(180, Number(msg.minutes) || 25)) * 60_000;
    return save({ ...s, focusUntil: Math.max(s.focusUntil, until) });
  },
  async endFocus() {
    const s = await getSettings();
    return save({ ...s, focusUntil: 0 });
  },
  async openAnyway(msg) {
    const state = await getState();
    state.grace[msg.domain] = Date.now() + GRACE_MS;
    await setState(state);
    return { ok: true };
  },
  async moreTime(msg) {
    const s = await getSettings();
    const rule = s.sites.find((r) => r.domain === msg.domain);
    if (!rule?.allowExtend || strictActive(s, Date.now())) return { error: "More time isn't available for this site." };
    const state = await getState();
    state.extend[msg.domain] = Date.now() + EXTEND_MS;
    await setState(state);
    return { ok: true };
  },
  async startStrict(msg) {
    const s = await getSettings();
    const now = Date.now();
    const until = Number(msg.until) || 0;
    if (until <= now) return { error: "Pick a time in the future." };
    // Strict mode can be extended while on, never shortened.
    const strictUntil = strictActive(s, now) ? Math.max(s.strictUntil, until) : until;
    await setSettings({ ...s, strictUntil, lockExtensionsPage: s.lockExtensionsPage || !!msg.lockExtensionsPage });
    const state = await getState();
    await setState({ ...state, unlockRequestedAt: 0 });
    await checkAllTabs();
    return { ok: true };
  },
  async requestUnlock() {
    const state = await getState();
    if (!state.unlockRequestedAt) await setState({ ...state, unlockRequestedAt: Date.now() });
    return { ok: true };
  },
  async cancelUnlock() {
    const state = await getState();
    await setState({ ...state, unlockRequestedAt: 0 });
    return { ok: true };
  },
  async unlockNow() {
    const state = await getState();
    if (!canUnlockEarly(state.unlockRequestedAt, Date.now())) return { error: "The 15-minute wait isn't over yet." };
    const s = await getSettings();
    await setSettings({ ...s, strictUntil: 0, lockExtensionsPage: false });
    await setState({ ...state, unlockRequestedAt: 0 });
    return { ok: true };
  },
};

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  // Only STOIC's own pages may change settings.
  if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(chrome.runtime.getURL(""))) return false;
  const h = handlers[msg?.type];
  if (!h) return false;
  h(msg)
    .then(reply)
    .catch((e) => reply({ error: String(e?.message ?? e) }));
  return true; // reply asynchronously
});
