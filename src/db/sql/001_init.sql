-- Terra Ledger — initial schema. Idempotent: safe to run repeatedly.
-- Mirrors src/db/schema.ts. Apply with: npm run db:setup

CREATE TABLE IF NOT EXISTS categories (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  blurb text,
  sort integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS subcategories (
  id serial PRIMARY KEY,
  category_id integer NOT NULL REFERENCES categories(id),
  slug text NOT NULL,
  name text NOT NULL,
  sort integer NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS subcategories_cat_slug ON subcategories (category_id, slug);

CREATE TABLE IF NOT EXISTS licences (
  id serial PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  url text,
  allows_commercial boolean NOT NULL DEFAULT false,
  requires_attribution boolean NOT NULL DEFAULT false,
  notes text
);

CREATE TABLE IF NOT EXISTS creators (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  real_name text,
  base text,
  known_for text,
  bio text,
  hue integer NOT NULL DEFAULT 200,
  headline_value text,
  headline_caption text,
  is_editorial boolean NOT NULL DEFAULT true,
  editorial_rank integer,
  anonymous boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS creator_photos (
  id serial PRIMARY KEY,
  creator_id integer NOT NULL REFERENCES creators(id),
  media_key text NOT NULL,
  licence_id integer REFERENCES licences(id),
  author text,
  source_url text,
  attribution text,
  width integer,
  height integer
);

CREATE TABLE IF NOT EXISTS featured_works (
  id serial PRIMARY KEY,
  creator_id integer NOT NULL REFERENCES creators(id),
  title text NOT NULL,
  year text,
  note text,
  media_key text,
  licence_id integer REFERENCES licences(id),
  sale_amount text,
  sale_date text,
  venue text,
  source_url text,
  verified boolean NOT NULL DEFAULT false,
  sort integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS partners (
  id serial PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  sector text,
  since_year text,
  seasons integer NOT NULL DEFAULT 0,
  releases integer NOT NULL DEFAULT 0,
  tone text NOT NULL DEFAULT 'lime'
);

CREATE TABLE IF NOT EXISTS works (
  id serial PRIMARY KEY,
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  creator_id integer REFERENCES creators(id),
  creator_name text NOT NULL,
  studio text,
  category_id integer NOT NULL REFERENCES categories(id),
  subcategory_id integer REFERENCES subcategories(id),
  status text NOT NULL DEFAULT 'Draft',
  price_amount_minor bigint NOT NULL DEFAULT 0,
  price_currency text NOT NULL DEFAULT 'ETH',
  likes integer NOT NULL DEFAULT 0,
  owners integer NOT NULL DEFAULT 0,
  editions integer NOT NULL DEFAULT 1,
  minted_at date,
  review_token text UNIQUE,
  brief text,
  description text,
  media_key text NOT NULL,
  licence_id integer REFERENCES licences(id),
  royalty_bps integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS works_status_idx ON works (status);
CREATE INDEX IF NOT EXISTS works_category_idx ON works (category_id);

CREATE TABLE IF NOT EXISTS drops (
  id serial PRIMARY KEY,
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  partner_id integer REFERENCES partners(id),
  studio text,
  category_id integer REFERENCES categories(id),
  release_date date NOT NULL,
  supply integer NOT NULL DEFAULT 0,
  price_amount_minor bigint NOT NULL DEFAULT 0,
  price_currency text NOT NULL DEFAULT 'ETH',
  season text,
  status text NOT NULL DEFAULT 'Upcoming',
  media_key text,
  blurb text,
  minted_pct integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  wallet_address text UNIQUE,
  email text UNIQUE,
  display_name text,
  org text,
  role text NOT NULL DEFAULT 'client',
  pass_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_users (
  id serial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  totp_secret text,
  name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suggestions (
  id serial PRIMARY KEY,
  work_id integer NOT NULL REFERENCES works(id),
  author text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'Open',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS suggestions_work_idx ON suggestions (work_id);

CREATE TABLE IF NOT EXISTS market_hourly_high (
  id serial PRIMARY KEY,
  hour text NOT NULL,
  amount_minor bigint NOT NULL,
  currency text NOT NULL DEFAULT 'ETH',
  work_code text,
  work_title text
);

CREATE TABLE IF NOT EXISTS top_buyers (
  id serial PRIMARY KEY,
  handle text NOT NULL,
  wallet text,
  region text,
  purchases integer NOT NULL DEFAULT 0,
  volume_minor bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'ETH',
  since text
);

CREATE TABLE IF NOT EXISTS category_stats (
  category_id integer PRIMARY KEY REFERENCES categories(id),
  designs integer NOT NULL DEFAULT 0,
  designers integer NOT NULL DEFAULT 0,
  volume_minor bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'ETH'
);

CREATE TABLE IF NOT EXISTS site_stats (
  key text PRIMARY KEY,
  label text NOT NULL,
  value text NOT NULL,
  sub text,
  delta text,
  sort integer NOT NULL DEFAULT 0
);
