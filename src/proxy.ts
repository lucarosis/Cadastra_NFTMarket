/* Route protection: the marketplace is members-only.

   Next 16 renamed `middleware` to `proxy`; the runtime is Node.js, so the
   signed session cookie can be verified here with node:crypto. This is the
   coarse gate (signed and in date). Anything that depends on who the viewer
   is — role, revocation — is checked again on the server via getViewer().

   Open to everyone:
     /                 landing page
     /login /register  getting in
     /tezos            how to get a wallet, needed before you can register
     /review/<token>   designers, who have no account; the token is the credential
     /api/auth/*       the sign-in handshake
     /api/health       deployment check: yes/no facts only
     /api/media/*      decides per request (visitors get watermarked previews
                       of listed works only, for the landing page) */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const PUBLIC_EXACT = new Set(["/", "/login", "/register", "/tezos", "/manifest.webmanifest"]);
const PUBLIC_PREFIX = ["/review/", "/api/auth/", "/api/media/", "/api/health"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_EXACT.has(pathname) || PUBLIC_PREFIX.some((p) => pathname.startsWith(p));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const session = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  /* everything except Next's own assets and static files */
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)"],
};
