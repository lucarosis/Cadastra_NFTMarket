/* Shared body for /explore, /explore/[category] and
   /explore/[category]/[subcategory]. Server component: it loads the works for
   the current slice and hands them to the client-side Gallery, which keeps
   search and sorting local. */

import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Gallery } from "@/components/Gallery";
import { getXtzUsd } from "@/lib/price";
import { getCategoryBySlug, listCategories, listWorks } from "@/lib/repo";
import { CryptoIcon, type CoinId } from "@/components/visuals/CryptoIcon";

const HEAD_COINS: CoinId[] = ["xtz", "eth", "btc", "usdc", "sol"];

export async function ExploreSection({
  category,
  subcategory,
}: {
  category?: string;
  subcategory?: string;
}) {
  const categories = await listCategories();

  const active = category ? categories.find((c) => c.slug === category) ?? null : null;
  if (category && !active) notFound();

  const activeSub = subcategory ? active?.subcategories.find((s) => s.slug === subcategory) ?? null : null;
  if (subcategory && !activeSub) notFound();

  const [works, rate] = await Promise.all([
    listWorks({ status: "Live", categorySlug: category, subcategorySlug: subcategory }),
    getXtzUsd(),
  ]);

  const heading = activeSub?.name ?? active?.name ?? "Find your next asset";
  const blurb =
    activeSub
      ? `${activeSub.name} in ${active?.name}.`
      : active?.blurb || "Every listing on the market, with its creator, price and how many collectors love it.";

  return (
    <>
      <header className="page-head page-head-coins shell">
        <div>
        <p className="kicker">{active ? `Explore · ${active.name}` : "Explore"}</p>
        <h1>{heading}</h1>
        <p>{blurb}</p>
        {activeSub?.restricted && (
          <p className="field-hint" style={{ marginTop: 12 }}>
            Works in this group are held back from sale until the legal review of property-linked
            tokens is complete.
          </p>
        )}
        </div>
        <div className="head-coins" aria-hidden="true">
          {HEAD_COINS.map((c, i) => (
            <CryptoIcon key={c} coin={c} size={[66, 46, 54, 38, 44][i]} className={["float-a", "float-b", "float-c", "float-b", "float-a"][i]} />
          ))}
        </div>
      </header>

      <Suspense fallback={<div className="shell"><p className="result-count">Loading assets…</p></div>}>
        <Gallery
          works={works}
          categories={categories}
          activeCategory={category ?? null}
          activeSubcategory={subcategory ?? null}
          usdRate={rate.usdPerTez}
        />
      </Suspense>
    </>
  );
}

/** Slugs for the three category pages, used by generateStaticParams-style helpers. */
export async function categorySlugs() {
  return (await listCategories()).map((c) => c.slug);
}

export { getCategoryBySlug };
