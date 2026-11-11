import { View } from "react-native";
import { Pebble } from "@/components/Pebble";
import { NavCard, Screen, T } from "@/components/ui";
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

      {isAndroid ? (
        <View style={{ gap: space.md }}>
          <T v="h2">My data</T>
          <NavCard href="/score" icon="🌟" tint="butter" title="My day score" body="One number for your day, from goals you set, explained in plain words." />
          <NavCard href="/screen-time" icon="📊" tint="sky" title="My screen time" body="Your real per-app usage, today and this week, plus a record that survives uninstalls." />
        </View>
      ) : null}

      <View style={{ gap: space.md }}>
        <T v="h2">Learn</T>
        <NavCard href="/docs" icon="📘" tint="mint" title="How-to guides" body="Set up and get the most out of every part of STOIC." />
        <NavCard href="/survey" icon="🗳️" tint="peach" title="Survey results" body="What 17 first-years told us, and how it shaped STOIC." />
        <NavCard href="/about" icon="ℹ️" tint="lavender" title="About STOIC" body="What it is, every permission and why, privacy, accessibility and credits." />
        <NavCard href="/design-note" icon="🧩" tint="rose" title="Design note: tamper-resistant tracking" body="What the app records, what it can't stop, and why it is honest about gaps." />
      </View>
    </Screen>
  );
}
