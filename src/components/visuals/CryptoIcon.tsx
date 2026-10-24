/* ============================================================
   Cryptocurrency icons.

   Simple marks drawn here in each currency's colour, so the
   market reads as crypto at a glance: no image files, no network,
   no hooks (they render on the server and in client components).
   They identify the currencies; they are not the projects' official
   logo files.
   ============================================================ */

export type CoinId =
  | "btc" | "eth" | "xtz" | "sol" | "usdt" | "usdc" | "bnb"
  | "xrp" | "ada" | "doge" | "avax" | "dot" | "ltc" | "pol";

export const COINS: Record<CoinId, { name: string; symbol: string; gecko: string; color: string }> = {
  btc: { name: "Bitcoin", symbol: "BTC", gecko: "bitcoin", color: "#F7931A" },
  eth: { name: "Ethereum", symbol: "ETH", gecko: "ethereum", color: "#627EEA" },
  xtz: { name: "Tezos", symbol: "XTZ", gecko: "tezos", color: "#2C7DF7" },
  sol: { name: "Solana", symbol: "SOL", gecko: "solana", color: "#0B0B12" },
  usdt: { name: "Tether", symbol: "USDT", gecko: "tether", color: "#26A17B" },
  usdc: { name: "USD Coin", symbol: "USDC", gecko: "usd-coin", color: "#2775CA" },
  bnb: { name: "BNB", symbol: "BNB", gecko: "binancecoin", color: "#F3BA2F" },
  xrp: { name: "XRP", symbol: "XRP", gecko: "ripple", color: "#23292F" },
  ada: { name: "Cardano", symbol: "ADA", gecko: "cardano", color: "#0033AD" },
  doge: { name: "Dogecoin", symbol: "DOGE", gecko: "dogecoin", color: "#C2A633" },
  avax: { name: "Avalanche", symbol: "AVAX", gecko: "avalanche-2", color: "#E84142" },
  dot: { name: "Polkadot", symbol: "DOT", gecko: "polkadot", color: "#E6007A" },
  ltc: { name: "Litecoin", symbol: "LTC", gecko: "litecoin", color: "#345D9D" },
  pol: { name: "Polygon", symbol: "POL", gecko: "polygon-ecosystem-token", color: "#8247E5" },
};

export const COIN_IDS = Object.keys(COINS) as CoinId[];

const W = "#fff";
const bold = { fontFamily: "Arial, Helvetica, sans-serif", fontWeight: 800 } as const;

function Mark({ coin }: { coin: CoinId }) {
  switch (coin) {
    case "btc":
      return (
        <g transform="rotate(14 50 50)">
          <path d="M45 24v8M55 24v8M45 68v8M55 68v8" stroke={W} strokeWidth="5" strokeLinecap="round" />
          <text x="50" y="66" textAnchor="middle" fontSize="46" fill={W} style={bold}>B</text>
        </g>
      );
    case "eth":
      return (
        <g fill={W}>
          <path d="M50 16 L71 51 L50 63 L29 51 Z" />
          <path d="M50 16 L50 63 L29 51 Z" opacity=".6" />
          <path d="M50 67 L71 55 L50 85 L29 55 Z" />
          <path d="M50 67 L50 85 L29 55 Z" opacity=".6" />
        </g>
      );
    case "xtz":
      return (
        <g fill="none" stroke={W} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M33 30 H67 L44 52" />
          <path d="M50 22 V30" />
          <path d="M44 52 C62 50 70 60 66 70 C62 80 46 80 42 72" />
        </g>
      );
    case "sol":
      return (
        <g>
          <path d="M33 33 H71 L65 40 H27 Z" fill="#9945FF" />
          <path d="M27 47 H65 L71 54 H33 Z" fill="#43B4CA" />
          <path d="M33 61 H71 L65 68 H27 Z" fill="#14F195" />
        </g>
      );
    case "usdt":
      return (
        <g fill={W}>
          <rect x="29" y="26" width="42" height="9" rx="2" />
          <rect x="45" y="26" width="10" height="50" rx="2" />
          <ellipse cx="50" cy="47" rx="25" ry="7" fill="none" stroke={W} strokeWidth="4" />
        </g>
      );
    case "usdc":
      return (
        <g>
          <path d="M34 26 A28 28 0 0 0 34 74 M66 26 A28 28 0 0 1 66 74" stroke={W} strokeWidth="5" fill="none" strokeLinecap="round" />
          <text x="50" y="65" textAnchor="middle" fontSize="40" fill={W} style={bold}>$</text>
        </g>
      );
    case "bnb":
      return (
        <g fill={W} transform="rotate(45 50 50)">
          <rect x="42" y="42" width="16" height="16" rx="1" />
          <rect x="44" y="22" width="12" height="12" rx="1" />
          <rect x="44" y="66" width="12" height="12" rx="1" />
          <rect x="22" y="44" width="12" height="12" rx="1" />
          <rect x="66" y="44" width="12" height="12" rx="1" />
        </g>
      );
    case "xrp":
      return (
        <g fill="none" stroke={W} strokeWidth="6.5" strokeLinecap="round">
          <path d="M28 28 C40 42 60 42 72 28" />
          <path d="M28 72 C40 58 60 58 72 72" />
        </g>
      );
    case "ada":
      return (
        <g fill={W}>
          <circle cx="50" cy="50" r="7" />
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i * Math.PI) / 3;
            return <circle key={i} cx={50 + Math.cos(a) * 18} cy={50 + Math.sin(a) * 18} r="4.5" />;
          })}
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i * Math.PI) / 3 + Math.PI / 6;
            return <circle key={`o${i}`} cx={50 + Math.cos(a) * 30} cy={50 + Math.sin(a) * 30} r="3" />;
          })}
        </g>
      );
    case "doge":
      return (
        <g>
          <text x="52" y="66" textAnchor="middle" fontSize="44" fill={W} style={bold}>D</text>
          <path d="M30 50 H54" stroke={W} strokeWidth="6" strokeLinecap="round" />
        </g>
      );
    case "avax":
      return (
        <g fill={W}>
          <path d="M50 22 L76 70 H56 L50 58 L44 70 H24 Z" />
          <path d="M60 50 L70 68 H52 Z" fill="#E84142" />
          <path d="M66 58 L74 72 H58 Z" />
        </g>
      );
    case "dot":
      return (
        <g fill={W}>
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i * Math.PI) / 3 - Math.PI / 2;
            return (
              <ellipse key={i} cx={50 + Math.cos(a) * 22} cy={50 + Math.sin(a) * 22} rx="9" ry="6"
                transform={`rotate(${(i * 60) % 180} ${50 + Math.cos(a) * 22} ${50 + Math.sin(a) * 22})`} />
            );
          })}
        </g>
      );
    case "ltc":
      return (
        <g>
          <text x="54" y="68" textAnchor="middle" fontSize="48" fill={W} style={bold}>L</text>
          <path d="M33 58 L58 46" stroke={W} strokeWidth="6" strokeLinecap="round" />
        </g>
      );
    case "pol":
      return (
        <g fill="none" stroke={W} strokeWidth="5.5" strokeLinejoin="round">
          <path d="M44 38 L34 32 L24 38 V50 L34 56 L44 50 V44" />
          <path d="M56 62 L66 68 L76 62 V50 L66 44 L56 50 V56" />
          <path d="M44 44 L56 56" />
        </g>
      );
  }
}

export function CryptoIcon({
  coin,
  size = 24,
  className,
  style,
  title,
}: {
  coin: CoinId;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Give a title when the icon stands alone; leave it out when a label sits next to it. */
  title?: string;
}) {
  const c = COINS[coin];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className ? `cicon ${className}` : "cicon"}
      style={style}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <circle cx="50" cy="50" r="50" fill={c.color} />
      {coin === "sol" && <circle cx="50" cy="50" r="48.5" fill="none" stroke="#2a2a3a" strokeWidth="3" />}
      <circle cx="50" cy="50" r="46" fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth="2" />
      <Mark coin={coin} />
    </svg>
  );
}
