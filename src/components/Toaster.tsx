"use client";

/* Notifications in the top-right corner of the screen.

   useToast().show({ title, body }) from any client component. The toast survives a
   page change: it is kept in sessionStorage until shown, so a message raised just
   before navigating still appears on the next page. Each one closes by itself after
   six seconds, or with its close button; screen readers announce it politely. */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type Tone = "success" | "info" | "error";
export type Toast = { id: string; title: string; body?: string; tone?: Tone };

type Ctx = { show: (t: Omit<Toast, "id">) => void };
const ToastCtx = createContext<Ctx | null>(null);

const STORE = "cadastra.toasts";
const LIFETIME_MS = 6000;

function readPending(): Toast[] {
  try {
    const raw = sessionStorage.getItem(STORE);
    sessionStorage.removeItem(STORE);
    return raw ? (JSON.parse(raw) as Toast[]) : [];
  } catch {
    return [];
  }
}

function writePending(list: Toast[]) {
  try {
    if (list.length) sessionStorage.setItem(STORE, JSON.stringify(list));
    else sessionStorage.removeItem(STORE);
  } catch {
    /* storage blocked: the toast still shows on this page */
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const arm = useCallback((t: Toast) => {
    if (timers.current.has(t.id)) return;
    timers.current.set(t.id, setTimeout(() => dismiss(t.id), LIFETIME_MS));
  }, [dismiss]);

  const show = useCallback<Ctx["show"]>((t) => {
    const toast: Toast = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, tone: "success", ...t };
    /* kept until displayed, in case a page change happens first */
    writePending([...readPending(), toast]);
    setToasts((list) => [...list, toast]);
  }, []);

  /* show what an earlier page left pending */
  useEffect(() => {
    const t = setTimeout(() => {
      const pending = readPending();
      if (pending.length) setToasts((list) => [...list, ...pending.filter((p) => !list.some((x) => x.id === p.id))]);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  /* once on screen: start its timer and drop it from the pending store */
  useEffect(() => {
    if (!toasts.length) return;
    toasts.forEach(arm);
    writePending(readPending().filter((p) => !toasts.some((t) => t.id === p.id)));
  }, [toasts, arm]);

  useEffect(() => {
    const all = timers.current;
    return () => all.forEach((timer) => clearTimeout(timer));
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone ?? "success"}`}>
            <span className="toast-icon" aria-hidden="true">{t.tone === "error" ? "!" : t.tone === "info" ? "i" : "✓"}</span>
            <div className="toast-text">
              <b>{t.title}</b>
              {t.body && <p>{t.body}</p>}
            </div>
            <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Close notification">×</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): Ctx {
  const c = useContext(ToastCtx);
  if (!c) throw new Error("useToast must be called inside ToastProvider");
  return c;
}
