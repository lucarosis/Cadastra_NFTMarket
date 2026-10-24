"use client";

/* GREEN — fairly priced and most liked */

import { useState } from "react";
import { formatTez } from "@/lib/currency";
import type { LikedView } from "@/lib/repo";
import { EmptyChart } from "./EmptyChart";

const GREEN = "var(--sig-green)";
const FAIR_BAND = 5; /* percent from the estimate that still counts as "fairly priced" */

function LikesChartView({ data }: { data: LikedView[] }) {
  const max = Math.max(1, ...data.map((d) => d.likes));
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? 0;
  const d0 = data[active];
  const gapOf = (d: LikedView) => (d.fairMutez > 0 ? ((d.fairMutez - d.priceMutez) / d.fairMutez) * 100 : 0);
  const gap = gapOf(d0);
  const withinBand = data.filter((d) => Math.abs(gapOf(d)) <= FAIR_BAND).length;

  return (
    <>
      <div className="panel-body" style={{ paddingBottom: 6 }}>
        <p className="chart-figure" style={{ color: GREEN }}>
          {d0.likes.toLocaleString("en-US")}
        </p>
        <p className="label" style={{ letterSpacing: ".1em" }}>
          {d0.name} · {formatTez(d0.priceMutez)} ·{" "}
          {gap >= 0 ? `${gap.toFixed(1)}% under fair value` : `${Math.abs(gap).toFixed(1)}% over fair value`}
        </p>
      </div>
      <div className="panel-body" style={{ paddingTop: 10, paddingBottom: 10 }}>
        {data.map((d, i) => {
          const pct = (d.likes / max) * 100;
          const on = i === active;
          return (
            <div
              key={d.id}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "5px 0",
                cursor: "pointer",
                opacity: on ? 1 : 0.62,
                transition: "opacity .15s",
              }}
            >
              <span
                className="mono"
                style={{ fontSize: 11, width: 96, flex: "none", color: "var(--ink-2)" }}
              >
                {d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name}
              </span>
              <span
                style={{
                  flex: 1,
                  height: 12,
                  background: "var(--bg-2)",
                  border: "1px solid var(--line)",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 1,
                    bottom: 1,
                    left: 1,
                    width: `calc(${pct}% - 2px)`,
                    background: GREEN,
                    opacity: on ? 1 : 0.75,
                  }}
                />
              </span>
              <span
                className="mono"
                style={{ fontSize: 11, width: 46, textAlign: "right", flex: "none" }}
              >
                {(d.likes / 1000).toFixed(1)}k
              </span>
            </div>
          );
        })}
      </div>
      <p className="chart-note">
        The {data.length} most-liked works carrying a fair-value estimate. {withinBand} of them trade
        within {FAIR_BAND}% of that estimate.
      </p>
    </>
  );
}

/* Nothing to plot yet (e.g. before real trading starts): say so instead of failing. */
export function LikesChart(props: { data: LikedView[] }) {
  if (!props.data.length) return <EmptyChart text="No listed work carries a fair-value estimate yet." />;
  return <LikesChartView {...props} />;
}
