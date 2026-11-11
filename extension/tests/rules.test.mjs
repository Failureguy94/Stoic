import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canUnlockEarly,
  countsAsUse,
  decide,
  defaultSettings,
  hostOf,
  isExtensionsPage,
  looserReason,
  matchDomain,
  normalizeSite,
  refreshedGrace,
  sanitize,
  scheduleActive,
  usageStep,
  GRACE_MS,
  MAX_STEP_MS,
  UNLOCK_WAIT_MS,
} from "../src/rules.js";

const MIN = 60_000;
// A Monday at 10:00 local time.
const monday10 = new Date(2026, 10, 9, 10, 0).getTime();

const settings = (over = {}) => ({ ...defaultSettings(), ...over });
const site = (over = {}) => ({ domain: "youtube.com", pause: false, limitMin: 0, blockInFocus: false, allowExtend: true, ...over });
const decideFor = (host, s, extra = {}) =>
  decide({ host, settings: s, now: monday10, usedTodayMs: 0, graceUntil: 0, extendUntil: 0, ...extra }).kind;

test("normalizes what people type", () => {
  assert.equal(normalizeSite("https://www.YouTube.com/watch?v=x"), "youtube.com");
  assert.equal(normalizeSite("m.reddit.com/r/all"), "reddit.com");
  assert.equal(normalizeSite("music.youtube.com"), "music.youtube.com");
  assert.equal(normalizeSite("nope"), null);
  assert.equal(normalizeSite(""), null);
});

test("hosts of web pages only", () => {
  assert.equal(hostOf("https://www.youtube.com/shorts/abc"), "www.youtube.com");
  assert.equal(hostOf("chrome://extensions"), null);
  assert.equal(hostOf("not a url"), null);
});

test("subdomains match, lookalikes do not", () => {
  assert.equal(matchDomain("www.youtube.com", ["youtube.com"]), "youtube.com");
  assert.equal(matchDomain("notyoutube.com", ["youtube.com"]), null);
  assert.equal(matchDomain("youtube.com.evil.org", ["youtube.com"]), null);
});

test("sites without rules are allowed", () => assert.equal(decideFor("wikipedia.org", settings({ sites: [site()] })), "ALLOW"));

test("pause until Open anyway", () => {
  const s = settings({ sites: [site({ pause: true })] });
  assert.equal(decideFor("www.youtube.com", s), "PAUSE");
  assert.equal(decideFor("www.youtube.com", s, { graceUntil: monday10 + 1 }), "ALLOW");
});

test("daily limit, and 5 more minutes", () => {
  const s = settings({ sites: [site({ limitMin: 30 })] });
  assert.equal(decideFor("youtube.com", s, { usedTodayMs: 29 * MIN }), "ALLOW");
  assert.equal(decideFor("youtube.com", s, { usedTodayMs: 30 * MIN }), "LIMIT");
  assert.equal(decideFor("youtube.com", s, { usedTodayMs: 31 * MIN, extendUntil: monday10 + 1 }), "ALLOW");
});

test("focus blocks only sites marked for it, and beats everything", () => {
  const s = settings({ sites: [site({ blockInFocus: true, pause: true }), site({ domain: "x.com" })], focusUntil: monday10 + MIN });
  assert.equal(decideFor("youtube.com", s), "FOCUS");
  assert.equal(decideFor("x.com", s), "ALLOW");
});

test("schedules block their sites inside the window", () => {
  const study = { id: "s", name: "Study", enabled: true, days: [1, 2, 3, 4, 5], startMin: 9 * 60, endMin: 17 * 60, domains: ["reddit.com"] };
  const s = settings({ schedules: [study] });
  assert.equal(decideFor("old.reddit.com", s), "SCHEDULE");
  assert.equal(decideFor("old.reddit.com", s, { now: new Date(2026, 10, 9, 18, 0).getTime() }), "ALLOW");
  assert.equal(decideFor("old.reddit.com", s, { now: new Date(2026, 10, 8, 10, 0).getTime() }), "ALLOW"); // Sunday
});

test("overnight schedules run past midnight", () => {
  const bed = { id: "b", name: "Bedtime", enabled: true, days: [7], startMin: 23 * 60, endMin: 7 * 60, domains: [] };
  assert.equal(scheduleActive(bed, 1, 2 * 60), true); // Monday 02:00 after Sunday night
  assert.equal(scheduleActive(bed, 1, 23 * 60), false);
});

test("grace is renewed while open, never revived", () => {
  assert.equal(refreshedGrace(monday10 + 5_000, monday10), monday10 + GRACE_MS);
  assert.equal(refreshedGrace(monday10, monday10), monday10);
});

test("strict mode: stricter is fine, looser is refused", () => {
  const now = monday10;
  const old = settings({ sites: [site({ limitMin: 30, pause: true, allowExtend: false })] });
  assert.equal(looserReason(old, old, now), null);
  assert.equal(looserReason(old, { ...old, sites: [...old.sites, site({ domain: "x.com" })] }, now), null);
  assert.equal(looserReason(old, { ...old, sites: [site({ limitMin: 15, pause: true, allowExtend: false })] }, now), null);
  assert.match(looserReason(old, { ...old, sites: [] }, now), /remove youtube.com/);
  assert.match(looserReason(old, { ...old, sites: [site({ limitMin: 60, pause: true, allowExtend: false })] }, now), /raise/);
  assert.match(looserReason(old, { ...old, sites: [site({ limitMin: 0, pause: true, allowExtend: false })] }, now), /raise/);
  assert.match(looserReason(old, { ...old, sites: [site({ limitMin: 30, pause: false, allowExtend: false })] }, now), /pause/);
  assert.match(looserReason(old, { ...old, youtube: { ...old.youtube, shorts: false } }, now), /YouTube/);
  const focusing = { ...old, focusUntil: now + MIN };
  assert.match(looserReason(focusing, { ...focusing, focusUntil: 0 }, now), /focus/);
});

test("unlock early needs the wait", () => {
  assert.equal(canUnlockEarly(0, monday10), false);
  assert.equal(canUnlockEarly(monday10, monday10 + UNLOCK_WAIT_MS - 1), false);
  assert.equal(canUnlockEarly(monday10, monday10 + UNLOCK_WAIT_MS), true);
});

test("extensions pages are recognised in each browser", () => {
  assert.ok(isExtensionsPage("chrome://extensions/"));
  assert.ok(isExtensionsPage("edge://extensions/?id=abc"));
  assert.ok(isExtensionsPage("about:addons"));
  assert.ok(!isExtensionsPage("chrome://settings"));
});

test("sanitize repairs whatever is in storage", () => {
  const s = sanitize({ sites: [{ domain: "https://www.YouTube.com/x", limitMin: -5 }, { domain: "youtube.com" }, { domain: "bad" }], youtube: { shorts: false } });
  assert.deepEqual(s.sites.map((r) => r.domain), ["youtube.com"]);
  assert.equal(s.sites[0].limitMin, 0);
  assert.equal(s.youtube.shorts, false);
  assert.equal(s.youtube.feed, true);
  assert.deepEqual(sanitize(null), defaultSettings());
});

test("time counts while watching, not while locked or in another app", () => {
  assert.equal(countsAsUse("active", true), true);
  assert.equal(countsAsUse("idle", true), true); // watching a video: no keyboard or mouse
  assert.equal(countsAsUse("locked", true), false);
  assert.equal(countsAsUse("active", false), false); // another app is in front
});

test("a sleeping computer doesn't count as use", () => {
  assert.equal(usageStep(1000, 31_000), 30_000);
  assert.equal(usageStep(0, 10 * 60_000), MAX_STEP_MS);
  assert.equal(usageStep(5000, 1000), 0); // clock went backwards
});
