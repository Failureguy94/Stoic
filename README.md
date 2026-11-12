# STOIC: digital wellbeing, made for students

STOIC started as a first-year course project at IIIT Nagpur (Project 3). It is a free Android app that helps students take back their study time, plus a website with how-to guides and the STOIC Circle. Everything stays on the user's phone: no account, no server.

The name lives in one place: `SITE_NAME` in [`lib/site.ts`](lib/site.ts) (website) and [`mobile/src/lib/site.ts`](mobile/src/lib/site.ts) (app).

## What STOIC does (Android app, in `mobile/`)

| Feature | What it is |
|---|---|
| Limits and pauses | A pause before opening an app, daily limits, opens per day, "Still worth it?" check-ins |
| Bedtime and schedules | Hours when apps stay closed, with Do Not Disturb; calls, messages and alarms always work |
| Focus with Pebble | A focus timer that can block apps or switch the internet off |
| Notifications | Per-app counts, hold noisy apps, summaries at chosen times |
| Websites and internet | Site blocking in every browser through an on-phone VPN; internet off during focus |
| Strict mode | Settings can only get stricter until a chosen time; "Unlock early" takes 15 minutes |
| Day score | 0–100 from four explained parts, no streaks |
| Screen time | Real per-app usage, plus an add-only record that survives uninstalls |

See [`mobile/AGENTS.md`](mobile/AGENTS.md) for app commands. In short: `cd mobile && npm install && npm run android` (needs Android Studio's SDK and an emulator or phone). `npm test` runs the TypeScript tests; `cd android && ./gradlew :stoic-device:testDebugUnitTest` runs the Kotlin tests.

## STOIC for your browser (in `extension/`)

A Chrome/Edge extension for laptops: pauses, daily limits and schedules for sites, focus sessions, a calmer YouTube (no feed, no Shorts) and strict mode. See [`extension/README.md`](extension/README.md); `cd extension && npm test` runs its tests.

## STOIC for Windows and Mac (in `desktop/`)

An Electron tray app: pause before opening, daily limits (time open), schedules, focus sessions and strict mode for desktop apps. It finds and closes apps with each system's own tools (tasklist/taskkill on Windows, ps on macOS/Linux), so there are no native add-ons. See [`desktop/README.md`](desktop/README.md).

## Website pages

| Route | What it is |
|---|---|
| `/` | What STOIC is and does, privacy, how to get it |
| `/docs`, `/docs/[slug]` | How-to guides for every feature (the app teaches itself with a first-run tour instead) |
| `/circle` | STOIC Circle: cohort pulse + weekly pledge (saved in this browser only) |
| `/survey` | Survey results as accessible bar charts, and how they shaped STOIC |
| `/about` | What STOIC is, every permission and what it's for, privacy, accessibility, credits |
| `/design-note` | Tamper-resistant tracking: what the app records and what it can't stop |

Old hub URLs (`/tools`, `/guides/...`) redirect to the new pages.

## Run the website locally

Needs Node.js 20.9 or newer.

```bash
npm install
npm run dev          # http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

## Checks

```bash
npm run lint
npm run check:links                 # writes docs/link-test-record.md
npm run build && npm run start      # in one terminal, then in another:
npm run check:a11y                  # axe-core on every page → docs/a11y-report.md
```

`check:a11y` uses Google Chrome at `/usr/bin/google-chrome`. Set `CHROME_PATH` if yours is elsewhere, and `BASE_URL` if the server isn't on port 3000.

## Deploy the website to Vercel

1. Push this repo to GitHub.
2. On vercel.com, choose **Add New → Project**, import the repo, and keep the defaults (Vercel detects Next.js).
3. Click **Deploy**. No environment variables are needed.

## Where to edit content

| What | File |
|---|---|
| How-to guides (website) | `content/docs/*.mdx`, with title, summary and icon in `data/docs.ts` |
| First-run tour (app) | `mobile/src/lib/tour.ts` (steps), `mobile/src/components/Tour.tsx` (overlay) |
| Survey numbers | `data/survey.ts` |

Guides can use `<Note>`, `<IfItDidntWork>` and `<Screenshot src="/doc-images/<slug>/<file>.png" alt="..." caption="..." />` (images go in `public/doc-images/`; alt text is required).

## Docs

- [`docs/accessibility-checklist.md`](docs/accessibility-checklist.md): what has been checked, and the manual tests still to do
- [`docs/a11y-report.md`](docs/a11y-report.md): latest axe-core results
- [`docs/link-test-record.md`](docs/link-test-record.md): latest external link check
- [`docs/ATTRIBUTION.md`](docs/ATTRIBUTION.md): sources, libraries, fonts and the AI-assistance acknowledgement

## Honesty notes

- The website cannot see device usage. Circle check-ins are **self-reported** and stored only in `localStorage`.
- The app can't stop safe mode, a computer with developer tools, or a factory reset; the guides say so.
- STOIC was built with assistance from Claude; the survey, user testing and final verification are my own work.
