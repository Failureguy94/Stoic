import { View } from "react-native";
import { Pebble } from "@/components/Pebble";
import { Card, NavCard, Screen, T } from "@/components/ui";
import { isAndroid } from "@/lib/device";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { space } from "@/theme";

export default function More() {
  return (
    <Screen tab>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <Pebble mood="happy" size={72} />
        <View style={{ flex: 1 }}>
          <T v="h1">{SITE_NAME}</T>
          <T muted>{SITE_TAGLINE}</T>
        </View>
      </View>

      <View style={{ gap: space.md }}>
        <T v="h2">On this phone</T>
        {isAndroid ? (
          <>
            <NavCard href="/screen-time" icon="⏱️" tint="sky" title="My screen time" body="Your real per-app usage, today and this week, plus a log that survives uninstalls." />
            <NavCard href="/limits" icon="✋" tint="peach" title="Limits and pauses" body="Daily limits, a pause before opening an app, and blocking during focus." />
          </>
        ) : (
          <Card tint="butter">
            <T v="h3">Screen time and limits are Android only</T>
            <T>
              iPhone does not let apps like this one read your usage or pause other apps without special approval from Apple.
              Use iPhone&apos;s built-in Screen Time instead. The Find your fix picker shows how.
            </T>
          </Card>
        )}
      </View>

      <View style={{ gap: space.md }}>
        <T v="h2">Learn</T>
        <NavCard href="/guides" icon="📘" tint="mint" title="Setup guides" body="Step-by-step help with screenshots, written by a student." />
        <NavCard href="/survey" icon="📊" tint="butter" title="Survey results" body="What 17 first-years told us, and what it changed." />
        <NavCard href="/about" icon="ℹ️" tint="lavender" title="About, method and sources" body="How tools were checked, accessibility, and the AI-assistance acknowledgement." />
        <NavCard href="/design-note" icon="🧩" tint="rose" title="Design note: tamper-resistant tracking" body="What the app records, what it can't stop, and why it is honest about gaps." />
      </View>
    </Screen>
  );
}
