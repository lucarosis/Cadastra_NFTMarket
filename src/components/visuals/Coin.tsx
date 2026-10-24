/* ============================================================
   Coins and tokens — the platform's visual vocabulary.
   Pure SVG, no client JS. Motion lives in site.css
   (.spin, .float-*) and respects reduced-motion.
   ============================================================ */

export type CoinTone = "lime" | "iri" | "gold" | "violet" | "cyan" | "pink";
export type CoinGlyph = "ledger" | "gem" | "hex" | "spark" | "play" | "home" | "face" | "brush";

const TONES: Record<CoinTone, [string, string, string]> = {
  lime: ["#f2ffb0", "#d4ff3a", "#6f8f00"],
  iri: ["#9ff3ff", "#8b5cf6", "#ff5cc8"],
  gold: ["#fff1b8", "#ffcf5a", "#a8680a"],
  violet: ["#d9c8ff", "#8b5cf6", "#3b1d8f"],
  cyan: ["#d2f9ff", "#38e1ff", "#0a6d8a"],
  pink: ["#ffd3f0", "#ff5cc8", "#8f1466"],
};

function Glyph({ kind }: { kind: CoinGlyph }) {
  switch (kind) {
    case "ledger":
      return (
        <g>
          <path d="M50 28 L68 38 L50 48 L32 38 Z" />
          <path d="M32 46 L50 56 L68 46 L68 51 L50 61 L32 51 Z" opacity=".7" />
          <path d="M32 57 L50 67 L68 57 L68 62 L50 72 L32 62 Z" opacity=".45" />
        </g>
      );
    case "gem":
      return (
        <g>
          <path d="M50 24 L67 51 L50 61 L33 51 Z" />
          <path d="M50 65 L67 55 L50 78 L33 55 Z" opacity=".6" />
        </g>
      );
    case "hex":
      return <path d="M50 26 L71 38 L71 62 L50 74 L29 62 L29 38 Z M50 38 L40 44 L40 56 L50 62 L60 56 L60 44 Z" fillRule="evenodd" />;
    case "spark":
      return <path d="M50 24 C53 42 58 47 76 50 C58 53 53 58 50 76 C47 58 42 53 24 50 C42 47 47 42 50 24 Z" />;
    case "play":
      return <path d="M40 30 L72 50 L40 70 Z" />;
    case "home":
      return <path d="M50 27 L73 46 L67 46 L67 72 L55 72 L55 58 L45 58 L45 72 L33 72 L33 46 L27 46 Z" />;
    case "face":
      return <path d="M50 26 A15 15 0 1 1 49.9 26 Z M26 76 C28 62 38 56 50 56 C62 56 72 62 74 76 Z" />;
    case "brush":
      return <path d="M68 24 L76 32 L50 58 L42 50 Z M40 53 L47 60 C45 70 36 76 26 75 C31 70 30 58 40 53 Z" />;
  }
}

export function Coin({
  size = 120,
  tone = "lime",
  glyph = "ledger",
  uid,
  className,
  style,
}: {
  size?: number;
  tone?: CoinTone;
  glyph?: CoinGlyph;
  uid?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [hi, mid, lo] = TONES[tone];
  const id = uid ?? `${tone}-${glyph}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`cf-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={hi} />
          <stop offset=".5" stopColor={mid} />
          <stop offset="1" stopColor={lo} />
        </linearGradient>
        <linearGradient id={`cr-${id}`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hi} stopOpacity=".95" />
          <stop offset="1" stopColor={lo} />
        </linearGradient>
        <radialGradient id={`cs-${id}`} cx=".32" cy=".26" r=".55">
          <stop offset="0" stopColor="#fff" stopOpacity=".7" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* edge thickness */}
      <circle cx="50" cy="53" r="46" fill={lo} />
      <circle cx="50" cy="50" r="46" fill={`url(#cf-${id})`} />
      <circle cx="50" cy="50" r="38" fill="none" stroke={`url(#cr-${id})`} strokeWidth="3" />
      <circle cx="50" cy="50" r="41.5" fill="none" stroke="#0b0b10" strokeOpacity=".18" strokeDasharray="1.2 2.4" />
      <g fill="#0b0b10" fillOpacity=".82">
        <Glyph kind={glyph} />
      </g>
      <circle cx="50" cy="50" r="46" fill={`url(#cs-${id})`} />
    </svg>
  );
}

/* A faceted token — the "NFT" counterpart to the round coin. */
export function Token({
  size = 110,
  tone = "iri",
  uid,
  className,
  style,
}: {
  size?: number;
  tone?: CoinTone;
  uid?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [hi, mid, lo] = TONES[tone];
  const id = uid ?? `tk-${tone}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={`tf-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={hi} />
          <stop offset=".55" stopColor={mid} />
          <stop offset="1" stopColor={lo} />
        </linearGradient>
      </defs>
      <path d="M50 4 L90 27 L90 73 L50 96 L10 73 L10 27 Z" fill={`url(#tf-${id})`} />
      <path d="M50 4 L90 27 L50 50 L10 27 Z" fill="#fff" fillOpacity=".28" />
      <path d="M50 50 L90 27 L90 73 L50 96 Z" fill="#000" fillOpacity=".22" />
      <path d="M50 22 L70 34 L70 58 L50 70 L30 58 L30 34 Z" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.5" />
      <text x="50" y="52" textAnchor="middle" fontSize="11" fontWeight="600" fill="#0b0b10" fillOpacity=".8" letterSpacing="1">
        NFT
      </text>
    </svg>
  );
}
