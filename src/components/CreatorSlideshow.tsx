"use client";

/* The ten artists as an automatic slideshow.

   Advances every 7 seconds. It pauses while the pointer is over it or focus is
   inside it, has a pause button (WCAG 2.2.2), and does not start on its own for
   visitors who ask for reduced motion. Arrow keys move between artists, and a
   link to /creators#slug opens on that artist. */

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { TokenArt } from "@/components/visuals/TokenArt";
import { creatorPhotoSrc } from "@/lib/media";
import type { CreatorView } from "@/lib/repo";

const INTERVAL_MS = 7000;

export function CreatorSlideshow({ creators }: { creators: CreatorView[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const root = useRef<HTMLElement | null>(null);
  const count = creators.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  /* reduced motion: start paused; open on the artist named in the URL */
  useEffect(() => {
    const fromHash = () => {
      const i = creators.findIndex((c) => `#${c.slug}` === window.location.hash);
      if (i >= 0) go(i);
    };
    const t = setTimeout(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
      fromHash();
    }, 0);
    window.addEventListener("hashchange", fromHash);
    return () => {
      clearTimeout(t);
      window.removeEventListener("hashchange", fromHash);
    };
  }, [creators, go]);

  const running = playing && !hovered && !focused && count > 1;
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => clearTimeout(t);
  }, [running, index, go]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
  };

  if (!count) return null;

  return (
    <section
      ref={root}
      className="slides"
      aria-roledescription="carousel"
      aria-label="Top artists"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => { if (!root.current?.contains(e.relatedTarget as Node)) setFocused(false); }}
      onKeyDown={onKey}
    >
      {/* the strip of all ten, also the navigation */}
      <div className="slides-strip" role="tablist" aria-label="Choose an artist">
        {creators.map((c, i) => (
          <button
            key={c.slug}
            role="tab"
            aria-selected={i === index}
            aria-controls={`slide-${c.slug}`}
            className="strip-item"
            onClick={() => go(i)}
          >
            <span className="strip-photo">
              {c.photo ? (
                <Image src={creatorPhotoSrc(c.slug)} alt="" fill unoptimized sizes="44px"
                  style={{ objectFit: "cover", objectPosition: c.photo.focus ?? "50% 30%" }} />
              ) : (
                <TokenArt seed={c.slug} hue={c.hue} variant="portrait" />
              )}
            </span>
            <span className="strip-name">
              <i className="mono">{String(c.rank).padStart(2, "0")}</i> {c.name}
            </span>
          </button>
        ))}
      </div>

      <div className="slides-stage">
        {creators.map((c, i) => (
          <article
            key={c.slug}
            id={`slide-${c.slug}`}
            className="slide"
            role="tabpanel"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}: ${c.name}`}
            hidden={i !== index}
          >
            <div className="slide-photo-col">
              <div className="slide-photo">
                {c.photo ? (
                  <Image src={creatorPhotoSrc(c.slug)} alt={c.photo.subject ?? c.name} fill unoptimized sizes="240px"
                    priority={i === 0} style={{ objectFit: "cover", objectPosition: c.photo.focus ?? "50% 30%" }} />
                ) : (
                  <TokenArt seed={c.slug} hue={c.hue} variant="portrait" label={`${c.name} — portrait placeholder`} />
                )}
                <span className="slide-rank">{String(c.rank).padStart(2, "0")}</span>
              </div>
              {c.photo?.kind === "avatar" && <p className="photo-credit">Avatar — {c.name} is anonymous; this is artwork, not a portrait.</p>}
              {c.photo && c.photo.kind !== "avatar" && (
                <p className="photo-credit">
                  {c.photo.subject ?? c.name}
                  {c.photo.licence === "PROPRIETARY" ? " · Used with permission" : c.photo.licence ? ` · ${c.photo.licence}` : ""}
                  {c.photo.author ? ` · Photo: ${c.photo.author}` : ""}
                </p>
              )}
              {!c.photo && <p className="photo-credit">{c.anonymous ? "Anonymous artist · no portrait exists" : "Portrait pending"}</p>}
            </div>

            <div className="slide-body">
              {c.rank === 1 && <span className="crown">★ World&rsquo;s No. 1 NFT artist</span>}
              <div className="creator-top">
                <div>
                  <h2>{c.name}</h2>
                  <p className="creator-sub">{[c.realName, c.base, c.known].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="creator-headline">
                  <b className="iri-text">{c.headline.value}</b>
                  <small>{c.headline.caption}</small>
                </div>
              </div>
              <p className="creator-bio">{c.bio}</p>

              <p className="label" style={{ margin: "0 0 10px" }}>Notable works</p>
              <div className="slide-works">
                {c.works.map((w) => (
                  <div className="work" key={w.title}>
                    <div className="work-art">
                      <TokenArt seed={`${c.slug}:${w.title}`} hue={c.hue} label={`${w.title} — artwork placeholder`} />
                    </div>
                    <div className="work-body">
                      <span className="yr">{w.year}</span>
                      <h3>{w.title}</h3>
                      {w.saleAmount && <p className="mono" style={{ fontSize: 11, color: "var(--ink-2)", margin: "4px 0 0" }}>{w.saleAmount}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="slides-controls">
        <button className="slides-btn" onClick={() => go(index - 1)} aria-label="Previous artist">←</button>
        <div className="slides-progress" aria-hidden="true">
          {creators.map((c, i) => (
            <i key={c.slug} data-on={i === index} data-done={i < index}>
              {i === index && running && <b key={index} style={{ animationDuration: `${INTERVAL_MS}ms` }} />}
            </i>
          ))}
        </div>
        <span className="mono slides-count">{index + 1} / {count}</span>
        <button className="slides-btn" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause slideshow" : "Play slideshow"}>
          {playing ? "❚❚" : "▶"}
        </button>
        <button className="slides-btn" onClick={() => go(index + 1)} aria-label="Next artist">→</button>
      </div>
    </section>
  );
}
