"use client";

/* ============================================================
   Cadastra Pass — artwork generated deterministically from the
   account email. The same address always produces the same
   image, so the artwork itself identifies the account.
   ============================================================ */

import { useEffect, useRef } from "react";
import { rngFrom } from "@/lib/hash";

export function PassCanvas({ seed, active = true }: { seed: number; active?: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      w = Math.max(1, Math.floor(r.width));
      h = Math.max(1, Math.floor(r.height));
      cv.width = Math.floor(w * dpr);
      cv.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (p: number) => {
      const rnd = rngFrom(seed);
      const hue = Math.floor(rnd() * 360);
      const hue2 = (hue + 40 + Math.floor(rnd() * 120)) % 360;
      const rings = 7 + Math.floor(rnd() * 7);
      const cells = 5 + Math.floor(rnd() * 4);
      const tilt = (rnd() - 0.5) * 0.7;

      ctx.clearRect(0, 0, w, h);

      /* ground */
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, `hsl(${hue} 34% 8%)`);
      g.addColorStop(1, `hsl(${hue2} 26% 5%)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h * 0.46;
      const R = Math.min(w, h) * 0.4;

      /* concentric rings, opening with progress p */
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(tilt);
      for (let i = 0; i < rings; i++) {
        const t = i / rings;
        const rad = R * (0.18 + t * 0.95);
        const span = (0.5 + rnd() * 1.5) * Math.PI * p;
        const start = rnd() * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(0, 0, rad, start, start + span);
        ctx.strokeStyle = `hsl(${i % 2 ? hue2 : hue} ${45 + t * 35}% ${58 + t * 22}% / ${0.14 + (1 - t) * 0.5})`;
        ctx.lineWidth = i % 3 === 0 ? 2.2 : 0.9;
        ctx.stroke();
      }
      ctx.restore();

      /* ledger rule marks */
      const step = w / (cells * 2);
      ctx.strokeStyle = `hsl(${hue} 20% 70% / 0.09)`;
      ctx.lineWidth = 1;
      for (let x = step; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(Math.floor(x) + 0.5, 0);
        ctx.lineTo(Math.floor(x) + 0.5, h);
        ctx.stroke();
      }

      /* generated glyph: a polyline drawn from the seed */
      ctx.beginPath();
      const pts = 4 + Math.floor(rnd() * 5);
      for (let i = 0; i <= pts; i++) {
        const x = cx + (i / pts - 0.5) * R * 2.1;
        const y = cy + (rnd() - 0.5) * R * 1.25;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `hsl(${hue2} 88% 66% / ${0.85 * p})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      /* holding marks */
      const dots = 22 + Math.floor(rnd() * 26);
      for (let i = 0; i < dots * p; i++) {
        const a = rnd() * Math.PI * 2;
        const d = Math.sqrt(rnd()) * R * 1.15;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, rnd() < 0.12 ? 2.1 : 0.9, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${rnd() < 0.5 ? hue : hue2} 80% 74% / ${0.2 + rnd() * 0.6})`;
        ctx.fill();
      }

      /* progress rule */
      ctx.fillStyle = `hsl(${hue2} 80% 60% / 0.5)`;
      ctx.fillRect(0, h - 2, w * p, 2);
    };

    resize();

    if (!active || reduce) {
      draw(1);
    } else {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / 620);
        draw(p < 1 ? p * p * (3 - 2 * p) : 1);
        if (p < 1) raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    }

    const ro = new ResizeObserver(() => {
      resize();
      draw(1);
    });
    ro.observe(cv);

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
    };
  }, [seed, active]);

  return <canvas ref={ref} aria-label="Generated Cadastra Pass artwork" role="img" />;
}
