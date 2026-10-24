/* ============================================================
   Drops — new creations launched with long-term client partners.
   Everything here is fictional demo data. Replace these values
   to load the real release calendar.
   ============================================================ */

import type { Category } from "./data";

export type Partner = {
  slug: string;
  name: string;
  sector: string;
  since: string;
  seasons: number;
  releases: number;
  tone: "lime" | "iri" | "gold" | "violet" | "cyan" | "pink";
};

export const PARTNERS: Partner[] = [
  { slug: "northgate", name: "Northgate Capital", sector: "Real estate", since: "2025", seasons: 4, releases: 11, tone: "gold" },
  { slug: "arcadia", name: "Arcadia Games", sector: "Entertainment", since: "2025", seasons: 5, releases: 19, tone: "cyan" },
  { slug: "halden", name: "Halden Museum", sector: "Art", since: "2026", seasons: 2, releases: 6, tone: "violet" },
  { slug: "loop", name: "Loop Social", sector: "Avatar", since: "2025", seasons: 3, releases: 9, tone: "pink" },
];

export type DropStatus = "Live" | "Upcoming" | "Sold out";

export type Drop = {
  id: string;
  title: string;
  partner: string;
  studio: string;
  category: Category;
  date: string;
  supply: number;
  priceEth: number;
  season: string;
  status: DropStatus;
  image: string;
  blurb: string;
};

export const DROPS: Drop[] = [
  { id: "DR-311", title: "Halo Fragment II", partner: "loop", studio: "Odama", category: "Avatar", date: "2026-09-12", supply: 2500, priceEth: 0.48, season: "Season 3 · Release 2", status: "Live", image: "/nft/nft-16.jpg", blurb: "The second metallic avatar tier, built with Loop Social for its profile rewards." },
  { id: "DR-312", title: "Bracket Finals", partner: "arcadia", studio: "Ledo", category: "Entertainment", date: "2026-09-24", supply: 1024, priceEth: 0.32, season: "Season 5 · Release 4", status: "Upcoming", image: "/nft/nft-08.jpg", blurb: "Collectibles that unlock as Arcadia's tournament bracket plays out." },
  { id: "DR-313", title: "Gallery Nights", partner: "halden", studio: "Verhoeven Studio", category: "Art", date: "2026-10-08", supply: 128, priceEth: 2.2, season: "Season 2 · Release 3", status: "Upcoming", image: "/nft/nft-03.jpg", blurb: "Editions released alongside Halden Museum's autumn exhibition." },
  { id: "DR-314", title: "Harborline Phase 2", partner: "northgate", studio: "Terra Ledger", category: "Real estate", date: "2026-10-29", supply: 3300, priceEth: 12.3, season: "Season 4 · Release 3", status: "Upcoming", image: "/nft/site/harborline-lofts.jpg", blurb: "Second tranche of the Harborline certificate series with Northgate Capital." },
  { id: "DR-315", title: "Neon Ladder: Winter", partner: "arcadia", studio: "Korsa Studio", category: "Entertainment", date: "2026-11-19", supply: 2048, priceEth: 0.28, season: "Season 5 · Release 5", status: "Upcoming", image: "/nft/nft-05.jpg", blurb: "Seasonal reward tiers for the ladder game's winter league." },
  { id: "DR-316", title: "Soft Alloy: Traits", partner: "loop", studio: "Hossen", category: "Avatar", date: "2026-12-10", supply: 4000, priceEth: 0.22, season: "Season 3 · Release 3", status: "Upcoming", image: "/nft/nft-15.jpg", blurb: "Wearable trait layers for Soft Alloy holders." },
  { id: "DR-309", title: "Prism Arcade", partner: "arcadia", studio: "Odama", category: "Entertainment", date: "2026-08-20", supply: 4096, priceEth: 0.18, season: "Season 5 · Release 3", status: "Sold out", image: "/nft/nft-06.jpg", blurb: "High-volume entry collection, sold out in under an hour." },
  { id: "DR-310", title: "Refraction Study", partner: "halden", studio: "Haddad", category: "Art", date: "2026-08-02", supply: 512, priceEth: 0.9, season: "Season 2 · Release 2", status: "Sold out", image: "/nft/site/refraction-study.jpg", blurb: "Entry-tier art editions for first-time collectors." },
];

export const partnerOf = (slug: string) => PARTNERS.find((p) => p.slug === slug);

export const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
