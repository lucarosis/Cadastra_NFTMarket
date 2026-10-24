"use client";

/* Last-resort error page, for failures in the root layout itself. It replaces the whole
   document, so it carries its own minimal styling. */

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#07070c", color: "#f4f3f8", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 560, margin: "0 auto", padding: "96px 24px" }}>
          <h1 style={{ fontSize: 30, margin: "0 0 12px" }}>Cadastra could not load</h1>
          <p style={{ color: "#b6b5c6", lineHeight: 1.6 }}>
            Something went wrong on the server. Try again in a moment. If you run this site, open{" "}
            <a href="/api/health" style={{ color: "#d4ff3a" }}>/api/health</a> to see what is missing.
          </p>
          {error.digest && <p style={{ color: "#56556a", fontSize: 12 }}>Reference: {error.digest}</p>}
          <button onClick={reset} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 999, border: 0, background: "#d4ff3a", fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
