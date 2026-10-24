-- Stage 2: Tezos is the base currency. Amounts stay integers in the smallest
-- unit; that unit is now mutez (1 tez = 1,000,000 mutez). New rows default to
-- XTZ, and any row still marked ETH is converted by the seeder.

ALTER TABLE works              ALTER COLUMN price_currency SET DEFAULT 'XTZ';
ALTER TABLE drops              ALTER COLUMN price_currency SET DEFAULT 'XTZ';
ALTER TABLE market_hourly_high ALTER COLUMN currency      SET DEFAULT 'XTZ';
ALTER TABLE top_buyers         ALTER COLUMN currency      SET DEFAULT 'XTZ';
ALTER TABLE category_stats     ALTER COLUMN currency      SET DEFAULT 'XTZ';
