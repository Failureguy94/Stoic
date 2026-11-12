import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Pebble } from "@/components/Pebble";
import { TourTarget } from "@/components/Tour";
import { B, Button, Card, Screen, T } from "@/components/ui";
import { device, isAndroid } from "@/lib/device";
import { hm } from "@/lib/score";
import { moodFor, useDayScore } from "@/lib/useDayScore";
import { useForeground } from "@/lib/useForeground";
import { font, space, useTheme } from "@/theme";

function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 5) return "Up late?";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** The two permissions most of STOIC needs, each one tap away. Others are asked for by the feature that uses them. */
function SetUpCard() {
  const t = useTheme();
  const [state, setState] = useState<{ usage: boolean; blocker: boolean } | null>(null);
  useForeground(() => {
    if (device) setState({ usage: device.hasUsageAccess(), blocker: device.isBlockerEnabled() });
  });
  if (!device || !state || (state.usage && state.blocker)) return null;
  const items = [
    { done: state.usage, label: "Usage access", why: "To see your screen time", open: () => device!.openUsageAccessSettings() },
    { done: state.blocker, label: "Accessibility", why: "To pause apps (find “STOIC limits and pauses”)", open: () => device!.openAccessibilitySettings() },
  ];
  return (
    <TourTarget id="today.setup">
      <Card tint="butter">
        <T v="h2">Set up</T>
        {items.map((i) => (
          <View key={i.label} style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <View style={{ flex: 1 }}>
              <T v="label">
                {i.done ? "✅ " : ""}
                {i.label}
              </T>
              <T v="small">{i.why}</T>
            </View>
            {i.done ? (
              <T v="label" color={t.goodInk}>
                On
              </T>
            ) : (
              <Button label="Turn on" accessibilityHint={`Opens ${i.label} settings`} onPress={i.open} />
            )}
          </View>
        ))}
        <T v="small" muted>
          Says “Restricted setting”? Settings › Apps › STOIC › ⋮ › Allow restricted settings.
        </T>
      </Card>
    </TourTarget>
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
            <Pressable accessibilityRole="link" onPress={() => router.push("/screen-time")} style={{ flex: 1 }}>
              <Card tint="sky">
                <T v="label">Screen time</T>
                <T v="h2">{screenMs === null ? "–" : hm(screenMs)}</T>
              </Card>
            </Pressable>
            <Card tint="mint" style={{ flex: 1 }}>
              <T v="label">Focus</T>
              <T v="h2">{hm(focusMs)}</T>
            </Card>
          </View>
        </>
      ) : (
        <Card tint="butter">
          <T v="h3">Most of STOIC needs Android for now</T>
          <T>
            On iPhone you can still use <B>Focus with Pebble</B> and the <B>Circle</B>.
          </T>
        </Card>
      )}

      <Button label="Start a focus session" onPress={() => router.push("/focus")} />
    </Screen>
  );
}
