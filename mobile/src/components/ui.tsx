import { Link, router, type Href } from "expo-router";
import { createContext, useRef, type ComponentRef, type ReactNode, type RefObject } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TOUCH, font, radius, space, useTheme, type Tint } from "@/theme";

/* ----------------------------- layout ----------------------------- */

/** The page's scroll view and its content, so the tour can scroll a highlighted control into view. */
export type ScrollRefs = { scroll: RefObject<ComponentRef<typeof ScrollView> | null>; content: RefObject<ComponentRef<typeof View> | null> };
export const ScreenScroll = createContext<ScrollRefs | null>(null);

/** Scrolling page with the app background. `tab` adds top safe-area padding (tab screens have no header). */
export function Screen({ children, tab = false }: { children: ReactNode; tab?: boolean }) {
  const t = useTheme();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const content = useRef<ComponentRef<typeof View>>(null);
  const body = (
    <ScreenScroll value={{ scroll, content }}>
      <ScrollView
        ref={scroll}
        style={{ backgroundColor: t.bg }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl * 1.5 }}
        keyboardShouldPersistTaps="handled"
      >
        <View ref={content} collapsable={false} style={{ gap: space.xl }}>
          {children}
        </View>
      </ScrollView>
    </ScreenScroll>
  );
  if (!tab) return body;
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: t.bg }}>
      {body}
    </SafeAreaView>
  );
}

export function Card({
  children,
  tint = "surface",
  outline = false,
  style,
}: {
  children: ReactNode;
  tint?: Tint;
  outline?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t[tint],
          borderRadius: radius.blob,
          padding: space.lg + 2,
          gap: space.sm,
          borderWidth: outline || tint === "surface" ? 2 : 0,
          borderColor: t.line,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, alignItems: "center" }, style]}>{children}</View>;
}

/* ------------------------------ text ------------------------------ */

type Variant = "h1" | "h2" | "h3" | "body" | "lead" | "small" | "label";

const variants: Record<Variant, TextStyle> = {
  h1: { fontFamily: font.display, fontSize: 30, lineHeight: 36 },
  h2: { fontFamily: font.display, fontSize: 23, lineHeight: 29 },
  h3: { fontFamily: font.displaySemi, fontSize: 19, lineHeight: 25 },
  lead: { fontFamily: font.body, fontSize: 18, lineHeight: 27 },
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 25 },
  small: { fontFamily: font.body, fontSize: 14, lineHeight: 21 },
  label: { fontFamily: font.xbold, fontSize: 15, lineHeight: 21 },
};

export function T({
  v = "body",
  muted = false,
  color,
  style,
  children,
  ...rest
}: TextProps & { v?: Variant; muted?: boolean; color?: string }) {
  const t = useTheme();
  const isHeading = v === "h1" || v === "h2" || v === "h3";
  return (
    <Text
      accessibilityRole={isHeading ? "header" : undefined}
      {...rest}
      style={[variants[v], { color: color ?? (muted ? t.muted : t.ink) }, style]}
    >
      {children}
    </Text>
  );
}

/** Bold run inside a paragraph. */
export function B({ children }: { children: ReactNode }) {
  return <Text style={{ fontFamily: font.xbold }}>{children}</Text>;
}

/* ---------------------------- controls ---------------------------- */

export function Button({
  label,
  onPress,
  kind = "primary",
  accessibilityHint,
  disabled,
}: {
  label: string;
  onPress: () => void;
  kind?: "primary" | "outline" | "quiet";
  accessibilityHint?: string;
  disabled?: boolean;
}) {
  const t = useTheme();
  const bg = kind === "primary" ? t.brand : "transparent";
  const fg = kind === "primary" ? t.brandInk : kind === "quiet" ? t.brand : t.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor: kind === "outline" ? t.field : "transparent",
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          paddingHorizontal: kind === "quiet" ? space.sm : space.xl,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: kind === "quiet" ? font.xbold : font.display,
          fontSize: kind === "quiet" ? 15 : 17,
          color: fg,
          textDecorationLine: kind === "quiet" ? "underline" : "none",
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** A selectable pill. `role` is "radio" inside a single-choice group, "checkbox" for a toggle. */
export function Chip({
  label,
  hint,
  icon,
  selected,
  onPress,
  role = "radio",
  accessibilityLabel,
}: {
  label: string;
  hint?: string;
  icon?: string;
  selected: boolean;
  onPress: () => void;
  /** "button" for chips that act (e.g. remove an app) rather than select. */
  role?: "radio" | "checkbox" | "button";
  /** Spoken label when the visible one is abbreviated (e.g. "M" for Monday). */
  accessibilityLabel?: string;
}) {
  const t = useTheme();
  const fg = selected ? t.brandInk : t.ink;
  const spoken = accessibilityLabel ?? label;
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={role === "button" ? undefined : { checked: selected }}
      accessibilityLabel={hint ? `${spoken}, ${hint}` : spoken}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? t.brand : t.surface,
          borderColor: selected ? t.brand : t.line,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {icon ? (
        <Text style={{ fontSize: 18 }} importantForAccessibility="no" accessibilityElementsHidden>
          {icon}
        </Text>
      ) : null}
      <View style={{ flexShrink: 1 }}>
        <Text style={{ fontFamily: font.xbold, fontSize: 15, color: fg }}>
          {selected ? "✓ " : ""}
          {label}
        </Text>
        {hint ? <Text style={{ fontFamily: font.body, fontSize: 12, color: selected ? fg : t.muted }}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

/** Group wrapper so screen readers announce a set of chips as one radio group. */
export function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
      {children}
    </View>
  );
}

/** External link. Always underlined (not colour alone) and announced as a link. */
export function ExternalLink({ href, children }: { href: string; children: string }) {
  const t = useTheme();
  return (
    <Text
      accessibilityRole="link"
      accessibilityHint="Opens in your browser"
      onPress={() => Linking.openURL(href)}
      style={[styles.link, { color: t.brand }]}
    >
      {children}
    </Text>
  );
}

/** In-app link styled as text. */
export function AppLink({ href, children }: { href: Href; children: string }) {
  const t = useTheme();
  return (
    <Link href={href} accessibilityRole="link" style={[styles.link, { color: t.brand }]}>
      {children}
    </Link>
  );
}

/** A full-width row that navigates somewhere, or does something (`onPress`). */
export function NavCard({
  href,
  onPress,
  title,
  body,
  icon,
  tint,
}: {
  href?: Href;
  onPress?: () => void;
  title: string;
  body: string;
  icon: string;
  tint: Tint;
}) {
  const t = useTheme();
  return (
    // Not <Link asChild>: Link's slot drops Pressable's function style (that lost the row layout).
    <Pressable
      onPress={() => (onPress ? onPress() : href && router.push(href))}
      accessibilityRole={onPress ? "button" : "link"}
      accessibilityLabel={`${title}. ${body}`}
      style={({ pressed }) => ({
        backgroundColor: t[tint],
        borderRadius: radius.blob,
        padding: space.lg + 2,
        flexDirection: "row",
        gap: space.md,
        alignItems: "center",
        opacity: pressed ? 0.85 : 1,
        minHeight: TOUCH,
      })}
    >
      <Text style={{ fontSize: 28 }} importantForAccessibility="no">
        {icon}
      </Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: font.display, fontSize: 18, color: t.ink, textDecorationLine: "underline" }}>{title}</Text>
        <Text style={{ fontFamily: font.body, fontSize: 15, lineHeight: 22, color: t.ink }}>{body}</Text>
      </View>
      <Text style={{ fontFamily: font.display, fontSize: 22, color: t.ink }} importantForAccessibility="no">
        ›
      </Text>
    </Pressable>
  );
}

/** Bulleted list with real bullets that screen readers skip. */
export function Bullets({ items, v = "body" }: { items: ReactNode[]; v?: Variant }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: "row", gap: space.sm }}>
          <Text style={[variants[v], { color: t.brand, fontFamily: font.xbold }]} importantForAccessibility="no">
            •
          </Text>
          <T v={v} style={{ flex: 1 }}>
            {item}
          </T>
        </View>
      ))}
    </View>
  );
}

/** A labelled on/off switch row. */
export function SwitchRow({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (on: boolean) => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 48 }}>
      <View style={{ flex: 1 }}>
        <T v="label">{label}</T>
        {hint ? (
          <T v="small" muted>
            {hint}
          </T>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityHint={hint}
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ true: t.brand, false: t.field }}
        thumbColor={t.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: TOUCH,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: space.sm,
    alignSelf: "flex-start",
  },
  chip: {
    minHeight: TOUCH,
    borderRadius: radius.pill,
    borderWidth: 2,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    maxWidth: "100%",
  },
  link: {
    fontFamily: font.xbold,
    fontSize: 15,
    lineHeight: 24,
    textDecorationLine: "underline",
  },
});
