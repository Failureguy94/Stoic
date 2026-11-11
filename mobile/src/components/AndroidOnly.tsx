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
          On iPhone, Apple only lets approved apps read screen time or pause other apps. Until STOIC has that approval, this
          part works on Android phones only. Focus with Pebble and the Circle work everywhere.
        </T>
        <AppLink href="/focus">Open Focus with Pebble</AppLink>
      </Card>
    </Screen>
  );
}
