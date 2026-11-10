# Accessibility checklist

Target: WCAG 2.2 level AA.
Legend: ✅ done and checked · ⬜ manual test still to do (student) · ⚠️ known limitation

## Automated check

- ✅ axe-core 4.14 (rules: wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice) on all 10 pages, in light and dark mode, at 1280 px and 375 px wide. **0 violations** on 2026-11-10. Full table: [a11y-report.md](a11y-report.md). Re-run with `npm run check:a11y` while `npm run start` is running.
- ✅ No horizontal page scrolling at 375 px (checked by the same script).
- ⬜ Lighthouse accessibility score (Chrome DevTools, then Lighthouse): record the score here: `[ADD SCORE + DATE]`

## Structure and semantics

- ✅ `<html lang="en">`, a unique `<title>` on every page.
- ✅ Landmarks: `header`, `nav` (labelled "Main" and "Footer"), `main`, `footer`.
- ✅ One `h1` per page, headings in order (axe `heading-order` passes).
- ✅ Skip link "Skip to main content" is the first Tab stop (checked in a browser test).
- ✅ Current page in nav marked with `aria-current="page"` (and shown by fill colour plus bold, not colour alone).
- ✅ Guides use a breadcrumb `nav` with `aria-current`.

## Keyboard and focus

- ✅ All controls are native elements (`a`, `button`, `input`, `select`), so they work with Tab, Space, Enter and arrow keys.
- ✅ A visible 3 px focus outline (`:focus-visible`) on every interactive element. Contrast is 5.7:1 (light) and 8.8:1 (dark).
- ✅ Picker radio cards show the focus ring around the whole card.
- ✅ Pledge form: on an empty "My own goal", the error is announced (`role="alert"`) and focus moves to the text box. After editing a goal, focus returns to the goal heading.
- ⬜ Manual: complete the picker, filters and pledge using only the keyboard. `[ADD RESULT + DATE]`

## Screen readers

- ✅ Picker results announced with a polite live region ("2 tools for YouTube / reels on Android phone, shown below.").
- ✅ Compare filters announce "Showing N of 11 tools".
- ✅ Pledge check-ins announce a supportive message, and buttons use `aria-pressed`.
- ✅ External links include hidden text "(external site)".
- ⬜ Manual: test with NVDA (Windows) or TalkBack (Android). `[ADD RESULT + DATE]`

## Tables and charts

- ✅ Compare table has a `caption`, `th scope="col"` column headers and `th scope="row"` row headers. The scroll region is focusable and labelled.
- ✅ On small screens the table becomes cards that use `dl`/`dt`/`dd`.
- ✅ Survey bar charts are real tables. Each bar also shows the count and percentage as text, and the bar itself is `aria-hidden`.

## Colour and contrast

All pairs meet AA (4.5:1 text, 3:1 UI). Measured from the CSS tokens in `app/globals.css`:

| Pair | Light | Dark |
|---|---|---|
| Body text on page | 16.6:1 | 15.5:1 |
| Body text on card | 18.0:1 | 14.0:1 |
| Muted text on page | 7.7:1 | 9.7:1 |
| Muted text on card | 8.3:1 | 8.8:1 |
| Muted text on tinted panel | 7.1:1 | 7.0:1 |
| Link/accent text on card | 7.7:1 | 9.2:1 |
| Link/accent text on page | 7.1:1 | 10.2:1 |
| Link text on tinted panel | 6.6:1 | 7.4:1 |
| Button text on accent | 7.7:1 | 9.4:1 |
| Free badge | 8.0:1 | 10.5:1 |
| Freemium badge | 9.1:1 | 10.0:1 |
| Paid / high-permission badge | 8.5:1 | 9.2:1 |
| Automatic badge / info note | 8.9:1 | 10.3:1 |
| Text on placeholder note | 16.8:1 | 12.9:1 |
| Form field border on card (3:1 needed) | 4.5:1 | 5.4:1 |
| Focus outline on page (3:1 needed) | 5.7:1 | 8.8:1 |

- ✅ Nothing relies on colour alone: badges have words and symbols, links are always underlined, and pledge weeks show "Kept", "Partly", "Rest week" or "No check-in" as text.

## Content

- ✅ Link text describes the destination. No "click here".
- ✅ Every image needs alt text. The `<Screenshot>` component makes `alt` required, and placeholders show the planned alt text.
- ⬜ When adding real screenshots, rewrite each alt text to describe what *your* screenshot shows.
- ✅ Plain language, short sentences. The body font is Atkinson Hyperlegible (designed for low vision).

## Motion, zoom and responsive

- ✅ `prefers-reduced-motion` turns off animations and transitions. The site has almost no motion anyway.
- ✅ Layout works from 320 px up. Text uses rem units.
- ⬜ Manual: browser zoom to 200% on a laptop, with no content lost. `[ADD RESULT + DATE]`

## Known limitations

- ⚠️ Third-party tools listed on the site have **not** been tested by us with screen readers. Each tool's notes say so.
- ⚠️ The weekly pledge uses `localStorage`. In private browsing it lasts only for that visit.
