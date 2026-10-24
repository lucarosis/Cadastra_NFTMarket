"use client";

/* Shown when a page fails on the server. In production the cause is almost always
   the database; /api/health says which part is missing. */

export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="shell" style={{ padding: "96px 0", maxWidth: 640 }}>
      <p className="kicker">Something went wrong</p>
      <h1 style={{ fontFamily: "var(--display)", fontSize: 36, letterSpacing: "-0.03em", margin: "14px 0 12px" }}>
        This page could not load
      </h1>
      <p style={{ color: "var(--ink-2)" }}>
        The server could not prepare this page. Try again in a moment. If you run this site, open{" "}
        <a href="/api/health" style={{ color: "var(--lime)" }}>/api/health</a> to see which setting is missing.
      </p>
      {error.digest && <p className="mono" style={{ fontSize: 12, color: "var(--ink-4)" }}>Reference: {error.digest}</p>}
      <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={reset}>Try again</button>
    </main>
  );
}
