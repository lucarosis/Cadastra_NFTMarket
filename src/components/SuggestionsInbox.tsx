"use client";

/* Designer feedback, as seen by the sales team.

   Suggestions are database rows now, so a note left by a designer
   on their own machine reaches the team on every other machine.
   Status changes go through a server action. */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setSuggestionStatus } from "@/lib/actions";
import { AGO } from "@/lib/format";
import type { InternalWorkView, SuggestionView } from "@/lib/repo";

export function SuggestionsInbox({ suggestions }: { suggestions: SuggestionView[] }) {
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const list = onlyOpen ? suggestions.filter((s) => s.status === "Open") : suggestions;
  const openCount = suggestions.filter((s) => s.status === "Open").length;

  const move = (id: number, status: "Open" | "Acknowledged" | "Applied") =>
    startTransition(async () => {
      await setSuggestionStatus(id, status);
      router.refresh();
    });

  return (
    <>
      <div className="panel-head">
        <div className="chart-title">
          <b>Designer suggestions</b>
        </div>
        <div className="filters">
          <button className="chip" data-on={!onlyOpen} onClick={() => setOnlyOpen(false)}>
            All {suggestions.length}
          </button>
          <button className="chip" data-on={onlyOpen} onClick={() => setOnlyOpen(true)}>
            Open {openCount}
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="panel-body">
          <p style={{ margin: 0, color: "var(--ink-3)", fontSize: 13.5 }}>
            Nothing open. New suggestions arrive here when a designer submits one from their
            review link.
          </p>
        </div>
      ) : (
        <ul className="inbox" style={pending ? { opacity: 0.6 } : undefined}>
          {list.map((s) => (
            <li key={s.id}>
              <div className="inbox-top">
                <span className="inbox-who">
                  <b>{s.author}</b>
                  <span className="inbox-asset">
                    {s.workCode} · {s.workTitle}
                  </span>
                </span>
                <span className={`pill pill-${s.status.toLowerCase()}`}>{s.status}</span>
              </div>
              <p>{s.body}</p>
              <div className="inbox-actions">
                <span className="label" style={{ marginRight: 4 }}>{AGO(s.createdAt)}</span>
                {s.status !== "Acknowledged" && (
                  <button className="mini" disabled={pending} onClick={() => move(s.id, "Acknowledged")}>
                    Acknowledge
                  </button>
                )}
                {s.status !== "Applied" && (
                  <button className="mini" disabled={pending} onClick={() => move(s.id, "Applied")}>
                    Mark applied
                  </button>
                )}
                {s.status !== "Open" && (
                  <button className="mini" disabled={pending} onClick={() => move(s.id, "Open")}>
                    Reopen
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* Assets waiting on a designer, with the link to send them. */
export function ReviewLinks({ pending }: { pending: InternalWorkView[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (token: string) => {
    const url = `${window.location.origin}/review/${token}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard may be blocked; the link is visible either way */
    }
    setCopied(token);
    window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <>
      <div className="panel-head">
        <div className="chart-title">
          <b>Awaiting the designer</b>
        </div>
        <span className="label">{pending.length} assets</span>
      </div>
      <div className="panel-body" style={{ paddingBottom: 8 }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)" }}>
          Designers have no account here. Send them the link for the asset and they can review the
          work and reply with suggestions.
        </p>
      </div>
      {pending.map((d) => (
        <div className="linkrow" key={d.id}>
          <span className={`status status-${d.status.replace(/\s/g, "-").toLowerCase()}`}>
            {d.status}
          </span>
          <code>/review/{d.reviewToken}</code>
          <button className="mini" onClick={() => copy(d.reviewToken)}>
            {copied === d.reviewToken ? "Copied" : "Copy"}
          </button>
          <a className="mini" href={`/review/${d.reviewToken}`} target="_blank" rel="noopener noreferrer">
            Open
          </a>
        </div>
      ))}
    </>
  );
}
