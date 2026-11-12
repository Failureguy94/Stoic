// macOS menu-bar ("template") icons: a black Pebble silhouette that macOS recolours for light and dark menu bars.
// The colour icons in icons/icon*.png come from the browser extension. Usage: node tools/make-icons.mjs
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(join(here, "../../package.json"))("playwright-core");
const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 120 120">
  <path d="M14 70c0-27 20-48 49-48 27 0 45 18 45 43 0 22-16 34-46 34C31 99 14 90 14 70z" fill="none" stroke="#000" stroke-width="9"/>
  <g stroke="#000" stroke-width="8" stroke-linecap="round" fill="none"><path d="M40 64q6-7 12 0"/><path d="M70 64q6-7 12 0"/><path d="M50 80q11 8 22 0"/></g>
</svg>`;

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [size, name] of [[16, "trayTemplate.png"], [32, "trayTemplate@2x.png"]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg(size)}</body></html>`);
  await page.screenshot({ path: join(here, "../icons", name), omitBackground: true });
}
await browser.close();
console.log("tray icons written");
