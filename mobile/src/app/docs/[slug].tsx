import { router, Stack, useLocalSearchParams, type Href } from "expo-router";
import { DOCS } from "@shared/docs";
import { GuideContent, type Block } from "@/components/GuideContent";
import { AppLink, Button, Screen, T } from "@/components/ui";
import docs from "@/generated/docs.json";

export default function Doc() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const doc = DOCS.find((d) => d.slug === slug);
  const blocks = (docs as unknown as Record<string, Block[]>)[slug ?? ""];

  if (!doc || !blocks) {
    return (
      <Screen>
        <T v="h1">Guide not found</T>
        <AppLink href="/docs">Back to all guides</AppLink>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: doc.title }} />
      <T v="lead">{doc.summary}</T>
      {doc.screen ? <Button kind="outline" label={doc.screen.label} onPress={() => router.push(doc.screen!.href as Href)} /> : null}
      <GuideContent blocks={blocks} />
      <AppLink href="/docs">All guides</AppLink>
    </Screen>
  );
}
