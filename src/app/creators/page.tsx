import type { Metadata } from "next";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { CreatorSlideshow } from "@/components/CreatorSlideshow";
import { CryptoIcon, type CoinId } from "@/components/visuals/CryptoIcon";
import { listCreators } from "@/lib/repo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Top 10 NFT artists — Cadastra",
  description: "The ten artists who defined NFTs, from Beeple to FEWOCiOUS — with their landmark works.",
};

const UPDATED = "September 2026";
const HEAD_COINS: CoinId[] = ["eth", "xtz", "sol", "btc"];

export default async function CreatorsPage() {
  const creators = await listCreators();

  return (
    <>
      <TopBar />
      <main className="shell">
        <header className="page-head page-head-coins">
          <div>
            <p className="kicker">Top 10 artists</p>
            <h1>The artists who defined NFTs</h1>
            <p>
              From the world&rsquo;s best-selling digital artist to the pioneers of generative art —
              the ten artists every collector should know, one at a time.
            </p>
          </div>
          <div className="head-coins" aria-hidden="true">
            {HEAD_COINS.map((c, i) => (
              <CryptoIcon key={c} coin={c} size={[64, 48, 56, 40][i]} className={["float-a", "float-b", "float-c", "float-b"][i]} />
            ))}
          </div>
        </header>

        <CreatorSlideshow creators={creators} />

        <p className="disclaimer">
          Editorial feature, updated {UPDATED}. Ranking reflects landmark sales and influence and is
          compiled from public reporting. Terra Ledger is not affiliated with or endorsed by these
          artists. Photos are used with permission and credited; artworks are placeholders until
          licensed images are supplied.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
