/* ============================================================
   "New to Tezos?" — the explainer the wallet flow links to.

   IMPORTANT: this page is promotional copy about a crypto-asset.
   Marketing crypto is regulated in most markets (for example the
   EU's MiCA marketing-communication rules and the UK's financial
   promotion regime). Keep it factual, keep the risk warning, and
   have counsel approve the wording before launch — plan step 0.3.
   No price predictions, no returns, no "investment" language.
   ============================================================ */

import type { Metadata } from "next";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { Coin, type CoinGlyph, type CoinTone } from "@/components/visuals/Coin";
import { getXtzUsd } from "@/lib/price";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New to Tezos? — Cadastra",
  description: "What tez is, how to set up a Tezos wallet, and what it costs to buy and hold assets on Cadastra.",
};

const STEPS: { glyph: CoinGlyph; tone: CoinTone; title: string; text: string }[] = [
  { glyph: "face", tone: "cyan", title: "Get a wallet", text: "A wallet holds your assets and signs your transactions. Nobody else can move them." },
  { glyph: "gem", tone: "violet", title: "Add some tez", text: "Tez (ꜩ) is the currency of the Tezos network. Exchanges sell it; your wallet can receive it." },
  { glyph: "ledger", tone: "lime", title: "Connect and collect", text: "Coming soon: connect your wallet to Cadastra and the assets you buy arrive in it directly." },
];

const WALLETS = [
  { name: "Temple", note: "Browser extension and mobile app, widely used across Tezos.", url: "https://templewallet.com/" },
  { name: "Kukai", note: "Web wallet that can create an account from a Google, Apple or email sign-in.", url: "https://wallet.kukai.app/" },
  { name: "Umami", note: "Desktop and mobile wallet from Nomadic Labs.", url: "https://umamiwallet.com/" },
];

export default async function TezosPage() {
  const rate = await getXtzUsd();

  return (
    <>
      <TopBar />
      <main className="shell">
        <header className="page-head">
          <p className="kicker">New to Tezos?</p>
          <h1>How buying works here</h1>
          <p>
            Cadastra runs on Tezos, and assets are priced in tez (ꜩ). Wallet connection is coming
            soon; in the meantime this page covers everything you need before your first purchase.
          </p>
        </header>

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="flow">
            {STEPS.map((s, i) => (
              <div className="flow-step" key={s.title} style={{ gridColumn: "span 1" }}>
                <div className="flow-icon">
                  <Coin size={76} tone={s.tone} glyph={s.glyph} uid={`tz${i}`} className={i % 2 ? "float-b" : "float-a"} />
                </div>
                <span className="n">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <div>
              <p className="kicker">Wallets</p>
              <h2>Where your assets live</h2>
              <p>
                Cadastra does not hold your assets or your keys. These wallets work with Tezos;
                we are not affiliated with any of them, and the choice is yours.
              </p>
            </div>
          </div>
          <div className="partners">
            {WALLETS.map((w) => (
              <a className="partner" key={w.name} href={w.url} target="_blank" rel="noopener noreferrer">
                <Coin size={56} tone="cyan" glyph="hex" uid={`w-${w.name}`} />
                <h3>{w.name}</h3>
                <span className="sector">{w.note}</span>
                <div className="partner-foot" style={{ marginTop: 16 }}>
                  <span>Official site ↗</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <div>
              <p className="kicker">Costs</p>
              <h2>What you pay</h2>
            </div>
          </div>
          <div className="facts" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            <div>
              <b>ꜩ 1 ≈ ${rate.usdPerTez.toFixed(4)}</b>
              <small>{rate.stale ? "Reference rate — live feed unavailable" : "Live reference rate, updated every few minutes"}</small>
            </div>
            <div>
              <b>Network fee</b>
              <small>A small fee per transaction, paid to the Tezos network, not to us</small>
            </div>
            <div>
              <b>Listed price</b>
              <small>Always shown in tez. Any dollar figure is a reference only</small>
            </div>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="panel">
            <div className="panel-head">
              <span className="label">Before you buy</span>
            </div>
            <div className="panel-body">
              <ul style={{ margin: 0, paddingLeft: 18, color: "var(--ink-2)", fontSize: 14.5, lineHeight: 1.8 }}>
                <li>The value of tez changes, and it can fall as well as rise.</li>
                <li>Transactions on Tezos are irreversible. Check the address and the amount before you confirm.</li>
                <li>You are responsible for your wallet&rsquo;s recovery phrase. Anyone who has it can take your assets, and nobody can restore it for you.</li>
                <li>Digital assets are not bank deposits and are not protected by a deposit guarantee scheme.</li>
                <li>Nothing on this page is investment advice or a recommendation to buy any asset.</li>
              </ul>
            </div>
          </div>
        </section>

        <div className="cta-band">
          <h2>Ready when you are</h2>
          <p>Create a free account to browse the market — you do not need a wallet to look around.</p>
          <Link href="/register" className="btn btn-primary btn-lg">
            Create free account
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
