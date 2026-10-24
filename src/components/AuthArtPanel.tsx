"use client";

import Link from "next/link";
import { PassCanvas } from "./PassCanvas";
import { Logo } from "./Logo";
import { CryptoIcon, type CoinId } from "./visuals/CryptoIcon";
import { seedFrom, passIdFrom } from "@/lib/hash";

/* Coins drifting around the pass: position, size, delay */
const FLOAT: [CoinId, string, string, number, string][] = [
  ["btc", "8%", "18%", 54, "float-a"], ["eth", "80%", "14%", 48, "float-b"], ["xtz", "84%", "62%", 60, "float-c"],
  ["sol", "6%", "66%", 44, "float-b"], ["usdc", "70%", "84%", 36, "float-a"], ["bnb", "86%", "84%", 34, "float-c"],
];

export function AuthArtPanel({ email, handle, caption }: { email: string; handle: string; caption: string }) {
  /* the pass is drawn from the email, so this preview is the pass the account gets */
  const clean = email.trim().toLowerCase();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean);
  const seed = seedFrom(valid ? clean : "unclaimed");

  return (
    <aside className="auth-art">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, position: "relative", zIndex: 2 }}>
        <Link href="/">
          <Logo />
        </Link>
        <span className="label">Cadastra Pass</span>
      </div>

      {FLOAT.map(([coin, left, top, size, anim]) => (
        <CryptoIcon key={coin} coin={coin} size={size} className={`auth-coin ${anim}`} style={{ left, top }} />
      ))}

      <div className="passframe">
        <div className="passcard">
          <PassCanvas seed={seed} />
          <div className="passcard-meta">
            <div style={{ marginBottom: 10 }}>
              <div className="k">Holder</div>
              <div className="v">{handle || (valid ? clean : "— your name —")}</div>
            </div>
            <div className="passcard-row">
              <div>
                <div className="k">Pass ID</div>
                <div className="v">{valid ? passIdFrom(seed) : "CP-————-————"}</div>
              </div>
              <div>
                <div className="k">Wallet</div>
                <div className="v">Coming soon</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)", lineHeight: 1.8, margin: 0, maxWidth: "46ch", position: "relative", zIndex: 2 }}>
        {caption}
      </p>
    </aside>
  );
}
