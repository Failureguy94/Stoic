import { View } from "react-native";
import { B, Bullets, ExternalLink, Screen, T } from "@/components/ui";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { space } from "@/theme";

export default function About() {
  return (
    <Screen>
      <T v="lead">
        {SITE_NAME} is a free digital wellbeing app for students. It started as a first-year course project at IIIT Nagpur.
      </T>

      <Section title="Permissions">
        <Bullets
          items={[
            <>
              <B>Usage access: </B>how long each app was open.
            </>,
            <>
              <B>Accessibility: </B>which app is in front, to show pauses and limits. Never what&apos;s on screen or what you type.
            </>,
            <>
              <B>Notification access: </B>only to count and hold the apps you pick.
            </>,
            <>
              <B>Do Not Disturb: </B>only if Bedtime should switch it on.
            </>,
            <>
              <B>VPN: </B>only to block websites. It stays on your phone.
            </>,
          ]}
        />
      </Section>

      <Section title="Privacy">
        <T>
          No account, and your data stays on this phone: uninstalling deletes it. The app only goes online to download its
          own updates.
        </T>
      </Section>

      <Section title="Credits">
        <T v="small">
          Built with Expo, React Native and Kotlin. Fonts: Fredoka and Nunito (SIL Open Font License). Pebble and the icons are
          original drawings.
        </T>
        <T v="small">
          <B>AI-assistance acknowledgement: </B>This app and site were built with assistance from Claude; the survey, user
          testing and final verification are my own work.
        </T>
        <ExternalLink href={SITE_URL}>{`${SITE_NAME} website`}</ExternalLink>
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <T v="h2">{title}</T>
      {children}
    </View>
  );
}
