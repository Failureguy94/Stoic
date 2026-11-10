import { View } from "react-native";
import { AppLink, B, Bullets, Card, ExternalLink, Screen, T } from "@/components/ui";
import { isAndroid } from "@/lib/device";
import { space } from "@/theme";

export default function DesignNote() {
  return (
    <Screen>
      <T v="h1">Tamper-resistant tracking: what is built, and what is not</T>

      <Card tint="butter">
        <T>
          <B>Honest summary: </B>on Android, this app keeps its own record of your screen time on your phone, so past days are
          not lost when another app is uninstalled, and gaps are shown as “unverified”. It does <B>not</B> send anything to a
          server, and no system can be fully cheat-proof.
        </T>
      </Card>

      <Section title="The problem">
        <T>
          Students in our survey said tools stopped working because they ignored them or turned them off. There is a sneakier
          version too. On some Android phones (we saw this on a Redmi), when you uninstall an app, its usage history disappears
          from Digital Wellbeing. Uninstall Instagram on Sunday night, reinstall it on Monday, and the week&apos;s total looks
          smaller than it really was.
        </T>
        <T>A website cannot help: browsers have no permission to read how long you used other apps. An Android app can.</T>
      </Section>

      <Section title="What this app does (Android)">
        <Bullets
          items={[
            <>
              <B>Reads usage from the system. </B>Android&apos;s UsageStatsManager gives device usage history. It needs the
              “Usage access” permission, which you grant yourself in Settings and can switch off at any time.
            </>,
            <>
              <B>Keeps an append-only log on the phone. </B>A background job records each day&apos;s per-app totals into the
              app&apos;s own storage. Records are only added or updated for the same day, never removed, so uninstalling
              another app later cannot erase a day that was already recorded.
            </>,
            <>
              <B>Leaves a heartbeat. </B>Each time the job runs with Usage access on, it notes the time. A day with no
              heartbeat, or with access switched off, is shown as <B>“unverified”</B>. It is not shown as zero and not shown
              as a failure.
            </>,
            <>
              <B>Stays opt-in and private. </B>Recording is off until you turn it on. Only app names and daily totals are
              stored, never message content. You can see everything on the My screen time page.
            </>,
          ]}
        />
        {isAndroid ? <AppLink href="/screen-time">Open My screen time</AppLink> : null}
      </Section>

      <Section title="What is not built">
        <Bullets
          items={[
            "Sending the log to a server. That would let a batch see an anonymous median and would survive uninstalling this app, but it needs a backend and a careful privacy review.",
            "Anything on iPhone. Apple does not allow it without special approval.",
          ]}
        />
      </Section>

      <Section title="What this still cannot stop">
        <Bullets
          items={[
            "Using a second phone, a laptop, or a friend's device.",
            "Uninstalling this app or clearing its data, which deletes the log. Only a server copy would survive that.",
            "Rooted or modified phones that fake system data.",
            "The phone maker's battery saver stopping the background job, which causes honest gaps.",
            "Android itself keeps detailed usage events for only a few days, so the job has to run regularly.",
          ]}
        />
        <T>
          So the honest goal is not “cheat-proof”. It is <B>“gaps are visible”</B>, so you can trust your own numbers.
        </T>
      </Section>

      <Section title="Reference">
        <ExternalLink href="https://developer.android.com/reference/android/app/usage/UsageStatsManager">
          Android Developers: UsageStatsManager API reference
        </ExternalLink>
        <T v="small" muted>
          Checked 10 Nov 2026.
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
