"use client";

/* Sign in with email and password. `next` is where a members-only page sent
   the visitor from; safeNext checks it before following it. */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthArtPanel } from "@/components/AuthArtPanel";
import { useAccount } from "@/lib/account";
import { safeNext } from "@/lib/redirect";
import { useToast } from "@/components/Toaster";
import { PREFILL_KEY } from "@/components/RegisterForm";

export function LoginForm({ next, registered = false }: { next: string | null; registered?: boolean }) {
  const router = useRouter();
  const { account, busy, signIn } = useAccount();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  /* set once this form has signed someone in: it navigates once, itself */
  const done = useRef(false);

  /* just registered: fill in the email they used */
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const saved = sessionStorage.getItem(PREFILL_KEY);
        if (saved) {
          setEmail((current) => current || saved);
          sessionStorage.removeItem(PREFILL_KEY);
        }
      } catch {
        /* storage blocked */
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  /* already signed in when the page opened: go on to where they were heading */
  useEffect(() => {
    if (account && !done.current) router.replace(safeNext(next));
  }, [account, router, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (busy || done.current) return;
    const r = await signIn(email, password);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    done.current = true;
    toast.show({ title: `Welcome, ${r.name}!`, body: "You have signed in successfully." });
    router.replace(safeNext(next));
    router.refresh();
  };

  return (
    <div className="auth">
      <AuthArtPanel email={email} handle="" caption="Your Cadastra Pass is drawn from your email address, so it is the same on every device you sign in from." />

      <main className="auth-form">
        <form className="auth-form-in" onSubmit={submit}>
          <p className="label">Sign in</p>
          <h1>Welcome back</h1>
          <p className="sub">Sign in to open the whole market: every listing, drop, artist and your dashboard.</p>

          {registered && !error && <p className="ok">Your account is ready. Sign in with the email and password you just chose.</p>}
          {next && !registered && !error && <p className="field-hint" style={{ marginTop: -14, marginBottom: 20 }}>Sign in to continue to that page.</p>}
          {error && <p className="err" role="alert">{error}</p>}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>

          <p className="authswap">
            New here? <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Create a free account</Link>. Designers do
            not sign in — they work from their review link.
          </p>
        </form>
      </main>
    </div>
  );
}
