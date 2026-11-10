import { Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { GUIDE_META } from "@shared/guides";
import { getTool } from "@shared/tools";
import { GuideContent, type Block } from "@/components/GuideContent";
import { TagRow, formatDate } from "@/components/Tags";
import { AppLink, Card, Screen, T } from "@/components/ui";
import guides from "@/generated/guides.json";
import { space, type Tint } from "@/theme";

export default function Guide() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const guide = GUIDE_META.find((g) => g.slug === slug);
  const blocks = (guides as unknown as Record<string, Block[]>)[slug ?? ""];

  if (!guide || !blocks) {
    return (
      <Screen>
        <T v="h1">Guide not found</T>
        <AppLink href="/guides">Back to all guides</AppLink>
      </Screen>
    );
  }

  const facts: { icon: string; term: string; value: string; tint: Tint }[] = [
    { icon: "🙋", term: "Who it's for", value: guide.whoFor, tint: "mint" },
    { icon: "⏱️", term: "Time needed", value: guide.timeNeeded, tint: "butter" },
    { icon: "📱", term: "Device", value: guide.devices, tint: "sky" },
    {
      icon: "✍️",
      term: "Written and tested by",
      value: guide.lastTested ? `${guide.author}, tested ${formatDate(guide.lastTested)}` : `${guide.author} (not tested yet)`,
      tint: "peach",
    },
  ];

  return (
    <Screen>
      <Stack.Screen options={{ title: "Guide" }} />
      <T v="h1">{guide.title}</T>
      <View style={{ gap: space.sm }}>
        {facts.map((f) => (
          <Card key={f.term} tint={f.tint} style={{ gap: 2, padding: space.lg }}>
            <T v="label">
              {f.icon} {f.term}
            </T>
            <T>{f.value}</T>
          </Card>
        ))}
      </View>

      <GuideContent blocks={blocks} />

      <View style={{ gap: space.md }}>
        <T v="h2">Tools in this guide</T>
        {guide.toolIds.map((id) => {
          const tool = getTool(id);
          return (
            <Card key={id} style={{ padding: space.lg }}>
              <T v="h3">{tool.name}</T>
              <TagRow cost={tool.cost} level={tool.permissionLevel} effort={tool.effort} />
            </Card>
          );
        })}
        <AppLink href="/tools">Compare these with other tools</AppLink>
      </View>
    </Screen>
  );
}
