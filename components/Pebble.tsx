/**
 * Pebble: STOIC's mascot, a calm little stone. Drawn by hand as inline SVG
 * (no third-party art). Always decorative: hidden from screen readers.
 */
type Mood = "calm" | "happy" | "sleepy" | "cheer";

export function Pebble({
  mood = "calm",
  size = 120,
  className = "",
  float = false,
}: {
  mood?: Mood;
  size?: number;
  className?: string;
  float?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size * 0.82}
      viewBox="0 0 120 98"
      className={`${float ? "float" : ""} ${className}`}
    >
      {/* shadow */}
      <ellipse cx="60" cy="92" rx="38" ry="5" fill="var(--line)" />
      {/* body */}
      <path
        d="M14 58c0-27 20-48 49-48 27 0 45 18 45 43 0 22-16 34-46 34C31 87 14 78 14 58z"
        fill="var(--lavender)"
        stroke="var(--ink)"
        strokeWidth="3"
      />
      {/* shine */}
      <path d="M36 28c6-6 14-9 22-9" stroke="var(--surface)" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* cheeks */}
      <ellipse cx="38" cy="60" rx="7" ry="4" fill="var(--rose)" />
      <ellipse cx="84" cy="60" rx="7" ry="4" fill="var(--rose)" />
      {/* eyes */}
      {mood === "sleepy" ? (
        <g stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M42 50q5 4 10 0" />
          <path d="M70 50q5 4 10 0" />
        </g>
      ) : mood === "happy" || mood === "cheer" ? (
        <g stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M42 51q5-6 10 0" />
          <path d="M70 51q5-6 10 0" />
        </g>
      ) : (
        <g fill="var(--ink)">
          <circle cx="47" cy="49" r="3.6" />
          <circle cx="75" cy="49" r="3.6" />
        </g>
      )}
      {/* mouth */}
      {mood === "cheer" ? (
        <path d="M53 61q8 9 16 0z" fill="var(--ink)" />
      ) : mood === "sleepy" ? (
        <circle cx="61" cy="63" r="2.5" fill="var(--ink)" />
      ) : (
        <path d="M54 61q7 6 14 0" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" fill="none" />
      )}
      {mood === "sleepy" && (
        <g fill="var(--muted)" fontFamily="system-ui" fontWeight="700">
          <text x="92" y="22" fontSize="12">z</text>
          <text x="101" y="12" fontSize="9">z</text>
        </g>
      )}
      {mood === "cheer" && (
        <g stroke="var(--brand)" strokeWidth="3" strokeLinecap="round">
          <path d="M18 18l5 5M10 34h7M28 8v7" />
          <path d="M102 18l-5 5M110 34h-7M92 8v7" />
        </g>
      )}
    </svg>
  );
}
