import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { View } from "react-native";
import { Pebble } from "@/components/Pebble";
import { useTour } from "@/components/Tour";
import { NavCard, Screen, T } from "@/components/ui";
import { isAndroid } from "@/lib/device";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { space } from "@/theme";

export default function More() {
  const tour = useTour();
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
        {isAndroid ? (
          <>
            <NavCard href="/score" icon="🌟" tint="butter" title="My day score" body="Your day out of 100, and your goals." />
            <NavCard href="/screen-time" icon="📊" tint="sky" title="My screen time" body="Per app, today and this week." />
          </>
        ) : null}
        <NavCard onPress={() => tour?.start()} icon="🧭" tint="mint" title="Take the tour again" body="A one-minute look at every feature." />
        <NavCard href="/about" icon="ℹ️" tint="lavender" title="About and privacy" body="Every permission, and what it's for." />
      </View>

      <T v="small" muted style={{ textAlign: "center" }}>
        {versionText()}
      </T>
    </Screen>
  );
}

/** "Version 1.0.0 · updated 12 Nov, 2:30 pm", so it's easy to tell whether an update arrived. */
function versionText() {
  const version = `Version ${Constants.expoConfig?.version ?? "?"}`;
  if (Updates.isEmbeddedLaunch || !Updates.createdAt) return version;
  const when = Updates.createdAt.toLocaleString([], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  return `${version} · updated ${when}`;
}
