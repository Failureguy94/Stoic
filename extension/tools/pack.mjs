// Packs the extension into dist/stoic-extension-<version>.zip for the Chrome Web Store or Edge Add-ons.
// Only the files the browser needs go in: no tests or tools. Usage: node tools/pack.mjs
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
const out = join(root, "dist", `stoic-extension-${version}.zip`);
mkdirSync(dirname(out), { recursive: true });
rmSync(out, { force: true });
execFileSync("zip", ["-r", "-X", "-q", out, "manifest.json", "src", "icons", "fonts"], { cwd: root });
console.log(`packed ${out}`);
