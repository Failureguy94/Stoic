// End-to-end check of the desktop app on this computer (Linux), with ordinary programs standing in for
// distracting apps: `tail` (pause, focus) and `sleep` (schedule). Usage: node tools/e2e.mjs [screenshot-folder]
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "../../package.json"));
const { _electron: electron } = require("playwright-core");
const shots = process.argv[2];
if (shots) mkdirSync(shots, { recursive: true });

const results = [];
const ok = (name, pass, detail = "") => {
  results.push(pass);
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
const pgrep = (pattern) => {
  try {
    return execFileSync("pgrep", ["-f", pattern]).toString().trim().split("\n").filter(Boolean).map(Number);
  } catch {
    return [];
  }
};
const waitFor = async (fn, ms = 15000) => {
  for (const end = Date.now() + ms; Date.now() < end; await sleep(250)) if (await fn()) return true;
  return false;
};

const app = await electron.launch({
  executablePath: createRequire(join(here, "../package.json"))("electron"),
  args: [join(here, ".."), "--no-sandbox"],
  env: { ...process.env, STOIC_TEST: "1", STOIC_USER_DATA: mkdtempSync(join(tmpdir(), "stoic-desktop-")) },
});
const settingsWin = await app.firstWindow();
await settingsWin.waitForLoadState("domcontentloaded");
const send = (msg) => settingsWin.evaluate((m) => window.stoic.send(m), msg);
const blockWindow = async (kind) => {
  let found = null;
  await waitFor(() => {
    found = app.windows().find((w) => w.url().includes("block.html") && w.url().includes(`kind=${kind}`));
    return !!found;
  });
  return found;
};
if (shots) await settingsWin.screenshot({ path: join(shots, "settings-empty.png") });

// 1. System apps can't be added.
const ess = await send({ type: "addApp", key: "explorer.exe", name: "File Explorer" });
ok("system apps can't be added", /never closes system apps/.test(ess.error ?? ""), ess.error);

// 2. Pause before opening: `tail` is closed as it starts, then "Open anyway" reopens it.
await send({ type: "addApp", key: "tail", name: "Tail (test app)" });
const tail1 = spawn("tail", ["-f", "/dev/null"], { stdio: "ignore" });
const closed = await waitFor(() => !alive(tail1.pid), 10000);
ok("a paused app is closed as it opens", closed);
const pause = await blockWindow("PAUSE");
ok("Pebble's pause window appears", !!pause, pause?.url().slice(-80));
if (pause) {
  if (shots) await pause.screenshot({ path: join(shots, "pause.png") });
  ok("Open anyway waits", await pause.locator("#other").isDisabled());
  await pause.waitForFunction(() => !document.querySelector("#other").disabled, null, { timeout: 15000 });
  await pause.click("#other");
  const reopened = await waitFor(() => pgrep("^tail -f /dev/null").length > 0, 8000);
  ok("Open anyway opens the app again", reopened);
  await sleep(5000);
  ok("and leaves it open (grace)", pgrep("^tail -f /dev/null").length > 0);
}

// 3. Focus session closes apps marked for it, straight away.
await send({ type: "startFocus", minutes: 25 });
const focusClosed = await waitFor(() => pgrep("^tail -f /dev/null").length === 0, 8000);
ok("focus session closes the app", focusClosed);
const focusWin = await blockWindow("FOCUS");
ok("Pebble's focus window appears", !!focusWin);
if (focusWin && shots) await focusWin.screenshot({ path: join(shots, "focus.png") });

// 4. Schedules close their apps even without an app rule.
const all = await send({ type: "getAll" });
await send({
  type: "save",
  settings: { ...all.settings, schedules: [{ id: "t", name: "Study hours", enabled: true, days: [1, 2, 3, 4, 5, 6, 7], startMin: 0, endMin: 0, apps: ["sleep"] }] },
});
const sleeper = spawn("sleep", ["1000"], { stdio: "ignore" });
ok("a scheduled app is closed", await waitFor(() => !alive(sleeper.pid), 10000));
const schedWin = await blockWindow("SCHEDULE");
ok("Pebble's schedule window appears", !!schedWin);

// 5. Strict mode: stricter yes, looser no.
await send({ type: "startStrict", until: Date.now() + 60 * 60_000 });
const cur = await send({ type: "getAll" });
const loosen = await send({ type: "save", settings: { ...cur.settings, apps: [] } });
ok("strict mode refuses removing an app", /Strict mode is on/.test(loosen.error ?? ""), loosen.error);
const endEarly = await send({ type: "endFocus" });
ok("strict mode refuses ending focus early", /Strict mode is on/.test(endEarly.error ?? ""), endEarly.error);
const tighten = await send({ type: "save", settings: { ...cur.settings, apps: cur.settings.apps.map((a) => ({ ...a, limitMin: 30 })) } });
ok("strict mode allows a tighter limit", tighten.ok === true);
const unlock = await send({ type: "unlockNow" });
ok("unlocking early needs the wait", !!unlock.error, unlock.error);

// 6. Unrelated programs are left alone.
const other = spawn("cat", [], { stdio: ["pipe", "ignore", "ignore"] });
await sleep(5000);
ok("unrelated programs keep running", alive(other.pid));
other.kill();

// 7. Accessibility (axe) on the settings and Pebble windows, light and dark.
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
await settingsWin.reload();
await sleep(800);
if (shots) await settingsWin.screenshot({ path: join(shots, "settings-strict.png"), fullPage: true });
for (const scheme of ["light", "dark"]) {
  for (const [name, win] of [["settings", settingsWin], ["block", schedWin ?? focusWin]]) {
    if (!win) continue;
    await win.emulateMedia({ colorScheme: scheme });
    await sleep(300);
    const res = await win.evaluate(`${axeSource}; axe.run(document, { runOnly: { type: "tag", values: ["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa","best-practice"] } })`);
    ok(`a11y: ${name} (${scheme})`, res.violations.length === 0, res.violations.map((v) => `${v.id} (${v.nodes.length})`).join(", "));
    if (shots) await win.screenshot({ path: join(shots, `${name}-${scheme}.png`) });
  }
}

await app.close();
for (const pid of pgrep("^tail -f /dev/null")) process.kill(pid);
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
