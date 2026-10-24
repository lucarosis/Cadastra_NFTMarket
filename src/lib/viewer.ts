/* ============================================================
   Who is making this request? (server only)

   The proxy only checks that the session cookie is signed and in
   date — it cannot reach the database cheaply. Anything that
   depends on *who* the viewer is (role, revocation) goes through
   getViewer(), which also checks the account still exists and the
   cookie was issued after users.sessions_valid_after.

   The account is found by id and must carry the session's email:
   ids are only unique within one database, so the email is what
   makes a session point at exactly one person.
   ============================================================ */

import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";
import { getUserByEmail, getUserById, type UserView } from "./repo";
import { restoreFromCopy } from "./account-copy";

export async function getViewer(): Promise<UserView | null> {
  const store = await cookies();
  const session = verifySessionToken(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  let user = await getUserById(session.sub);
  if (!user || user.email !== session.em) user = await getUserByEmail(session.em);
  if (!user) user = (await restoreFromCopy(session.em))?.user ?? null; /* temporary database only */
  if (!user) return null;
  if (session.iat < user.sessionsValidAfter) return null; /* revoked */
  return user;
}

export async function isSalesViewer(): Promise<boolean> {
  return (await getViewer())?.role === "sales";
}
