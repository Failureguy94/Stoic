import { View } from "react-native";
import { TOTAL_RESPONDENTS } from "@shared/survey";
import { AppLink, B, Bullets, ExternalLink, Screen, T } from "@/components/ui";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { space } from "@/theme";

const A11Y = [
  "Every button, chip and switch has a spoken label, a role and a state for TalkBack and VoiceOver.",
  "Touch targets are at least 48dp tall.",
  "Text follows your system font size, and colours follow your light or dark setting.",
  "Text and background colours meet WCAG AA contrast in both themes.",
  "Tags and charts never rely on colour alone. Each shows a word, symbol or number.",
  "Results and check-in replies are announced to screen readers when they change.",
  "Pebble's floating animation stops when “Remove animations” is on.",
  "Decorative pictures and emoji are hidden from screen readers.",
];

export default function About() {
  return (
    <Screen>
      <T v="lead">
        {SITE_NAME} is a digital wellbeing app made for students: screen time, limits, bedtime, focus, notification control and
        website blocking in one place, built to be honest and kind. It started as a first-year course project at IIIT Nagpur.
      </T>
      <ExternalLink href={SITE_URL}>{`Open the ${SITE_NAME} website`}</ExternalLink>

      <Section title="How it was shaped">
        <Bullets
          items={[
            <>
              <B>Survey. </B>We asked {TOTAL_RESPONDENTS} first-year students about their phones, distractions and what made
              past attempts fail. Their answers decided what {SITE_NAME} does first.
            </>,
            <>
              <B>Tools failed because of permissions, cost and forgetting. </B>So {SITE_NAME} asks for each permission only when
              you switch on the feature that needs it, is free, and works automatically once set up.
            </>,
            <>
              <B>Kind by design. </B>No streaks to lose, no red warnings, no shaming. Every limit has a way through unless you
              choose strict mode.
            </>,
          ]}
        />
        <AppLink href="/survey">See the survey results</AppLink>
      </Section>

      <Section title="Permissions, and what each one is for">
        <Bullets
          items={[
            <>
              <B>Usage access: </B>how long each app was open, for screen time, daily limits and your day score.
            </>,
            <>
              <B>Accessibility: </B>which app is in front, to show pause, limit, bedtime and focus screens. It cannot read what is
              on your screen or what you type.
            </>,
            <>
              <B>Notification access: </B>only for Notifications, to count and hold the ones you choose.
            </>,
            <>
              <B>Do Not Disturb access: </B>only if Bedtime should switch Do Not Disturb on.
            </>,
            <>
              <B>VPN: </B>only for Websites and internet. It stays on your phone and only answers “where is this website?”.
            </>,
          ]}
        />
      </Section>

      <Section title="Privacy">
        <Bullets
          items={[
            "There is no account and no STOIC server. Everything stays on this phone.",
            "Held notifications are deleted when you open or clear them, or after three days.",
            "Uninstalling STOIC or clearing its data deletes everything it stored.",
          ]}
        />
        <AppLink href="/design-note">Read the design note</AppLink>
      </Section>

      <Section title="Accessibility">
        <Bullets items={A11Y} />
      </Section>

      <Section title="Attribution and AI assistance">
        <T>
          Built with Expo, React Native, TypeScript and Kotlin. Fonts: Fredoka and Nunito (SIL Open Font License). The Pebble
          mascot and icons are original drawings made for {SITE_NAME}. Small symbols are standard emoji.
        </T>
        <T>
          <B>AI-assistance acknowledgement: </B>This app and site were built with assistance from Claude; the survey, user
          testing and final verification are my own work.
        </T>
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.md }}>
      <T v="h2">{title}</T>
      {children}
    </View>
  );
}
