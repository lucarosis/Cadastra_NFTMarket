"use client";

/* Designs registered in the system, by category */

import { formatTez } from "@/lib/currency";
import type { CategoryView } from "@/lib/repo";
import { EmptyChart } from "./EmptyChart";

export function CategoryBars({ data }: { data: CategoryView[] }) {
  if (!data.length) return <EmptyChart text="No categories yet." />;
  const max = Math.max(1, ...data.map((c) => c.designs));
  const total = data.reduce((s, c) => s + c.designs, 0);
  const totalVolume = data.reduce((s, c) => s + c.volumeMutez, 0);

  /* Highest-earning category, worked out from the data rather than written by hand. */
  const top = data.reduce((b, c) => (c.volumeMutez > b.volumeMutez ? c : b), data[0]);
  const topShare = totalVolume ? (top.volumeMutez / totalVolume) * 100 : 0;

  return (
    <>
      <div className="panel-body" style={{ paddingBottom: 4 }}>
        <p className="chart-figure">{total.toLocaleString("en-US")}</p>
        <p className="label" style={{ letterSpacing: ".1em" }}>
          Registered designs · {data.length} categories · {formatTez(totalVolume)} lifetime
        </p>
      </div>
      <div className="panel-body" style={{ paddingTop: 8 }}>
        {data.map((c) => (
          <div className="catbar" key={c.slug}>
            <span className="catbar-name">{c.name}</span>
            <span className="catbar-track">
              <span className="catbar-fill" style={{ width: `calc(${(c.designs / max) * 100}% - 2px)` }} />
            </span>
            <span className="catbar-val">{c.designs.toLocaleString("en-US")}</span>
          </div>
        ))}
      </div>
      <p className="chart-note">
        {top.name} carries {topShare.toFixed(1)}% of lifetime volume from{" "}
        {((top.designs / total) * 100).toFixed(1)}% of the assets.
      </p>
    </>
  );
}
