/* ============================================================
   SEED FIXTURE — the catalogue taxonomy.

   Terra Ledger's core industries are art, real estate and gaming
   (decision Q4/R4), so those are the three categories. The old
   demo had "Entertainment" and "Avatar"; both fold into Gaming.

   Property certificates stay switched off until counsel confirms
   the structure (decision Q5 / R-LEGAL): works may be filed under
   that subcategory, but it is marked `restricted` so the UI can
   keep them out of public sale.
   ============================================================ */

export type SubcategorySeed = { slug: string; name: string; restricted?: boolean };
export type CategorySeed = { slug: string; name: string; blurb: string; subcategories: SubcategorySeed[] };

export const CATEGORY_SEED: CategorySeed[] = [
  {
    slug: "art",
    name: "Art",
    blurb: "Originals and editions, with authorship and royalties enforced by contract.",
    subcategories: [
      { slug: "digital-painting", name: "Digital painting" },
      { slug: "generative", name: "Generative" },
      { slug: "photography", name: "Photography" },
      { slug: "3d-and-motion", name: "3D and motion" },
    ],
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    blurb: "Architecture, interiors and property-linked works. One property, one vehicle.",
    subcategories: [
      { slug: "architecture", name: "Architecture and concept design" },
      { slug: "virtual-property", name: "Virtual property and interiors" },
      { slug: "certificates", name: "Property certificates", restricted: true },
    ],
  },
  {
    slug: "gaming",
    name: "Gaming",
    blurb: "Items, characters and worlds for games and social spaces.",
    subcategories: [
      { slug: "in-game-items", name: "In-game items" },
      { slug: "characters", name: "Characters and avatars" },
      { slug: "collectible-cards", name: "Collectible cards" },
      { slug: "worlds-and-land", name: "Game worlds and land" },
    ],
  },
];

/** Where each demo work belongs under the new taxonomy: code → [category, subcategory]. */
export const WORK_TAXONOMY: Record<string, [string, string]> = {
  "TL-0417": ["art", "generative"],
  "TL-0418": ["art", "photography"],
  "TL-0421": ["art", "digital-painting"],
  "TL-0430": ["art", "digital-painting"],

  "TL-0512": ["gaming", "in-game-items"],
  "TL-0515": ["gaming", "collectible-cards"],
  "TL-0519": ["gaming", "worlds-and-land"],
  "TL-0524": ["gaming", "in-game-items"],

  "TL-0611": ["real-estate", "certificates"],
  "TL-0614": ["real-estate", "certificates"],
  "TL-0618": ["real-estate", "virtual-property"],
  "TL-0622": ["real-estate", "architecture"],

  "TL-0703": ["gaming", "characters"],
  "TL-0707": ["gaming", "characters"],
  "TL-0712": ["gaming", "characters"],
  "TL-0716": ["gaming", "characters"],
};

/** Drops use the same three categories. */
export const DROP_TAXONOMY: Record<string, string> = {
  "DR-311": "gaming",
  "DR-312": "gaming",
  "DR-313": "art",
  "DR-314": "real-estate",
  "DR-315": "gaming",
  "DR-316": "gaming",
  "DR-309": "gaming",
  "DR-310": "art",
};

/** Headline figures per category, restated for the three-way split. */
export const CATEGORY_STATS_SEED: Record<string, { designs: number; designers: number; volumeTez: number }> = {
  art: { designs: 946, designers: 141, volumeTez: 6_310_200 },
  "real-estate": { designs: 41, designers: 4, volumeTez: 9_184_700 },
  gaming: { designs: 2_957, designers: 184, volumeTez: 7_888_300 },
};
