# Attribution

**Do not remove this file.**

## AI-assistance acknowledgement

STOIC (the website and the Android app) was built with assistance from Claude; the survey, user testing and final verification are my own work.

Specifically, Claude (an AI assistant by Anthropic, used through Claude Code) helped scaffold the Next.js website and the Expo/React Native app, write the Kotlin native module, write the components, page copy and how-to guides, and write the automated tests and check scripts.

## Survey

Google Form survey of 17 first-year students at IIIT Nagpur, designed, run and analysed by the student. Results are in `data/survey.ts` and shown on `/survey`.

## Technical references

Android platform APIs the app relies on (Android Developers documentation):

- UsageStatsManager (screen time): https://developer.android.com/reference/android/app/usage/UsageStatsManager
- AccessibilityService (which app is in front): https://developer.android.com/reference/android/accessibilityservice/AccessibilityService
- NotificationListenerService (notification control): https://developer.android.com/reference/android/service/notification/NotificationListenerService
- VpnService (website blocking on the phone): https://developer.android.com/reference/android/net/VpnService
- NotificationManager interruption filter (Bedtime's Do Not Disturb): https://developer.android.com/reference/android/app/NotificationManager

## Libraries and tools

### Website

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

### Android app (`mobile/`)

| Name | Use | Licence |
|---|---|---|
| Expo SDK 58, expo-router and Expo modules | App framework and navigation | MIT |
| React Native | UI | MIT |
| react-native-svg, react-native-safe-area-context, react-native-screens | Drawing, layout | MIT |
| @react-native-community/datetimepicker | Time picker for schedules | MIT |
| @react-native-async-storage/async-storage | Saving settings on the phone | MIT |
| AndroidX WorkManager | Background screen-time record | Apache-2.0 |
| Kotlin, JUnit, org.json (tests) | Native module and its tests | Apache-2.0, EPL-1.0, JSON licence |
| unified, remark-parse, remark-mdx | Turning the guides into app content (build only) | MIT |

## Fonts, images and icons

- **Fredoka** (headings) and **Nunito** (body), SIL Open Font License 1.1. The website loads them through `next/font/google`; the app bundles them (see `mobile/modules/stoic-device/FONTS.md`).
- **Pebble** mascot, wave divider and app icons: original drawings made for STOIC.
- No third-party images or icon sets. Badge symbols and decorative icons are plain Unicode characters and emoji (hidden from screen readers).
