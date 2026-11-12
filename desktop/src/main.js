// STOIC desktop: main process. Lives in the tray, checks running apps every two seconds, and closes an app
// (showing Pebble's window) when one of the user's own rules says so. Nothing leaves the computer.

import { BrowserWindow, Menu, Tray, app, ipcMain, nativeImage, screen } from "electron";
import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { closeApp, listProcesses, pathOf, reopen } from "./processes.js";
import {
  EXTEND_MS,
  GRACE_MS,
  canUnlockEarly,
  dayKey,
  decide,
  appKey,
  isEssential,
  looserReason,
  newlyStarted,
  openStep,
  refreshedGrace,
  sanitize,
  strictActive,
} from "./rules.js";

const here = dirname(fileURLToPath(import.meta.url));
const TICK_MS = 2_000;

// Tests run with their own settings folder.
if (process.env.STOIC_USER_DATA) app.setPath("userData", process.env.STOIC_USER_DATA);

// ---- one copy only ----
if (!app.requestSingleInstanceLock()) app.quit();
app.on("second-instance", () => showSettings());

// ---- storage (two small JSON files in the app's own folder) ----

const file = (/** @type {string} */ name) => join(app.getPath("userData"), name);

async function readJson(/** @type {string} */ name, /** @type {any} */ fallback) {
  try {
    return JSON.parse(await readFile(file(name), "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(/** @type {string} */ name, /** @type {any} */ value) {
  // Write then rename, so a crash can't leave a half-written file.
  const tmp = file(`${name}.tmp`);
  await writeFile(tmp, JSON.stringify(value, null, 1));
  await rename(tmp, file(name));
}

let settings = sanitize(null);
/** @type {{ day: string, openMs: Record<string, number>, grace: Record<string, number>, extend: Record<string, number>, unlockRequestedAt: number, paths: Record<string, string> }} */
let state = { day: "", openMs: {}, grace: {}, extend: {}, unlockRequestedAt: 0, paths: {} };

async function load() {
  settings = sanitize(await readJson("settings.json", null));
  const s = await readJson("state.json", {});
  state = { day: s.day ?? "", openMs: s.openMs ?? {}, grace: s.grace ?? {}, extend: s.extend ?? {}, unlockRequestedAt: s.unlockRequestedAt ?? 0, paths: s.paths ?? {} };
}

const saveSettings = () => writeJson("settings.json", settings);
const saveState = () => writeJson("state.json", state);

// ---- the checking loop ----

/** @type {Set<string>} */ let runningBefore = new Set();
let lastTick = Date.now();
let ticking = false;

async function tick() {
  if (ticking) return;
  ticking = true;
  try {
    const now = Date.now();
    if (state.day !== dayKey(now)) state = { ...state, day: dayKey(now), openMs: {}, extend: {} };
    if (settings.focusUntil && settings.focusUntil <= now) {
      settings.focusUntil = 0;
      await saveSettings();
      updateTray();
    }

    const watched = new Set([...settings.apps.map((a) => a.key), ...settings.schedules.flatMap((s) => s.apps)]);
    const procs = (await listProcesses()).filter((p) => watched.has(p.key) && p.pid !== process.pid);
    const started = newlyStarted(runningBefore, procs);
    const running = new Set(procs.map((p) => p.key));
    const step = openStep(lastTick, now);
    lastTick = now;

    for (const key of running) {
      state.openMs[key] = (state.openMs[key] ?? 0) + step;
      if (state.grace[key]) state.grace[key] = refreshedGrace(state.grace[key], now);
      const d = decide({
        key,
        settings,
        now,
        openTodayMs: state.openMs[key] ?? 0,
        graceUntil: state.grace[key] ?? 0,
        extendUntil: state.extend[key] ?? 0,
        justStarted: started.has(key),
      });
      if (d.kind === "ALLOW") continue;
      const mine = procs.filter((p) => p.key === key);
      // Remember how to open it again for "Open anyway" / "5 more minutes".
      const path = await pathOf(mine[0]);
      if (path) state.paths[key] = path;
      await closeApp(mine);
      running.delete(key);
      showBlock({
        kind: d.kind,
        key,
        name: d.rule?.name ?? mine[0].name,
        until: d.kind === "FOCUS" ? settings.focusUntil : 0,
        limitMin: d.rule?.limitMin ?? 0,
        allowExtend: !strictActive(settings, now) && !!d.rule?.allowExtend && !!state.paths[key],
        canReopen: !!state.paths[key],
        schedule: d.schedule?.name ?? "",
        endMin: d.schedule?.endMin ?? 0,
      });
    }
    runningBefore = running;
    await saveState();
  } catch (e) {
    console.error("STOIC check failed", e);
  } finally {
    ticking = false;
  }
}

// ---- windows ----

/** @type {BrowserWindow | null} */ let settingsWin = null;
/** @type {BrowserWindow | null} */ let blockWin = null;

const webPreferences = { preload: join(here, "preload.cjs"), contextIsolation: true, sandbox: true, nodeIntegration: false };

function showSettings() {
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.show();
    settingsWin.focus();
    return;
  }
  settingsWin = new BrowserWindow({ width: 900, height: 820, minWidth: 360, title: "STOIC", icon: iconPath(), backgroundColor: "#fffaf3", webPreferences, show: false });
  settingsWin.removeMenu();
  settingsWin.loadFile(join(here, "ui/settings.html"));
  settingsWin.once("ready-to-show", () => settingsWin?.show());
  // Closing the window keeps STOIC running in the tray.
  settingsWin.on("close", (e) => {
    if (!quitting) {
      e.preventDefault();
      settingsWin?.hide();
    }
  });
}

/** Pebble's window: pause / time's up / focus / schedule. Always on top, in the middle of the screen. */
function showBlock(/** @type {Record<string, any>} */ info) {
  const q = new URLSearchParams(Object.entries(info).map(([k, v]) => [k, String(v)])).toString();
  if (blockWin && !blockWin.isDestroyed()) {
    blockWin.loadFile(join(here, "ui/block.html"), { search: q });
    blockWin.show();
    blockWin.focus();
    return;
  }
  const { workArea } = screen.getPrimaryDisplay();
  const width = 520;
  const height = 620;
  blockWin = new BrowserWindow({
    width,
    height,
    x: Math.round(workArea.x + (workArea.width - width) / 2),
    y: Math.round(workArea.y + (workArea.height - height) / 2),
    alwaysOnTop: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: "STOIC",
    icon: iconPath(),
    backgroundColor: "#fffaf3",
    webPreferences,
  });
  blockWin.removeMenu();
  blockWin.loadFile(join(here, "ui/block.html"), { search: q });
  blockWin.on("closed", () => (blockWin = null));
}

// ---- tray ----

/** @type {Tray | null} */ let tray = null;
let quitting = false;
const iconPath = () => join(here, "../icons", process.platform === "darwin" ? "trayTemplate.png" : "icon32.png");

function updateTray() {
  if (!tray) return;
  const now = Date.now();
  const focusing = settings.focusUntil > now;
  const strict = strictActive(settings, now);
  const time = (/** @type {number} */ ms) => new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  tray.setToolTip(focusing ? `STOIC: focusing until ${time(settings.focusUntil)}` : "STOIC");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: focusing ? `Focusing until ${time(settings.focusUntil)}` : "Not focusing", enabled: false },
      ...(focusing
        ? [{ label: "End focus early", enabled: !strict, click: () => handlers.endFocus({}) }]
        : [15, 25, 45].map((m) => ({ label: `Focus for ${m} minutes`, click: () => handlers.startFocus({ minutes: m }) }))),
      { type: "separator" },
      { label: "Open STOIC", click: showSettings },
      ...(strict ? [{ label: `Strict mode until ${time(settings.strictUntil)}`, enabled: false }] : [{ label: "Quit STOIC", click: () => ((quitting = true), app.quit()) }]),
    ]),
  );
}

// ---- messages from STOIC's windows ----

async function save(/** @type {any} */ next) {
  const clean = sanitize(next);
  clean.strictUntil = settings.strictUntil; // only changed through its own messages
  if (strictActive(settings, Date.now())) {
    const reason = looserReason(settings, clean, Date.now());
    if (reason) return { error: `Strict mode is on, so you can't ${reason} until it ends.` };
  }
  settings = clean;
  await saveSettings();
  applyLogin();
  updateTray();
  tick();
  return { ok: true };
}

function applyLogin() {
  if (process.platform === "win32" || process.platform === "darwin") app.setLoginItemSettings({ openAtLogin: settings.openAtLogin });
}

/** @type {Record<string, (msg: any) => Promise<any>>} */
const handlers = {
  async getAll() {
    return { settings, state: { openMs: state.openMs, unlockRequestedAt: state.unlockRequestedAt }, now: Date.now(), platform: process.platform };
  },
  save: (msg) => save(msg.settings),
  async runningApps() {
    const seen = new Map();
    for (const p of await listProcesses()) if (!isEssential(p.key) && p.pid !== process.pid && !seen.has(p.key)) seen.set(p.key, p.name);
    return [...seen].map(([key, name]) => ({ key, name })).sort((a, b) => a.name.localeCompare(b.name));
  },
  async addApp(msg) {
    const key = appKey(msg.key);
    if (!key) return { error: "That doesn't look like an app name." };
    if (isEssential(key)) return { error: "STOIC never closes system apps like this one, so you can always use your computer." };
    if (settings.apps.some((a) => a.key === key)) return { ok: true };
    return save({ ...settings, apps: [...settings.apps, { key, name: String(msg.name || key), pause: true, limitMin: 0, blockInFocus: true, allowExtend: true }] });
  },
  async startFocus(msg) {
    const until = Date.now() + Math.max(1, Math.min(180, Number(msg.minutes) || 25)) * 60_000;
    return save({ ...settings, focusUntil: Math.max(settings.focusUntil, until) });
  },
  endFocus: () => save({ ...settings, focusUntil: 0 }),
  async openAnyway(msg) {
    const key = appKey(msg.key);
    state.grace[key] = Date.now() + GRACE_MS;
    await saveState();
    blockWin?.close();
    return { ok: reopen(state.paths[key] ?? "") };
  },
  async moreTime(msg) {
    const key = appKey(msg.key);
    const rule = settings.apps.find((a) => a.key === key);
    if (!rule?.allowExtend || strictActive(settings, Date.now())) return { error: "More time isn't available for this app." };
    state.extend[key] = Date.now() + EXTEND_MS;
    await saveState();
    blockWin?.close();
    return { ok: reopen(state.paths[key] ?? "") };
  },
  async closeBlock() {
    blockWin?.close();
    return { ok: true };
  },
  async openSettings() {
    blockWin?.close();
    showSettings();
    return { ok: true };
  },
  async startStrict(msg) {
    const now = Date.now();
    const until = Number(msg.until) || 0;
    if (until <= now) return { error: "Pick a time in the future." };
    settings = { ...settings, strictUntil: strictActive(settings, now) ? Math.max(settings.strictUntil, until) : until };
    state.unlockRequestedAt = 0;
    await saveSettings();
    await saveState();
    updateTray();
    return { ok: true };
  },
  async requestUnlock() {
    if (!state.unlockRequestedAt) state.unlockRequestedAt = Date.now();
    await saveState();
    return { ok: true };
  },
  async cancelUnlock() {
    state.unlockRequestedAt = 0;
    await saveState();
    return { ok: true };
  },
  async unlockNow() {
    if (!canUnlockEarly(state.unlockRequestedAt, Date.now())) return { error: "The 15-minute wait isn't over yet." };
    settings = { ...settings, strictUntil: 0 };
    state.unlockRequestedAt = 0;
    await saveSettings();
    await saveState();
    updateTray();
    return { ok: true };
  },
};

ipcMain.handle("stoic", async (event, msg) => {
  // Only STOIC's own windows (loaded from its files) may talk to it.
  if (!event.senderFrame?.url.startsWith("file://")) return { error: "Not allowed." };
  const h = handlers[msg?.type];
  if (!h) return { error: "Unknown request." };
  try {
    return await h(msg);
  } catch (e) {
    return { error: String(/** @type {any} */ (e)?.message ?? e) };
  }
});

// ---- start ----

app.on("window-all-closed", () => {
  // Stay in the tray.
});

app.on("before-quit", (e) => {
  // Strict mode: STOIC can't be quit from its own menu (Task Manager can still end it; the guide says so).
  if (strictActive(settings, Date.now()) && !process.env.STOIC_TEST) {
    e.preventDefault();
    quitting = false;
  } else quitting = true;
});

app.whenReady().then(async () => {
  await load();
  applyLogin();
  if (process.platform === "darwin") app.dock?.hide();
  tray = new Tray(nativeImage.createFromPath(iconPath()));
  tray.on("click", showSettings);
  updateTray();
  if (!process.argv.includes("--hidden")) showSettings();
  tick();
  setInterval(tick, TICK_MS);
  setInterval(updateTray, 30_000);
});
