import { View } from "react-native";
import { TOTAL_RESPONDENTS } from "@shared/survey";
import { tools } from "@shared/tools";
import { formatDate } from "@/components/Tags";
import { AppLink, B, Bullets, Card, ExternalLink, Screen, T } from "@/components/ui";
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
        {SITE_NAME} is a first-year course project (“Digital Wellness Resource Hub”) at IIIT Nagpur. Its goal is to help students{" "}
        <B>choose and use</B> practical digital wellness tools, not just list links. This app is the companion to the website.
      </T>
      <ExternalLink href={SITE_URL}>{`Open the ${SITE_NAME} website`}</ExternalLink>

      <Section title="Method">
        <Bullets
          items={[
            <>
              <B>Survey. </B>We asked {TOTAL_RESPONDENTS} first-year students about their devices, phone time, distractions and
              past tools (Google Form).
            </>,
            <>
              <B>Verification. </B>For each tool we read the official website and the official store listing and recorded cost,
              paid features, permissions and privacy labels. Anything we could not find is marked “Not confirmed”. We never
              guess. One candidate, StayFocusd, was dropped because its official pages could not be loaded.
            </>,
            <>
              <B>Labels. </B>If an important feature needs payment, the tool is labelled “Freemium” (never “Free”) and the paid
              features are listed.
            </>,
            <>
              <B>Guides. </B>Setup guides are written and tested by a student on a real device.
            </>,
          ]}
        />
      </Section>

      <Section title="What this app does on your phone">
        <Bullets
          items={[
            "Your pledge, focus sessions, limits and usage log stay on this phone. The app has no account and no server.",
            "Screen time needs Android's “Usage access”. You grant it in Settings and can switch it off at any time.",
            "Limits and pauses need Android's Accessibility permission. The app uses it only to see which app is in front. It does not read what you type or what is on the screen.",
            "On iPhone, screen time and limits are not available, because Apple requires special approval for them.",
          ]}
        />
        <AppLink href="/design-note">Read the design note</AppLink>
      </Section>

      <Section title="Accessibility">
        <Bullets items={A11Y} />
        <T v="small" muted>
          The third-party tools we list have not been tested by us with screen readers.
        </T>
      </Section>

      <Section title="Sources and dates checked">
        <T>Prices and features change. Always confirm on the official page before you pay or grant permissions.</T>
        {tools.map((tool) => (
          <Card key={tool.id} style={{ padding: space.lg, gap: 4 }}>
            <T v="label">
              {tool.name}, checked {formatDate(tool.dateChecked)}
            </T>
            {tool.sources.map((s) => (
              <ExternalLink key={s.url} href={s.url}>
                {s.label}
              </ExternalLink>
            ))}
          </Card>
        ))}
      </Section>

      <Section title="Attribution and AI assistance">
        <T>
          Built with Expo, React Native, TypeScript and Kotlin. Fonts: Fredoka and Nunito (SIL Open Font License). The Pebble
          mascot and icons are original drawings made for {SITE_NAME}. Small symbols are standard emoji.
        </T>
        <T>
          <B>AI-assistance acknowledgement: </B>This app and site were built with assistance from Claude; the survey, setup
          guides, screenshots, user testing and final verification are my own work.
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
