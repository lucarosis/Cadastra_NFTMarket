import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { Coin, type CoinGlyph, type CoinTone } from "@/components/visuals/Coin";
import { CryptoIcon, type CoinId } from "@/components/visuals/CryptoIcon";
import { assetSrc } from "@/lib/media";
import { monthShort } from "@/lib/format";
import { formatTez } from "@/lib/currency";
import { listDrops, listPartners, type DropView, type PartnerView } from "@/lib/repo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Drops — Cadastra",
  description: "New NFT creations released every season with Cadastra's long-term client partners.",
};

const HOW: { glyph: CoinGlyph; tone: CoinTone; title: string; text: string }[] = [
  { glyph: "ledger", tone: "gold", title: "Brief", text: "A partner sets the goal for the season" },
  { glyph: "brush", tone: "cyan", title: "Create", text: "We match the brief with the right creator" },
  { glyph: "hex", tone: "violet", title: "Review", text: "Creator and partner refine the work together" },
  { glyph: "spark", tone: "pink", title: "Launch", text: "The drop goes live to every collector" },
  { glyph: "gem", tone: "lime", title: "Next season", text: "Results shape the partner's next release" },
];

function CalRow({ d }: { d: DropView }) {
  return (
    <div className="cal-row">
      <div className="cal-date">
        <b>{d.date.slice(8, 10)}</b>
        <small>{monthShort(d.date)}</small>
      </div>
      <div className="cal-thumb">
        <Image src={assetSrc(d.id)} alt="" fill sizes="64px" unoptimized />
      </div>
      <div className="cal-title">
        <b>{d.title}</b>
        <small>
          {d.partnerName} × {d.studio} · {d.season}
        </small>
      </div>
      <div className="cal-price">
        {formatTez(d.priceMutez)}
        <br />
        <span style={{ color: "var(--ink-4)" }}>{d.supply.toLocaleString("en-US")} supply</span>
      </div>
      <span className={`dstat dstat-${d.status.replace(/\s/g, "-").toLowerCase()}`}>{d.status}</span>
    </div>
  );
}

export default async function DropsPage() {
  const [drops, partners] = await Promise.all([listDrops(), listPartners()]);

  const live = drops.find((d) => d.status === "Live");
  /* an "Upcoming" drop whose date has passed is stale data, not news */
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = drops
    .filter((d) => d.status === "Upcoming" && d.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = drops.filter((d) => d.status === "Sold out").sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <TopBar />
      <main className="shell">
        <header className="page-head page-head-coins">
          <div>
          <p className="kicker">Drops</p>
          <h1>New creations, every season</h1>
          <p>
            Our client partners don&rsquo;t launch once. They release season after season on Terra
            Ledger, working with creators to bring collectors something new.
          </p>
          </div>
          <div className="head-coins" aria-hidden="true">
            {(["sol", "xtz", "eth", "pol"] as CoinId[]).map((c, k) => (
              <CryptoIcon key={c} coin={c} size={[60, 48, 54, 40][k]} className={["float-a", "float-b", "float-c", "float-b"][k]} />
            ))}
          </div>
        </header>

        {live && (
          <section className="drop-live" aria-label="Live drop">
            <div className="drop-live-art">
              <Image src={assetSrc(live.id)} alt={live.title} fill sizes="(max-width:860px) 100vw, 50vw" loading="eager" unoptimized />
            </div>
            <div className="drop-live-body">
              <span className="live-dot">Live now</span>
              <h2>{live.title}</h2>
              <p style={{ margin: 0, color: "var(--ink-2)" }}>{live.blurb}</p>
              <p className="label" style={{ margin: 0 }}>
                {live.partnerName} × {live.studio} · {live.season}
              </p>
              <div className="facts">
                <div>
                  <b>{formatTez(live.priceMutez)}</b>
                  <small>Mint price</small>
                </div>
                <div>
                  <b>{live.supply.toLocaleString("en-US")}</b>
                  <small>Supply</small>
                </div>
                <div>
                  <b>{live.category}</b>
                  <small>Category</small>
                </div>
              </div>
              <div>
                <div className="meter">
                  <i style={{ width: `${live.mintedPct}%` }} />
                </div>
                <p className="result-count" style={{ margin: "8px 0 0" }}>{live.mintedPct}% minted</p>
              </div>
              <div>
                <Link href={`/explore/${live.categorySlug}`} className="btn btn-primary">
                  Collect now
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="section" id="calendar">
          <div className="section-head">
            <div>
              <p className="kicker">Calendar</p>
              <h2>Coming up</h2>
            </div>
          </div>
          <div className="cal">
            {upcoming.map((d) => (
              <CalRow key={d.id} d={d} />
            ))}
          </div>

          <p className="label" style={{ margin: "36px 0 12px" }}>Recently sold out</p>
          <div className="cal">
            {past.map((d) => (
              <CalRow key={d.id} d={d} />
            ))}
          </div>
        </section>

        <section className="section" id="how" style={{ paddingTop: 0 }}>
          <div className="section-head" style={{ justifyContent: "center", textAlign: "center" }}>
            <div>
              <p className="kicker">How drops work</p>
              <h2>A release cycle built to last</h2>
            </div>
          </div>
          <div className="flow">
            {HOW.map((s, i) => (
              <div className="flow-step" key={s.title}>
                <div className="flow-icon">
                  <Coin size={76} tone={s.tone} glyph={s.glyph} uid={`how${i}`} className={i % 2 ? "float-b" : "float-a"} />
                </div>
                <span className="n">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="partners" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <div>
              <p className="kicker">Launch partners</p>
              <h2>Partners who keep releasing</h2>
            </div>
          </div>
          <div className="partners">
            {partners.map((p: PartnerView) => (
              <div className="partner" key={p.slug}>
                <Coin size={56} tone={p.tone as CoinTone} glyph="ledger" uid={`pt-${p.slug}`} />
                <h3>{p.name}</h3>
                <span className="sector">{p.sector}</span>
                <div className="pips" aria-label={`${p.seasons} seasons launched`}>
                  {Array.from({ length: 6 }, (_, i) => (
                    <i key={i} data-on={i < p.seasons} />
                  ))}
                </div>
                <div className="partner-foot">
                  <span>Since {p.since}</span>
                  <span>{p.releases} releases</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="cta-band">
          <h2>Launch your next season with us</h2>
          <p>Bring your brand, your community and your ideas. We&rsquo;ll bring the creators and the collectors.</p>
          <Link href="/register" className="btn btn-primary btn-lg">
            Become a partner
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
