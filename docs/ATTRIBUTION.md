# Attribution

**Do not remove this file.**

## AI-assistance acknowledgement

This site was built with assistance from Claude; the survey, setup guides, screenshots, user testing and final verification are my own work.

Specifically, Claude (an AI assistant by Anthropic, used through Claude Code) helped scaffold the Next.js project, write the components and page copy, research tool details from official pages, and write the check scripts. All tool facts were read from the official sources listed below. Anything that could not be confirmed is marked "Not confirmed" on the site.

## Survey

Google Form survey of 17 first-year students at IIIT Nagpur, designed, run and analysed by the student. Results are in `data/survey.ts` and shown on `/survey`.

## Sources (all checked on 2026-11-10)

| Tool | Source |
|---|---|
| Android Digital Wellbeing | https://support.google.com/android/answer/9346420 |
| Android Digital Wellbeing | https://play.google.com/store/apps/details?id=com.google.android.apps.wellbeing |
| iPhone Screen Time | https://support.apple.com/guide/iphone/set-schedules-and-limits-iphb0c7313c9/ios |
| iPhone Focus | https://support.apple.com/guide/iphone/set-up-a-focus-iphd6288a67f/ios |
| Windows Focus sessions | https://support.microsoft.com/en-us/windows/how-to-use-focus-in-windows-11-cbcc9ddb-8164-43fa-8919-b9a2af072382 |
| ScreenZen | https://www.screenzen.co/ |
| ScreenZen | https://play.google.com/store/apps/details?id=com.screenzen |
| Forest | https://www.forestapp.cc/ |
| Forest | https://play.google.com/store/apps/details?id=cc.forestapp |
| Opal | https://opalapp.com/ |
| Opal | https://opalapp.com/pricing |
| Opal | https://play.google.com/store/apps/details?id=com.withopal.opal |
| LeechBlock NG | https://www.proginosko.com/leechblock/ |
| LeechBlock NG | https://addons.mozilla.org/en-US/firefox/addon/leechblock-ng/ |
| Unhook | https://unhook.app/ |
| Unhook | https://chromewebstore.google.com/detail/unhook-remove-youtube-rec/khncfooichmfjbepaaaebmommgaepoid |
| Unhook | https://addons.mozilla.org/en-US/firefox/addon/youtube-recommended-videos/ |
| Cold Turkey Blocker | https://getcoldturkey.com/ |
| Cold Turkey Blocker | https://getcoldturkey.com/pricing/ |
| Freedom | https://freedom.to/pricing |
| Freedom | https://play.google.com/store/apps/details?id=to.freedom.android2 |

Dropped: **StayFocusd**. Its official site showed no readable content, and its Chrome Web Store page could not be loaded, so nothing could be verified.

Technical reference for the design note (checked 2026-11-10): https://developer.android.com/reference/android/app/usage/UsageStatsManager

## Libraries and tools

| Name | Use | Licence |
|---|---|---|
| Next.js 16 | Framework | MIT |
| React 19 | UI | MIT |
| TypeScript | Language | Apache-2.0 |
| Tailwind CSS 4 | Styling | MIT |
| @next/mdx, @mdx-js/loader, @mdx-js/react | Guides in MDX | MIT |
| axe-core | Automated accessibility check (dev only) | MPL-2.0 |
| playwright-core | Headless browser for checks (dev only) | Apache-2.0 |
| ESLint, eslint-config-next | Linting (dev only) | MIT |

## Fonts, images and icons

- **Fredoka** (headings) and **Nunito** (body), SIL Open Font License 1.1. Loaded through `next/font/google`.
- **Pebble** mascot, wave divider and app icon: original inline SVG drawn for this site.
- No third-party images or icon sets. Badge symbols and decorative icons are plain Unicode characters and emoji (hidden from screen readers).
- Guide screenshots (in `public/guides/`) are the student's own.
