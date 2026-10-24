/* Where to send someone after they sign in. Safe in client components.

   `next` arrives in the URL, so anyone can craft it. Only same-site paths are
   accepted; "//evil.example" and "https://…" would leave the site. */

export function safeNext(next: string | null | undefined, fallback = "/explore"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  /* never bounce back to the sign-in screens themselves */
  if (/^\/(login|register)(\/|\?|$)/.test(next)) return fallback;
  return next;
}
