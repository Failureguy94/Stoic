import { Text, View } from "react-native";
import {
  COST_LABELS,
  EFFORT_LABELS,
  PERMISSION_LABELS,
  type Cost,
  type Effort,
  type PermissionLevel,
} from "@shared/tools";
import { font, radius, useTheme, type Theme } from "@/theme";

/* Every tag shows a word and a symbol, so meaning never depends on colour. */

function Tag({ bg, fg, symbol, label, a11y }: { bg: string; fg: string; symbol: string; label: string; a11y: string }) {
  return (
    <View
      accessible
      accessibilityLabel={a11y}
      style={{
        backgroundColor: bg,
        borderRadius: radius.pill,
        paddingHorizontal: 12,
        paddingVertical: 3,
        flexDirection: "row",
        gap: 6,
        alignItems: "center",
      }}
    >
      <Text style={{ fontFamily: font.xbold, fontSize: 13, color: fg }}>{symbol}</Text>
      <Text style={{ fontFamily: font.xbold, fontSize: 13, color: fg }}>{label}</Text>
    </View>
  );
}

export function CostTag({ cost }: { cost: Cost }) {
  const t = useTheme();
  const look: Record<Cost, [string, string, string]> = {
    free: [t.mint, t.goodInk, "✓"],
    freemium: [t.butter, t.warnInk, "◐"],
    paid: [t.rose, t.alertInk, "₹"],
  };
  const [bg, fg, symbol] = look[cost];
  return <Tag bg={bg} fg={fg} symbol={symbol} label={COST_LABELS[cost]} a11y={`Cost: ${COST_LABELS[cost]}`} />;
}

export function PermissionTag({ level }: { level: PermissionLevel }) {
  const t = useTheme();
  const look: Record<PermissionLevel, [string, string, string]> = {
    "built-in": [t.mint, t.goodInk, "⌂"],
    low: [t.mint, t.goodInk, "○"],
    high: [t.rose, t.alertInk, "●"],
    "not-confirmed": [t.line, t.ink, "?"],
  };
  const [bg, fg, symbol] = look[level];
  return <Tag bg={bg} fg={fg} symbol={symbol} label={PERMISSION_LABELS[level]} a11y={PERMISSION_LABELS[level]} />;
}

export function EffortTag({ effort }: { effort: Effort }) {
  const t = useTheme();
  const look: Record<Effort, [string, string, string]> = {
    automatic: [t.sky, t.infoInk, "↻"],
    "needs-you": [t.peach, t.warnInk, "▶"],
  };
  const [bg, fg, symbol] = look[effort];
  return <Tag bg={bg} fg={fg} symbol={symbol} label={EFFORT_LABELS[effort]} a11y={EFFORT_LABELS[effort]} />;
}

export function TagRow({ cost, level, effort }: { cost: Cost; level: PermissionLevel; effort: Effort }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      <CostTag cost={cost} />
      <PermissionTag level={level} />
      <EffortTag effort={effort} />
    </View>
  );
}

export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[m - 1]} ${y}`;
}

export type { Theme };
