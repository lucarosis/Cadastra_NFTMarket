import Link from "next/link";
import { LogoFull } from "./Logo";
import { CryptoIcon, COINS, COIN_IDS } from "./visuals/CryptoIcon";

export function SiteFooter({ note }: { note?: string }) {
  return (
    <footer className="site">
      <div className="shell">
        <div className="foot-grid">
          <div>
            <LogoFull width={180} className="foot-logo" />
            <p style={{ color: "var(--ink-3)", fontSize: 14, maxWidth: "34ch", margin: "10px 0 0" }}>
              Cadastra is the NFT marketplace by Terra Ledger: collect art, property and play on Tezos, with new releases every season.
            </p>
            <div className="foot-coins" aria-label="Currencies tracked">
              {COIN_IDS.map((c) => (
                <CryptoIcon key={c} coin={c} size={22} title={COINS[c].name} />
              ))}
            </div>
          </div>
          <div>
            <h4>Marketplace</h4>
            <ul>
              <li><Link href="/explore">Explore assets</Link></li>
              <li><Link href="/drops">Drop calendar</Link></li>
              <li><Link href="/creators">Top artists</Link></li>
              <li><Link href="/tezos">New to Tezos?</Link></li>
            </ul>
          </div>
          <div>
            <h4>Account</h4>
            <ul>
              <li><Link href="/register">Create free account</Link></li>
              <li><Link href="/login">Sign in</Link></li>
              <li><Link href="/dashboard">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4>Partners</h4>
            <ul>
              <li><Link href="/drops#partners">Launch with us</Link></li>
              <li><Link href="/drops#how">How drops work</Link></li>
            </ul>
          </div>
        </div>
        <div className="foot-base">
          <span>© 2026 Terra Ledger</span>
          <span>{note ?? "Listings, prices and accounts on this build are demo data."}</span>
        </div>
      </div>
    </footer>
  );
}
