// End-to-end check of the unpacked extension in Playwright's Chromium (needs internet).
// Usage: node tools/e2e.mjs [screenshot-folder]
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const ext = join(here, "..");
const shots = process.argv[2];
const HEADLESS = process.env.HEADLESS === "1" || !(process.env.DISPLAY || process.env.WAYLAND_DISPLAY);
if (shots) mkdirSync(shots, { recursive: true });
const require = createRequire(join(here, "../../package.json"));
const { chromium } = require("playwright-core");

const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "stoic-ext-")), {
  channel: "chromium",
  // Headless browsers always report the screen as locked, so time isn't counted there. Use a real
  // window when a display is available (HEADLESS=1 forces headless and skips the time test).
  headless: HEADLESS,
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  viewport: { width: 1280, height: 900 },
});
let [sw] = ctx.serviceWorkers();
sw ??= await ctx.waitForEvent("serviceworker");
const id = new URL(sw.url()).host;
const base = `chrome-extension://${id}/src`;
const results = [];
const ok = (name, pass, detail = "") => {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};
const shot = async (page, name) => shots && page.screenshot({ path: join(shots, `${name}.png`) });

// The options page opens on install; use it to talk to the background.
const opts = await ctx.newPage();
// STOIC opens its settings page by itself on install; that can interrupt this navigation, which is fine.
await opts.goto(`${base}/options.html`).catch(() => {});
await opts.waitForLoadState("load");
const send = (msg) => opts.evaluate((m) => chrome.runtime.sendMessage(m), msg);
await shot(opts, "options-empty");

// 1. Add youtube.com: pause before opening + blocked during focus.
const added = await send({ type: "addSite", domain: "https://www.youtube.com/" });
ok("add a site from a pasted link", added.ok && added.domain === "youtube.com", JSON.stringify(added));

const page = await ctx.newPage();
const t0 = Date.now();
if (process.env.DEBUG) page.on("framenavigated", (f) => f === page.mainFrame() && console.log(`  ${Date.now() - t0} ms: ${f.url().slice(0, 70)}`));
if (process.env.DEBUG) sw.on("console", (m) => console.log("  SW:", m.text()));
await page.goto("https://www.youtube.com/", { waitUntil: "commit" }).catch(() => {});
// Poll: Playwright's waitForURL gives up when the extension interrupts the navigation it is waiting for.
const until = async (/** @type {RegExp} */ re, ms = 15000) => {
  for (const end = Date.now() + ms; Date.now() < end && !re.test(page.url()); ) await page.waitForTimeout(100);
};
await until(/blocked\.html/);
ok("pause screen before youtube.com", page.url().includes("kind=PAUSE"), page.url().slice(0, 80));
await page.waitForTimeout(500);
await shot(page, "pause");
const disabledAtStart = await page.locator("#other").isDisabled();
ok("Open anyway waits", disabledAtStart);

// 2. Open anyway after the countdown, then YouTube loads with the home feed hidden.
await page.waitForFunction(() => !document.querySelector("#other").disabled, null, { timeout: 15000 });
await page.click("#other");
await page.waitForURL(/youtube\.com/, { timeout: 20000 });
await page.waitForTimeout(6000);
ok("Open anyway opens the site", page.url().startsWith("https://www.youtube.com/"), page.url());
const classes = await page.evaluate(() => document.documentElement.className);
ok("YouTube clean-up classes applied", /stoic-feed/.test(classes) && /stoic-shorts/.test(classes), classes.slice(0, 80));
const feedHidden = await page.evaluate(() => {
  const g = document.querySelector('ytd-browse[page-subtype="home"] ytd-rich-grid-renderer');
  return g ? getComputedStyle(g).display === "none" : "no feed element";
});
ok("home feed hidden", feedHidden === true || feedHidden === "no feed element", String(feedHidden));
const shortsNav = await page.evaluate(() =>
  [...document.querySelectorAll("ytd-mini-guide-entry-renderer, ytd-guide-entry-renderer")]
    .filter((e) => e.querySelector('a[href^="/shorts"]'))
    .every((e) => getComputedStyle(e).display === "none"),
);
ok("Shorts hidden from the side bar", shortsNav);
await shot(page, "youtube-home");

// 3. A Short opens as a normal video.
await page.goto("https://www.youtube.com/shorts/dQw4w9WgXcQ", { waitUntil: "domcontentloaded" }).catch(() => {});
await until(/watch\?v=dQw4w9WgXcQ/);
ok("Shorts open in the normal player", page.url().includes("/watch?v=dQw4w9WgXcQ"), page.url());

// 4. Focus session blocks the open tab straight away.
await send({ type: "startFocus", minutes: 25 });
await until(/kind=FOCUS/);
ok("focus session blocks youtube.com", page.url().includes("kind=FOCUS"), page.url().slice(0, 80));
await shot(page, "focus");

// 5. Strict mode refuses loosening, allows tightening.
await send({ type: "startStrict", until: Date.now() + 60 * 60_000, lockExtensionsPage: false });
const all = await send({ type: "getAll" });
const loosen = await send({ type: "save", settings: { ...all.settings, sites: [] } });
ok("strict mode refuses removing a site", /Strict mode is on/.test(loosen.error ?? ""), loosen.error);
const endEarly = await send({ type: "endFocus" });
ok("strict mode refuses ending focus early", /Strict mode is on/.test(endEarly.error ?? ""), endEarly.error);
const tighten = await send({ type: "save", settings: { ...all.settings, sites: all.settings.sites.map((r) => ({ ...r, limitMin: 15 })) } });
ok("strict mode allows a tighter limit", tighten.ok === true, JSON.stringify(tighten));
const unlockTooSoon = await send({ type: "unlockNow" });
ok("unlocking early needs the wait", !!unlockTooSoon.error, unlockTooSoon.error);

// 6. Other sites stay untouched.
await page.goto("https://en.wikipedia.org/wiki/Stoicism", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
ok("unrelated sites load normally", page.url().startsWith("https://en.wikipedia.org/"), page.url());

// 7. Time is counted, and the daily limit shows once it's reached (1-minute limit; takes ~2 minutes).
const env = await sw.evaluate(async () => ({
  idle: await chrome.idle.queryState(60),
  focused: !!(await chrome.windows.getLastFocused()).focused,
}));
if (HEADLESS || env.idle === "locked" || !env.focused) {
  console.log(`SKIP  time counting and daily limit (needs someone at an unlocked desktop; screen ${env.idle}, window ${env.focused ? "focused" : "not focused"})`);
} else {
  const cur = await send({ type: "getAll" });
  const add = await send({
    type: "save",
    settings: { ...cur.settings, sites: [...cur.settings.sites, { domain: "wikipedia.org", pause: false, limitMin: 1, blockInFocus: false, allowExtend: true }] },
  });
  ok("adding a site is allowed in strict mode", add.ok === true, JSON.stringify(add));
  await page.bringToFront();
  await page.goto("https://en.wikipedia.org/wiki/Epictetus", { waitUntil: "domcontentloaded" });
  await until(/kind=LIMIT/, 150_000);
  const used = (await send({ type: "getAll" })).state.usage.ms["wikipedia.org"] ?? 0;
  ok("time on the site is counted", used >= 55_000, `${Math.round(used / 1000)} s`);
  ok("daily limit screen after 1 minute", page.url().includes("kind=LIMIT"), page.url().slice(0, 80));
  ok("strict mode hides 5 more minutes", page.url().includes("allowExtend=false"));
  await shot(page, "limit");
}

await opts.reload();
await opts.waitForTimeout(800);
await shot(opts, "options-strict");

// 7. Accessibility (axe-core) on STOIC's own pages, light and dark.
const axeSource = require("fs").readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const pages = [
  ["popup", `${base}/popup.html`, { width: 360, height: 640 }],
  ["options", `${base}/options.html`, { width: 1280, height: 900 }],
  ["options-narrow", `${base}/options.html`, { width: 375, height: 800 }],
  ["blocked-pause", `${base}/blocked.html?kind=PAUSE&url=https%3A%2F%2Fexample.com&domain=example.com`, { width: 1280, height: 900 }],
  ["blocked-limit", `${base}/blocked.html?kind=LIMIT&url=https%3A%2F%2Fexample.com&domain=example.com&limitMin=30&allowExtend=true`, { width: 375, height: 800 }],
  ["blocked-focus", `${base}/blocked.html?kind=FOCUS&url=https%3A%2F%2Fexample.com&domain=example.com&until=${Date.now() + 600000}`, { width: 1280, height: 900 }],
  ["blocked-schedule", `${base}/blocked.html?kind=SCHEDULE&url=https%3A%2F%2Fexample.com&domain=example.com&schedule=Study%20hours&endMin=1020`, { width: 375, height: 800 }],
];
for (const scheme of ["light", "dark"]) {
  for (const [name, url, viewport] of pages) {
    const p = await ctx.newPage();
    await p.emulateMedia({ colorScheme: scheme });
    await p.setViewportSize(viewport);
    await p.goto(url);
    await p.waitForTimeout(700);
    // evaluate() runs outside the page's script policy, so axe can be loaded on extension pages.
    const res = await p.evaluate(`${axeSource}; axe.run(document, { runOnly: { type: "tag", values: ["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa","best-practice"] } })`);
    const hScroll = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    const issues = res.violations.map((v) => `${v.id} (${v.nodes.length})`).join(", ");
    ok(`a11y: ${name} (${scheme})`, res.violations.length === 0 && !hScroll, issues || (hScroll ? "scrolls sideways" : ""));
    if (shots) await p.screenshot({ path: join(shots, `${name}-${scheme}.png`), fullPage: true });
    await p.close();
  }
}

await ctx.close();
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
