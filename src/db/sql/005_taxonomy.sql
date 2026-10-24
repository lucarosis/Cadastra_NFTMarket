-- Stage 4: Art / Real Estate / Gaming.
--
-- The demo catalogue is reloaded by the seeder, which writes the new taxonomy
-- directly. This file carries the same change for a database that already holds
-- real rows: Entertainment and Avatar fold into Gaming, and the merged figures
-- are summed rather than lost. Safe to run repeatedly.

DO $$
DECLARE
  gaming_id integer;
  avatar_id integer;
BEGIN
  -- Entertainment becomes Gaming
  UPDATE categories
     SET name = 'Gaming',
         slug = 'gaming',
         blurb = 'Items, characters and worlds for games and social spaces.'
   WHERE slug = 'entertainment';

  SELECT id INTO gaming_id FROM categories WHERE slug = 'gaming';
  SELECT id INTO avatar_id FROM categories WHERE slug = 'avatar';

  -- Avatar folds into Gaming
  IF avatar_id IS NOT NULL AND gaming_id IS NOT NULL THEN
    UPDATE works SET category_id = gaming_id WHERE category_id = avatar_id;
    UPDATE drops SET category_id = gaming_id WHERE category_id = avatar_id;

    UPDATE category_stats g
       SET designs      = g.designs + a.designs,
           designers    = g.designers + a.designers,
           volume_minor = g.volume_minor + a.volume_minor
      FROM category_stats a
     WHERE g.category_id = gaming_id AND a.category_id = avatar_id;

    DELETE FROM category_stats WHERE category_id = avatar_id;
    DELETE FROM subcategories  WHERE category_id = avatar_id;
    DELETE FROM categories     WHERE id = avatar_id;
  END IF;

  -- Tidy the remaining names
  UPDATE categories SET name = 'Real Estate', slug = 'real-estate',
         blurb = 'Architecture, interiors and property-linked works. One property, one vehicle.'
   WHERE slug IN ('real-estate', 'real estate');

  UPDATE categories SET sort = CASE slug WHEN 'art' THEN 0 WHEN 'real-estate' THEN 1 WHEN 'gaming' THEN 2 ELSE sort END;
END $$;

-- Property certificates are gated until counsel signs off (decision Q5).
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS restricted boolean NOT NULL DEFAULT false;
