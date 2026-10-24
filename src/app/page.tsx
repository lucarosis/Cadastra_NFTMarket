/* ============================================================
   Landing page — the only marketplace page open to visitors.

   Three jobs: make clear this is a crypto NFT market, say what is
   inside each members' page, and get a visitor to create a free
   account. Every figure comes from the catalogue or a live price
   feed — nothing is invented. Visitors see watermarked previews;
   members see clean artwork (the media route decides).

   Wallet connection is switched off for now; the page says so
   where it matters instead of pretending.
   ============================================================ */

import Image from "next/image";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { WorkCard } from "@/components/WorkCard";
import { Coin, type CoinGlyph, type CoinTone } from "@/components/visuals/Coin";
import { CryptoIcon, COINS, type CoinId } from "@/components/visuals/CryptoIcon";
import { TokenArt } from "@/components/visuals/TokenArt";
import { LogoFull } from "@/components/Logo";
import { assetSrc, creatorPhotoSrc } from "@/lib/media";
import { fmtDate } from "@/lib/format";
import { formatTez } from "@/lib/currency";
import { getXtzUsd } from "@/lib/price";
import { formatUsd, getCoinQuotes } from "@/lib/crypto-prices";
import { getMarketSummary, listCategories, listCreators, listDrops, listWorks } from "@/lib/repo";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

type Room = {
  href: string;
  name: string;
  glyph: CoinGlyph;
  tone: CoinTone;
  text: string;
  points: string[];
  open?: boolean;
};

const CAT_ART: Record<string, { glyph: CoinGlyph; tone: CoinTone; coins: CoinId[] }> = {
  art: { glyph: "brush", tone: "violet", coins: ["eth", "xtz", "sol"] },
  "real-estate": { glyph: "home", tone: "gold", coins: ["usdc", "usdt", "btc"] },
  gaming: { glyph: "play", tone: "cyan", coins: ["pol", "avax", "bnb"] },
};

/* coins around the hero stage: coin, left, top, size, float class */
const ORBIT: [CoinId, string, string, number, string][] = [
  ["btc", "-2%", "8%", 62, "float-a"],
  ["eth", "86%", "-1%", 58, "float-b"],
  ["xtz", "92%", "40%", 70, "float-c"],
  ["sol", "-5%", "48%", 46, "float-c"],
  ["usdt", "74%", "86%", 44, "float-a"],
  ["bnb", "30%", "-4%", 38, "float-b"],
  ["usdc", "22%", "97%", 40, "float-b"],
  ["avax", "50%", "92%", 34, "float-c"],
];

const CTA_COINS: [CoinId, string, string, number, string][] = [
  ["btc", "6%", "14%", 84, "float-a"],
  ["eth", "84%", "12%", 70, "float-b"],
  ["xtz", "88%", "62%", 92, "float-c"],
  ["sol", "10%", "64%", 58, "float-b"],
  ["usdc", "24%", "36%", 40, "float-c"],
  ["bnb", "72%", "40%", 40, "float-a"],
];

const STEPS: { coin: CoinId; title: string; text: string; soon?: boolean }[] = [
  { coin: "xtz", title: "Create a free account", text: "An email and a password. It takes a minute, and your Cadastra Pass is issued straight away." },
  { coin: "eth", title: "Explore the whole market", text: "Every work, drop and artist opens once you are signed in — with prices in tez and a live USD reference." },
  { coin: "sol", title: "Follow drops and artists", text: "See what launches next, who made it, and how each market is moving on your dashboard." },
  { coin: "btc", title: "Connect a wallet", text: "Wallet connection and on-chain purchases are being built. Your account will link to your wallet when they launch.", soon: true },
];

const TRUST: { coin: CoinId; title: string; text: string }[] = [
  { coin: "xtz", title: "Passwords never stored", text: "Only a salted scrypt hash is kept, so a password cannot be read back — not even by us." },
  { coin: "usdc", title: "Guarded sign-in", text: "Sign-in attempts are rate-limited per device and per account, and sessions can be revoked at any time." },
  { coin: "eth", title: "Originals stay private", text: "Master files have no public address. Visitors see watermarked previews; members see the artwork." },
  { coin: "btc", title: "Exact prices in tez", text: "Amounts are kept in mutez, the smallest unit of tez, so no price is ever rounded. USD is shown for reference." },
];

const HERO_COINS: CoinId[] = ["btc", "eth", "xtz", "sol", "usdt", "usdc", "bnb", "xrp", "ada", "doge"];
const WALLET_COINS: CoinId[] = ["xtz", "eth", "btc", "sol", "usdc", "usdt", "bnb", "pol", "avax", "dot", "ltc", "ada"];

function lockHref(href: string, member: boolean, open?: boolean) {
  return member || open ? href : `/login?next=${encodeURIComponent(href)}`;
}

export default async function Home() {
  const [viewer, works, summary, categories, drops, creators, rate, quotes] = await Promise.all([
    getViewer(),
    listWorks({ status: "Live", limit: 12 }),
    getMarketSummary(),
    listCategories(),
    listDrops(),
    listCreators(),
    getXtzUsd(),
    getCoinQuotes(),
  ]);

  const member = Boolean(viewer);
  const hero = works.slice(0, 3);
  const featured = works.slice(0, 8);
  const mosaic = works.slice(3, 7);
  const subcategoryCount = categories.reduce((n, c) => n + c.subcategories.length, 0);
  const liveDrop = drops.find((d) => d.status === "Live");
  /* an "Upcoming" drop whose date has passed is stale data, not news */
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = drops
    .filter((d) => d.status === "Upcoming" && d.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextDrop = liveDrop ?? upcoming[0];
  const seasons = [...(liveDrop ? [liveDrop] : []), ...upcoming].slice(0, 4);
  const priced = quotes.filter((q) => q.usd !== null);

  const rooms: Room[] = [
    {
      href: "/explore",
      name: "Explore",
      glyph: "gem",
      tone: "lime",
      text: `The whole market in one place: ${summary.listed} works across ${categories.length} markets, each with its creator, price, editions and history.`,
      points: [
        "Search by title, creator or token ID",
        `${categories.map((c) => c.name).join(", ")} — ${subcategoryCount} subcategories`,
        "Prices in tez with a live USD reference",
      ],
    },
    {
      href: "/drops",
      name: "Drops",
      glyph: "spark",
      tone: "pink",
      text: "New collections released every season with our long-term brand partners.",
      points: ["The live drop and its mint progress", "The release calendar", "How a drop is made"],
    },
    {
      href: "/creators",
      name: "Artists",
      glyph: "brush",
      tone: "violet",
      text: `The ${creators.length} artists who defined NFTs, from ${creators[0]?.name ?? "Beeple"} onwards, in a rolling showcase.`,
      points: ["Profiles and landmark sales", "Notable works", "Sources for every figure"],
    },
    {
      href: "/dashboard",
      name: "Dashboard",
      glyph: "face",
      tone: "cyan",
      text: "Your Cadastra Pass, your holdings and the market's signals in one view.",
      points: ["Today's highest sales", "Fairly priced favourites", "Rankings by category"],
    },
    {
      href: "/tezos",
      name: "Tezos guide",
      glyph: "hex",
      tone: "gold",
      text: "New to crypto? What tez is, which wallet to pick, what things cost and the risks to know first.",
      points: ["Choosing a wallet", "Fees and costs", "Risks, plainly"],
      open: true,
    },
  ];

  return (
    <>
      <TopBar />

      <main className="lp">
        {/* ── Hero ── */}
        <section className="lp-hero">
          <div className="lp-grid-bg" aria-hidden="true" />
          <div className="shell lp-hero-in">
            <div className="lp-hero-copy">
              <span className="lp-rate mono">
                <CryptoIcon coin="xtz" size={18} />
                Live on Tezos · 1 ꜩ = ${rate.usdPerTez.toFixed(rate.usdPerTez < 10 ? 3 : 2)}
                {rate.stale && <em> delayed</em>}
              </span>
              <h1>
                Own the art.
                <br />
                Hold the <span className="iri-text">ledger.</span>
              </h1>
              <p className="lp-lede">
                Cadastra is Terra Ledger&rsquo;s NFT marketplace on Tezos. Create a free account to open every work,
                drop and artist — priced in tez, with the crypto markets live alongside.
              </p>
              <div className="lp-cta">
                {member ? (
                  <>
                    <Link href="/explore" className="btn btn-primary btn-lg">Explore the market</Link>
                    <Link href="/dashboard" className="btn btn-lg">Your dashboard</Link>
                  </>
                ) : (
                  <>
                    <Link href="/register" className="btn btn-primary btn-lg">Create free account</Link>
                    <Link href="/login" className="btn btn-lg">Sign in</Link>
                  </>
                )}
              </div>
              <ul className="lp-proof">
                <li><Check /> Free account in a minute</li>
                <li><Check /> Priced in tez (ꜩ)</li>
                <li><Check /> Wallet connection coming soon</li>
              </ul>
              <div className="lp-coinrow" aria-label="Currencies tracked on Cadastra">
                {HERO_COINS.map((c) => (
                  <CryptoIcon key={c} coin={c} size={30} title={COINS[c].name} />
                ))}
                <span className="lp-coinrow-more mono">+{Object.keys(COINS).length - HERO_COINS.length}</span>
              </div>
            </div>

            <div className="lp-stage" aria-label="Works listed on Cadastra">
              <div className="lp-halo" aria-hidden="true" />
              <div className="lp-ring lp-ring-a" aria-hidden="true" />
              <div className="lp-ring lp-ring-b" aria-hidden="true" />
              {ORBIT.map(([coin, left, top, size, anim]) => (
                <CryptoIcon key={coin} coin={coin} size={size} className={`lp-orbit-coin ${anim}`} style={{ left, top }} />
              ))}
              {hero.map((w, i) => (
                <figure className={`lp-nft lp-nft-${i}`} key={w.id}>
                  <div className="lp-nft-img">
                    <Image src={assetSrc(w.id)} alt={`${w.name}, by ${w.designer}`} fill unoptimized priority={i === 0} sizes="320px" />
                  </div>
                  <figcaption>
                    <span>
                      <b>{w.name}</b>
                      <small>{w.designer}</small>
                    </span>
                    <span className="lp-nft-price mono">{formatTez(w.priceMutez)}</span>
                  </figcaption>
                </figure>
              ))}
              <div className="lp-chip lp-chip-a float-b">
                <CryptoIcon coin="xtz" size={30} />
                <span><b>Minted on Tezos</b><small>at first sale</small></span>
              </div>
              <div className="lp-chip lp-chip-b float-c">
                <Coin size={30} tone="gold" glyph="gem" uid="chip-b" />
                <span><b className="mono">{formatTez(summary.floorMutez)}</b><small>floor price</small></span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Market bar: real figures only ── */}
        <section className="shell" aria-label="Market at a glance">
          <dl className="lp-stats">
            <div>
              <dt><CryptoIcon coin="xtz" size={14} /> XTZ / USD</dt>
              <dd className="mono">${rate.usdPerTez.toFixed(3)}</dd>
              <small>{rate.stale ? "Reference rate, delayed" : "Live reference rate"}</small>
            </div>
            <div>
              <dt>Works listed</dt>
              <dd>{summary.listed.toLocaleString("en-US")}</dd>
              <small>{categories.length} markets</small>
            </div>
            <div>
              <dt>Creators</dt>
              <dd>{summary.creators.toLocaleString("en-US")}</dd>
              <small>with work on sale</small>
            </div>
            <div>
              <dt>Floor price</dt>
              <dd className="mono">{formatTez(summary.floorMutez)}</dd>
              <small>lowest listing</small>
            </div>
            <div>
              <dt>{liveDrop ? "Drop" : "Next drop"}</dt>
              <dd>{liveDrop ? <span className="lp-live-text">Live now</span> : nextDrop ? fmtDate(nextDrop.date) : "—"}</dd>
              <small>{nextDrop?.title ?? "Calendar soon"}</small>
            </div>
          </dl>
        </section>

        {/* ── Ticker: listings, not invented price moves ── */}
        {works.length > 0 && (
          <div className="ticker lp-ticker" aria-label="Works listed now">
            <div className="ticker-track">
              {[0, 1].map((copy) => (
                <div key={copy} style={{ display: "flex" }} aria-hidden={copy === 1}>
                  {works.map((w) => (
                    <span className="ticker-item" key={w.id}>
                      <CryptoIcon coin="xtz" size={18} />
                      <b>{w.name}</b> {formatTez(w.priceMutez)}
                      <span className="ticker-cat">{w.subcategory ?? w.category}</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── What is inside ── */}
        <section className="section shell" id="inside">
          <div className="section-head">
            <div>
              <p className="kicker">Inside Cadastra</p>
              <h2>Five rooms, one account</h2>
              <p>
                {member
                  ? "Everything is open to you. Here is what each part of the marketplace is for."
                  : "The marketplace opens with a free account. Here is what you will find once you are signed in."}
              </p>
            </div>
          </div>

          <div className="rooms">
            {rooms.map((r, i) => (
              <Link key={r.href} href={lockHref(r.href, member, r.open)} className={`room${i === 0 ? " room-wide" : ""}`}>
                <div className="room-top">
                  <Coin size={48} tone={r.tone} glyph={r.glyph} uid={`room-${i}`} />
                  <span className={`room-badge${r.open || member ? " room-open" : ""}`}>
                    {r.open ? "Open to all" : member ? "Open" : <><LockIcon /> Members</>}
                  </span>
                </div>
                <h3>
                  {r.name} <span className="mono room-path">{r.href}</span>
                </h3>
                <p>{r.text}</p>
                <ul>
                  {r.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                {i === 0 && mosaic.length > 0 && (
                  <div className="room-mosaic" aria-hidden="true">
                    {mosaic.map((w) => (
                      <span key={w.id}>
                        <Image src={assetSrc(w.id)} alt="" fill unoptimized sizes="120px" />
                      </span>
                    ))}
                  </div>
                )}
                <span className="room-go">
                  {r.open || member ? `Open ${r.name}` : "Sign in to open"} <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Live crypto markets ── */}
        <section className="section shell" id="markets" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <div>
              <p className="kicker">Crypto markets</p>
              <h2>The coins around the market, live</h2>
              <p>
                Cadastra lists in tez. These are the currencies collectors hold and watch, with
                prices from CoinGecko, refreshed every five minutes.
              </p>
            </div>
          </div>
          <div className="coingrid">
            {quotes.map((q) => (
              <div className="coincard" key={q.coin} style={{ "--coin": COINS[q.coin].color } as React.CSSProperties}>
                <div className="coincard-top">
                  <CryptoIcon coin={q.coin} size={40} />
                  <span>
                    <b>{COINS[q.coin].name}</b>
                    <small className="mono">{COINS[q.coin].symbol}</small>
                  </span>
                </div>
                <div className="coincard-price mono">{q.usd !== null ? formatUsd(q.usd) : "—"}</div>
                {q.change24h !== null ? (
                  <span className={`coincard-chg mono ${q.change24h >= 0 ? "up" : "down"}`}>
                    {q.change24h >= 0 ? "▲" : "▼"} {Math.abs(q.change24h).toFixed(2)}% · 24h
                  </span>
                ) : (
                  <span className="coincard-chg mono">price unavailable</span>
                )}
              </div>
            ))}
          </div>
          {priced.length === 0 && <p className="lp-fine">The price feed is not responding right now; prices return automatically.</p>}
        </section>

        {/* ── How it works ── */}
        <section className="section shell" id="how" style={{ paddingTop: 0 }}>
          <div className="howto">
            <div>
              <p className="kicker">How it works</p>
              <h2 className="lp-h2">From sign-up to collection in four steps</h2>
              <ol className="howto-steps">
                {STEPS.map((s, i) => (
                  <li key={s.title}>
                    <CryptoIcon coin={s.coin} size={44} />
                    <div>
                      <span className="mono howto-n">0{i + 1}{s.soon && <em className="soon-tag">Coming soon</em>}</span>
                      <h3>{s.title}</h3>
                      <p>{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="lp-cta" style={{ marginTop: 28 }}>
                {!member && <Link href="/register" className="btn btn-primary">Create free account</Link>}
                <Link href="/tezos" className="btn">Read the Tezos guide</Link>
              </div>
            </div>

            {/* The wallet panel that will connect — shown as what it is: coming */}
            <div className="walletcard" aria-label="Wallet connection, coming soon">
              <div className="walletcard-bar">
                <span className="dots" aria-hidden="true"><i /><i /><i /></span>
                <span className="mono">Wallet connection</span>
                <span className="wallet-soon-badge">Coming soon</span>
              </div>
              <div className="walletcard-body">
                <p>
                  Buying, selling and minting on-chain arrive with wallet connection. Until then your
                  account works with email, and everything you follow carries over.
                </p>
                <div className="walletcard-coins">
                  {WALLET_COINS.map((c) => (
                    <span key={c}>
                      <CryptoIcon coin={c} size={34} />
                      <small className="mono">{COINS[c].symbol}</small>
                    </span>
                  ))}
                </div>
              </div>
              <div className="walletcard-foot">
                <span className="mono">Planned: Tezos wallets · WalletConnect</span>
                <span className="btn" aria-hidden="true">Connect wallet</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── From the market ── */}
        {featured.length > 0 && (
          <section className="section shell" style={{ paddingTop: 0 }}>
            <div className="section-head">
              <div>
                <p className="kicker">From the market</p>
                <h2>Most collected right now</h2>
                {!member && <p>Previews are watermarked. Members see every work in full resolution.</p>}
              </div>
              <Link href={lockHref("/explore", member)} className="btn">
                {member ? "Browse all works →" : "Sign in to browse all →"}
              </Link>
            </div>
            <div className="grid">
              {featured.map((w) => (
                <WorkCard key={w.id} work={w} usdRate={rate.usdPerTez} />
              ))}
            </div>
          </section>
        )}

        {/* ── Three markets ── */}
        <section className="shell" style={{ paddingBottom: "clamp(56px,8vw,110px)" }}>
          <div className="section-head">
            <div>
              <p className="kicker">Markets</p>
              <h2>Art, property and play — on one ledger</h2>
            </div>
          </div>
          <div className="markets">
            {categories.map((c) => {
              const art = CAT_ART[c.slug] ?? { glyph: "gem" as CoinGlyph, tone: "lime" as CoinTone, coins: ["xtz"] as CoinId[] };
              const listed = c.subcategories.reduce((n, s) => n + s.works, 0);
              return (
                <Link key={c.slug} href={lockHref(`/explore/${c.slug}`, member)} className="market">
                  <div className="market-icons">
                    <Coin size={58} tone={art.tone} glyph={art.glyph} uid={`mk-${c.slug}`} className="spin" />
                    <span className="market-coins" aria-hidden="true">
                      {art.coins.map((k) => <CryptoIcon key={k} coin={k} size={26} />)}
                    </span>
                  </div>
                  <span className="arrow" aria-hidden="true">↗</span>
                  <h3>{c.name}</h3>
                  <p>{c.blurb}</p>
                  <div className="market-subs">
                    {c.subcategories.map((s) => (
                      <span key={s.slug}>{s.name}</span>
                    ))}
                  </div>
                  <span className="mono market-n">{listed} listed</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Drops with partners ── */}
        {seasons.length > 0 && (
          <section className="shell" style={{ paddingBottom: "clamp(56px,8vw,110px)" }}>
            <div className="mission">
              <div className="mission-in">
                <div>
                  <p className="kicker">Drops</p>
                  <h2>New creations, released with partners who stay.</h2>
                  <p>
                    We don&rsquo;t list and leave. Every brand partner launches season after season on
                    Cadastra, so there is always something new to collect.
                  </p>
                  <Link href={lockHref("/drops", member)} className="btn btn-primary">
                    {member ? "See the drop calendar" : "Sign in for the calendar"}
                  </Link>
                </div>
                <div className="seasons">
                  {seasons.map((d) => (
                    <div className="season" key={d.id} data-live={d.status === "Live"}>
                      <span className="season-thumb">
                        <Image src={assetSrc(d.id)} alt="" fill unoptimized sizes="56px" />
                      </span>
                      <span>
                        <b>{d.title}</b>
                        <small>
                          {d.partnerName} · {d.season} · {formatTez(d.priceMutez)}
                        </small>
                      </span>
                      <span className="when">{d.status === "Live" ? "● Live now" : fmtDate(d.date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Artists: five, compact ── */}
        <section className="shell" style={{ paddingBottom: "clamp(56px,8vw,110px)" }}>
          <div className="section-head">
            <div>
              <p className="kicker">Top artists</p>
              <h2>The artists who defined NFTs</h2>
            </div>
            <Link href={lockHref("/creators", member)} className="btn">
              See all {creators.length} →
            </Link>
          </div>
          <div className="artists5">
            {creators.slice(0, 5).map((c) => (
              <Link key={c.slug} href={lockHref(`/creators#${c.slug}`, member)} className="artist-mini">
                <span className="artist-mini-photo">
                  {c.photo ? (
                    <Image
                      src={creatorPhotoSrc(c.slug)}
                      alt={c.photo.subject ?? c.name}
                      fill
                      unoptimized
                      sizes="112px"
                      style={{ objectFit: "cover", objectPosition: c.photo.focus ?? "50% 30%" }}
                    />
                  ) : (
                    <TokenArt seed={c.slug} hue={c.hue} variant="portrait" label={`${c.name} placeholder`} />
                  )}
                </span>
                <span className="artist-mini-rank mono">#{c.rank}</span>
                <h3>{c.name}</h3>
                <p className="artist-mini-known">{c.known}</p>
                <p className="artist-mini-head">
                  <b className="iri-text">{c.headline.value}</b>
                  <small>{c.headline.caption}</small>
                </p>
              </Link>
            ))}
          </div>
          <p className="lp-fine">Editorial feature. Terra Ledger is not affiliated with or endorsed by these artists.</p>
        </section>

        {/* ── Security ── */}
        <section className="section shell" id="trust" style={{ paddingTop: 0 }}>
          <div className="section-head" style={{ justifyContent: "center", textAlign: "center" }}>
            <div>
              <p className="kicker">Security</p>
              <h2>Built like a vault, open like a market</h2>
            </div>
          </div>
          <div className="trust">
            {TRUST.map((t) => (
              <div className="trust-item" key={t.title}>
                <CryptoIcon coin={t.coin} size={48} />
                <h3>{t.title}</h3>
                <p>{t.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Final call to action ── */}
        <section className="shell">
          <div className="cta-band">
            {CTA_COINS.map(([coin, left, top, size, anim]) => (
              <CryptoIcon key={coin} coin={coin} size={size} className={`deco ${anim}`} style={{ left, top }} />
            ))}
            <LogoFull width={260} className="cta-logo" />
            {member ? (
              <>
                <h2>The market is open</h2>
                <p>{summary.listed} works are listed right now.</p>
                <Link href="/explore" className="btn btn-primary btn-lg">Explore the market</Link>
              </>
            ) : (
              <>
                <h2>Your free account opens the market</h2>
                <p>Sign up with your email and every work, drop and artist is yours to explore. Your Cadastra Pass is issued instantly.</p>
                <Link href="/register" className="btn btn-primary btn-lg">Create free account</Link>
              </>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}
