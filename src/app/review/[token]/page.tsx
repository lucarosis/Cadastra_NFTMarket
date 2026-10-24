/* ============================================================
   Designer review surface — no sign-in required.

   The sales team shares /review/<token> with the designer who
   made the asset. They see the brief, the work as published and
   how it is performing, and leave improvement suggestions.

   The token also unlocks the clean artwork for that one asset
   (see /api/media).
   ============================================================ */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SuggestionForm } from "@/components/SuggestionForm";
import { assetSrc } from "@/lib/media";
import { AGO } from "@/lib/format";
import { formatTez, usdFromMutez } from "@/lib/currency";
import { getXtzUsd } from "@/lib/price";
import { getWorkByReviewToken, listSuggestions } from "@/lib/repo";

export const dynamic = "force-dynamic";

/* The token is the credential: keep the page out of search engines and keep
   the URL out of the Referer header of anything it links to. */
export const metadata: Metadata = {
  title: "Designer review — Cadastra",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const design = await getWorkByReviewToken(token);

  if (!design) {
    return (
      <main className="shell" style={{ padding: "80px 0" }}>
        <Link href="/">
          <Logo />
        </Link>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 30, marginTop: 40 }}>
          This review link is not valid
        </h1>
        <p style={{ color: "var(--ink-2)", maxWidth: "56ch" }}>
          The link may have expired or been superseded by a newer one. Ask your contact on the
          Terra Ledger team to reissue it.
        </p>
      </main>
    );
  }

  const [thread, rate] = await Promise.all([listSuggestions(design.id), getXtzUsd()]);

  return (
    <>
      <header className="topbar">
        <div className="shell topbar-in">
          <Logo />
          <span className="label">Designer review · no sign-in required</span>
        </div>
      </header>

      <main className="shell review">
        <div className="review-head">
          <div>
            <p className="label">
              {design.id} · {design.category}
            </p>
            <h1>{design.name}</h1>
            <p className="review-sub">
              Commissioned from {design.studio}. You are viewing this asset as its designer —
              your suggestions go straight to the account team.
            </p>
          </div>
          <span className={`status status-${design.status.replace(/\s/g, "-").toLowerCase()}`}>
            {design.status}
          </span>
        </div>

        <div className="review-grid">
          <section>
            <div className="panel">
              <div className="review-art">
                <Image
                  src={assetSrc(design.id, design.reviewToken)}
                  alt={`${design.name} by ${design.designer}`}
                  fill
                  sizes="(max-width:900px) 100vw, 52vw"
                  unoptimized
                />
              </div>
            </div>

            <div className="panel" style={{ marginTop: 16 }}>
              <div className="panel-head">
                <span className="label">Original brief</span>
                <span className="label">Issued {design.mintedAt}</span>
              </div>
              <div className="panel-body">
                <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 14.5 }}>{design.brief}</p>
              </div>
            </div>

            <div className="panel" style={{ marginTop: 16 }}>
              <div className="panel-head">
                <span className="label">How it is performing</span>
              </div>
              <div className="factgrid">
                <div>
                  <span className="label">List price</span>
                  <b>{formatTez(design.priceMutez)}</b>
                  <small>{usdFromMutez(design.priceMutez, rate.usdPerTez)}</small>
                </div>
                <div>
                  <span className="label">Likes</span>
                  <b>{design.likes.toLocaleString("en-US")}</b>
                  <small>across the marketplace</small>
                </div>
                <div>
                  <span className="label">Holders</span>
                  <b>{design.owners.toLocaleString("en-US")}</b>
                  <small>of {design.editions.toLocaleString("en-US")} editions</small>
                </div>
                <div>
                  <span className="label">Sell-through</span>
                  <b>{Math.round((design.owners / design.editions) * 100)}%</b>
                  <small>of the edition placed</small>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="panel">
              <div className="panel-head">
                <span className="label">Suggest an improvement</span>
              </div>
              <div className="panel-body">
                <SuggestionForm reviewToken={design.reviewToken} studio={design.studio} />
              </div>
            </div>

            <div className="panel" style={{ marginTop: 16 }}>
              <div className="panel-head">
                <span className="label">Thread</span>
                <span className="label">{thread.length} on this asset</span>
              </div>
              {thread.length === 0 ? (
                <div className="panel-body">
                  <p style={{ margin: 0, color: "var(--ink-3)", fontSize: 13.5 }}>
                    No suggestions on this asset yet. Yours will be the first.
                  </p>
                </div>
              ) : (
                <ul className="thread">
                  {thread.map((s) => (
                    <li key={s.id}>
                      <div className="thread-top">
                        <b>{s.author}</b>
                        <span className={`pill pill-${s.status.toLowerCase()}`}>{s.status}</span>
                      </div>
                      <p>{s.body}</p>
                      <span className="label">{AGO(s.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="site">
        <div className="shell in">
          <span>© 2026 Terra Ledger</span>
          <span>This link is scoped to one asset. It grants no access to the marketplace.</span>
        </div>
      </footer>
    </>
  );
}
