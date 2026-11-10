import type { Metadata } from "next";
import Link from "next/link";
import { tools } from "@/data/tools";
import { formatDate } from "@/components/Badges";
import { SITE_NAME } from "@/lib/site";
import { TOTAL_RESPONDENTS } from "@/data/survey";

export const metadata: Metadata = {
  title: "About, method and accessibility",
  description: `How ${SITE_NAME} was researched and built, our sources, accessibility checklist and AI-assistance acknowledgement.`,
};

const A11Y_CHECKLIST = [
  "Semantic HTML: one h1 per page, headings in order, landmarks (header, nav, main, footer).",
  "A “Skip to main content” link is the first thing you reach with the Tab key.",
  "Every interactive element shows a clear focus outline.",
  "Text and background colours meet WCAG AA contrast in both light and dark mode.",
  "Links say where they go. We never use “click here”.",
  "Every image has alt text. Screenshot slots require alt text before they render.",
  "Data tables have a caption, column headers and row headers.",
  "Badges and charts never rely on colour alone. Each shows a word, symbol or number.",
  "The Find your fix picker uses native radio buttons and announces results to screen readers.",
  "Animations and transitions are switched off if you ask your device for reduced motion.",
  "Pages work at 320 px wide and zoomed to 200%.",
];

export default function AboutPage() {
  return (
    <div className="prose max-w-3xl">
      <h1>About, method and accessibility</h1>
      <p>
        {SITE_NAME} is a first-year course project (&ldquo;Digital Wellness Resource Hub&rdquo;) at IIIT Nagpur.
        Its goal is to help students <strong>choose and use</strong> practical digital wellness tools, not just
        to list links.
      </p>

      <h2 id="method">Method</h2>
      <ol>
        <li>
          <strong>Survey.</strong> We asked {TOTAL_RESPONDENTS} first-year students about their devices, phone time,
          distractions and past tools (Google Form). See the <Link href="/survey">survey results</Link>.
        </li>
        <li>
          <strong>Shortlist.</strong> We started from 12 candidate tools across Android, iPhone, Windows and the
          browser.
        </li>
        <li>
          <strong>Verification.</strong> For each tool we read the official website and the official store
          listing (Google Play, Chrome Web Store or Firefox Add-ons) and recorded cost, paid features,
          permissions and privacy labels. Anything we could not find is marked &ldquo;Not confirmed&rdquo;. We
          never guess. One candidate, StayFocusd, was dropped because its official pages could not be loaded.
        </li>
        <li>
          <strong>Labels.</strong> If an important feature needs payment, the tool is labelled
          &ldquo;Freemium&rdquo; (never &ldquo;Free&rdquo;) and the paid features are listed.
        </li>
        <li>
          <strong>Guides.</strong> Setup guides are written and tested by a student on a real device.
        </li>
        <li>
          <strong>Link check.</strong> A script checks every external link and saves the result in{" "}
          <code>docs/link-test-record.md</code>.
        </li>
      </ol>

      <h2 id="sources">Sources and dates checked</h2>
      <p>Prices and features change. Always confirm on the official page before you pay or grant permissions.</p>
      <ul>
        {tools.map((t) => (
          <li key={t.id}>
            <strong>{t.name}</strong>, checked <time dateTime={t.dateChecked}>{formatDate(t.dateChecked)}</time>:
            <ul>
              {t.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <h2 id="accessibility">Accessibility checklist</h2>
      <p>
        We aim for WCAG 2.2 level AA. We check every page with an automated checker (axe) and by keyboard. Manual
        screen-reader and zoom tests are recorded in <code>docs/accessibility-checklist.md</code>. If something does not work for you, please tell us so we can fix it.
      </p>
      <ul>
        {A11Y_CHECKLIST.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2 id="honesty">What this site cannot do</h2>
      <p>
        A website cannot read how much you use your phone. Check-ins in the <Link href="/circle">{SITE_NAME} Circle</Link>{" "}
        are <strong>self-reported</strong>. Our{" "}
        <Link href="/design-note">design note on tamper-resistant tracking</Link> explains what a future native app
        could do, and why no system is fully cheat-proof.
      </p>

      <h2 id="attribution">Attribution and AI assistance</h2>
      <p>
        Built with Next.js, React, TypeScript, Tailwind CSS and MDX. Body font: Atkinson Hyperlegible (Braille
        Institute, SIL Open Font License), served by Google Fonts through <code>next/font</code>. No other images,
        icons or assets are third-party.
      </p>
      <p>
        <strong>AI-assistance acknowledgement:</strong> This site was built with assistance from Claude; the
        survey, setup guides, screenshots, user testing and final verification are my own work.
      </p>
      <p>
        The full list of sources and libraries is in <code>docs/ATTRIBUTION.md</code> in the project repository.
      </p>
    </div>
  );
}
