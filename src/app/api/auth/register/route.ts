/* Create an account: email, password, a display name, the terms. Open to anyone.

   Registering does not sign in: the new member goes to the sign-in page next.
   In temporary-database mode the browser also receives an encrypted copy of the
   account, so every server can recognise it (see session.ts). */

import { cookies } from "next/headers";
import { createUser } from "@/lib/repo";
import { hashPassword, passwordProblem } from "@/lib/password";
import { ACCOUNT_COOKIE, MissingSecretError, accountCookie, sealAccount } from "@/lib/session";
import { isTemporaryDatabase } from "@/db/client";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { TERMS_VERSION } from "@/lib/site";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const bad = (error: string, status = 400) => Response.json({ ok: false, error }, { status });

export async function POST(request: Request) {
  const limited = rateLimit(`register:${clientIp(request.headers)}`, 5, 10 * 60_000);
  if (!limited.ok) return tooMany(limited.retryAfterSeconds);

  let body: { email?: string; password?: string; displayName?: string; acceptTerms?: boolean };
  try {
    body = await request.json();
  } catch {
    return bad("Invalid body");
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const displayName = String(body.displayName ?? "").trim().slice(0, 60) || null;

  if (!EMAIL.test(email)) return bad("Enter a valid email address.");
  const weak = passwordProblem(password);
  if (weak) return bad(weak);
  if (body.acceptTerms !== true) return bad("Accept the terms of sale to create an account.");

  const passwordHash = await hashPassword(password);
  const user = await createUser({ email, passwordHash, displayName, termsVersion: TERMS_VERSION });
  if (!user) return bad("An account with that email already exists. Sign in instead.", 409);

  if (isTemporaryDatabase()) {
    try {
      (await cookies()).set(ACCOUNT_COOKIE, sealAccount({ email, passwordHash, displayName, termsVersion: TERMS_VERSION }), accountCookie);
    } catch (e) {
      if (e instanceof MissingSecretError) return bad("Registration is unavailable: server not configured.", 503);
      throw e;
    }
  }

  return Response.json({ ok: true, email: user.email, displayName: user.displayName });
}
