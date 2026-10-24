"use client";

/* The wallet button — a placeholder.

   Wallet connection is switched off: it will be rebuilt by the blockchain
   engineer (Tezos wallets, WalletConnect, on-chain purchases). Until then the
   button stays in its place, right-most in the header (decision Q3), and only
   says that it is coming. It loads no wallet library and talks to no network. */

import { useEffect, useRef, useState } from "react";
import { CryptoIcon } from "./visuals/CryptoIcon";

export function ConnectWalletButton() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div className="wallet-box" ref={box}>
      <button className="btn wallet-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="dialog" aria-label="Connect wallet (coming soon)">
        <WalletIcon /> <span className="wallet-btn-text">Connect wallet</span>
      </button>
      {open && (
        <div className="wallet-menu" role="dialog" aria-label="Wallet connection">
          <p className="wallet-soon">
            <span className="wallet-soon-badge">Coming soon</span>
          </p>
          <p className="wallet-note">
            Wallet connection is being built. Your Cadastra account works without one — sign in
            with your email to browse and save the market.
          </p>
          <div className="wallet-coins" aria-hidden="true">
            {(["xtz", "eth", "btc", "sol", "usdc"] as const).map((c) => (
              <CryptoIcon key={c} coin={c} size={26} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WalletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1" />
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M16 13.5h2" />
    </svg>
  );
}
