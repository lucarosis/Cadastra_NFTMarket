-- The dashboard's green chart ("fairly priced, most liked") compares a work's
-- asking price with an estimated fair value. Stored per work, in the same
-- minor units as the price. NULL means "no estimate", and the work is left out.

ALTER TABLE works ADD COLUMN IF NOT EXISTS fair_value_minor bigint;
