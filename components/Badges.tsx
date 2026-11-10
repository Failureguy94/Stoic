import {
  COST_LABELS,
  EFFORT_LABELS,
  PERMISSION_LABELS,
  type Cost,
  type Effort,
  type PermissionLevel,
} from "@/data/tools";

/*
 * Badges always carry a text label and a symbol, so meaning is never
 * conveyed by colour alone.
 */

const base =
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-bold leading-6 whitespace-nowrap";

export function CostBadge({ cost }: { cost: Cost }) {
  const styles: Record<Cost, string> = {
    free: "bg-free-bg text-free-fg border-free-fg/40",
    freemium: "bg-freemium-bg text-freemium-fg border-freemium-fg/40",
    paid: "bg-paid-bg text-paid-fg border-paid-fg/40",
  };
  const symbol: Record<Cost, string> = { free: "✓", freemium: "◐", paid: "₹" };
  return (
    <span className={`${base} ${styles[cost]}`}>
      <span aria-hidden="true">{symbol[cost]}</span>
      <span>
        <span className="sr-only">Cost: </span>
        {COST_LABELS[cost]}
      </span>
    </span>
  );
}

export function PermissionBadge({ level }: { level: PermissionLevel }) {
  const styles: Record<PermissionLevel, string> = {
    "built-in": "bg-free-bg text-free-fg border-free-fg/40",
    low: "bg-free-bg text-free-fg border-free-fg/40",
    high: "bg-paid-bg text-paid-fg border-paid-fg/40",
    "not-confirmed": "bg-surface text-muted border-field",
  };
  const symbol: Record<PermissionLevel, string> = {
    "built-in": "⌂",
    low: "○",
    high: "●",
    "not-confirmed": "?",
  };
  return (
    <span className={`${base} ${styles[level]}`}>
      <span aria-hidden="true">{symbol[level]}</span>
      <span>{PERMISSION_LABELS[level]}</span>
    </span>
  );
}

export function EffortBadge({ effort }: { effort: Effort }) {
  const styles: Record<Effort, string> = {
    automatic: "bg-info-bg text-info-fg border-info-fg/40",
    "needs-you": "bg-freemium-bg text-freemium-fg border-freemium-fg/40",
  };
  const symbol: Record<Effort, string> = { automatic: "↻", "needs-you": "▶" };
  return (
    <span className={`${base} ${styles[effort]}`}>
      <span aria-hidden="true">{symbol[effort]}</span>
      <span>{EFFORT_LABELS[effort]}</span>
    </span>
  );
}

export function BadgeRow({
  cost,
  level,
  effort,
}: {
  cost: Cost;
  level: PermissionLevel;
  effort: Effort;
}) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Quick facts">
      <li>
        <CostBadge cost={cost} />
      </li>
      <li>
        <PermissionBadge level={level} />
      </li>
      <li>
        <EffortBadge effort={effort} />
      </li>
    </ul>
  );
}

export function formatDate(iso: string) {
  // Fixed format so server and client render identically.
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[m - 1]} ${y}`;
}
