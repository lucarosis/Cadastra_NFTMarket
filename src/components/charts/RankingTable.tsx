"use client";

/* Ranking by category: Entertainment / Art / Real estate / Avatar */

import { useState } from "react";
import Image from "next/image";
import { formatTez, usdFromMutez } from "@/lib/currency";
import { assetSrc } from "@/lib/media";
import type { WorkView } from "@/lib/repo";

export function RankingTable({ works, categories, usdRate }: { works: WorkView[]; categories: string[]; usdRate: number }) {
  const [cat, setCat] = useState<string>(categories[0] ?? "");
  const rows = works.filter((d) => d.category === cat).sort((a, b) => b.likes - a.likes);

  return (
    <>
      <div className="panel-head">
        <div className="chart-title">
          <b>Ranking by category</b>
        </div>
        <div className="filters">
          {categories.map((c) => (
            <button key={c} className="chip" data-on={c === cat} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <table className="rank">
        <thead>
          <tr>
            <th style={{ width: 34 }}>#</th>
            <th>Design</th>
            <th className="n">Price</th>
            <th className="n">USD</th>
            <th className="n">Likes</th>
            <th className="n">Holders</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d, i) => (
            <tr key={d.id}>
              <td className="rank-pos">{String(i + 1).padStart(2, "0")}</td>
              <td>
                <span className="rank-name">
                  <Image src={assetSrc(d.id)} alt="" width={34} height={34} className="rank-thumb" unoptimized />
                  <span>
                    <span style={{ display: "block", fontWeight: 500 }}>{d.name}</span>
                    <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                      {d.id} · {d.studio}
                    </span>
                  </span>
                </span>
              </td>
              <td className="n">{formatTez(d.priceMutez)}</td>
              <td className="n" style={{ color: "var(--ink-3)" }}>{usdFromMutez(d.priceMutez, usdRate)}</td>
              <td className="n">{d.likes.toLocaleString("en-US")}</td>
              <td className="n" style={{ color: "var(--ink-3)" }}>{d.owners.toLocaleString("en-US")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
