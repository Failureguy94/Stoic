import {
  COST_LABELS,
  EFFORT_LABELS,
  PERMISSION_LABELS,
  type Cost,
  type Effort,
  type PermissionLevel,
} from "@/data/tools";

/* Every tag shows a word and a symbol, so meaning never depends on colour. */

const pill =
  "inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm font-extrabold leading-6 whitespace-nowrap";

export function CostTag({ cost }: { cost: Cost }) {
  const look = {
    free: ["bg-mint text-good-ink", "✓"],
    freemium: ["bg-butter text-warn-ink", "◐"],
    paid: ["bg-rose text-alert-ink", "₹"],
  }[cost];
  return (
    <span className={`${pill} ${look[0]}`}>
      <span aria-hidden="true">{look[1]}</span>
      <span>
        <span className="sr-only">Cost: </span>
        {COST_LABELS[cost]}
      </span>
    </span>
  );
}

export function PermissionTag({ level }: { level: PermissionLevel }) {
  const look = {
    "built-in": ["bg-mint text-good-ink", "⌂"],
    low: ["bg-mint text-good-ink", "○"],
    high: ["bg-rose text-alert-ink", "●"],
    "not-confirmed": ["bg-surface text-muted ring-2 ring-inset ring-line", "?"],
  }[level];
  return (
    <span className={`${pill} ${look[0]}`}>
      <span aria-hidden="true">{look[1]}</span>
      <span>{PERMISSION_LABELS[level]}</span>
    </span>
  );
}

export function EffortTag({ effort }: { effort: Effort }) {
  const look = {
    automatic: ["bg-sky text-info-ink", "↻"],
    "needs-you": ["bg-peach text-warn-ink", "▶"],
  }[effort];
  return (
    <span className={`${pill} ${look[0]}`}>
      <span aria-hidden="true">{look[1]}</span>
      <span>{EFFORT_LABELS[effort]}</span>
    </span>
  );
}

export function TagRow({ cost, level, effort }: { cost: Cost; level: PermissionLevel; effort: Effort }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Quick facts">
      <li>
        <CostTag cost={cost} />
      </li>
      <li>
        <PermissionTag level={level} />
      </li>
      <li>
        <EffortTag effort={effort} />
      </li>
    </ul>
  );
}

/** Fixed format so server and client output match. */
export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[m - 1]} ${y}`;
}
