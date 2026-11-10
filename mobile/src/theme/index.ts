import { useColorScheme } from "react-native";

/**
 * Colour tokens, ported from the website (app/globals.css) so the app and
 * site match. Every text/background pair meets WCAG AA; ratios are in
 * docs/accessibility-checklist.md at the repo root.
 */
export const light = {
  dark: false,
  bg: "#fffaf3",
  surface: "#ffffff",
  ink: "#2b2340",
  muted: "#5b5470",
  line: "#e7dfd3",
  field: "#7a7290",
  brand: "#5b3fd0",
  brandInk: "#ffffff",
  focus: "#d1366b",
  peach: "#ffe3d3",
  mint: "#d9f5e5",
  lavender: "#ece6ff",
  sky: "#dcefff",
  butter: "#fff1bf",
  rose: "#ffdfe6",
  goodInk: "#1b5e3a",
  warnInk: "#6b4400",
  alertInk: "#8a1c3c",
  infoInk: "#1f4a80",
};

export const dark: Theme = {
  dark: true,
  bg: "#1c1726",
  surface: "#262035",
  ink: "#f4effa",
  muted: "#cbc2de",
  line: "#3d3452",
  field: "#9a90b4",
  brand: "#b9a6ff",
  brandInk: "#1c1240",
  focus: "#ff8fb3",
  peach: "#4a2f2a",
  mint: "#1f3b2e",
  lavender: "#322a55",
  sky: "#1d3247",
  butter: "#3d3519",
  rose: "#4a2333",
  goodInk: "#a8efc5",
  warnInk: "#ffd98a",
  alertInk: "#ffb8cb",
  infoInk: "#b8d6ff",
};

export type Theme = typeof light;
export type Tint = "peach" | "mint" | "lavender" | "sky" | "butter" | "rose" | "surface";

export function useTheme(): Theme {
  return useColorScheme() === "dark" ? dark : light;
}

export const font = {
  display: "Fredoka_700Bold",
  displaySemi: "Fredoka_600SemiBold",
  body: "Nunito_400Regular",
  semi: "Nunito_600SemiBold",
  bold: "Nunito_700Bold",
  xbold: "Nunito_800ExtraBold",
} as const;

export const radius = { blob: 28, card: 20, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Minimum touch target (Android accessibility guidance: 48dp). */
export const TOUCH = 48;
