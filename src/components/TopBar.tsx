"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { useAccount } from "@/lib/account";

/* Members see the market. Visitors see the landing page's sections — the
   market pages would only send them to sign in. */
const MEMBER_NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/drops", label: "Drops" },
  { href: "/creators", label: "Artists" },
  { href: "/dashboard", label: "Dashboard" },
];

const VISITOR_NAV = [
  { href: "/#inside", label: "Marketplace" },
  { href: "/#markets", label: "Crypto" },
  { href: "/#how", label: "How it works" },
  { href: "/tezos", label: "Tezos guide" },
];

export function TopBar() {
  const { account } = useAccount();
  const path = usePathname();
  const links = account ? MEMBER_NAV : VISITOR_NAV;

  return (
    <header className="topbar">
      <div className="shell topbar-in">
        <Link href="/" aria-label="Cadastra home">
          <Logo />
        </Link>

        <nav className="topbar-nav" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={!l.href.includes("#") && path.startsWith(l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="topbar-actions">
          {account ? (
            <AccountMenu />
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Sign in</Link>
              <Link href="/register" className="btn btn-primary">Create account</Link>
            </>
          )}
          {/* The wallet button stays right-most on every page (decision Q3). */}
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}

function AccountMenu() {
  const { account, signOut } = useAccount();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!account) return null;
  const name = account.displayName || account.email.split("@")[0];

  return (
    <div className="wallet-box" ref={box}>
      <button className="btn account-pill" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="account-avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
        <span className="account-name">{name}</span>
      </button>
      {open && (
        <div className="wallet-menu">
          <p className="wallet-addr">{account.email}</p>
          <p className="wallet-sub">
            {account.role === "sales" ? "Sales team" : "Collector"} · {account.passId}
          </p>
          <Link className="wallet-item" href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
          <Link className="wallet-item" href="/explore" onClick={() => setOpen(false)}>Explore the market</Link>
          <Link className="wallet-item" href="/drops" onClick={() => setOpen(false)}>Drops</Link>
          <Link className="wallet-item" href="/creators" onClick={() => setOpen(false)}>Artists</Link>
          <button
            className="wallet-item wallet-danger"
            onClick={async () => {
              setOpen(false);
              await signOut();
              router.push("/");
              router.refresh();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
