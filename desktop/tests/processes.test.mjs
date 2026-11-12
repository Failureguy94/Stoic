import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePsLinux, parsePsMac, parseTasklist } from "../src/processes.js";

test("Windows tasklist CSV", () => {
  const csv = [
    '"System Idle Process","0","Services","0","8 K"',
    '"Discord.exe","10234","Console","1","152,340 K"',
    '"Discord.exe","10240","Console","1","90,112 K"',
    '"explorer.exe","4321","Console","1","120,000 K"',
    "",
  ].join("\r\n");
  const p = parseTasklist(csv);
  assert.deepEqual(
    p.map((x) => [x.pid, x.key, x.name]),
    [
      [0, "system idle process", "System Idle Process"],
      [10234, "discord", "Discord"],
      [10240, "discord", "Discord"],
      [4321, "explorer", "explorer"],
    ],
  );
});

test("macOS ps: apps only, helpers skipped", () => {
  const text = [
    "  1 /sbin/launchd",
    "  512 /Applications/Discord.app/Contents/MacOS/Discord",
    "  513 /Applications/Discord.app/Contents/Frameworks/Discord Helper.app/Contents/MacOS/Discord Helper",
    "  700 /System/Applications/Messages.app/Contents/MacOS/Messages",
    "  800 /usr/libexec/trustd",
  ].join("\n");
  const p = parsePsMac(text);
  assert.deepEqual(
    p.map((x) => [x.pid, x.key, x.name, x.path]),
    [
      [512, "discord", "Discord", "/Applications/Discord.app"],
      [700, "messages", "Messages", "/System/Applications/Messages.app"],
    ],
  );
});

test("Linux ps: program name from the command, kernel threads skipped", () => {
  const text = ["    2 [kthreadd]", " 1234 /usr/bin/vlc --started-from-file a.mp4", " 1300 tail -f /dev/null"].join("\n");
  const p = parsePsLinux(text);
  assert.deepEqual(
    p.map((x) => [x.pid, x.key, x.path]),
    [
      [1234, "vlc", "/usr/bin/vlc --started-from-file a.mp4"],
      [1300, "tail", "tail -f /dev/null"],
    ],
  );
});
