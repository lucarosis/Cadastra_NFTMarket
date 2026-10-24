/* Sign in with email and password.

   One message for every failure, and the same work whether or not the email exists,
   so the form cannot be used to find out who has an account. */

import { cookies } from "next/headers";
import { getLoginByEmail, touchUser } from "@/lib/repo";
import { dummyHash, verifyPassword } from "@/lib/password";
import { SESSION_COOKIE, MissingSecretError, createSessionToken, sessionCookie } from "@/lib/session";
import { restoreFromCopy } from "@/lib/account-copy";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const WRONG = "That email and password do not match an account.";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  /* per client, and per account so one address cannot be guessed at from many places */
  for (const key of [`login:${clientIp(request.headers)}`, `login-email:${email}`]) {
    const limited = rateLimit(key, 10, 15 * 60_000);
    if (!limited.ok) return tooMany(limited.retryAfterSeconds);
  }

  /* in temporary-database mode the account may live only in the browser's account copy */
  const found = email && password ? (await getLoginByEmail(email)) ?? (await restoreFromCopy(email)) : null;
  const ok = await verifyPassword(password, found?.passwordHash ?? (await dummyHash()));
  if (!found || !ok) return Response.json({ ok: false, error: WRONG }, { status: 401 });

  try {
    (await cookies()).set(SESSION_COOKIE, createSessionToken({ sub: found.user.id, em: found.user.email }), sessionCookie);
  } catch (e) {
    if (e instanceof MissingSecretError) {
      return Response.json({ ok: false, error: "Sign-in is unavailable: server not configured." }, { status: 503 });
    }
    throw e;
  }
  await touchUser(found.user.id);
  return Response.json({ ok: true, user: found.user });
}
