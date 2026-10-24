"use client";

/* ============================================================
   The signed-in account, for client components.

   Accounts are email and password (src/app/api/auth/*). The
   server reads the session during rendering and hands it in as
   initialAccount, so the header is right on first paint.

   Wallet connection is not part of this: it is switched off until
   the blockchain integration is built (see ConnectWalletButton).
   ============================================================ */

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type Account = {
  id: string;
  email: string;
  displayName: string | null;
  role: "client" | "sales";
  passId: string;
  seed: number;
  createdAt: string;
};

type Result = { ok: true; name: string } | { ok: false; error: string };

type Ctx = {
  account: Account | null;
  /** Kept for components that wait for the session; it is known at first paint. */
  ready: boolean;
  busy: boolean;
  signIn: (email: string, password: string) => Promise<Result>;
  register: (data: { email: string; password: string; displayName: string; acceptTerms: boolean }) => Promise<Result>;
  signOut: () => Promise<void>;
};

const AccountCtx = createContext<Ctx | null>(null);

async function post(url: string, body: unknown): Promise<{ ok: boolean; error?: string; user?: Account; email?: string; displayName?: string | null }> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return await res.json();
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection and try again." };
  }
}

export function AccountProvider({
  children,
  initialAccount = null,
}: {
  children: React.ReactNode;
  initialAccount?: Account | null;
}) {
  const [account, setAccount] = useState<Account | null>(initialAccount);
  const [busy, setBusy] = useState(false);

  /* Signing in opens a session; registering only creates the account — the new
     member signs in next, on the sign-in page. */
  const signIn = useCallback<Ctx["signIn"]>(async (email, password) => {
    setBusy(true);
    try {
      const json = await post("/api/auth/login", { email, password });
      if (!json.ok || !json.user) return { ok: false, error: json.error ?? "Something went wrong. Try again." };
      setAccount(json.user);
      return { ok: true, name: json.user.displayName || json.user.email.split("@")[0] };
    } finally {
      setBusy(false);
    }
  }, []);

  const register = useCallback<Ctx["register"]>(async (data) => {
    setBusy(true);
    try {
      const json = await post("/api/auth/register", data);
      if (!json.ok) return { ok: false, error: json.error ?? "Something went wrong. Try again." };
      return { ok: true, name: json.displayName || (json.email ?? data.email).split("@")[0] };
    } finally {
      setBusy(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
    setAccount(null);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ account, ready: true, busy, signIn, register, signOut }),
    [account, busy, signIn, register, signOut],
  );

  return <AccountCtx.Provider value={value}>{children}</AccountCtx.Provider>;
}

export function useAccount(): Ctx {
  const c = useContext(AccountCtx);
  if (!c) throw new Error("useAccount must be called inside AccountProvider");
  return c;
}
