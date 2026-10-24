/* Who is signed in (GET), and signing out (DELETE). */

import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ ok: true, user: await getViewer() });
}

export async function DELETE() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
