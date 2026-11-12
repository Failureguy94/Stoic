// Finding, closing and reopening apps, with each system's own tools (no native add-ons):
// Windows: tasklist / taskkill / PowerShell, macOS: ps / open, Linux: ps.
// The parse* functions are pure and unit-tested in ../tests/processes.test.mjs.

import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { appKey } from "./rules.js";

const run = promisify(execFile);

/** @typedef {import("./rules.js").Proc} Proc */

/** `tasklist /FO CSV /NH` → processes. Windows doesn't give paths here; see pathOf(). @returns {Proc[]} */
export function parseTasklist(/** @type {string} */ csv) {
  /** @type {Proc[]} */ const out = [];
  for (const line of csv.split(/\r?\n/)) {
    const cells = [...line.matchAll(/"((?:[^"]|"")*)"/g)].map((m) => m[1].replace(/""/g, '"'));
    if (cells.length < 2) continue;
    const pid = Number(cells[1]);
    if (!Number.isInteger(pid)) continue;
    out.push({ pid, key: appKey(cells[0]), name: cells[0].replace(/\.exe$/i, ""), path: "" });
  }
  return out;
}

/** macOS `ps -axo pid=,comm=` (comm is the full executable path). Only apps from .app bundles. @returns {Proc[]} */
export function parsePsMac(/** @type {string} */ text) {
  /** @type {Proc[]} */ const out = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*(\d+)\s+(.+?)\s*$/);
    if (!m) continue;
    const exe = m[2];
    const bundle = exe.match(/^(.*?\/([^/]+)\.app)\//);
    if (!bundle) continue; // background tools and system daemons
    if (/\.app\/Contents\/(Frameworks|XPCServices|PlugIns|Library)\//.test(exe)) continue; // helpers inside an app
    out.push({ pid: Number(m[1]), key: appKey(exe), name: bundle[2], path: bundle[1] });
  }
  return out;
}

/** Linux `ps -eo pid=,args=`. The key comes from the program's file name. @returns {Proc[]} */
export function parsePsLinux(/** @type {string} */ text) {
  /** @type {Proc[]} */ const out = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*(\d+)\s+(.+?)\s*$/);
    if (!m) continue;
    const args = m[2];
    if (args.startsWith("[")) continue; // kernel threads
    const exe = args.split(" ")[0];
    const key = appKey(exe);
    if (!key) continue;
    out.push({ pid: Number(m[1]), key, name: key, path: args });
  }
  return out;
}

/** Everything running for this user right now. */
export async function listProcesses() {
  try {
    if (process.platform === "win32") {
      const { stdout } = await run("tasklist", ["/FO", "CSV", "/NH"], { windowsHide: true, maxBuffer: 8 << 20 });
      return parseTasklist(stdout);
    }
    if (process.platform === "darwin") {
      const { stdout } = await run("ps", ["-axo", "pid=,comm="], { maxBuffer: 8 << 20 });
      return parsePsMac(stdout);
    }
    const { stdout } = await run("ps", ["-u", String(process.getuid?.() ?? ""), "-o", "pid=,args="], { maxBuffer: 8 << 20 });
    return parsePsLinux(stdout);
  } catch {
    return [];
  }
}

/** What to run to open the app again after "Open anyway" (looked up before closing it). */
export async function pathOf(/** @type {Proc} */ p) {
  if (process.platform !== "win32") return p.path;
  try {
    const { stdout } = await run(
      "powershell",
      ["-NoProfile", "-NonInteractive", "-Command", `(Get-Process -Id ${Number(p.pid)} -ErrorAction SilentlyContinue).Path`],
      { windowsHide: true },
    );
    return stdout.trim();
  } catch {
    return "";
  }
}

/** Close every process of an app. */
export async function closeApp(/** @type {Proc[]} */ procs) {
  if (process.platform === "win32" && procs.length) {
    // Closes the app and the helper processes it started.
    const args = procs.flatMap((p) => ["/PID", String(p.pid)]);
    await run("taskkill", ["/F", "/T", ...args], { windowsHide: true }).catch(() => {});
    return;
  }
  for (const p of procs) {
    try {
      process.kill(p.pid, "SIGTERM");
    } catch {
      // Already gone.
    }
  }
}

/** Open the app again (after "Open anyway" or "5 more minutes"). */
export function reopen(/** @type {string} */ path) {
  if (!path) return false;
  try {
    let child;
    if (process.platform === "darwin") child = spawn("open", ["-a", path], { detached: true, stdio: "ignore" });
    else if (process.platform === "win32") child = spawn(path, [], { detached: true, stdio: "ignore", windowsHide: false });
    else {
      const [cmd, ...args] = path.split(" ");
      child = spawn(cmd, args, { detached: true, stdio: "ignore" });
    }
    child.unref();
    return true;
  } catch {
    return false;
  }
}
