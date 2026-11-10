import { View } from "react-native";
import { Pebble } from "@/components/Pebble";
import { AppLink, Card, Screen, T } from "@/components/ui";
import { space } from "@/theme";

/** Shown on iPhone (and anywhere the native module is missing) instead of an Android-only screen. */
export function AndroidOnly() {
  return (
    <Screen>
      <Card tint="butter">
        <View style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
          <Pebble mood="calm" size={64} />
          <T v="h2" style={{ flex: 1 }}>
            This part is Android only
          </T>
        </View>
        <T>
          iPhone does not let apps like this one read your screen time or pause other apps without special approval from Apple.
          On iPhone, use the built-in Screen Time. The Find your fix picker shows where to start.
        </T>
        <AppLink href="/">Open Find your fix</AppLink>
      </Card>
    </Screen>
  );
}
