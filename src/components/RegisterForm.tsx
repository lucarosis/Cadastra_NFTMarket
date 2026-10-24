"use client";

/* Create an account — open to anyone. Email, password, a display name and the
   terms of sale; the server records the terms version with the account. No
   wallet is needed: wallet connection comes later. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthArtPanel } from "@/components/AuthArtPanel";
import { useAccount } from "@/lib/account";
import { safeNext } from "@/lib/redirect";
import { useToast } from "@/components/Toaster";

/* the sign-in page fills the email in from here */
export const PREFILL_KEY = "cadastra.prefill-email";

const MIN = 8;

export function RegisterForm({ next }: { next: string | null }) {
  const router = useRouter();
  const { account, busy, register } = useAccount();
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account) router.replace(safeNext(next));
  }, [account, router, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const r = await register({ email, password, displayName: name, acceptTerms: accepted });
    if (!r.ok) {
      setError(r.error);
      return;
    }
    /* registering does not sign in: congratulate, then go to the sign-in page */
    try {
      sessionStorage.setItem(PREFILL_KEY, email.trim().toLowerCase());
    } catch {
      /* storage blocked: the member types the email again */
    }
    toast.show({
      title: `Congratulations, ${r.name}!`,
      body: "Your Cadastra account is ready. Sign in to open the market.",
    });
    router.push(`/login?registered=1${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  };

  return (
    <div className="auth">
      <AuthArtPanel email={email} handle={name} caption="Your Cadastra Pass is drawn from your email address. Type it in and watch your pass appear." />

      <main className="auth-form">
        <form className="auth-form-in" onSubmit={submit}>
          <p className="label">Create account</p>
          <h1>Join the market</h1>
          <p className="sub">Free, and open to everyone. One account opens every listing, drop and artist on Cadastra.</p>

          {error && <p className="err" role="alert">{error}</p>}

          <div className="field">
            <label htmlFor="name">Display name <span className="optional">optional</span></label>
            <input id="name" autoComplete="nickname" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Marchetti" />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="pw">
              <input
                id="password"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={MIN}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby="pw-hint"
              />
              <button type="button" className="mini" onClick={() => setShow((v) => !v)} aria-pressed={show}>
                {show ? "Hide" : "Show"}
              </button>
            </div>
            <p className="field-hint" id="pw-hint">
              At least {MIN} characters{password && password.length < MIN ? ` — ${MIN - password.length} more` : ""}.
            </p>
          </div>

          <label className="check">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            <span>I accept the terms of sale and understand that digital assets can lose value.</span>
          </label>

          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={busy || !accepted}>
            {busy ? "Creating your account…" : "Create account"}
          </button>

          <p className="authswap">
            Already a member? <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Sign in</Link>. New to crypto?{" "}
            <Link href="/tezos">Read the Tezos guide</Link>.
          </p>
        </form>
      </main>
    </div>
  );
}
