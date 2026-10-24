/* ============================================================
   SEED FIXTURES — input for scripts/seed.mjs only.
   The application reads the database (src/lib/repo.ts), never
   these files. Kept so the demo catalogue can be reloaded.
   ============================================================ */

/* ============================================================
   Mock data — everything here is fictional.
   ------------------------------------------------------------
   Replace the values in this file and every screen updates.
   No component changes are required. Currency is ETH with a
   USD reference set by USD_PER_ETH.
   ============================================================ */

export const USD_PER_ETH = 3_480;
export const DATA_UPDATED_AT = "2026-09-09T09:40:00Z";

export type Category = "Entertainment" | "Art" | "Real estate" | "Avatar";
export const CATEGORIES: Category[] = ["Entertainment", "Art", "Real estate", "Avatar"];

/** Where an asset sits in the commissioning pipeline. */
export type AssetStatus = "Live" | "In review" | "Revision requested" | "Draft";

export type Design = {
  id: string;
  name: string;
  designer: string;
  studio: string;
  category: Category;
  image: string;
  priceEth: number;
  likes: number;
  owners: number;
  editions: number;
  mintedAt: string;
  status: AssetStatus;
  /** Token used for the no-login designer review link: /review/<token> */
  reviewToken: string;
  /** What the sales team originally commissioned. Shown to the designer. */
  brief: string;
};

export const DESIGNS: Design[] = [
  { id: "TL-0417", name: "Cadastral", designer: "Ilse Verhoeven", studio: "Verhoeven Studio", category: "Art", image: "/nft/site/cadastral.jpg", priceEth: 4.82, likes: 3140, owners: 212, editions: 256, mintedAt: "2026-07-14", status: "Live", reviewToken: "rv-0417-tqm4", brief: "Topographic line study for the flagship art drop. Greyscale only, no gradients, must hold at 64px." },
  { id: "TL-0418", name: "Ground Truth", designer: "Mateo Salinas", studio: "Salinas Atelier", category: "Art", image: "/nft/site/ground-truth.jpg", priceEth: 9.40, likes: 1877, owners: 12, editions: 12, mintedAt: "2026-07-22", status: "Live", reviewToken: "rv-0418-b7yn", brief: "Twelve-edition physical work, custodied. Capture must be colour-accurate under D65 for the certificate." },
  { id: "TL-0421", name: "Refraction Study", designer: "Noor Haddad", studio: "Haddad", category: "Art", image: "/nft/site/refraction-study.jpg", priceEth: 2.16, likes: 4420, owners: 388, editions: 512, mintedAt: "2026-08-02", status: "Live", reviewToken: "rv-0421-k29d", brief: "Entry-tier art edition for first-time buyers. Needs to read as a set with TL-0417." },
  { id: "TL-0430", name: "Cadmium Study", designer: "Ilse Verhoeven", studio: "Verhoeven Studio", category: "Art", image: "/nft/nft-04.jpg", priceEth: 6.05, likes: 2610, owners: 96, editions: 128, mintedAt: "2026-08-11", status: "In review", reviewToken: "rv-0430-w8fc", brief: "Second colourway of Cadastral. Warm palette, same construction. Client asked for more contrast." },

  { id: "TL-0512", name: "Neon Ladder", designer: "Korsa", studio: "Korsa Studio", category: "Entertainment", image: "/nft/nft-05.jpg", priceEth: 1.24, likes: 5980, owners: 1420, editions: 2048, mintedAt: "2026-06-30", status: "Live", reviewToken: "rv-0512-p4rt", brief: "Reward tier art for the ladder game. Fourteen visual steps, each legible as a thumbnail in a leaderboard row." },
  { id: "TL-0515", name: "Prism Arcade", designer: "Odama", studio: "Odama", category: "Entertainment", image: "/nft/nft-06.jpg", priceEth: 0.86, likes: 7310, owners: 2260, editions: 4096, mintedAt: "2026-07-08", status: "Live", reviewToken: "rv-0515-h6ez", brief: "High-volume entry collection. Must survive heavy compression on social previews." },
  { id: "TL-0519", name: "Chroma Reel", designer: "Outcrowd", studio: "Outcrowd", category: "Entertainment", image: "/nft/nft-07.jpg", priceEth: 3.38, likes: 4105, owners: 540, editions: 720, mintedAt: "2026-08-19", status: "Revision requested", reviewToken: "rv-0519-3mva", brief: "Seasonal campaign key art. Client flagged the palette as too close to a competitor's launch." },
  { id: "TL-0524", name: "Bloom Circuit", designer: "Ledo", studio: "Ledo", category: "Entertainment", image: "/nft/nft-08.jpg", priceEth: 2.70, likes: 6640, owners: 880, editions: 1024, mintedAt: "2026-08-27", status: "Live", reviewToken: "rv-0524-9qsl", brief: "Mid-tier collectible tied to the tournament bracket. Generative, 1,024 deterministic outputs." },

  { id: "TL-0611", name: "Cascade House", designer: "In-house", studio: "Terra Ledger", category: "Real estate", image: "/nft/site/cascade-house.jpg", priceEth: 18.60, likes: 940, owners: 8400, editions: 8400, mintedAt: "2026-05-18", status: "Live", reviewToken: "rv-0611-x1cd", brief: "Property certificate artwork. Photography only — no illustration on regulated instruments." },
  { id: "TL-0614", name: "The Mercer Block", designer: "In-house", studio: "Terra Ledger", category: "Real estate", image: "/nft/site/the-mercer-block.jpg", priceEth: 27.45, likes: 712, owners: 5120, editions: 5120, mintedAt: "2026-06-04", status: "Live", reviewToken: "rv-0614-t0be", brief: "Commercial mixed-use certificate. Same treatment as Cascade House for series consistency." },
  { id: "TL-0618", name: "Harborline Lofts", designer: "In-house", studio: "Terra Ledger", category: "Real estate", image: "/nft/site/harborline-lofts.jpg", priceEth: 12.30, likes: 1180, owners: 3300, editions: 3300, mintedAt: "2026-07-01", status: "Live", reviewToken: "rv-0618-m5wq", brief: "Multifamily certificate. Interior shot approved by counsel; exterior was rejected for signage." },
  { id: "TL-0622", name: "Juniper Ridge", designer: "In-house", studio: "Terra Ledger", category: "Real estate", image: "/nft/site/juniper-ridge.jpg", priceEth: 8.94, likes: 655, owners: 2100, editions: 2100, mintedAt: "2026-08-05", status: "Draft", reviewToken: "rv-0622-a3nk", brief: "Pending certificate. Do not publish until the SPV filing clears." },

  { id: "TL-0703", name: "Vitreous Head", designer: "DΞNYS Sergushkin", studio: "DΞNYS", category: "Avatar", image: "/nft/nft-02.jpg", priceEth: 1.92, likes: 8240, owners: 3180, editions: 5000, mintedAt: "2026-06-21", status: "Live", reviewToken: "rv-0703-v7ju", brief: "Flagship avatar set. Must crop cleanly to a circle at 48px for profile use across platforms." },
  { id: "TL-0707", name: "Wireframe Self", designer: "Mark Rise", studio: "Rise", category: "Avatar", image: "/nft/nft-11.jpg", priceEth: 1.05, likes: 6890, owners: 4210, editions: 6000, mintedAt: "2026-07-16", status: "Live", reviewToken: "rv-0707-c2ld", brief: "Budget avatar tier. Line weight must stay visible after platform downscaling." },
  { id: "TL-0712", name: "Soft Alloy", designer: "Alamin Hossen", studio: "Hossen", category: "Avatar", image: "/nft/nft-15.jpg", priceEth: 0.74, likes: 5210, owners: 2870, editions: 4000, mintedAt: "2026-08-13", status: "In review", reviewToken: "rv-0712-r8hp", brief: "Companion set to Wireframe Self. Trait layers due with the delivery for the generative pipeline." },
  { id: "TL-0716", name: "Halo Fragment", designer: "Odama", studio: "Odama", category: "Avatar", image: "/nft/nft-16.jpg", priceEth: 2.44, likes: 7025, owners: 1640, editions: 2500, mintedAt: "2026-09-01", status: "Live", reviewToken: "rv-0716-f4dx", brief: "Premium avatar tier tied to the Q3 campaign. Metallic treatment, single light source." },
];

/* ── RED: highest price achieved today, hour by hour ── */
export type SalePoint = { hour: string; eth: number; name: string; id: string };
export const TOP_SALES_TODAY: SalePoint[] = [
  { hour: "09", eth: 6.20, name: "Cadmium Study", id: "TL-0430" },
  { hour: "10", eth: 8.95, name: "Ground Truth", id: "TL-0418" },
  { hour: "11", eth: 7.40, name: "Cascade House", id: "TL-0611" },
  { hour: "12", eth: 12.10, name: "Harborline Lofts", id: "TL-0618" },
  { hour: "13", eth: 10.85, name: "Cascade House", id: "TL-0611" },
  { hour: "14", eth: 15.60, name: "Cascade House", id: "TL-0611" },
  { hour: "15", eth: 19.20, name: "The Mercer Block", id: "TL-0614" },
  { hour: "16", eth: 27.45, name: "The Mercer Block", id: "TL-0614" },
  { hour: "17", eth: 21.30, name: "The Mercer Block", id: "TL-0614" },
  { hour: "18", eth: 16.80, name: "Cascade House", id: "TL-0611" },
  { hour: "19", eth: 13.55, name: "Harborline Lofts", id: "TL-0618" },
  { hour: "20", eth: 11.20, name: "Juniper Ridge", id: "TL-0622" },
  { hour: "21", eth: 9.75, name: "Ground Truth", id: "TL-0418" },
];

/* ── GREEN: fairly priced and widely liked ── */
export type LikedItem = { id: string; name: string; likes: number; priceEth: number; fairEth: number; image: string };
export const MOST_LIKED: LikedItem[] = [
  { id: "TL-0703", name: "Vitreous Head", likes: 8240, priceEth: 1.92, fairEth: 2.05, image: "/nft/nft-02.jpg" },
  { id: "TL-0515", name: "Prism Arcade", likes: 7310, priceEth: 0.86, fairEth: 0.92, image: "/nft/nft-06.jpg" },
  { id: "TL-0716", name: "Halo Fragment", likes: 7025, priceEth: 2.44, fairEth: 2.50, image: "/nft/nft-16.jpg" },
  { id: "TL-0707", name: "Wireframe Self", likes: 6890, priceEth: 1.05, fairEth: 1.12, image: "/nft/nft-11.jpg" },
  { id: "TL-0524", name: "Bloom Circuit", likes: 6640, priceEth: 2.70, fairEth: 2.66, image: "/nft/nft-08.jpg" },
  { id: "TL-0512", name: "Neon Ladder", likes: 5980, priceEth: 1.24, fairEth: 1.30, image: "/nft/nft-05.jpg" },
  { id: "TL-0712", name: "Soft Alloy", likes: 5210, priceEth: 0.74, fairEth: 0.80, image: "/nft/nft-15.jpg" },
];

/* ── YELLOW: highest-volume buyers. Sales-team view only. ── */
export type Buyer = { handle: string; wallet: string; region: string; purchases: number; volumeEth: number; since: string };
export const TOP_BUYERS: Buyer[] = [
  { handle: "@lumen.eth", wallet: "0x7Dfe…a885", region: "Singapore", purchases: 148, volumeEth: 412.6, since: "2025-11" },
  { handle: "@okonkwo", wallet: "0x41b2…3c07", region: "Lagos", purchases: 121, volumeEth: 338.9, since: "2026-01" },
  { handle: "@mirabel_v", wallet: "0x9ac4…7e12", region: "Lisbon", purchases: 96, volumeEth: 254.1, since: "2025-08" },
  { handle: "@takara", wallet: "0x2f80…dd41", region: "Osaka", purchases: 84, volumeEth: 221.7, since: "2026-02" },
  { handle: "@s.rivera", wallet: "0xbb19…04a6", region: "Bogotá", purchases: 73, volumeEth: 168.3, since: "2026-03" },
  { handle: "@haruki", wallet: "0x5c63…9f2b", region: "Berlin", purchases: 61, volumeEth: 140.5, since: "2026-04" },
];

/* ── Designs registered in the system, by category ── */
export type CategoryStat = { category: Category; designs: number; designers: number; volumeEth: number };
export const CATEGORY_STATS: CategoryStat[] = [
  { category: "Entertainment", designs: 1284, designers: 96, volumeEth: 4820.5 },
  { category: "Art", designs: 946, designers: 141, volumeEth: 6310.2 },
  { category: "Real estate", designs: 41, designers: 4, volumeEth: 9184.7 },
  { category: "Avatar", designs: 1673, designers: 88, volumeEth: 3067.8 },
];

/* ── Suggestions left by designers on the review link ── */
export type Suggestion = {
  id: string;
  designId: string;
  author: string;
  createdAt: string;
  body: string;
  status: "Open" | "Acknowledged" | "Applied";
};

export const SEED_SUGGESTIONS: Suggestion[] = [
  { id: "sg-01", designId: "TL-0519", author: "Outcrowd", createdAt: "2026-09-08T14:20:00Z", body: "The palette clash is fixable without a redraw — shifting the magenta 18° toward red separates us from their launch and keeps the campaign key art intact. I can deliver the revised set in three days.", status: "Open" },
  { id: "sg-02", designId: "TL-0430", author: "Ilse Verhoeven", createdAt: "2026-09-08T09:05:00Z", body: "Raising contrast will break the pairing with TL-0417, which was specified to read as a set. Suggest we raise contrast on the warm colourway only and leave the greyscale original alone.", status: "Acknowledged" },
  { id: "sg-03", designId: "TL-0712", author: "Alamin Hossen", createdAt: "2026-09-07T17:42:00Z", body: "Trait layers are ready, but the naming in the brief conflicts with the generative pipeline's reserved words. Renaming three layers avoids an export step on your side.", status: "Applied" },
  { id: "sg-04", designId: "TL-0703", author: "DΞNYS Sergushkin", createdAt: "2026-09-06T11:15:00Z", body: "Circle crop at 48px clips the halo on four of the traits. Adding 6% padding to the source keeps every trait intact at profile size across all platforms.", status: "Open" },
];

/* ── KPIs ── */
export const SALES_KPIS = [
  { label: "Registered designs", value: "3,944", sub: "assets", delta: "+128 this week" },
  { label: "Volume today", value: "312.4", sub: "ETH", delta: "+18.2%" },
  { label: "Active holders", value: "12,684", sub: "accounts", delta: "+441 this week" },
  { label: "Commissioned designers", value: "329", sub: "contributors", delta: "+12 this week" },
];

export const usd = (eth: number) =>
  "$" + Math.round(eth * USD_PER_ETH).toLocaleString("en-US");

export const findByToken = (token: string) =>
  DESIGNS.find((d) => d.reviewToken === token);
