import { View } from "react-native";
import { GUIDE_META } from "@shared/guides";
import { Pebble } from "@/components/Pebble";
import { NavCard, Screen, T } from "@/components/ui";
import { space, type Tint } from "@/theme";

const TINTS: Tint[] = ["mint", "peach", "sky"];
const ICONS = ["📱", "🔕", "📺"];

export default function Guides() {
  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <T v="lead" style={{ flex: 1 }}>
          11 of the 17 students we asked wanted step-by-step guides. Each one is written by a student, tested on a real device,
          and follows the same pattern: who it&apos;s for, how long it takes, numbered steps with screenshots, and what to do
          if it didn&apos;t work.
        </T>
        <Pebble mood="happy" size={72} />
      </View>
      <View style={{ gap: space.md }}>
        {GUIDE_META.map((g, i) => (
          <NavCard
            key={g.slug}
            href={{ pathname: "/guides/[slug]", params: { slug: g.slug } }}
            icon={ICONS[i % 3]}
            tint={TINTS[i % 3]}
            title={g.title}
            body={`${g.summary} Device: ${g.devices}.`}
          />
        ))}
      </View>
    </Screen>
  );
}
