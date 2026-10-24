/* ============================================================
   Database schema (PostgreSQL via Drizzle).

   Money: amounts are integers in the currency's smallest unit
   (`*_amount_minor` + `*_currency`). That unit is mutez
   (1 tez = 1,000,000 mutez) and the currency is XTZ.

   Artwork: tables store a storage *key* (e.g. "nft/nft-01.jpg"),
   never a public URL. Delivery stays behind /api/media.
   ============================================================ */

import {
  pgTable, text, integer, bigint, boolean, timestamp, date, uniqueIndex, index, serial,
} from "drizzle-orm/pg-core";

/* ---------- taxonomy ---------- */

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  blurb: text("blurb"),
  sort: integer("sort").notNull().default(0),
});

export const subcategories = pgTable("subcategories", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  sort: integer("sort").notNull().default(0),
  /* e.g. property certificates, held back pending legal sign-off */
  restricted: boolean("restricted").notNull().default(false),
}, (t) => [uniqueIndex("subcategories_cat_slug").on(t.categoryId, t.slug)]);

/* ---------- rights ---------- */

export const licences = pgTable("licences", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),          /* CC0, CC-BY-SA-4.0, PD, PROPRIETARY */
  name: text("name").notNull(),
  url: text("url"),
  allowsCommercial: boolean("allows_commercial").notNull().default(false),
  requiresAttribution: boolean("requires_attribution").notNull().default(false),
  notes: text("notes"),
});

/* ---------- people ---------- */

export const creators = pgTable("creators", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  realName: text("real_name"),
  base: text("base"),
  knownFor: text("known_for"),
  bio: text("bio"),
  hue: integer("hue").notNull().default(200),
  headlineValue: text("headline_value"),
  headlineCaption: text("headline_caption"),
  /* editorial = featured for context, not selling on Cadastra */
  isEditorial: boolean("is_editorial").notNull().default(true),
  editorialRank: integer("editorial_rank"),
  anonymous: boolean("anonymous").notNull().default(false),
});

export const creatorPhotos = pgTable("creator_photos", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => creators.id),
  mediaKey: text("media_key").notNull(),
  licenceId: integer("licence_id").references(() => licences.id),
  author: text("author"),
  sourceUrl: text("source_url"),
  attribution: text("attribution"),
  width: integer("width"),
  height: integer("height"),
  /* who the photograph shows, and who checked that it is this creator */
  subject: text("subject"),
  confirmedBy: text("confirmed_by"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  /* CSS object-position, so cropping keeps the face in frame */
  focus: text("focus"),
  /* portrait = photograph of the person; avatar = artwork an anonymous creator uses (007) */
  kind: text("kind").notNull().default("portrait"),
}, (t) => [uniqueIndex("creator_photos_creator").on(t.creatorId)]);

/* Landmark works by other artists — shown for context, never for sale here. */
export const featuredWorks = pgTable("featured_works", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => creators.id),
  title: text("title").notNull(),
  year: text("year"),
  note: text("note"),
  mediaKey: text("media_key"),
  licenceId: integer("licence_id").references(() => licences.id),
  saleAmount: text("sale_amount"),        /* as reported, e.g. "$69.3M" or "1,600 ETH" */
  saleDate: text("sale_date"),
  venue: text("venue"),
  sourceUrl: text("source_url"),
  verified: boolean("verified").notNull().default(false),
  sort: integer("sort").notNull().default(0),
});

/* ---------- partners and catalogue ---------- */

export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  sector: text("sector"),
  sinceYear: text("since_year"),
  seasons: integer("seasons").notNull().default(0),
  releases: integer("releases").notNull().default(0),
  tone: text("tone").notNull().default("lime"),
});

export const works = pgTable("works", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),            /* TL-0417 */
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  creatorId: integer("creator_id").references(() => creators.id),
  creatorName: text("creator_name").notNull(),
  studio: text("studio"),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  subcategoryId: integer("subcategory_id").references(() => subcategories.id),
  status: text("status").notNull().default("Draft"), /* Live | In review | Revision requested | Draft */
  priceAmountMinor: bigint("price_amount_minor", { mode: "number" }).notNull().default(0),
  priceCurrency: text("price_currency").notNull().default("XTZ"),
  likes: integer("likes").notNull().default(0),
  owners: integer("owners").notNull().default(0),
  editions: integer("editions").notNull().default(1),
  mintedAt: date("minted_at"),
  reviewToken: text("review_token").unique(),
  brief: text("brief"),
  description: text("description"),
  mediaKey: text("media_key").notNull(),
  licenceId: integer("licence_id").references(() => licences.id),
  royaltyBps: integer("royalty_bps").notNull().default(0),
  fairValueMinor: bigint("fair_value_minor", { mode: "number" }),   /* 002 */
  sourceUrl: text("source_url"),       /* 007: where the image comes from */
  attribution: text("attribution"),    /* 007: credit line its licence asks for */
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("works_status_idx").on(t.status), index("works_category_idx").on(t.categoryId)]);

export const drops = pgTable("drops", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  partnerId: integer("partner_id").references(() => partners.id),
  studio: text("studio"),
  categoryId: integer("category_id").references(() => categories.id),
  releaseDate: date("release_date").notNull(),
  supply: integer("supply").notNull().default(0),
  priceAmountMinor: bigint("price_amount_minor", { mode: "number" }).notNull().default(0),
  priceCurrency: text("price_currency").notNull().default("XTZ"),
  season: text("season"),
  status: text("status").notNull().default("Upcoming"), /* Live | Upcoming | Sold out */
  mediaKey: text("media_key"),
  blurb: text("blurb"),
  mintedPct: integer("minted_pct").notNull().default(0),
});

/* ---------- accounts ---------- */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  /* filled in Stage 3, when registration requires a connected wallet */
  walletAddress: text("wallet_address").unique(),
  email: text("email").unique(),
  displayName: text("display_name"),
  org: text("org"),
  role: text("role").notNull().default("client"),   /* client | sales */
  passId: text("pass_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  /* the $50 admission check (004) */
  balanceUsdCents: bigint("balance_usd_cents", { mode: "number" }),
  balanceCheckedAt: timestamp("balance_checked_at", { withTimezone: true }),
  balanceSources: text("balance_sources"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  /* recorded at registration (006) */
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
  termsVersion: text("terms_version"),
  /* cookies issued before this are refused (006) */
  sessionsValidAfter: timestamp("sessions_valid_after", { withTimezone: true }).notNull().default(new Date(0)),
});

export const staffUsers = pgTable("staff_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  totpSecret: text("totp_secret"),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------- designer feedback ---------- */

export const suggestions = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  workId: integer("work_id").notNull().references(() => works.id),
  author: text("author").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("Open"),  /* Open | Acknowledged | Applied */
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("suggestions_work_idx").on(t.workId)]);

/* ---------- dashboard figures (demo data until real analytics exist) ---------- */

export const marketHourlyHigh = pgTable("market_hourly_high", {
  id: serial("id").primaryKey(),
  hour: text("hour").notNull(),
  amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
  currency: text("currency").notNull().default("XTZ"),
  workCode: text("work_code"),
  workTitle: text("work_title"),
});

export const topBuyers = pgTable("top_buyers", {
  id: serial("id").primaryKey(),
  handle: text("handle").notNull(),
  wallet: text("wallet"),
  region: text("region"),
  purchases: integer("purchases").notNull().default(0),
  volumeMinor: bigint("volume_minor", { mode: "number" }).notNull().default(0),
  currency: text("currency").notNull().default("XTZ"),
  since: text("since"),
});

export const categoryStats = pgTable("category_stats", {
  categoryId: integer("category_id").primaryKey().references(() => categories.id),
  designs: integer("designs").notNull().default(0),
  designers: integer("designers").notNull().default(0),
  volumeMinor: bigint("volume_minor", { mode: "number" }).notNull().default(0),
  currency: text("currency").notNull().default("XTZ"),
});

export const siteStats = pgTable("site_stats", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  sub: text("sub"),
  delta: text("delta"),
  sort: integer("sort").notNull().default(0),
});
