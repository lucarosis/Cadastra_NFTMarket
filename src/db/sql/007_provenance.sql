-- Stage 6: where every work's image comes from.
-- The catalogue now mixes Terra Ledger's own works, images from the company
-- website and public-domain museum works. Each carries its source and the
-- credit its licence asks for, shown on the work's page.
ALTER TABLE works ADD COLUMN IF NOT EXISTS source_url  text;
ALTER TABLE works ADD COLUMN IF NOT EXISTS attribution text;

-- A creator image is either a portrait (a photograph of the person) or, for an
-- anonymous creator, an avatar: artwork they use in place of a face.
ALTER TABLE creator_photos ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'portrait';
