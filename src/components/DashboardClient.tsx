"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { PassCanvas } from "@/components/PassCanvas";
import { PriceChart } from "@/components/charts/PriceChart";
import { LikesChart } from "@/components/charts/LikesChart";
import { BuyersChart } from "@/components/charts/BuyersChart";
import { CategoryBars } from "@/components/charts/CategoryBars";
import { RankingTable } from "@/components/charts/RankingTable";
import { SuggestionsInbox, ReviewLinks } from "@/components/SuggestionsInbox";
import { ClientHoldings } from "@/components/ClientHoldings";
import { useAccount } from "@/lib/account";
import type {
  BuyerView, CategoryView, InternalWorkView, KpiView, LikedView, SalePoint, SuggestionView, WorkView,
} from "@/lib/repo";

export function DashboardClient({
  isSales,
  kpis, hourly, liked, buyers, categories, works, pending, suggestions, updatedAt, usdRate,
}: {
  /** Decided on the server from the database; sales-only props are empty otherwise. */
  isSales: boolean;
  kpis: KpiView[];
  hourly: SalePoint[];
  liked: LikedView[];
  buyers: BuyerView[];
  categories: CategoryView[];
  works: WorkView[];
  pending: InternalWorkView[];
  suggestions: SuggestionView[];
  updatedAt: string;
  usdRate: number;
}) {
  const router = useRouter();
  const { account: user, ready } = useAccount();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <>
        <TopBar />
        <main className="shell dash">
          <p className="label">Loading…</p>
        </main>
      </>
    );
  }

  const categoryNames = categories.map((c) => c.name);

  return (
    <>
      <TopBar />

      <main className="shell dash">
        {/* ── Header: the issued pass ── */}
        <div className="dash-head">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 58,
                height: 78,
                border: "1px solid var(--line-2)",
                overflow: "hidden",
                display: "flex",
                flex: "none",
              }}
            >
              <PassCanvas seed={user.seed} active={false} />
            </div>
            <div>
              <p className="label">
                {isSales ? "Sales dashboard" : "Client dashboard"} · {user.passId}
              </p>
              <h1>{user.displayName || user.email.split("@")[0]}</h1>
              <p className="mono" style={{ fontSize: 11, color: "var(--ink-4)", margin: "4px 0 0" }}>
                {user.email} · member since {user.createdAt.slice(0, 10)} · wallet: coming soon
              </p>
            </div>
          </div>
          <div className="legend">
            <span>
              <i className="swatch" style={{ background: "var(--sig-red)" }} />
              Red — today&rsquo;s highest sale
            </span>
            <span>
              <i className="swatch" style={{ background: "var(--sig-green)" }} />
              Green — fairly priced, most liked
            </span>
            {isSales && (
              <span>
                <i className="swatch" style={{ background: "var(--sig-yellow)" }} />
                Yellow — highest-volume buyers
              </span>
            )}
          </div>
        </div>

        {/* ── KPIs (sales only — clients see their portfolio instead) ── */}
        {isSales && (
          <div className="kpis">
            {kpis.map((k) => (
              <div className="kpi" key={k.label}>
                <span className="label">{k.label}</span>
                <b>
                  {k.value}
                  <span className="mono" style={{ fontSize: 12, color: "var(--ink-4)", marginLeft: 5 }}>
                    {k.sub}
                  </span>
                </b>
                <small className="delta">{k.delta}</small>
              </div>
            ))}
          </div>
        )}

        {/* ── The three signal charts ── */}
        <div className="charts" style={!isSales ? { gridTemplateColumns: "repeat(3,1fr)" } : undefined}>
          <section className="panel">
            <div className="panel-head">
              <div className="chart-title">
                <i className="swatch" style={{ background: "var(--sig-red)" }} />
                <b>Highest sale today</b>
              </div>
              <span className="label">Red</span>
            </div>
            <PriceChart data={hourly} usdRate={usdRate} />
          </section>

          <section className="panel">
            <div className="panel-head">
              <div className="chart-title">
                <i className="swatch" style={{ background: "var(--sig-green)" }} />
                <b>Fairly priced, most liked</b>
              </div>
              <span className="label">Green</span>
            </div>
            <LikesChart data={liked} />
          </section>

          {isSales ? (
            <section className="panel">
              <div className="panel-head">
                <div className="chart-title">
                  <i className="swatch" style={{ background: "var(--sig-yellow)" }} />
                  <b>Highest-volume buyers</b>
                </div>
                <span className="label">Yellow</span>
              </div>
              <BuyersChart data={buyers} />
            </section>
          ) : (
            /* Clients must not see other clients' purchase volumes. */
            <section className="panel">
              <ClientHoldings seed={user.seed} works={works} usdRate={usdRate} />
            </section>
          )}
        </div>

        {/* ── Designer feedback (sales only) ── */}
        {isSales && (
          <div className="split2" style={{ marginTop: 16 }}>
            <section className="panel">
              <SuggestionsInbox suggestions={suggestions} />
            </section>
            <section className="panel">
              <ReviewLinks pending={pending} />
            </section>
          </div>
        )}

        {/* ── Ranking and registered designs ── */}
        <div className="split2" style={{ marginTop: 16 }}>
          <section className="panel">
            <RankingTable works={works} categories={categoryNames} usdRate={usdRate} />
          </section>

          <section className="panel">
            <div className="panel-head">
              <div className="chart-title">
                <b>Registered designs</b>
              </div>
              <span className="label">By category</span>
            </div>
            <CategoryBars data={categories} />
          </section>
        </div>

        <p className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)", marginTop: 22, lineHeight: 1.8 }}>
          Figures come from the Cadastra database and are demo data until real trading begins
          (loaded{" "}
          {new Date(updatedAt).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "UTC",
          })}{" "}
          UTC).
        </p>
      </main>
    </>
  );
}
