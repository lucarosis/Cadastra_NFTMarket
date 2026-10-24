"use client";

import { useState } from "react";
import Link from "next/link";
import { WorkCard } from "@/components/WorkCard";
import type { CategoryView, WorkView } from "@/lib/repo";

type Sort = "trending" | "newest" | "price-asc" | "price-desc";

/* Cards per page. The catalogue is 100+ works; rendering them all at once
   would request every image up front. */
const PAGE = 24;

const SORTS: Record<Sort, { label: string; fn: (a: WorkView, b: WorkView) => number }> = {
  trending: { label: "Trending", fn: (a, b) => b.likes - a.likes },
  newest: { label: "Newest", fn: (a, b) => b.mintedAt.localeCompare(a.mintedAt) },
  "price-asc": { label: "Price: low to high", fn: (a, b) => a.priceMutez - b.priceMutez },
  "price-desc": { label: "Price: high to low", fn: (a, b) => b.priceMutez - a.priceMutez },
};

export function Gallery({
  works,
  categories,
  activeCategory,
  activeSubcategory,
  usdRate,
}: {
  works: WorkView[];
  categories: CategoryView[];
  activeCategory: string | null;
  activeSubcategory: string | null;
  usdRate: number;
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("trending");
  const [limit, setLimit] = useState(PAGE);

  /* Category and subcategory are routes, so they can be linked and shared.
     Search and sorting stay in the browser. */
  const current = categories.find((c) => c.slug === activeCategory) ?? null;

  const needle = q.trim().toLowerCase();
  const shown = works
    .filter((d) => !needle || `${d.name} ${d.designer} ${d.studio} ${d.id}`.toLowerCase().includes(needle))
    .sort(SORTS[sort].fn);
  const visible = shown.slice(0, limit);

  return (
    <section className="shell" style={{ paddingBottom: 80 }}>
      <div className="toolbar">
        <label className="search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ color: "var(--ink-3)" }}>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} placeholder="Search assets, creators or IDs" aria-label="Search assets" />
        </label>
        <div className="filters">
          <Link className="chip" data-on={!activeCategory} href="/explore">
            All
          </Link>
          {categories.map((c) => (
            <Link key={c.slug} className="chip" data-on={activeCategory === c.slug} href={`/explore/${c.slug}`}>
              {c.name}
            </Link>
          ))}
        </div>
        <select className="select" value={sort} onChange={(e) => { setSort(e.target.value as Sort); setLimit(PAGE); }} aria-label="Sort assets">
          {(Object.keys(SORTS) as Sort[]).map((s) => (
            <option key={s} value={s}>
              {SORTS[s].label}
            </option>
          ))}
        </select>
      </div>

      {current && current.subcategories.length > 0 && (
        <div className="filters subfilters">
          <Link className="chip chip-sub" data-on={!activeSubcategory} href={`/explore/${current.slug}`}>
            Everything in {current.name}
          </Link>
          {current.subcategories.map((s) => (
            <Link
              key={s.slug}
              className="chip chip-sub"
              data-on={activeSubcategory === s.slug}
              href={`/explore/${current.slug}/${s.slug}`}
            >
              {s.name}
              <span className="chip-count">{s.works}</span>
            </Link>
          ))}
        </div>
      )}

      <p className="result-count">
        {shown.length} {shown.length === 1 ? "asset" : "assets"} available
        {shown.length > visible.length && ` · showing ${visible.length}`}
      </p>

      {shown.length === 0 ? (
        <div className="empty">Nothing here yet. Try another category or search.</div>
      ) : (
        <div className="grid">
          {visible.map((d, i) => (
            <WorkCard key={d.id} work={d} usdRate={usdRate} priority={i < 8} />
          ))}
        </div>
      )}

      {shown.length > visible.length && (
        <div className="more">
          <button className="btn" onClick={() => setLimit((n) => n + PAGE)}>
            Show more · {shown.length - visible.length} left
          </button>
        </div>
      )}
    </section>
  );
}
