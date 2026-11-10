# STOIC: Digital Wellness Resource Hub

A first-year course project (IIIT Nagpur, Project 3). STOIC helps students **choose and use** practical digital wellness tools: a short, checked list, a "Find your fix" picker, side-by-side comparisons of cost, permissions and effort, student-written setup guides, and the STOIC Circle, which gives gentle, shame-free encouragement.

The site name lives in one place: `SITE_NAME` in [`lib/site.ts`](lib/site.ts).

## Pages

| Route | What it is |
|---|---|
| `/` | Find your fix picker (problem + device → 1–3 tools) |
| `/tools` | Compare tools: table on desktop, cards on mobile, with filters |
| `/guides`, `/guides/[slug]` | Three MDX setup guides (placeholders to fill in) |
| `/circle` | STOIC Circle: cohort pulse + weekly pledge (saved in this browser only) |
| `/survey` | Survey results as accessible bar charts + what changed |
| `/about` | Method, sources, accessibility checklist, AI acknowledgement |
| `/design-note` | Tamper-resistant tracking design (future work, not built) |

## Run it locally

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

## Deploy to Vercel

1. Push this repo to GitHub.
2. On vercel.com, choose **Add New → Project**, import the repo, and keep the defaults (Vercel detects Next.js).
3. Click **Deploy**. No environment variables are needed.

Or from the terminal: `npx vercel` (preview) and `npx vercel --prod`.

## Where to edit content

| What | File |
|---|---|
| Tool data (typed) | `data/tools.ts` |
| Picker recommendations | `data/picker.ts` |
| Survey numbers | `data/survey.ts` |
| Guides | `content/guides/*.mdx`, and their details (time needed, author, date tested) in `lib/guides.ts` |
| Guide screenshots | `public/guides/<guide-slug>/` |

### Adding a screenshot to a guide

```mdx
<Screenshot
  src="/guides/android-digital-wellbeing/app-timer.png"
  alt="Digital Wellbeing showing a 30-minute timer on YouTube"
  caption="Set the timer, then tap OK."
/>
```

Without `src` it shows a visible `[ADD SCREENSHOT]` placeholder. `alt` is always required.

## Docs

- [`docs/accessibility-checklist.md`](docs/accessibility-checklist.md): what has been checked, and the manual tests still to do
- [`docs/a11y-report.md`](docs/a11y-report.md): latest axe-core results
- [`docs/link-test-record.md`](docs/link-test-record.md): latest external link check
- [`docs/ATTRIBUTION.md`](docs/ATTRIBUTION.md): sources, libraries, fonts and the AI-assistance acknowledgement

## Honesty notes

- Tool facts come from official pages, checked on the date shown. Anything not found says "Not confirmed".
- The website cannot see device usage. Circle check-ins are **self-reported** and stored only in `localStorage`.
- This site was built with assistance from Claude; the survey, setup guides, screenshots, user testing and final verification are my own work.
