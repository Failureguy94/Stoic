import { router, type Href } from "expo-router";
import { Image, Linking, Text, View } from "react-native";
import { T } from "@/components/ui";
import { SITE_URL } from "@/lib/site";
import { font, radius, space, useTheme, type Theme } from "@/theme";

/* Renders the JSON made by scripts/build-docs.mjs from content/docs/*.mdx. */

export type Inline =
  | { t: "text"; v: string }
  | { t: "strong"; c: Inline[] }
  | { t: "em"; c: Inline[] }
  | { t: "code"; v: string }
  | { t: "link"; href: string; c: Inline[] }
  | { t: "todo"; c: Inline[] };

export type Block =
  | { type: "heading"; depth: number; inline: Inline[] }
  | { type: "paragraph"; inline: Inline[] }
  | { type: "list"; ordered: boolean; items: Block[][] }
  | { type: "screenshot"; alt: string; src?: string; caption?: string; width?: number; height?: number }
  | { type: "didntWork"; children: Block[] }
  | { type: "note"; children: Block[] };

function openLink(href: string) {
  if (href.startsWith("/")) router.push(href as Href);
  else Linking.openURL(href);
}

function plain(nodes: Inline[]): string {
  return nodes.map((n) => ("v" in n ? n.v : plain(n.c))).join("");
}

function Run({ nodes, t }: { nodes: Inline[]; t: Theme }) {
  return (
    <>
      {nodes.map((n, i) => {
        switch (n.t) {
          case "text":
            return n.v;
          case "strong":
            return (
              <Text key={i} style={{ fontFamily: font.xbold }}>
                <Run nodes={n.c} t={t} />
              </Text>
            );
          case "em":
            return (
              <Text key={i} style={{ fontStyle: "italic" }}>
                <Run nodes={n.c} t={t} />
              </Text>
            );
          case "code":
            return (
              <Text key={i} style={{ backgroundColor: t.lavender, fontFamily: font.semi }}>
                {` ${n.v} `}
              </Text>
            );
          case "link":
            return (
              <Text
                key={i}
                accessibilityRole="link"
                onPress={() => openLink(n.href)}
                style={{ color: t.brand, fontFamily: font.xbold, textDecorationLine: "underline" }}
              >
                <Run nodes={n.c} t={t} />
              </Text>
            );
          case "todo":
            // Unfinished content is impossible to miss: dashed highlight plus the bracketed words.
            return (
              <Text key={i} style={{ backgroundColor: t.butter, color: t.warnInk, fontFamily: font.xbold }}>
                {` ${plain(n.c)} `}
              </Text>
            );
        }
      })}
    </>
  );
}

export function GuideContent({ blocks }: { blocks: Block[] }) {
  const t = useTheme();
  return (
    <View style={{ gap: space.md }}>
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} t={t} />
      ))}
    </View>
  );
}

function BlockView({ block, t }: { block: Block; t: Theme }) {
  switch (block.type) {
    case "heading":
      return (
        <T v={block.depth <= 2 ? "h2" : "h3"} style={{ marginTop: space.md }}>
          <Run nodes={block.inline} t={t} />
        </T>
      );
    case "paragraph":
      return (
        <T>
          <Run nodes={block.inline} t={t} />
        </T>
      );
    case "list":
      return (
        <View style={{ gap: space.sm }}>
          {block.items.map((item, i) => (
            <View key={i} style={{ flexDirection: "row", gap: space.sm }}>
              <T v="label" color={t.brand} style={{ minWidth: 22 }} importantForAccessibility="no">
                {block.ordered ? `${i + 1}.` : "•"}
              </T>
              <View
                style={{ flex: 1, gap: space.sm }}
                accessibilityLabel={block.ordered ? `Step ${i + 1}` : undefined}
              >
                {item.map((child, j) => (
                  <BlockView key={j} block={child} t={t} />
                ))}
              </View>
            </View>
          ))}
        </View>
      );
    case "screenshot":
      return <Screenshot shot={block} t={t} />;
    case "didntWork":
      return (
        <View style={{ backgroundColor: t.peach, borderRadius: radius.blob, padding: space.lg, gap: space.md, marginTop: space.md }}>
          <T v="h2">🤔 If it didn&apos;t work</T>
          {block.children.map((child, i) => (
            <BlockView key={i} block={child} t={t} />
          ))}
        </View>
      );
    case "note":
      return (
        <View style={{ backgroundColor: t.sky, borderRadius: radius.card, padding: space.lg, gap: space.sm }}>
          {block.children.map((child, i) => (
            <BlockView key={i} block={child} t={t} />
          ))}
        </View>
      );
  }
}

function Screenshot({ shot, t }: { shot: Extract<Block, { type: "screenshot" }>; t: Theme }) {
  if (!shot.src) {
    return (
      <View
        accessible
        accessibilityLabel={`Screenshot to be added. Planned description: ${shot.alt}`}
        style={{ borderWidth: 2, borderStyle: "dashed", borderColor: t.warnInk, backgroundColor: t.butter, borderRadius: radius.card, padding: space.lg, gap: 4 }}
      >
        <T v="label" color={t.warnInk}>
          🖼️ [ADD SCREENSHOT]
        </T>
        <T v="small" color={t.warnInk}>
          <Text style={{ fontFamily: font.xbold }}>Planned alt text: </Text>
          {shot.alt}
        </T>
        {shot.caption ? (
          <T v="small" color={t.warnInk}>
            {shot.caption}
          </T>
        ) : null}
      </View>
    );
  }
  const uri = shot.src.startsWith("http") ? shot.src : `${SITE_URL}${shot.src}`;
  const ratio = shot.width && shot.height ? shot.width / shot.height : 540 / 1170;
  return (
    <View style={{ gap: 6 }}>
      <Image
        source={{ uri }}
        accessible
        accessibilityLabel={shot.alt}
        resizeMode="contain"
        style={{ width: "100%", maxWidth: 360, aspectRatio: ratio, borderRadius: radius.card, borderWidth: 2, borderColor: t.line, backgroundColor: t.surface }}
      />
      {shot.caption ? (
        <T v="small" muted>
          {shot.caption}
        </T>
      ) : null}
    </View>
  );
}
