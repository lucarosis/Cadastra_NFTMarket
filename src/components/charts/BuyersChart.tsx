"use client";

/* YELLOW — clients holding the most assets. Sales view only. */

import { useState } from "react";
import { formatTez } from "@/lib/currency";
import type { BuyerView } from "@/lib/repo";
import { EmptyChart } from "./EmptyChart";

const W = 520;
const H = 206;
const L = 34;
const R = 14;
const T = 24;
const B = 40;
const YELLOW = "var(--sig-yellow)";

function niceMax(v: number) {
  if (v <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

function BuyersChartView({ data }: { data: BuyerView[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? 0;
  const d0 = data[active];

  const yMax = niceMax(Math.max(...data.map((d) => d.purchases)));
  const ticks = [0, yMax / 2, yMax];
  const band = (W - L - R) / data.length;
  const bw = band * 0.52;
  const py = (v: number) => H - B - (v / yMax) * (H - B - T);
  const totalVolume = data.reduce((s, d) => s + d.volumeMutez, 0);

  return (
    <>
      <div className="panel-body" style={{ paddingBottom: 6 }}>
        <p className="chart-figure" style={{ color: YELLOW }}>
          {d0.purchases} assets
        </p>
        <p className="label" style={{ letterSpacing: ".1em" }}>
          {d0.handle} · {d0.region} · {formatTez(d0.volumeMutez)} lifetime
        </p>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chartsvg"
        role="img"
        aria-label={`The ${data.length} highest-volume buyers. ${data[0].handle} leads with ${data[0].purchases} assets.`}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={py(v)} y2={py(v)} stroke="var(--line)" strokeWidth="1" />
            <text x={L - 8} y={py(v) + 3.5} fontSize="9.5" fill="var(--ink-4)" textAnchor="end">
              {Math.round(v)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const x = L + band * i + (band - bw) / 2;
          const y = py(d.purchases);
          const on = i === active;
          return (
            <g key={d.handle} onMouseEnter={() => setHover(i)} style={{ cursor: "pointer" }}>
              <rect x={L + band * i} y={T - 10} width={band} height={H - B - T + 14} fill="transparent" />
              <rect x={x} y={y} width={bw} height={H - B - y} fill={YELLOW} opacity={on ? 1 : 0.52} />
              <text
                x={x + bw / 2}
                y={y - 7}
                fontSize="10"
                fill={on ? "var(--ink)" : "var(--ink-3)"}
                textAnchor="middle"
              >
                {d.purchases}
              </text>
              <text
                x={x + bw / 2}
                y={H - B + 16}
                fontSize="9"
                fill={on ? "var(--ink-2)" : "var(--ink-4)"}
                textAnchor="middle"
              >
                {d.handle.replace("@", "").slice(0, 9)}
              </text>
            </g>
          );
        })}
        <text x={W - R} y={H - 6} fontSize="9" fill="var(--ink-4)" textAnchor="end" letterSpacing="1.4">
          Assets bought
        </text>
      </svg>
      <p className="chart-note">
        The {data.length} highest-volume accounts, {formatTez(totalVolume)} between them since joining.
      </p>
    </>
  );
}

/* Nothing to plot yet (e.g. before real trading starts): say so instead of failing. */
export function BuyersChart(props: { data: BuyerView[] }) {
  if (!props.data.length) return <EmptyChart text="No buyers to rank yet." />;
  return <BuyersChartView {...props} />;
}
