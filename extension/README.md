# STOIC for your browser

A Chrome/Edge extension (Manifest V3) that brings STOIC to laptops, replacing what students used LeechBlock NG, Unhook and Cold Turkey for:

- **Sites**: a 10-second pause before opening, daily time limits ("5 more minutes" optional), and blocking during focus.
- **Schedules**: days and hours when chosen sites stay closed (overnight windows work).
- **Focus with Pebble**: 15/25/45-minute sessions from the toolbar popup.
- **A calmer YouTube**: hide the home feed, Shorts (and open any Short as a normal video), recommendations, end screens and comments.
- **Strict mode**: rules can only get stricter until a chosen time; the extensions page can be locked; "Unlock early" takes 15 minutes.

Privacy: no network requests, no analytics. Rules and today's time per site are kept in `chrome.storage.local`, only for sites the user added. Time counts only while the browser window is focused and the screen is unlocked (idle counts, so watching a video counts).

## Try it

1. Open `chrome://extensions` (or `edge://extensions`) and switch on **Developer mode**.
2. **Load unpacked** → choose this `extension/` folder.

## Files

| Path | What it is |
|---|---|
| `src/rules.js` | Pure decision logic (mirrors the Android app's Blocker/Schedules/Strict) |
| `src/background.js` | Service worker: watches tabs, counts time, sends tabs to STOIC's page, handles messages |
| `src/blocked.html/.js` | Pause / time's up / focus / schedule / strict page |
| `src/popup.*`, `src/options.*` | Toolbar popup and settings page |
| `src/youtube.js/.css` | YouTube clean-up (class names + CSS only; Shorts → normal player) |

## Checks

```bash
npm test          # unit tests for src/rules.js (Node 20+)
npm run e2e       # loads the extension in Playwright's Chromium: live YouTube/Wikipedia checks + axe on every page
npm run pack      # dist/stoic-extension-<version>.zip for the Chrome Web Store / Edge Add-ons
npm run icons     # re-render icons/ from src/pebble.svg
```

`e2e` and `icons` use `playwright-core` from the repo root (`npm install` there first). The daily-limit check in `e2e` needs someone at an unlocked desktop (Chrome reports a locked screen otherwise) and is skipped with a message when that isn't the case.

YouTube changes its page often, so `src/youtube.css` may need new selectors over time; `npm run e2e` checks the home feed and the Shorts side-bar entry against the live site.

Fonts (Fredoka, Nunito) are under the SIL Open Font License; see `../mobile/modules/stoic-device/FONTS.md`.
