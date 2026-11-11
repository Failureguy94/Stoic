// Runs axe-core (WCAG 2.x A/AA rules) against every page in light and dark mode.
// Usage: npm run build && npm run start (in another terminal), then: npm run check:a11y
// Optional: BASE_URL=http://localhost:3000 SCREENSHOTS=/tmp/shots
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.SCREENSHOTS;
const CHROME = process.env.CHROME_PATH ?? "/usr/bin/google-chrome";

const PAGES = [
  "/",
  "/docs",
  "/docs/getting-started",
  "/docs/websites",
  "/circle",
  "/survey",
  "/about",
  "/design-note",
];

const browser = await chromium.launch({ executablePath: CHROME });
const results = [];
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

for (const scheme of ["light", "dark"]) {
  for (const width of [1280, 375]) {
    const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    for (const path of PAGES) {
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      await page.addScriptTag({ content: axeSource });
      const res = await page.evaluate(async () =>
        axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } }),
      );
      const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      results.push({ path, scheme, width, violations: res.violations, hScroll });
      if (SHOTS) {
        const name = `${path === "/" ? "home" : path.slice(1).replaceAll("/", "_")}-${scheme}-${width}.png`;
        await page.screenshot({ path: `${SHOTS}/${name}`, fullPage: true });
      }
    }
    await ctx.close();
  }
}
await browser.close();

let total = 0;
const lines = [];
for (const r of results) {
  total += r.violations.length + (r.hScroll ? 1 : 0);
  const status = r.violations.length === 0 && !r.hScroll ? "PASS" : "FAIL";
  lines.push(`| ${r.path} | ${r.scheme} | ${r.width}px | ${status} | ${r.violations.map((v) => `${v.id} (${v.nodes.length})`).join(", ") || "none"}${r.hScroll ? ", horizontal page scroll" : ""} |`);
  for (const v of r.violations) {
    console.log(`\n[${r.path} ${r.scheme} ${r.width}] ${v.id}: ${v.help}`);
    for (const n of v.nodes.slice(0, 3)) console.log("   ", n.target.join(" "), "\n    ", n.failureSummary?.split("\n").slice(0, 3).join(" | "));
  }
  if (r.hScroll) console.log(`\n[${r.path} ${r.scheme} ${r.width}] page scrolls horizontally`);
}

const report = `# Automated accessibility check (axe-core)

Run: ${new Date().toISOString()}
Tool: axe-core ${JSON.parse(readFileSync(require.resolve("axe-core/package.json"), "utf8")).version}, rules tagged wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa and best-practice.
Each page checked in light and dark colour schemes at 1280px and 375px wide. Also checks for horizontal page scrolling.

Automated tools find only part of accessibility problems. Manual checks are in accessibility-checklist.md.

| Page | Scheme | Width | Result | Violations (nodes) |
|---|---|---|---|---|
${lines.join("\n")}

Total issues: ${total}
`;
writeFileSync("docs/a11y-report.md", report);
console.log(`\nWrote docs/a11y-report.md. Total issues: ${total}`);
process.exit(total ? 1 : 0);
