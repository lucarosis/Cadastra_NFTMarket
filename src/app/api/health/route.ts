/* Deployment health check: what the site needs, and whether it has it.

   Open /api/health on a deployment to see why pages fail. It reports only yes/no
   facts and counts — never the database address, the secret or any account data. */

import { access } from "node:fs/promises";
import path from "node:path";
import { databaseUrl, getDb } from "@/db/client";
import { MEDIA_ROOT } from "@/lib/media-render";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {
    /* persistent: hosted PostgreSQL. temporary: the demo database the build shipped
       (accounts reset when a server restarts). local: a developer's machine. */
    databaseMode: databaseUrl() ? "persistent" : process.env.VERCEL ? "temporary" : "local",
    sessionSecret: (process.env.SESSION_SECRET ?? "").length >= 16
      ? "configured"
      : (process.env.DEPLOY_SESSION_SECRET ?? "").length >= 16
        ? "generated for this deployment"
        /* outside production the built-in development secret is used, so sign-in works */
        : process.env.NODE_ENV !== "production" ? "development default" : "missing",
    imagesBundled: await access(path.join(MEDIA_ROOT, "nft", "catalog.csv")).then(() => true, () => false),
  };

  try {
    const db = await getDb();
    const r = await db.execute(sql`
      SELECT (SELECT count(*) FROM categories)::int AS categories,
             (SELECT count(*) FROM works WHERE status = 'Live')::int AS works`);
    checks.databaseConnected = true;
    checks.categories = Number(r.rows[0]?.categories ?? 0);
    checks.listedWorks = Number(r.rows[0]?.works ?? 0);
  } catch (e) {
    checks.databaseConnected = false;
    /* the database library wraps the driver's error; the cause holds the real reason */
    const err = e as { message?: string; cause?: { message?: string } };
    const msg = `${err?.message ?? e} ${err?.cause?.message ?? ""}`;
    /* name the kind of failure without echoing connection details */
    checks.databaseError = /does not exist/.test(msg)
      ? "Tables are missing: the build did not set up the database"
      : /No database configured/.test(msg)
        ? "DATABASE_URL is not set for this environment"
        : /password|authentication|SSL|ENOTFOUND|ECONNREFUSED|timeout/i.test(msg)
          ? "Cannot reach the database: check DATABASE_URL"
          : "Database error (see the deployment's runtime logs)";
    /* the demo database has no address or password, so its message is safe to show */
    if (checks.databaseMode === "temporary") checks.databaseErrorDetail = msg.trim().slice(0, 300);
  }

  const ok = checks.sessionSecret !== "missing" && checks.databaseConnected === true
    && Number(checks.listedWorks ?? 0) > 0;
  return Response.json({ ok, ...checks }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
