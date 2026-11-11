import { View } from "react-native";
import { DOCS } from "@shared/docs";
import { Pebble } from "@/components/Pebble";
import { NavCard, Screen, T } from "@/components/ui";
import { space, type Tint } from "@/theme";

const TINTS: Tint[] = ["mint", "peach", "lavender", "sky", "butter", "rose"];

export default function Docs() {
  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <T v="lead" style={{ flex: 1 }}>
          Short guides to every part of STOIC: what it does, how to set it up, and what to do if it doesn&apos;t work.
        </T>
        <Pebble mood="happy" size={72} />
      </View>
      <View style={{ gap: space.md }}>
        {DOCS.map((d, i) => (
          <NavCard
            key={d.slug}
            href={{ pathname: "/docs/[slug]", params: { slug: d.slug } }}
            icon={d.icon}
            tint={TINTS[i % TINTS.length]}
            title={d.title}
            body={`${d.summary} ${d.minutes} min read.`}
          />
        ))}
      </View>
    </Screen>
  );
}
