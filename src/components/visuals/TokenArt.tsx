/* ============================================================
   Abstract artwork generated from a string.
   Used as a stand-in wherever a licensed image has not been
   supplied yet (creator portraits and featured works). It is
   deliberately generic — it does not imitate any artist.
   ============================================================ */

import { seedFrom, rngFrom } from "@/lib/hash";

const f = (n: number) => n.toFixed(1);

export function TokenArt({
  seed,
  hue,
  variant = "work",
  label,
}: {
  seed: string;
  hue: number;
  variant?: "work" | "portrait";
  label?: string;
}) {
  const rnd = rngFrom(seedFrom(seed));
  const id = `ta-${seedFrom(seed + variant).toString(36)}`;
  const h2 = (hue + 50 + Math.floor(rnd() * 90)) % 360;

  const rings = Array.from({ length: 5 + Math.floor(rnd() * 4) }, (_, i) => ({
    r: 14 + i * 9 + rnd() * 5,
    a: rnd() * 360,
    len: 60 + rnd() * 220,
    w: rnd() < 0.3 ? 2.4 : 1,
  }));
  const blobs = Array.from({ length: 3 }, () => ({
    x: 20 + rnd() * 60,
    y: 20 + rnd() * 60,
    r: 18 + rnd() * 26,
  }));
  const pts = Array.from({ length: 6 }, (_, i) => `${f(8 + i * 16.8)},${f(30 + rnd() * 40)}`).join(" ");

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label} style={{ display: "block", width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 60% 16%)`} />
          <stop offset="1" stopColor={`hsl(${h2} 55% 7%)`} />
        </linearGradient>
        <filter id={`${id}-blur`}>
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <rect width="100" height="100" fill={`url(#${id}-bg)`} />
      <g filter={`url(#${id}-blur)`} opacity=".75">
        {blobs.map((b, i) => (
          <circle key={i} cx={f(b.x)} cy={f(b.y)} r={f(b.r)} fill={`hsl(${i % 2 ? h2 : hue} 90% 60% / .55)`} />
        ))}
      </g>

      {variant === "portrait" ? (
        <g>
          <circle cx="50" cy="40" r="17" fill={`hsl(${hue} 30% 88% / .16)`} stroke={`hsl(${h2} 90% 75% / .7)`} strokeWidth="1" />
          <path d="M18 100 C20 74 34 64 50 64 C66 64 80 74 82 100 Z" fill={`hsl(${hue} 30% 88% / .12)`} stroke={`hsl(${h2} 90% 75% / .6)`} strokeWidth="1" />
        </g>
      ) : (
        <g>
          {rings.map((r, i) => {
            const c = 2 * Math.PI * r.r;
            return (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={f(r.r)}
                fill="none"
                stroke={`hsl(${i % 2 ? h2 : hue} 90% 72% / .7)`}
                strokeWidth={r.w}
                strokeDasharray={`${f((c * r.len) / 360)} ${f(c)}`}
                transform={`rotate(${f(r.a)} 50 50)`}
              />
            );
          })}
          <polyline points={pts} fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth=".9" />
        </g>
      )}

      <g stroke="#fff" strokeOpacity=".06">
        {[20, 40, 60, 80].map((x) => (
          <line key={x} x1={x} x2={x} y1="0" y2="100" />
        ))}
      </g>
    </svg>
  );
}
