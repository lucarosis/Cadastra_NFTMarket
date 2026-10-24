/* Restoring an account on a server that has not seen it (server only).

   Only in temporary-database mode (Vercel without DATABASE_URL), where each server has
   its own in-memory database. The browser's encrypted account copy (ACCOUNT_COOKIE, see
   session.ts) lets any server recreate the account it describes. */

import { cookies } from "next/headers";
import { isTemporaryDatabase } from "@/db/client";
import { ACCOUNT_COOKIE, openAccount } from "./session";
import { createUser, getUserByEmail, type UserView } from "./repo";

export async function restoreFromCopy(email: string): Promise<{ user: UserView; passwordHash: string } | null> {
  if (!isTemporaryDatabase()) return null;
  const copy = openAccount((await cookies()).get(ACCOUNT_COOKIE)?.value);
  if (!copy || copy.email !== email.trim().toLowerCase()) return null;

  const user =
    (await createUser({
      email: copy.email,
      passwordHash: copy.passwordHash,
      displayName: copy.displayName,
      termsVersion: copy.termsVersion,
    })) ?? (await getUserByEmail(copy.email)); /* another request restored it first */
  return user ? { user, passwordHash: copy.passwordHash } : null;
}
