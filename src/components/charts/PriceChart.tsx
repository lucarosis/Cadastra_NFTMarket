"use client";

/* RED — highest price achieved today, hour by hour */

import { useState } from "react";
import { formatTez, formatTezShort, usdFromMutez } from "@/lib/currency";
import type { SalePoint } from "@/lib/repo";
import { EmptyChart } from "./EmptyChart";

const W = 520;
const H = 206;
const L = 52;
const R = 14;
const T = 18;
const B = 34;
const RED = "var(--sig-red)";

/** Round an axis maximum up to something readable (1, 2 or 5 × a power of ten). */
function niceMax(v: number) {
  if (v <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

function PriceChartView({ data, usdRate }: { data: SalePoint[]; usdRate: number }) {
  const peakIdx = data.reduce((b, d, i) => (d.mutez > data[b].mutez ? i : b), 0);
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? peakIdx;
  const d0 = data[active];
  const peak = data[peakIdx];

  const yMax = niceMax(Math.max(...data.map((d) => d.mutez)));
  const ticks = [0, yMax / 2, yMax];
  const px = (i: number) => L + (data.length > 1 ? i / (data.length - 1) : 0.5) * (W - L - R);
  const py = (v: number) => H - B - (v / yMax) * (H - B - T);

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(d.mutez).toFixed(1)}`).join(" ");
  const area = `${line} L${px(data.length - 1).toFixed(1)},${H - B} L${px(0).toFixed(1)},${H - B} Z`;

  return (
    <>
      <div className="panel-body" style={{ paddingBottom: 6 }}>
        <p className="chart-figure" style={{ color: RED }}>
          {formatTez(d0.mutez)}
        </p>
        <p className="label" style={{ letterSpacing: ".1em" }}>
          {d0.hour}:00 UTC · {d0.name} · {usdFromMutez(d0.mutez, usdRate)}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chartsvg"
        role="img"
        aria-label={`Highest sale price by hour today. Peak of ${formatTez(peak.mutez)} on ${peak.name} at ${peak.hour}:00 UTC.`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="redfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff5a5a" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#ff5a5a" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={py(v)} y2={py(v)} stroke="var(--line)" strokeWidth="1" />
            <text x={L - 8} y={py(v) + 3.5} fontSize="9.5" fill="var(--ink-4)" textAnchor="end">
              {formatTezShort(v)}
            </text>
          </g>
        ))}

        <path d={area} fill="url(#redfill)" />
        <path d={line} fill="none" stroke={RED} strokeWidth="2" strokeLinejoin="round" />

        <line
          x1={px(active)}
          x2={px(active)}
          y1={T - 4}
          y2={H - B}
          stroke="var(--line-2)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <circle cx={px(active)} cy={py(d0.mutez)} r="5" fill={RED} stroke="var(--panel)" strokeWidth="2" />

        {data.map((d, i) => (
          <g key={d.hour}>
            {i % 2 === 0 && (
              <text x={px(i)} y={H - B + 16} fontSize="9.5" fill="var(--ink-4)" textAnchor="middle">
                {d.hour}
              </text>
            )}
            <rect
              x={px(i) - 16}
              y={T - 8}
              width="32"
              height={H - B - T + 12}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              style={{ cursor: "pointer" }}
            />
          </g>
        ))}
        <text x={L} y={H - 4} fontSize="9" fill="var(--ink-4)" letterSpacing="1.4">
          Hour (UTC)
        </text>
        <text x={W - R} y={H - 4} fontSize="9" fill="var(--ink-4)" textAnchor="end" letterSpacing="1.4">
          tez
        </text>
      </svg>
      <p className="chart-note">
        Highest sale settled in each hour. {peak.name} set today&rsquo;s high at {formatTez(peak.mutez)} at{" "}
        {peak.hour}:00 UTC.
      </p>
    </>
  );
}

/* Nothing to plot yet (e.g. before real trading starts): say so instead of failing. */
export function PriceChart(props: { data: SalePoint[]; usdRate: number }) {
  if (!props.data.length) return <EmptyChart text="No sales recorded today yet." />;
  return <PriceChartView {...props} />;
}
