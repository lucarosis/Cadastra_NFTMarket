"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitSuggestion } from "@/lib/actions";

export function SuggestionForm({ reviewToken, studio }: { reviewToken: string; studio: string }) {
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const r = await submitSuggestion(reviewToken, author, body);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setBody("");
      setSent(true);
      router.refresh(); /* the thread below is rendered on the server */
    });
  };

  return (
    <>
      {sent && (
        <p className="ok">
          Thank you — your suggestion is now with the account team. You can add another below.
        </p>
      )}
      {error && <p className="err">{error}</p>}

      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="author">Your name or studio</label>
          <input
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={80}
            placeholder={studio}
          />
        </div>
        <div className="field">
          <label htmlFor="body">What would you change, and why?</label>
          <textarea
            id="body"
            value={body}
            rows={6}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Be specific about the change and its effect — the team acts on these directly."
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={pending || !body.trim()}>
          {pending ? "Sending…" : "Send suggestion"}
        </button>
      </form>
    </>
  );
}
