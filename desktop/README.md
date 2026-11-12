# STOIC for Windows and Mac

An Electron tray app that brings STOIC's rules to desktop apps (games, Discord, video apps…), the role Cold Turkey and Windows Focus played. Websites are handled by [`../extension`](../extension).

- **Pause before opening**: a watched app that just started is closed and Pebble asks first; "Open anyway" (after 10 s) reopens it and leaves it alone for that visit.
- **Daily limits** on time open, with optional "5 more minutes".
- **Focus sessions** from the tray or window; **schedules** (days + hours, overnight); **strict mode** (only stricter until a time, no quitting from the menu, "Unlock early" takes 15 minutes).
- System apps (Explorer, Finder, Task Manager…) are never closed. Nothing leaves the computer: settings and today's time are two JSON files in the app's data folder.

## Run it

```bash
npm install
npm start            # on Linux development machines: npx electron . --no-sandbox
```

## Files

| Path | What it is |
|---|---|
| `src/rules.js` | Pure decision logic, mirrors the Android app and the extension |
| `src/processes.js` | List / close / reopen apps: `tasklist` + `taskkill` + PowerShell (Windows), `ps` + `open` (macOS), `ps` (Linux) |
| `src/main.js` | Tray, windows, the 2-second checking loop, storage, strict mode |
| `src/ui/` | Settings window and Pebble's pause / time's-up / focus / schedule window |

## Checks

```bash
npm test                  # unit tests: rules + process-list parsers for all three systems
node tools/e2e.mjs        # launches the real app (Linux) with stand-in programs: 24 checks incl. axe
node tools/make-icons.mjs # macOS menu-bar template icons
```

The end-to-end test runs on Linux. Finding and closing apps on Windows and macOS uses different commands (covered by parser unit tests) and still needs checking on those systems.
