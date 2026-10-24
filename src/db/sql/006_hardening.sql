-- Stage 5: hardening, members-only marketplace, catalogue and portrait imports.
-- Safe to run repeatedly.

-- Terms are accepted once, at registration, and recorded here — the checkbox
-- on /register is no longer the only evidence.
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_version     text;

-- Session revocation. A session cookie issued before this moment is refused.
-- Support can sign a wallet out everywhere with:
--   UPDATE users SET sessions_valid_after = now() WHERE wallet_address = '…';
ALTER TABLE users ADD COLUMN IF NOT EXISTS sessions_valid_after timestamptz NOT NULL DEFAULT 'epoch';

-- Review tokens used to be the work code plus four characters (rv-0417-tqm4),
-- which can be guessed. Replace any in that form with a 122-bit random token.
UPDATE works
   SET review_token = 'rv_' || replace(gen_random_uuid()::text, '-', '')
 WHERE review_token IS NULL OR review_token ~ '^rv-[0-9]{4}-[a-z0-9]{4}$';

-- Creator portraits: one per creator, and a person must confirm that the
-- photograph shows that creator before it is published.
ALTER TABLE creator_photos ADD COLUMN IF NOT EXISTS subject      text;
ALTER TABLE creator_photos ADD COLUMN IF NOT EXISTS confirmed_by text;
ALTER TABLE creator_photos ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE creator_photos ADD COLUMN IF NOT EXISTS focus        text;
CREATE UNIQUE INDEX IF NOT EXISTS creator_photos_creator ON creator_photos (creator_id);
