"use client";

/* A client's own portfolio. Derived from the account seed so the
   demo shows a realistic, stable position per account. */

import Image from "next/image";
import { formatTez, usdFromMutez } from "@/lib/currency";
import type { WorkView } from "@/lib/repo";
import { assetSrc } from "@/lib/media";
import { rngFrom } from "@/lib/hash";

export function ClientHoldings({ seed, works, usdRate }: { seed: number; works: WorkView[]; usdRate: number }) {
  const rnd = rngFrom(seed);
  const live = works.filter((d) => d.status === "Live");
  const holdings = live
    .map((d) => ({ d, r: rnd() }))
    .sort((a, b) => a.r - b.r)
    .slice(0, 5)
    .map(({ d }, i) => ({ design: d, units: 1 + Math.floor(rngFrom(seed + i)() * 4) }));

  const value = holdings.reduce((s, h) => s + h.design.priceMutez * h.units, 0);

  return (
    <>
      <div className="panel-head">
        <div className="chart-title">
          <b>Your holdings</b>
        </div>
        <span className="label">{holdings.length} positions</span>
      </div>
      <div className="panel-body" style={{ paddingBottom: 6 }}>
        <p className="chart-figure">{formatTez(value)}</p>
        <p className="label" style={{ letterSpacing: ".1em" }}>
          Portfolio value · {usdFromMutez(value, usdRate)}
        </p>
      </div>
      <table className="rank">
        <thead>
          <tr>
            <th>Asset</th>
            <th className="n">Units</th>
            <th className="n">Value</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.design.id}>
              <td>
                <span className="rank-name">
                  <Image src={assetSrc(h.design.id)} alt="" width={34} height={34} className="rank-thumb" unoptimized />
                  <span>
                    <span style={{ display: "block", fontWeight: 500 }}>{h.design.name}</span>
                    <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                      {h.design.id} · {h.design.category}
                    </span>
                  </span>
                </span>
              </td>
              <td className="n">{h.units}</td>
              <td className="n">{formatTez(h.design.priceMutez * h.units)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
