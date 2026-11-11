import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Pebble } from "@/components/Pebble";
import { AppLink, B, Button, Card, NavCard, Screen, T } from "@/components/ui";
import { device, isAndroid } from "@/lib/device";
import { hm } from "@/lib/score";
import { moodFor, useDayScore } from "@/lib/useDayScore";
import { useForeground } from "@/lib/useForeground";
import { font, radius, space, useTheme } from "@/theme";

function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 5) return "Up late?";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** The two permissions most of STOIC needs. Others are asked for by the feature that uses them. */
function SetUpCard() {
  const [state, setState] = useState<{ usage: boolean; blocker: boolean } | null>(null);
  useForeground(() => {
    if (device) setState({ usage: device.hasUsageAccess(), blocker: device.isBlockerEnabled() });
  });
  if (!state || (state.usage && state.blocker)) return null;
  const items = [
    { done: state.usage, label: "Screen time", hint: "Usage access", href: "/screen-time" as const },
    { done: state.blocker, label: "Limits and schedules", hint: "Accessibility", href: "/limits" as const },
  ];
  return (
    <Card tint="butter">
      <T v="h2">Set up</T>
      <T>Two switches in Android&apos;s settings unlock most of STOIC. Each one takes about a minute.</T>
      {items.map((i) => (
        <NavCard
          key={i.label}
          href={i.href}
          icon={i.done ? "✅" : "⬜"}
          tint="surface"
          title={i.label}
          body={i.done ? `${i.hint}: on` : `${i.hint}: tap to switch on`}
        />
      ))}
      <AppLink href={{ pathname: "/docs/[slug]", params: { slug: "getting-started" } }}>What STOIC needs, and why</AppLink>
    </Card>
  );
}

export default function Today() {
  const t = useTheme();
  const { score, screenMs, focusMs } = useDayScore();

  return (
    <Screen tab>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <View style={{ flex: 1, gap: space.xs }}>
          <T v="h1">{greeting()}</T>
          <T muted>Here&apos;s your day with STOIC.</T>
        </View>
        <Pebble mood={score ? moodFor(score.total) : "happy"} size={84} float />
      </View>

      {isAndroid && device ? (
        <>
          <SetUpCard />

          <Pressable
            accessibilityRole="link"
            accessibilityLabel={score ? `Today's score: ${score.total} out of 100. ${score.word}. See what makes it up.` : "Today's score"}
            onPress={() => router.push("/score")}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <Card tint="lavender">
              <T v="label">Today&apos;s score</T>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.sm }}>
                <T style={{ fontFamily: font.display, fontSize: 48, lineHeight: 56, color: t.ink }}>{score ? score.total : "–"}</T>
                <T v="h3">{score ? score.word : "Working it out…"}</T>
              </View>
              <T v="small" muted>
                Tap to see what makes it up ›
              </T>
            </Card>
          </Pressable>

          <View style={{ flexDirection: "row", gap: space.md }}>
            <Card tint="sky" style={{ flex: 1 }}>
              <T v="label">Screen time</T>
              <T v="h2">{screenMs === null ? "–" : hm(screenMs)}</T>
            </Card>
            <Card tint="mint" style={{ flex: 1 }}>
              <T v="label">Focus</T>
              <T v="h2">{hm(focusMs)}</T>
            </Card>
          </View>
        </>
      ) : (
        <Card tint="butter">
          <T v="h3">STOIC&apos;s phone features need Android for now</T>
          <T>
            On iPhone, Apple only lets approved apps see screen time or pause other apps. Until STOIC has that approval, you can
            still use <B>Focus with Pebble</B> and the <B>Circle</B> here.
          </T>
        </Card>
      )}

      <Button label="Start a focus session" onPress={() => router.push("/focus")} />

      <View style={{ gap: space.md }}>
        <T v="h2">Quick fixes</T>
        <NavCard href="/limits" icon="✋" tint="peach" title="One app keeps pulling me in" body="Add a pause, a daily limit or fewer opens." />
        <NavCard href="/schedules" icon="🌙" tint="lavender" title="I stay up on my phone" body="Set a bedtime when apps stay closed." />
        <NavCard href="/notifications" icon="🔔" tint="mint" title="Notifications keep interrupting" body="Hold the noisy ones for one summary." />
        <NavCard href="/sites" icon="🌐" tint="sky" title="I get lost on websites" body="Block sites in every browser on this phone." />
      </View>

      <Pressable
        accessibilityRole="link"
        onPress={() => router.push("/docs")}
        style={({ pressed }) => ({
          borderRadius: radius.blob,
          padding: space.lg,
          borderWidth: 2,
          borderColor: t.line,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <T v="label">📘 New to STOIC?</T>
        <T>Short how-to guides for every feature ›</T>
      </Pressable>
    </Screen>
  );
}
