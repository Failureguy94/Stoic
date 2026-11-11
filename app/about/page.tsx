import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { TOTAL_RESPONDENTS } from "@/data/survey";

export const metadata: Metadata = {
  title: "About STOIC",
  description: `What ${SITE_NAME} is, how the survey shaped it, every permission and what it is for, privacy, accessibility and credits.`,
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
  "The Circle's check-in uses native radio buttons and announces results to screen readers.",
  "Animations and transitions are switched off if you ask your device for reduced motion.",
  "Pages work at 320 px wide and zoomed to 200%.",
];

export default function AboutPage() {
  return (
    <div className="reading">
      <h1>About {SITE_NAME}</h1>
      <p>
        {SITE_NAME} is a free digital wellbeing app made for students: screen time, limits, bedtime, focus,
        notification control and website blocking in one place, built to be honest and kind. It started as a
        first-year course project at IIIT Nagpur.
      </p>

      <h2 id="method">How it was shaped</h2>
      <ol>
        <li>
          <strong>Survey.</strong> We asked {TOTAL_RESPONDENTS} first-year students about their phones, distractions
          and why past attempts failed (Google Form). See the <Link href="/survey">survey results</Link>.
        </li>
        <li>
          <strong>Tools failed because of permissions, cost and forgetting.</strong> So {SITE_NAME} is free, asks for
          each permission only when you switch on the feature that needs it, and works automatically once set up.
        </li>
        <li>
          <strong>Kind by design.</strong> No streaks to lose, no red warnings, no shaming. Every limit has a way
          through unless you choose strict mode.
        </li>
        <li>
          <strong>Tested on Android.</strong> Every feature is tested on an Android 16 phone emulator, and the
          blocking rules have automated tests.
        </li>
      </ol>

      <h2 id="permissions">Permissions, and what each one is for</h2>
      <ul>
        <li>
          <strong>Usage access:</strong> how long each app was open, for screen time, daily limits and your day
          score.
        </li>
        <li>
          <strong>Accessibility:</strong> which app is in front, to show pause, limit, bedtime and focus screens. It
          cannot read what is on your screen or what you type.
        </li>
        <li>
          <strong>Notification access:</strong> only for Notifications, to count and hold the ones you choose.
        </li>
        <li>
          <strong>Do Not Disturb access:</strong> only if Bedtime should switch Do Not Disturb on.
        </li>
        <li>
          <strong>VPN:</strong> only for Websites and internet. It stays on your phone and only answers &ldquo;where
          is this website?&rdquo;.
        </li>
      </ul>

      <h2 id="privacy">Privacy</h2>
      <ul>
        <li>There is no account and no {SITE_NAME} server. Everything stays on your phone.</li>
        <li>Held notifications are deleted when you open or clear them, or after three days.</li>
        <li>Uninstalling {SITE_NAME} or clearing its data deletes everything it stored.</li>
        <li>
          This website stores your Circle pledge only in your own browser. Read the{" "}
          <Link href="/design-note">design note</Link> for what the app records and what it can&apos;t stop.
        </li>
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

      <h2 id="attribution">Attribution and AI assistance</h2>
      <p>
        Built with Next.js, React, TypeScript, Tailwind CSS and MDX. Fonts: Fredoka (headings) and Nunito (body),
        both under the SIL Open Font License, served through <code>next/font</code>. The Pebble mascot and all
        illustrations are original inline SVG drawn for this site. Small symbols are standard emoji.
      </p>
      <p>
        <strong>AI-assistance acknowledgement:</strong> This site and app were built with assistance from Claude;
        the survey, user testing and final verification are my own work.
      </p>
      <p>
        The full list of sources and libraries is in <code>docs/ATTRIBUTION.md</code> in the project repository.
      </p>
    </div>
  );
}
