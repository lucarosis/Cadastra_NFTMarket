"use server";

/* Server actions for designer feedback.

   Server actions are public HTTP endpoints: anyone can call them with any
   arguments, whatever the UI shows. Each one therefore checks its own
   credential — the review token for designers, a sales session for the team. */

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { insertSuggestion, updateSuggestionStatus } from "./repo";
import { getViewer } from "./viewer";
import { clientIp, rateLimit } from "./rate-limit";

const STATUSES = ["Open", "Acknowledged", "Applied"] as const;
type Status = (typeof STATUSES)[number];

export async function submitSuggestion(reviewToken: string, author: string, body: string) {
  const text = String(body ?? "").trim();
  if (!text) return { ok: false as const, error: "Write a suggestion first." };
  if (text.length > 4000) return { ok: false as const, error: "That suggestion is too long." };

  const ip = clientIp(await headers());
  const limited = rateLimit(`suggest:${ip}`, 10, 10 * 60_000);
  if (!limited.ok) return { ok: false as const, error: "Too many suggestions in a short time. Try again shortly." };

  const name = String(author ?? "").trim().slice(0, 80) || "Anonymous designer";
  const done = await insertSuggestion(String(reviewToken ?? ""), name, text);
  if (!done) return { ok: false as const, error: "This review link is no longer valid." };

  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function setSuggestionStatus(id: number, status: Status) {
  const viewer = await getViewer();
  if (viewer?.role !== "sales") return { ok: false as const, error: "Only the sales team can change this." };
  if (!Number.isInteger(id) || !STATUSES.includes(status)) return { ok: false as const, error: "Invalid request." };

  await updateSuggestionStatus(id, status);
  revalidatePath("/dashboard");
  return { ok: true as const };
}
