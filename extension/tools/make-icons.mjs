// Renders src/pebble.svg to the PNG icons Chrome needs. Usage: node tools/make-icons.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "../../package.json"));
const { chromium } = require("playwright-core");
const svg = readFileSync(join(here, "../src/pebble.svg"), "utf8");

const browser = await chromium.launch();
const page = await browser.newPage();
for (const size of [16, 32, 48, 128]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent"><div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center">${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</div></body></html>`,
  );
  await page.screenshot({ path: join(here, `../icons/icon${size}.png`), omitBackground: true });
}
await browser.close();
console.log("icons written");
