-- Stage 3: wallet-first accounts.
-- Sign-in is a signed challenge: the server issues a single-use nonce, the
-- wallet signs it, the server verifies the signature against the account's
-- public key. Nonces live here so they survive a restart and cannot be replayed.

CREATE TABLE IF NOT EXISTS auth_nonces (
  nonce       text PRIMARY KEY,
  address     text NOT NULL,
  message     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz
);
CREATE INDEX IF NOT EXISTS auth_nonces_expiry_idx ON auth_nonces (expires_at);

-- What the wallet was worth when the account was admitted (the $50 rule).
-- Kept as a snapshot so support can see what was checked, and when.
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance_usd_cents  bigint;
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance_checked_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance_sources    text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at       timestamptz;
