/* ============================================================
   Repository layer — the only place that reads the database.

   Server-side only. Pages and route handlers call these; client
   components receive the results as props.

   Amounts come out of the database as whole mutez
   (1 tez = 1,000,000 mutez) and stay integers all the way to the
   formatter in src/lib/currency.ts. USD is display-only and is
   added by the caller from src/lib/price.ts.
   ============================================================ */

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db/client";
import { passIdFrom, seedFrom } from "./hash";

const asMutez = (n: number | string | null | undefined) => Number(n ?? 0);

/* What any signed-in member may see about a work. */
export type WorkView = {
  id: string;            /* TL-0417 */
  name: string;
  designer: string;
  studio: string;
  category: string;
  categorySlug: string;
  subcategory: string | null;
  subcategorySlug: string | null;
  restricted: boolean;   /* subcategory held back from sale (decision Q5) */
  image: string;         /* storage key, delivered through /api/media */
  priceMutez: number;
  likes: number;
  owners: number;
  editions: number;
  mintedAt: string;
  status: string;
  description: string;
  royaltyBps: number;
  licence: string | null;
  licenceName: string | null;
  licenceUrl: string | null;
  sourceUrl: string | null;
  attribution: string | null;
};

/* Internal fields, for the sales team and the designer review link only.
   Never pass these to a page a client or visitor can load: the review token
   unlocks the clean artwork. */
export type InternalWorkView = WorkView & { reviewToken: string; brief: string };

const workView = (r: Record<string, unknown>): WorkView => ({
  id: String(r.code),
  name: String(r.title),
  designer: String(r.creator_name ?? ""),
  studio: String(r.studio ?? ""),
  category: String(r.category ?? ""),
  categorySlug: String(r.category_slug ?? ""),
  subcategory: r.subcategory ? String(r.subcategory) : null,
  subcategorySlug: r.subcategory_slug ? String(r.subcategory_slug) : null,
  restricted: Boolean(r.restricted),
  image: String(r.media_key ?? ""),
  priceMutez: asMutez(r.price_amount_minor as number),
  likes: Number(r.likes ?? 0),
  owners: Number(r.owners ?? 0),
  editions: Number(r.editions ?? 0),
  mintedAt: r.minted_at ? String(r.minted_at).slice(0, 10) : "",
  status: String(r.status ?? ""),
  description: String(r.description ?? ""),
  royaltyBps: Number(r.royalty_bps ?? 0),
  licence: r.licence_code ? String(r.licence_code) : null,
  licenceName: r.licence_name ? String(r.licence_name) : null,
  licenceUrl: r.licence_url ? String(r.licence_url) : null,
  sourceUrl: r.source_url ? String(r.source_url) : null,
  attribution: r.attribution ? String(r.attribution) : null,
});

const internalWorkView = (r: Record<string, unknown>): InternalWorkView => ({
  ...workView(r),
  reviewToken: String(r.review_token ?? ""),
  brief: String(r.brief ?? ""),
});

const WORK_COLUMNS = sql`
  w.code, w.title, w.creator_name, w.studio, c.name AS category, c.slug AS category_slug,
  s.name AS subcategory, s.slug AS subcategory_slug, COALESCE(s.restricted, false) AS restricted,
  w.media_key, w.price_amount_minor, w.likes, w.owners, w.editions, w.minted_at, w.status,
  w.description, w.royalty_bps, w.source_url, w.attribution,
  l.code AS licence_code, l.name AS licence_name, l.url AS licence_url`;

const INTERNAL_COLUMNS = sql`${WORK_COLUMNS}, w.review_token, w.brief`;

/* every work query joins the same taxonomy */
const WORK_FROM = sql`FROM works w
  JOIN categories c ON c.id = w.category_id
  LEFT JOIN subcategories s ON s.id = w.subcategory_id
  LEFT JOIN licences l ON l.id = w.licence_id`;

/* ---------- works ---------- */

export async function listWorks(
  opts: { status?: string; categorySlug?: string; subcategorySlug?: string; limit?: number } = {},
): Promise<WorkView[]> {
  const db = await getDb();
  const rows = await db.execute(sql`
    SELECT ${WORK_COLUMNS} ${WORK_FROM}
    WHERE ${opts.status ? sql`w.status = ${opts.status}` : sql`true`}
      AND ${opts.categorySlug ? sql`c.slug = ${opts.categorySlug}` : sql`true`}
      AND ${opts.subcategorySlug ? sql`s.slug = ${opts.subcategorySlug}` : sql`true`}
    ORDER BY w.likes DESC, w.code
    ${opts.limit ? sql`LIMIT ${opts.limit}` : sql``}`);
  return rows.rows.map(workView);
}

export async function getWorkByCode(code: string): Promise<WorkView | null> {
  const db = await getDb();
  const rows = await db.execute(sql`SELECT ${WORK_COLUMNS} ${WORK_FROM} WHERE w.code = ${code} LIMIT 1`);
  return rows.rows[0] ? workView(rows.rows[0]) : null;
}

export async function getWorkByReviewToken(token: string): Promise<InternalWorkView | null> {
  if (!token) return null;
  const db = await getDb();
  const rows = await db.execute(sql`SELECT ${INTERNAL_COLUMNS} ${WORK_FROM} WHERE w.review_token = ${token} LIMIT 1`);
  return rows.rows[0] ? internalWorkView(rows.rows[0]) : null;
}

export type MediaInfo = { key: string; kind: "work" | "drop"; status: string; reviewToken: string | null };

/** Storage key and visibility facts for any sellable asset (work or drop), for /api/media. */
export async function getMediaInfo(code: string): Promise<MediaInfo | null> {
  const db = await getDb();
  const rows = await db.execute(sql`
    SELECT media_key, 'work' AS kind, status, review_token FROM works WHERE code = ${code}
    UNION ALL
    SELECT media_key, 'drop' AS kind,
           /* a drop that reuses the image of a work not yet listed must not reveal it */
           CASE WHEN EXISTS (SELECT 1 FROM works w WHERE w.media_key = d.media_key AND w.status <> 'Live')
                THEN 'Unlisted' ELSE d.status END AS status,
           NULL AS review_token
    FROM drops d WHERE code = ${code}
    LIMIT 1`);
  const r = rows.rows[0];
  if (!r?.media_key) return null;
  return {
    key: String(r.media_key),
    kind: r.kind === "drop" ? "drop" : "work",
    status: String(r.status ?? ""),
    reviewToken: r.review_token ? String(r.review_token) : null,
  };
}

/** Works still waiting on their designer — the dashboard's review-link panel (sales only). */
export async function listPendingWorks(): Promise<InternalWorkView[]> {
  const db = await getDb();
  const rows = await db.execute(sql`SELECT ${INTERNAL_COLUMNS} ${WORK_FROM}
    WHERE w.status <> 'Live' ORDER BY w.code`);
  return rows.rows.map(internalWorkView);
}

/* ---------- landing-page figures, computed from the catalogue itself ---------- */

export type MarketSummary = { listed: number; creators: number; listedValueMutez: number; floorMutez: number };

export async function getMarketSummary(): Promise<MarketSummary> {
  const db = await getDb();
  const rows = await db.execute(sql`
    SELECT count(*)::int AS listed,
           count(DISTINCT creator_name)::int AS creators,
           COALESCE(sum(price_amount_minor), 0) AS listed_value,
           COALESCE(min(price_amount_minor), 0) AS floor
    FROM works WHERE status = 'Live'`);
  const r = rows.rows[0] ?? {};
  return {
    listed: Number(r.listed ?? 0),
    creators: Number(r.creators ?? 0),
    listedValueMutez: asMutez(r.listed_value as number),
    floorMutez: asMutez(r.floor as number),
  };
}

export type LikedView = { id: string; name: string; likes: number; priceMutez: number; fairMutez: number; image: string };

/** Most liked works that carry a fair-value estimate (the dashboard's green chart). */
export async function listFairlyPriced(limit = 7): Promise<LikedView[]> {
  const db = await getDb();
  const rows = await db.execute(sql`
    SELECT code, title, likes, price_amount_minor, fair_value_minor, media_key
    FROM works WHERE fair_value_minor IS NOT NULL AND status = 'Live'
    ORDER BY likes DESC LIMIT ${limit}`);
  return rows.rows.map((r) => ({
    id: String(r.code), name: String(r.title), likes: Number(r.likes ?? 0),
    priceMutez: asMutez(r.price_amount_minor as number),
    fairMutez: asMutez(r.fair_value_minor as number),
    image: String(r.media_key ?? ""),
  }));
}

/* ---------- categories ---------- */

export type SubcategoryView = { slug: string; name: string; restricted: boolean; works: number };
export type CategoryView = {
  name: string; slug: string; blurb: string;
  designs: number; designers: number; volumeMutez: number;
  subcategories: SubcategoryView[];
};

export async function listCategories(): Promise<CategoryView[]> {
  const db = await getDb();
  const cats = await db.execute(sql`
    SELECT c.id, c.name, c.slug, c.blurb, s.volume_minor,
           (SELECT count(*) FROM works w WHERE w.category_id = c.id AND w.status = 'Live')::int AS designs,
           (SELECT count(DISTINCT w.creator_name) FROM works w WHERE w.category_id = c.id AND w.status = 'Live')::int AS designers
    FROM categories c LEFT JOIN category_stats s ON s.category_id = c.id
    ORDER BY c.sort`);

  const subs = await db.execute(sql`
    SELECT s.category_id, s.slug, s.name, s.restricted,
           count(w.id) FILTER (WHERE w.status = 'Live')::int AS works
    FROM subcategories s
    LEFT JOIN works w ON w.subcategory_id = s.id
    GROUP BY s.id, s.category_id, s.slug, s.name, s.restricted, s.sort
    ORDER BY s.sort`);

  return cats.rows.map((r) => ({
    name: String(r.name),
    slug: String(r.slug),
    blurb: String(r.blurb ?? ""),
    designs: Number(r.designs ?? 0),
    designers: Number(r.designers ?? 0),
    volumeMutez: asMutez(r.volume_minor as number),
    subcategories: subs.rows
      .filter((x) => x.category_id === r.id)
      .map((x) => ({
        slug: String(x.slug), name: String(x.name),
        restricted: Boolean(x.restricted), works: Number(x.works ?? 0),
      })),
  }));
}

export async function getCategoryBySlug(slug: string): Promise<CategoryView | null> {
  return (await listCategories()).find((c) => c.slug === slug) ?? null;
}

/* ---------- drops and partners ---------- */

export type PartnerView = { slug: string; name: string; sector: string; since: string; seasons: number; releases: number; tone: string };
export type DropView = {
  id: string; title: string; partner: string; partnerName: string; studio: string; category: string;
  categorySlug: string;
  date: string; supply: number; priceMutez: number; season: string; status: string; image: string;
  blurb: string; mintedPct: number;
};

export async function listPartners(): Promise<PartnerView[]> {
  const db = await getDb();
  const rows = await db.execute(sql`SELECT slug, name, sector, since_year, seasons, releases, tone FROM partners ORDER BY id`);
  return rows.rows.map((r) => ({
    slug: String(r.slug), name: String(r.name), sector: String(r.sector ?? ""),
    since: String(r.since_year ?? ""), seasons: Number(r.seasons ?? 0),
    releases: Number(r.releases ?? 0), tone: String(r.tone ?? "lime"),
  }));
}

export async function listDrops(): Promise<DropView[]> {
  const db = await getDb();
  const rows = await db.execute(sql`
    SELECT d.code, d.title, p.slug AS partner_slug, p.name AS partner_name, d.studio,
           c.name AS category, c.slug AS category_slug, d.release_date, d.supply, d.price_amount_minor, d.season,
           d.status, d.media_key, d.blurb, d.minted_pct
    FROM drops d
    LEFT JOIN partners p ON p.id = d.partner_id
    LEFT JOIN categories c ON c.id = d.category_id
    ORDER BY d.release_date`);
  return rows.rows.map((r) => ({
    id: String(r.code), title: String(r.title),
    partner: String(r.partner_slug ?? ""), partnerName: String(r.partner_name ?? ""),
    studio: String(r.studio ?? ""), category: String(r.category ?? ""),
    categorySlug: String(r.category_slug ?? ""),
    date: String(r.release_date ?? "").slice(0, 10),
    supply: Number(r.supply ?? 0), priceMutez: asMutez(r.price_amount_minor as number),
    season: String(r.season ?? ""), status: String(r.status ?? ""),
    image: String(r.media_key ?? ""), blurb: String(r.blurb ?? ""),
    mintedPct: Number(r.minted_pct ?? 0),
  }));
}

/* ---------- creators (editorial) ---------- */

export type CreatorWorkView = { title: string; year: string; note: string; image: string | null; licence: string | null; sourceUrl: string | null; saleAmount: string | null; verified: boolean };
export type CreatorView = {
  rank: number; slug: string; name: string; realName: string | null; base: string; known: string;
  bio: string; hue: number; anonymous: boolean;
  headline: { value: string; caption: string };
  photo: {
    licence: string | null; licenceUrl: string | null; author: string | null; attribution: string | null;
    sourceUrl: string | null; focus: string | null; subject: string | null;
    kind: "portrait" | "avatar";
  } | null;
  works: CreatorWorkView[];
};

export async function listCreators(): Promise<CreatorView[]> {
  const db = await getDb();
  const creators = await db.execute(sql`
    SELECT cr.id, cr.slug, cr.name, cr.real_name, cr.base, cr.known_for, cr.bio, cr.hue,
           cr.headline_value, cr.headline_caption, cr.editorial_rank, cr.anonymous,
           p.media_key AS photo_key, p.author AS photo_author, p.attribution, p.source_url AS photo_source,
           p.focus AS photo_focus, p.subject AS photo_subject, p.kind AS photo_kind, pl.code AS photo_licence, pl.url AS photo_licence_url
    FROM creators cr
    LEFT JOIN creator_photos p ON p.creator_id = cr.id AND p.confirmed_by IS NOT NULL
    LEFT JOIN licences pl ON pl.id = p.licence_id
    WHERE cr.is_editorial = true
    ORDER BY cr.editorial_rank`);

  const works = await db.execute(sql`
    SELECT f.creator_id, f.title, f.year, f.note, f.media_key, f.sale_amount, f.source_url,
           f.verified, l.code AS licence
    FROM featured_works f LEFT JOIN licences l ON l.id = f.licence_id
    ORDER BY f.creator_id, f.sort`);

  return creators.rows.map((r) => ({
    rank: Number(r.editorial_rank ?? 0),
    slug: String(r.slug),
    name: String(r.name),
    realName: r.real_name ? String(r.real_name) : null,
    base: String(r.base ?? ""),
    known: String(r.known_for ?? ""),
    bio: String(r.bio ?? ""),
    hue: Number(r.hue ?? 200),
    anonymous: Boolean(r.anonymous),
    headline: { value: String(r.headline_value ?? ""), caption: String(r.headline_caption ?? "") },
    /* anonymous creators never get a portrait, whatever the table holds — only an avatar */
    photo: r.photo_key && (!r.anonymous || r.photo_kind === "avatar")
      ? {
          licence: r.photo_licence ? String(r.photo_licence) : null,
          licenceUrl: r.photo_licence_url ? String(r.photo_licence_url) : null,
          author: r.photo_author ? String(r.photo_author) : null,
          attribution: r.attribution ? String(r.attribution) : null,
          sourceUrl: r.photo_source ? String(r.photo_source) : null,
          focus: r.photo_focus ? String(r.photo_focus) : null,
          subject: r.photo_subject ? String(r.photo_subject) : null,
          kind: r.photo_kind === "avatar" ? "avatar" as const : "portrait" as const,
        }
      : null,
    works: works.rows
      .filter((w) => w.creator_id === r.id)
      .map((w) => ({
        title: String(w.title), year: String(w.year ?? ""), note: String(w.note ?? ""),
        image: w.media_key ? String(w.media_key) : null,
        licence: w.licence ? String(w.licence) : null,
        sourceUrl: w.source_url ? String(w.source_url) : null,
        saleAmount: w.sale_amount ? String(w.sale_amount) : null,
        verified: Boolean(w.verified),
      })),
  }));
}

/** Storage key of a creator's confirmed portrait, for /api/media/creator/<slug>. */
export async function getCreatorPhotoKey(slug: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.execute(sql`
    SELECT p.media_key FROM creator_photos p JOIN creators c ON c.id = p.creator_id
    WHERE c.slug = ${slug} AND p.confirmed_by IS NOT NULL
      AND (c.anonymous = false OR p.kind = 'avatar')
    LIMIT 1`);
  const key = rows.rows[0]?.media_key;
  return key ? String(key) : null;
}

/* ---------- dashboard figures ---------- */

export type SalePoint = { hour: string; mutez: number; name: string; id: string };
export type BuyerView = { handle: string; wallet: string; region: string; purchases: number; volumeMutez: number; since: string };
export type KpiView = { label: string; value: string; sub: string; delta: string };

/** Today's highest sale per hour. Outside the sales team, works that are not listed stay unnamed. */
export async function listHourlyHighs(opts: { includeUnlisted?: boolean } = {}): Promise<SalePoint[]> {
  const db = await getDb();
  const rows = await db.execute(sql`
    SELECT h.hour, h.amount_minor, h.work_code, h.work_title, w.status
    FROM market_hourly_high h LEFT JOIN works w ON w.code = h.work_code
    ORDER BY h.hour`);
  return rows.rows.map((r) => {
    const visible = opts.includeUnlisted || r.status === "Live";
    return {
      hour: String(r.hour), mutez: asMutez(r.amount_minor as number),
      name: visible ? String(r.work_title ?? "") : "Unlisted work", id: visible ? String(r.work_code ?? "") : "",
    };
  });
}

export async function listTopBuyers(): Promise<BuyerView[]> {
  const db = await getDb();
  const rows = await db.execute(sql`
    SELECT handle, wallet, region, purchases, volume_minor, since FROM top_buyers ORDER BY purchases DESC`);
  return rows.rows.map((r) => ({
    handle: String(r.handle), wallet: String(r.wallet ?? ""), region: String(r.region ?? ""),
    purchases: Number(r.purchases ?? 0), volumeMutez: asMutez(r.volume_minor as number),
    since: String(r.since ?? ""),
  }));
}

export async function listKpis(): Promise<KpiView[]> {
  const db = await getDb();
  const rows = await db.execute(sql`SELECT label, value, sub, delta FROM site_stats ORDER BY sort`);
  return rows.rows.map((r) => ({
    label: String(r.label), value: String(r.value), sub: String(r.sub ?? ""), delta: String(r.delta ?? ""),
  }));
}

/* ---------- accounts (email and password) ----------
   Wallet sign-in is switched off until the blockchain integration is built;
   the wallet columns stay in the table for that work. */

export type UserView = {
  id: string;
  email: string;
  displayName: string | null;
  role: "client" | "sales";
  passId: string;
  seed: number;
  createdAt: string;
  termsAcceptedAt: string | null;
  /** Session cookies issued before this instant (ms) are refused. */
  sessionsValidAfter: number;
};

const USER_COLS = sql`id, email, display_name, role, created_at, terms_accepted_at, sessions_valid_after`;

/* The Cadastra Pass is drawn from the email, so the register screen can show the
   same pass the account will have. */
export const passSeed = (email: string) => seedFrom(email.trim().toLowerCase());

const userView = (r: Record<string, unknown>): UserView => {
  const email = String(r.email ?? "");
  const seed = passSeed(email);
  return {
    id: String(r.id),
    email,
    displayName: r.display_name ? String(r.display_name) : null,
    role: r.role === "sales" ? "sales" : "client",
    passId: passIdFrom(seed),
    seed,
    createdAt: new Date(String(r.created_at)).toISOString(),
    termsAcceptedAt: r.terms_accepted_at ? new Date(String(r.terms_accepted_at)).toISOString() : null,
    sessionsValidAfter: r.sessions_valid_after ? new Date(String(r.sessions_valid_after)).getTime() : 0,
  };
};

export async function getUserById(id: string): Promise<UserView | null> {
  if (!/^\d{1,12}$/.test(id)) return null; /* also rejects cookies from the old wallet sign-in */
  const db = await getDb();
  const rows = await db.execute(sql`SELECT ${USER_COLS} FROM users WHERE id = ${Number(id)} AND email IS NOT NULL LIMIT 1`);
  return rows.rows[0] ? userView(rows.rows[0]) : null;
}

export async function getUserByEmail(email: string): Promise<UserView | null> {
  const db = await getDb();
  const rows = await db.execute(sql`SELECT ${USER_COLS} FROM users WHERE lower(email) = ${email.trim().toLowerCase()} LIMIT 1`);
  return rows.rows[0] ? userView(rows.rows[0]) : null;
}

/** The account and its password hash, for sign-in only. */
export async function getLoginByEmail(email: string): Promise<{ user: UserView; passwordHash: string } | null> {
  const db = await getDb();
  const rows = await db.execute(sql`
    SELECT ${USER_COLS}, password_hash FROM users
    WHERE lower(email) = ${email.trim().toLowerCase()} AND password_hash IS NOT NULL LIMIT 1`);
  const r = rows.rows[0];
  return r ? { user: userView(r), passwordHash: String(r.password_hash) } : null;
}

/** Creates an account. Returns null when the email is already registered. */
export async function createUser(data: {
  email: string; passwordHash: string; displayName: string | null; termsVersion: string;
}): Promise<UserView | null> {
  const db = await getDb();
  const rows = await db.execute(sql`
    INSERT INTO users (email, password_hash, display_name, role, terms_accepted_at, terms_version, last_seen_at)
    SELECT ${data.email.trim().toLowerCase()}, ${data.passwordHash}, ${data.displayName}, 'client', now(), ${data.termsVersion}, now()
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE lower(email) = ${data.email.trim().toLowerCase()})
    ON CONFLICT DO NOTHING
    RETURNING ${USER_COLS}`);
  return rows.rows[0] ? userView(rows.rows[0]) : null;
}

export async function touchUser(id: string) {
  const db = await getDb();
  await db.execute(sql`UPDATE users SET last_seen_at = now() WHERE id = ${Number(id)}`);
}

/* ---------- designer suggestions ---------- */

export type SuggestionView = { id: number; workCode: string; workTitle: string; author: string; body: string; status: string; createdAt: string };

export async function listSuggestions(workCode?: string): Promise<SuggestionView[]> {
  const db = await getDb();
  const rows = workCode
    ? await db.execute(sql`
        SELECT s.id, w.code, w.title, s.author, s.body, s.status, s.created_at
        FROM suggestions s JOIN works w ON w.id = s.work_id
        WHERE w.code = ${workCode} ORDER BY s.created_at DESC`)
    : await db.execute(sql`
        SELECT s.id, w.code, w.title, s.author, s.body, s.status, s.created_at
        FROM suggestions s JOIN works w ON w.id = s.work_id
        ORDER BY s.created_at DESC`);
  return rows.rows.map((r) => ({
    id: Number(r.id), workCode: String(r.code), workTitle: String(r.title),
    author: String(r.author), body: String(r.body), status: String(r.status),
    createdAt: new Date(String(r.created_at)).toISOString(),
  }));
}

/** Adds a designer suggestion. The review token is the designer's only credential,
    so the work is found by token, never by a code the browser could change. */
export async function insertSuggestion(reviewToken: string, author: string, body: string) {
  if (!reviewToken) return null;
  const db = await getDb();
  const work = await db.select({ id: schema.works.id }).from(schema.works).where(eq(schema.works.reviewToken, reviewToken)).limit(1);
  if (!work[0]) return null;
  await db.insert(schema.suggestions).values({ workId: work[0].id, author, body, status: "Open" });
  return true;
}

export async function updateSuggestionStatus(id: number, status: string) {
  const db = await getDb();
  await db.update(schema.suggestions).set({ status }).where(eq(schema.suggestions.id, id));
}

/* re-exported so callers do not need drizzle directly */
export { and, asc, desc, eq, sql };
