/* One asset: the page every grid card links to.

   Members only (src/proxy.ts). Works that are not listed yet are visible to the
   sales team alone; everyone else gets a 404, as if the work did not exist.

   Buying is not built yet. Works are minted at their first sale (decision Q6,
   lazy minting), which needs the sale contract — until then the button says
   so instead of pretending. */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { WorkCard, fmtLikes } from "@/components/WorkCard";
import { assetSrc } from "@/lib/media";
import { formatTez, usdFromMutez } from "@/lib/currency";
import { fmtDate } from "@/lib/format";
import { getXtzUsd } from "@/lib/price";
import { getWorkByCode, listWorks, type WorkView } from "@/lib/repo";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/* route params can arrive encoded or not; a malformed one must not crash the page */
function safeDecode(code: string): string {
  try {
    return decodeURIComponent(code);
  } catch {
    return code;
  }
}

async function load(code: string): Promise<WorkView | null> {
  const work = await getWorkByCode(code);
  if (!work) return null;
  if (work.status !== "Live" && (await getViewer())?.role !== "sales") return null;
  return work;
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const work = await load(safeDecode(code));
  return work
    ? { title: `${work.name} by ${work.designer} — Cadastra`, robots: { index: false } }
    : { title: "Not found — Cadastra" };
}

export default async function ItemPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const work = await load(safeDecode(code));
  if (!work) notFound();

  const [rate, sameCategory] = await Promise.all([
    getXtzUsd(),
    listWorks({ status: "Live", categorySlug: work.categorySlug, limit: 9 }),
  ]);
  const related = sameCategory.filter((w) => w.id !== work.id).slice(0, 4);
  const placed = Math.min(work.owners, work.editions);
  const available = Math.max(work.editions - placed, 0);
  const sellThrough = work.editions ? Math.round((placed / work.editions) * 100) : 0;
  const listed = work.status === "Live";
  const soldOut = listed && work.editions > 0 && available === 0;
  const publicDomain = work.licence === "CC0" || work.licence === "PD";

  return (
    <>
      <TopBar />
      <main className="shell item">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/explore">Explore</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/explore/${work.categorySlug}`}>{work.category}</Link>
          {work.subcategory && (
            <>
              <span aria-hidden="true">/</span>
              <Link href={`/explore/${work.categorySlug}/${work.subcategorySlug}`}>{work.subcategory}</Link>
            </>
          )}
        </nav>

        <div className="item-grid">
          <div className="item-art">
            <Image
              src={assetSrc(work.id)}
              alt={`${work.name}, an NFT by ${work.designer}`}
              fill
              priority
              unoptimized
              sizes="(max-width:960px) 100vw, 56vw"
            />
            <span className="card-id">{work.id}</span>
          </div>

          <div className="item-body">
            <p className="kicker">
              {work.category}
              {work.subcategory ? ` · ${work.subcategory}` : ""}
            </p>
            <h1>{work.name}</h1>
            <p className="item-by">
              by <b>{work.designer}</b>
              {work.studio && work.studio !== work.designer ? ` · ${work.studio}` : ""}
            </p>

            <div className="item-buy">
              <span className="label">{!listed ? `Not listed · ${work.status}` : soldOut ? "Sold out · last price" : "Price"}</span>
              <div className="item-price">
                <b>{formatTez(work.priceMutez)}</b>
                <span>≈ {usdFromMutez(work.priceMutez, rate.usdPerTez)}{rate.stale ? " · delayed rate" : ""}</span>
              </div>
              <button className="btn btn-primary btn-lg btn-block" disabled>
                {soldOut ? "Sold out" : "Buy with tez"}
              </button>
              <p className="field-hint">
                {work.restricted
                  ? "Held back from sale until the legal review of property-linked tokens is complete."
                  : soldOut
                    ? "Every edition has been placed. Resale opens with the marketplace."
                    : "Purchasing opens at launch. Each work is minted on Tezos at its first sale, so you pay the mint, not a reseller."}
              </p>
            </div>

            <div className="factgrid item-facts">
              <div>
                <span className="label">Editions</span>
                <b>{work.editions.toLocaleString("en-US")}</b>
                <small>{sellThrough}% placed</small>
              </div>
              <div>
                <span className="label">Available</span>
                <b>{available.toLocaleString("en-US")}</b>
                <small>{placed.toLocaleString("en-US")} placed</small>
              </div>
              <div>
                <span className="label">Likes</span>
                <b>{fmtLikes(work.likes)}</b>
                <small>across the market</small>
              </div>
              <div>
                <span className="label">Creator royalty</span>
                <b>{(work.royaltyBps / 100).toLocaleString("en-US")}%</b>
                <small>on every resale</small>
              </div>
            </div>

            {work.description && <p className="item-desc">{work.description}</p>}

            <dl className="specs">
              <div><dt>Token</dt><dd className="mono">{work.id}</dd></div>
              <div><dt>Blockchain</dt><dd>Tezos</dd></div>
              <div><dt>Currency</dt><dd>tez (ꜩ)</dd></div>
              {work.mintedAt && <div><dt>Released</dt><dd>{fmtDate(work.mintedAt)}, {work.mintedAt.slice(0, 4)}</dd></div>}
              <div><dt>Artwork</dt><dd>Full resolution goes to the holder</dd></div>
              {work.licence && (
                <div>
                  <dt>Image licence</dt>
                  <dd>
                    {work.licenceUrl ? (
                      <a href={work.licenceUrl} target="_blank" rel="noopener noreferrer">{work.licenceName ?? work.licence}</a>
                    ) : (
                      work.licenceName ?? work.licence
                    )}
                  </dd>
                </div>
              )}
              {work.sourceUrl && (
                <div>
                  <dt>Source</dt>
                  <dd>
                    <a href={work.sourceUrl} target="_blank" rel="noopener noreferrer">{new URL(work.sourceUrl).hostname.replace(/^www\./, "")} ↗</a>
                  </dd>
                </div>
              )}
            </dl>
            {(work.attribution || publicDomain) && (
              <p className="photo-credit" style={{ marginTop: 12 }}>
                {work.attribution ??
                  "A public-domain work. The digital image was released for any use by the museum that holds the original."}
              </p>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="section" style={{ paddingTop: 64 }}>
            <div className="section-head">
              <div>
                <p className="kicker">More in {work.category}</p>
                <h2>Keep exploring</h2>
              </div>
              <Link href={`/explore/${work.categorySlug}`} className="btn">
                All of {work.category} →
              </Link>
            </div>
            <div className="grid">
              {related.map((w) => (
                <WorkCard key={w.id} work={w} usdRate={rate.usdPerTez} />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
