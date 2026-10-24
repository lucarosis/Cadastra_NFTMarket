/* Terra Ledger Studio — a generative series rendered from code.

   Original works owned by Terra Ledger: every image is drawn here from a seed,
   so the same seed always gives the same artwork and nothing is borrowed.
   render(style, seed) returns an SVG string (1600 × 1600). */

const W = 1600;
const INK = ["#07070c", "#0c0c14", "#11111a"];
const HUES = ["#d4ff3a", "#8b5cf6", "#38e1ff", "#ff5cc8", "#ffcf5a", "#f4f3f8"];

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* smooth 2-D value noise, enough for fields and ridges */
function noise2(seed) {
  const r = rng(seed);
  const P = Array.from({ length: 256 }, () => r());
  const h = (x, y) => P[(x * 73 + y * 151 + ((x * y) & 0xff)) & 255];
  const s = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * s(xf) + (c - a) * s(yf) + (a - b - c + d) * s(xf) * s(yf);
  };
}

const f = (n) => n.toFixed(1);
const pick = (r, a) => a[Math.floor(r() * a.length)];
const palette = (r) => {
  const p = [...HUES].sort(() => r() - 0.5);
  return p.slice(0, 3);
};
const frame = (bg, body, defs = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${W}" viewBox="0 0 ${W} ${W}"><defs>${defs}</defs><rect width="${W}" height="${W}" fill="${bg}"/>${body}</svg>`;

const STYLES = {
  flow(r, seed) {
    const n = noise2(seed);
    const [a, b, c] = palette(r);
    const lines = [];
    for (let i = 0; i < 1100; i++) {
      let x = r() * W, y = r() * W;
      const pts = [`M${f(x)} ${f(y)}`];
      for (let s = 0; s < 70; s++) {
        const ang = n(x / 260, y / 260) * Math.PI * 4;
        x += Math.cos(ang) * 9; y += Math.sin(ang) * 9;
        if (x < 0 || y < 0 || x > W || y > W) break;
        pts.push(`L${f(x)} ${f(y)}`);
      }
      const col = i % 7 === 0 ? c : x < W / 2 ? a : b;
      lines.push(`<path d="${pts.join("")}" stroke="${col}" stroke-opacity=".55" stroke-width="1.6" fill="none"/>`);
    }
    return frame(INK[0], lines.join(""));
  },

  contour(r) {
    const [a, b, c] = palette(r);
    const cx = W * (0.35 + r() * 0.3), cy = W * (0.35 + r() * 0.3);
    const k1 = 3 + Math.floor(r() * 5), k2 = 2 + Math.floor(r() * 4), ph = r() * 6;
    const rings = [];
    for (let i = 1; i < 70; i++) {
      const rad = i * 15;
      const pts = [];
      for (let t = 0; t <= 360; t += 3) {
        const th = (t * Math.PI) / 180;
        const rr = rad + Math.sin(th * k1 + ph + i * 0.08) * (8 + i * 0.9) + Math.cos(th * k2 - i * 0.05) * i * 0.6;
        pts.push(`${f(cx + Math.cos(th) * rr)},${f(cy + Math.sin(th) * rr)}`);
      }
      const col = i % 9 === 0 ? c : i % 2 ? a : b;
      rings.push(`<polygon points="${pts.join(" ")}" fill="none" stroke="${col}" stroke-width="${i % 9 === 0 ? 5 : 2.4}" stroke-opacity=".9"/>`);
    }
    return frame(INK[1], rings.join(""));
  },

  truchet(r) {
    const [a, b] = palette(r);
    const N = 14, S = W / N, out = [];
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const X = x * S, Y = y * S, flip = r() < 0.5;
        const col = (x + y) % 3 === 0 ? b : a;
        const arcs = flip
          ? `M${X + S / 2} ${Y} A${S / 2} ${S / 2} 0 0 1 ${X} ${Y + S / 2} M${X + S} ${Y + S / 2} A${S / 2} ${S / 2} 0 0 0 ${X + S / 2} ${Y + S}`
          : `M${X + S / 2} ${Y} A${S / 2} ${S / 2} 0 0 0 ${X + S} ${Y + S / 2} M${X} ${Y + S / 2} A${S / 2} ${S / 2} 0 0 1 ${X + S / 2} ${Y + S}`;
        out.push(`<path d="${arcs}" stroke="${col}" stroke-width="${S * 0.18}" stroke-linecap="round" fill="none"/>`);
      }
    return frame(INK[0], out.join(""));
  },

  packing(r) {
    const cols = palette(r);
    const circles = [];
    for (let i = 0; i < 6000 && circles.length < 420; i++) {
      const x = r() * W, y = r() * W;
      let rad = 6 + r() * 150;
      for (const c of circles) rad = Math.min(rad, Math.hypot(c.x - x, c.y - y) - c.r - 5);
      rad = Math.min(rad, x - 10, y - 10, W - x - 10, W - y - 10);
      if (rad > 6) circles.push({ x, y, r: rad });
    }
    const body = circles.map((c, i) => {
      const col = cols[i % 3];
      return i % 4 === 0
        ? `<circle cx="${f(c.x)}" cy="${f(c.y)}" r="${f(c.r)}" fill="none" stroke="${col}" stroke-width="3"/>`
        : `<circle cx="${f(c.x)}" cy="${f(c.y)}" r="${f(c.r)}" fill="${col}" fill-opacity="${(0.35 + (i % 5) * 0.12).toFixed(2)}"/>`;
    });
    return frame(INK[1], body.join(""));
  },

  moire(r) {
    const [a, b] = palette(r);
    const sets = [[W * (0.38 + r() * 0.08), W * 0.45, a], [W * (0.55 + r() * 0.08), W * 0.55, b]];
    const body = sets.map(([cx, cy, col]) =>
      Array.from({ length: 70 }, (_, i) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${i * 17 + 6}" fill="none" stroke="${col}" stroke-width="6" stroke-opacity=".8"/>`).join(""));
    return frame(INK[0], body.join(""));
  },

  survey(r, seed) {
    const n = noise2(seed);
    const [a, , c] = palette(r);
    const rows = [];
    for (let i = 0; i < 64; i++) {
      const base = 170 + i * 20;
      const pts = [];
      for (let x = 120; x <= W - 120; x += 8) {
        const centre = 1 - Math.abs(x - W / 2) / (W / 2 - 120);
        const h = Math.pow(n(x / 140, i / 3), 3) * 260 * Math.pow(centre, 1.6);
        pts.push(`${x},${f(base - h)}`);
      }
      rows.push(`<polyline points="120,${base} ${pts.join(" ")} ${W - 120},${base}" fill="${INK[0]}" stroke="${i % 11 === 0 ? c : a}" stroke-width="2"/>`);
    }
    return frame(INK[0], rows.join(""));
  },

  subdivide(r) {
    const cols = [...palette(r), "#f4f3f8", "#17172a", "#17172a"];
    const rects = [];
    const split = (x, y, w, h, d) => {
      if (d > 5 || (d > 2 && r() < 0.25) || w < 120 || h < 120) {
        rects.push(`<rect x="${f(x + 6)}" y="${f(y + 6)}" width="${f(w - 12)}" height="${f(h - 12)}" rx="10" fill="${pick(r, cols)}"/>`);
        return;
      }
      const t = 0.3 + r() * 0.4;
      if (w > h) { split(x, y, w * t, h, d + 1); split(x + w * t, y, w * (1 - t), h, d + 1); }
      else { split(x, y, w, h * t, d + 1); split(x, y + h * t, w, h * (1 - t), d + 1); }
    };
    split(60, 60, W - 120, W - 120, 0);
    return frame(INK[0], rects.join(""));
  },

  bands(r) {
    const [a, b, c] = palette(r);
    const defs = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".5" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
    const body = [];
    const k = 2 + r() * 3, ph = r() * 6;
    for (let i = 0; i < 28; i++) {
      const y0 = 60 + i * 55;
      let d = `M0 ${W}`;
      for (let x = 0; x <= W; x += 20) d += ` L${x} ${f(y0 + Math.sin((x / W) * Math.PI * k + ph + i * 0.35) * 90)}`;
      d += ` L${W} ${W} Z`;
      body.push(`<path d="${d}" fill="url(#g)" fill-opacity="${(0.08 + (i % 4) * 0.03).toFixed(2)}" stroke="${INK[0]}" stroke-width="3"/>`);
    }
    return frame(INK[0], body.join(""), defs);
  },

  orbits(r) {
    const [a, b, c] = palette(r);
    const body = [];
    for (let i = 0; i < 160; i++) {
      const rx = 120 + r() * 620, ry = 40 + r() * 260, rot = r() * 180;
      const col = i % 13 === 0 ? c : i % 2 ? a : b;
      body.push(`<ellipse cx="800" cy="800" rx="${f(rx)}" ry="${f(ry)}" transform="rotate(${f(rot)} 800 800)" fill="none" stroke="${col}" stroke-width="1.5" stroke-opacity=".6"/>`);
    }
    body.push(`<circle cx="800" cy="800" r="46" fill="${c}"/>`);
    return frame(INK[1], body.join(""));
  },

  rays(r) {
    const cols = palette(r);
    const ox = W * (0.2 + r() * 0.6), oy = W * (0.85 + r() * 0.1);
    const body = [];
    let ang = Math.PI * 1.05;
    while (ang < Math.PI * 1.95) {
      const w = 0.01 + r() * 0.05;
      const L = W * 1.6;
      const p = (t) => `${f(ox + Math.cos(t) * L)},${f(oy + Math.sin(t) * L)}`;
      body.push(`<polygon points="${f(ox)},${f(oy)} ${p(ang)} ${p(ang + w)}" fill="${pick(r, cols)}" fill-opacity="${(0.25 + r() * 0.6).toFixed(2)}"/>`);
      ang += w + r() * 0.02;
    }
    return frame(INK[0], body.join(""));
  },
};

export const STYLES_AVAILABLE = Object.keys(STYLES);

export function render(style, seed) {
  const fn = STYLES[style];
  if (!fn) throw new Error(`unknown style ${style}`);
  return fn(rng(seed), seed);
}
