/* One asset in a grid. No hooks, so it renders on the server or inside a
   client component alike. */

import Image from "next/image";
import Link from "next/link";
import { assetSrc } from "@/lib/media";
import { formatTez, usdFromMutez } from "@/lib/currency";
import type { WorkView } from "@/lib/repo";
import { CryptoIcon } from "./visuals/CryptoIcon";

export const fmtLikes = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export function WorkCard({ work: d, usdRate, priority = false }: { work: WorkView; usdRate: number; priority?: boolean }) {
  return (
    <Link className="card" href={`/nft/${encodeURIComponent(d.id)}`}>
      <div className="card-img">
        <Image
          src={assetSrc(d.id)}
          alt={`${d.name}, an NFT by ${d.designer}`}
          fill
          unoptimized
          loading={priority ? "eager" : "lazy"}
          sizes="(max-width:480px) 100vw, (max-width:780px) 50vw, (max-width:1100px) 33vw, 25vw"
        />
        <span className="card-id">{d.id}</span>
        <span className="card-cat">{d.subcategory ?? d.category}</span>
      </div>
      <div className="card-body">
        <h3>{d.name}</h3>
        <p className="card-artist">{d.studio || d.designer}</p>
        <div className="card-foot">
          <span>
            <span className="label" style={{ display: "block", letterSpacing: ".08em" }}>Price</span>
            <span className="card-price"><CryptoIcon coin="xtz" size={16} /> {formatTez(d.priceMutez, { symbol: false })}</span>
            <span className="mono" style={{ display: "block", fontSize: 11, color: "var(--ink-4)" }}>
              {usdFromMutez(d.priceMutez, usdRate)}
            </span>
          </span>
          <span className="card-likes">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 21s-8-4.9-8-10.4A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 3.6C20 16.1 12 21 12 21z" />
            </svg>
            {fmtLikes(d.likes)}
          </span>
        </div>
      </div>
    </Link>
  );
}
