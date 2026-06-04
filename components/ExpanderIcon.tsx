interface ExpanderIconProps {
  size?: number;
  className?: string;
  showSparkle?: boolean;
}

/**
 * Minimal flat illustration of a palatal expander.
 *
 * Shape (top-down view):
 *   ┌────────┐          ← central expansion screw
 *   │   ●    │
 *   └──┬──┬──┘
 *     /    \            ← curved support arms
 *    /      \
 * [band]  [band]        ← molar attachment bands
 *
 * Draw order: arms first so the screw body covers the connection seam cleanly.
 */
export default function ExpanderIcon({
  size = 40,
  className = "",
  showSparkle = false,
}: ExpanderIconProps) {
  // viewBox is 68 wide × 56 tall
  const height = Math.round(size * (56 / 68));

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 68 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ── Arms ────────────────────────────────────────────────────────── */}
      {/* Start inside the screw body so the screw rect covers the seam    */}

      {/* Left arm */}
      <path
        d="M30,22 C16,24 4,30 9,42"
        stroke="#C4B5FD"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Right arm */}
      <path
        d="M38,22 C52,24 64,30 59,42"
        stroke="#C4B5FD"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* ── Molar bands ─────────────────────────────────────────────────── */}
      {/* Left band */}
      <rect
        x="2" y="40" width="14" height="12"
        rx="4"
        fill="#DDD6FE"
        stroke="#8B5CF6"
        strokeWidth="2"
      />
      {/* Right band */}
      <rect
        x="52" y="40" width="14" height="12"
        rx="4"
        fill="#DDD6FE"
        stroke="#8B5CF6"
        strokeWidth="2"
      />

      {/* ── Central expansion screw body ────────────────────────────────── */}
      {/* Drawn on top so it cleanly covers the arm start points            */}
      <rect
        x="24" y="6" width="20" height="18"
        rx="5"
        fill="#EDE9FE"
        stroke="#8B5CF6"
        strokeWidth="2"
      />

      {/* Subtle horizontal split line — suggests the two halves that separate */}
      <line
        x1="24" y1="15"
        x2="44" y2="15"
        stroke="#C4B5FD"
        strokeWidth="1.5"
        opacity="0.7"
      />

      {/* Key hole — the small circle you insert the turning key into */}
      <circle
        cx="34" cy="15" r="3"
        fill="#A78BFA"
        opacity="0.9"
      />

      {/* ── Optional sparkle ────────────────────────────────────────────── */}
      {showSparkle && (
        <g>
          {/* 8-point star made from two overlapping lines + two diagonals */}
          <line x1="60" y1="3"  x2="60" y2="11" stroke="#A78BFA" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="56" y1="7"  x2="64" y2="7"  stroke="#A78BFA" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="57.5" y1="4.5" x2="62.5" y2="9.5" stroke="#C4B5FD" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
          <line x1="62.5" y1="4.5" x2="57.5" y2="9.5" stroke="#C4B5FD" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
        </g>
      )}
    </svg>
  );
}
