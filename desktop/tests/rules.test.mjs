import assert from "node:assert/strict";
import { test } from "node:test";
import {
  GRACE_MS,
  MAX_STEP_MS,
  UNLOCK_WAIT_MS,
  appKey,
  canUnlockEarly,
  decide,
  defaultSettings,
  isEssential,
  looserReason,
  newlyStarted,
  openStep,
  refreshedGrace,
  sanitize,
  scheduleActive,
} from "../src/rules.js";

const MIN = 60_000;
const monday10 = new Date(2026, 10, 9, 10, 0).getTime();
const app = (over = {}) => ({ key: "discord", name: "Discord", pause: false, limitMin: 0, blockInFocus: false, allowExtend: true, ...over });
const settings = (over = {}) => ({ ...defaultSettings(), ...over });
const decideFor = (key, s, extra = {}) =>
  decide({ key, settings: s, now: monday10, openTodayMs: 0, graceUntil: 0, extendUntil: 0, justStarted: false, ...extra }).kind;

test("app keys from Windows, macOS and Linux paths", () => {
  assert.equal(appKey("C:\\Program Files\\Discord\\Discord.exe"), "discord");
  assert.equal(appKey("/Applications/Steam.app/Contents/MacOS/steam_osx"), "steam");
  assert.equal(appKey("/usr/bin/vlc"), "vlc");
  assert.equal(appKey("Spotify.exe"), "spotify");
  assert.equal(appKey(""), "");
});

test("essential apps are never closed, even if someone adds them", () => {
  assert.ok(isEssential("explorer"));
  assert.ok(isEssential("finder"));
  assert.equal(decideFor("explorer", settings({ apps: [app({ key: "explorer", blockInFocus: true })], focusUntil: monday10 + MIN })), "ALLOW");
  assert.deepEqual(sanitize({ apps: [{ key: "explorer" }, { key: "Taskmgr.exe" }] }).apps, []);
});

test("apps without rules are left alone", () => assert.equal(decideFor("code", settings({ apps: [app()] })), "ALLOW"));

test("the pause only happens when an app opens, until Open anyway", () => {
  const s = settings({ apps: [app({ pause: true })] });
  assert.equal(decideFor("discord", s, { justStarted: true }), "PAUSE");
  assert.equal(decideFor("discord", s, { justStarted: false }), "ALLOW"); // already open: no interruption
  assert.equal(decideFor("discord", s, { justStarted: true, graceUntil: monday10 + 1 }), "ALLOW");
});

test("daily limit on time open, and 5 more minutes", () => {
  const s = settings({ apps: [app({ limitMin: 60 })] });
  assert.equal(decideFor("discord", s, { openTodayMs: 59 * MIN }), "ALLOW");
  assert.equal(decideFor("discord", s, { openTodayMs: 60 * MIN }), "LIMIT");
  assert.equal(decideFor("discord", s, { openTodayMs: 61 * MIN, extendUntil: monday10 + 1 }), "ALLOW");
});

test("focus beats everything, but only for apps marked for it", () => {
  const s = settings({ apps: [app({ blockInFocus: true, pause: true }), app({ key: "code", name: "VS Code" })], focusUntil: monday10 + MIN });
  assert.equal(decideFor("discord", s, { justStarted: true }), "FOCUS");
  assert.equal(decideFor("code", s), "ALLOW");
});

test("schedules close their apps inside the window, rule or not", () => {
  const study = { id: "s", name: "Study", enabled: true, days: [1, 2, 3, 4, 5], startMin: 9 * 60, endMin: 17 * 60, apps: ["steam"] };
  const s = settings({ schedules: [study] });
  assert.equal(decideFor("steam", s), "SCHEDULE");
  assert.equal(decideFor("steam", s, { now: new Date(2026, 10, 9, 18, 0).getTime() }), "ALLOW");
});

test("overnight schedules run past midnight", () => {
  const night = { id: "n", name: "Bedtime", enabled: true, days: [7], startMin: 23 * 60, endMin: 6 * 60, apps: ["steam"] };
  assert.equal(scheduleActive(night, 1, 3 * 60), true);
  assert.equal(scheduleActive(night, 1, 12 * 60), false);
});

test("only apps with no process before count as just started", () => {
  const before = new Set(["chrome", "discord"]);
  const procs = [
    { pid: 1, key: "chrome", name: "Chrome", path: "" },
    { pid: 2, key: "steam", name: "Steam", path: "" },
    { pid: 3, key: "steam", name: "Steam", path: "" },
  ];
  assert.deepEqual([...newlyStarted(before, procs)], ["steam"]);
});

test("grace is renewed while open, never revived; sleep doesn't count as open", () => {
  assert.equal(refreshedGrace(monday10 + 1, monday10), monday10 + GRACE_MS);
  assert.equal(refreshedGrace(monday10, monday10), monday10);
  assert.equal(openStep(0, 10 * MIN), MAX_STEP_MS);
  assert.equal(openStep(1000, 3000), 2000);
  assert.equal(openStep(5000, 1000), 0);
});

test("strict mode: stricter is fine, looser is refused", () => {
  const old = settings({ apps: [app({ limitMin: 60, pause: true, allowExtend: false })] });
  assert.equal(looserReason(old, old, monday10), null);
  assert.equal(looserReason(old, { ...old, apps: [...old.apps, app({ key: "steam", name: "Steam" })] }, monday10), null);
  assert.match(looserReason(old, { ...old, apps: [] }, monday10), /remove Discord/);
  assert.match(looserReason(old, { ...old, apps: [app({ limitMin: 0, pause: true, allowExtend: false })] }, monday10), /raise/);
  assert.match(looserReason(old, { ...old, openAtLogin: false }, monday10), /log in/);
  const focusing = { ...old, focusUntil: monday10 + MIN };
  assert.match(looserReason(focusing, { ...focusing, focusUntil: 0 }, monday10), /focus/);
});

test("unlock early needs the wait", () => {
  assert.equal(canUnlockEarly(0, monday10), false);
  assert.equal(canUnlockEarly(monday10, monday10 + UNLOCK_WAIT_MS - 1), false);
  assert.equal(canUnlockEarly(monday10, monday10 + UNLOCK_WAIT_MS), true);
});

test("sanitize repairs whatever is on disk", () => {
  const s = sanitize({ apps: [{ key: "C:\\Games\\Steam.exe", name: "Steam", limitMin: -1 }, { key: "steam" }], schedules: [{ id: "x", days: [1, 9], apps: ["explorer", "Steam.exe"] }] });
  assert.deepEqual(s.apps.map((a) => a.key), ["steam"]);
  assert.equal(s.apps[0].limitMin, 0);
  assert.deepEqual(s.schedules[0].days, [1]);
  assert.deepEqual(s.schedules[0].apps, ["steam"]);
  assert.deepEqual(sanitize(null), defaultSettings());
});
