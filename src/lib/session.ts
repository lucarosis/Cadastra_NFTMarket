/* ============================================================
   Server-side session cookie (HttpOnly, signed).

   Issued only after the password has been checked (or the
   account created), and carries the account id. The media route
   checks this cookie before handing out artwork.
   ============================================================ */

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "tl.session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; /* 7 days */

/* Development only. This value is public (it is in the repository), so a
   production server must never sign or accept cookies with it. */
const DEV_SECRET = "terra-ledger-dev-secret-change-me";

export class MissingSecretError extends Error {
  constructor() {
    super("SESSION_SECRET is not set (16+ characters required in production).");
  }
}

function secret(): string {
  /* DEPLOY_SESSION_SECRET is generated per deployment by the build when SESSION_SECRET
     is not set (scripts/setup.mjs, next.config.ts) */
  const s = process.env.SESSION_SECRET || process.env.DEPLOY_SESSION_SECRET;
  if (s && s.length >= 16) return s;
  /* Fail closed: without a real secret, production issues no sessions and accepts none. */
  if (process.env.NODE_ENV === "production") throw new MissingSecretError();
  return DEV_SECRET;
}

/* The role is deliberately not in the cookie: it is read from the database on
   every request (src/lib/viewer.ts), so promoting or demoting a wallet takes
   effect at once rather than when the cookie expires. */
export type SessionPayload = {
  /** Id of the signed-in account (users.id). */
  sub: string;
  /** Its email. Ids are only unique within one database; the email is checked too, so a
      session can never resolve to someone else's account. */
  em: string;
  /** Issued at, in milliseconds — compared with users.sessions_valid_after. */
  iat: number;
  exp: number;
};

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url").toString("utf8");
const sign = (body: string) => createHmac("sha256", secret()).update(body).digest("base64url");

export function createSessionToken(payload: { sub: string; em: string }, now = Date.now()): string {
  const full: SessionPayload = {
    sub: payload.sub, em: payload.em.toLowerCase(), iat: now, exp: Math.floor(now / 1000) + SESSION_MAX_AGE,
  };
  const body = b64(JSON.stringify(full));
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;

  let expected: string;
  try {
    expected = sign(body);
  } catch {
    return null; /* no secret configured: treat every cookie as invalid */
  }
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(unb64(body)) as SessionPayload;
    if (!payload?.exp || payload.exp * 1000 < Date.now()) return null;
    if (typeof payload.iat !== "number" || !payload.sub || typeof payload.em !== "string" || !payload.em) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Cookie attributes for the session: never readable by scripts, sent only to this site. */
export const sessionCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

/* ---------- the account copy (temporary-database mode only) ----------
   Without DATABASE_URL, every Vercel server holds its own in-memory database, so an
   account created on one is unknown to the others. The browser therefore keeps an
   encrypted copy of its own account (AES-256-GCM, key derived from the session secret);
   any server can read it and restore the account. With a real database this is unused. */

export const ACCOUNT_COOKIE = "tl.account";
export const ACCOUNT_MAX_AGE = 60 * 60 * 24 * 30; /* 30 days */

export type AccountCopy = {
  email: string;
  passwordHash: string;
  displayName: string | null;
  termsVersion: string;
};

const accountKey = () => createHash("sha256").update(`${secret()}:account-copy`).digest();

export function sealAccount(copy: AccountCopy): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", accountKey(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(copy), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function openAccount(token: string | undefined): AccountCopy | null {
  if (!token) return null;
  try {
    const [iv, tag, data] = token.split(".").map((p) => Buffer.from(p, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", accountKey(), iv);
    decipher.setAuthTag(tag);
    const copy = JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8")) as AccountCopy;
    return copy?.email && copy?.passwordHash ? copy : null;
  } catch {
    return null; /* tampered, or sealed with another deployment's secret */
  }
}

export const accountCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ACCOUNT_MAX_AGE,
};
