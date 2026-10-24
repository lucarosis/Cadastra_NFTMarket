/* ============================================================
   Top 10 NFT creators — editorial feature.

   Profiles summarise widely reported public facts. The order is
   an editorial ranking by landmark sales and cultural influence;
   edit `CREATORS` to change it.

   IMAGES: `photo` and each work's `image` are null on purpose.
   Artist portraits and artworks are protected by copyright and
   publicity rights, so only add files you are licensed to use
   (e.g. supplied by the artist or their gallery) — put them in
   /public/creators/ and set the path here. Until then the page
   renders generated placeholders.

   Terra Ledger is not affiliated with these creators.
   ============================================================ */

export type CreatorWork = {
  title: string;
  year: string;
  note: string;
  image: string | null;
};

export type Creator = {
  rank: number;
  slug: string;
  name: string;
  realName?: string;
  base: string;
  known: string;
  headline: { value: string; caption: string };
  bio: string;
  photo: string | null;
  hue: number;
  works: CreatorWork[];
};

export const CREATORS_UPDATED = "September 2026";

export const CREATORS: Creator[] = [
  {
    rank: 1,
    slug: "beeple",
    name: "Beeple",
    realName: "Mike Winkelmann",
    base: "Charleston, South Carolina",
    known: "Digital art · Everydays",
    headline: { value: "$69.3M", caption: "Christie's, March 2021" },
    bio: "A graphic designer who has posted a new digital artwork every day since 2007. His collage of the first 5,000 of those images became the most expensive NFT ever sold at auction and brought NFTs into the mainstream art market.",
    photo: null,
    hue: 200,
    works: [
      { title: "Everydays: The First 5000 Days", year: "2021", note: "Christie's online sale, $69.3M", image: null },
      { title: "HUMAN ONE", year: "2021", note: "Kinetic sculpture with a changing digital artwork", image: null },
      { title: "CROSSROAD", year: "2020", note: "Election-themed piece that changed with the result", image: null },
      { title: "OCEAN FRONT", year: "2021", note: "Climate-themed work sold for charity", image: null },
    ],
  },
  {
    rank: 2,
    slug: "pak",
    name: "Pak",
    base: "Anonymous",
    known: "Conceptual digital art",
    headline: { value: "$91.8M", caption: "The Merge, December 2021" },
    bio: "An anonymous artist whose work questions ownership and scarcity. The Merge sold units of 'mass' to roughly 28,000 collectors at once, making it the highest total ever raised by a single NFT sale.",
    photo: null,
    hue: 0,
    works: [
      { title: "The Merge", year: "2021", note: "Mass units that combine when held together", image: null },
      { title: "Clock", year: "2022", note: "With Julian Assange; acquired by AssangeDAO", image: null },
      { title: "Lost Poets", year: "2021", note: "Collectible poets that collectors can name", image: null },
    ],
  },
  {
    rank: 3,
    slug: "xcopy",
    name: "XCOPY",
    base: "London",
    known: "Glitch art · Crypto culture",
    headline: { value: "1,600 ETH", caption: "Right-click and Save As guy, 2021" },
    bio: "A pioneer of crypto art who has minted since 2018. Flickering, dark animated loops about death, greed and internet culture made XCOPY a symbol of the NFT scene's early years.",
    photo: null,
    hue: 330,
    works: [
      { title: "Right-click and Save As guy", year: "2018", note: "Resold in 2021 for 1,600 ETH", image: null },
      { title: "A Coin for the Ferryman", year: "2018", note: "Resold in 2021 for 1,000 ETH", image: null },
      { title: "MAX PAIN", year: "2021", note: "Animated series on market cycles", image: null },
    ],
  },
  {
    rank: 4,
    slug: "larva-labs",
    name: "Larva Labs",
    realName: "Matt Hall & John Watkinson",
    base: "New York",
    known: "Generative collections",
    headline: { value: "10,000", caption: "CryptoPunks, 2017" },
    bio: "The studio behind CryptoPunks, one of the first NFT collections on Ethereum and the template for the profile-picture projects that followed. Yuga Labs acquired the CryptoPunks and Meebits IP in 2022.",
    photo: null,
    hue: 280,
    works: [
      { title: "CryptoPunks", year: "2017", note: "10,000 algorithmically generated characters", image: null },
      { title: "Autoglyphs", year: "2019", note: "Among the first generative art stored fully on-chain", image: null },
      { title: "Meebits", year: "2021", note: "20,000 3D voxel characters", image: null },
    ],
  },
  {
    rank: 5,
    slug: "yuga-labs",
    name: "Yuga Labs",
    base: "Miami",
    known: "Collections · Metaverse",
    headline: { value: "10,000", caption: "Bored Ape Yacht Club, 2021" },
    bio: "The company behind Bored Ape Yacht Club, which turned an NFT collection into a membership brand with commercial rights for holders. It grew into one of the largest companies in the NFT space.",
    photo: null,
    hue: 40,
    works: [
      { title: "Bored Ape Yacht Club", year: "2021", note: "10,000 apes with holder commercial rights", image: null },
      { title: "Mutant Ape Yacht Club", year: "2021", note: "Companion collection for ape holders", image: null },
      { title: "Otherside", year: "2022", note: "Metaverse land sale", image: null },
    ],
  },
  {
    rank: 6,
    slug: "tyler-hobbs",
    name: "Tyler Hobbs",
    base: "Austin, Texas",
    known: "Generative art",
    headline: { value: "999", caption: "Fidenza outputs, 2021" },
    bio: "A generative artist and former software engineer. Fidenza, his flow-field algorithm released on Art Blocks, became a benchmark for long-form generative art, where collectors mint outputs the artist has never seen.",
    photo: null,
    hue: 20,
    works: [
      { title: "Fidenza", year: "2021", note: "999 flow-field compositions on Art Blocks", image: null },
      { title: "QQL", year: "2022", note: "Collector-driven algorithm with Dandelion Wist", image: null },
    ],
  },
  {
    rank: 7,
    slug: "dmitri-cherniak",
    name: "Dmitri Cherniak",
    base: "Toronto",
    known: "Generative art · Automation",
    headline: { value: "1,000", caption: "Ringers outputs, 2021" },
    bio: "An artist and engineer whose work explores automation. Ringers, simple algorithmic drawings of string wrapped around pegs, is one of the most valued generative collections and has sold at Sotheby's.",
    photo: null,
    hue: 50,
    works: [
      { title: "Ringers", year: "2021", note: "String-and-peg compositions on Art Blocks", image: null },
      { title: "Light Years", year: "2021", note: "Generative series on Art Blocks", image: null },
    ],
  },
  {
    rank: 8,
    slug: "snowfro",
    name: "Snowfro",
    realName: "Erick Calderon",
    base: "Houston, Texas",
    known: "Founder of Art Blocks",
    headline: { value: "Art Blocks", caption: "Generative art platform, 2020" },
    bio: "Creator of Chromie Squiggle and founder of Art Blocks, the platform that made on-chain generative art a major NFT category. Many of the most influential generative artists launched their work there.",
    photo: null,
    hue: 150,
    works: [
      { title: "Chromie Squiggle", year: "2020", note: "The founding Art Blocks project", image: null },
      { title: "Art Blocks Curated", year: "2020", note: "Platform programme for generative releases", image: null },
    ],
  },
  {
    rank: 9,
    slug: "refik-anadol",
    name: "Refik Anadol",
    base: "Los Angeles",
    known: "AI · Data paintings",
    headline: { value: "MoMA", caption: "Unsupervised, 2022–23" },
    bio: "A media artist who turns large datasets into moving 'data paintings' using machine learning. His installation Unsupervised, trained on MoMA's collection, was shown in the museum's lobby.",
    photo: null,
    hue: 190,
    works: [
      { title: "Unsupervised", year: "2022", note: "AI work trained on MoMA's collection", image: null },
      { title: "Machine Hallucinations", year: "2019–", note: "Ongoing series of data sculptures", image: null },
      { title: "Winds of Yawanawá", year: "2022", note: "Collaboration with the Yawanawá people", image: null },
    ],
  },
  {
    rank: 10,
    slug: "fewocious",
    name: "FEWOCiOUS",
    realName: "Victor Langlois",
    base: "United States",
    known: "Painting · Digital illustration",
    headline: { value: "$2.16M", caption: "Christie's, June 2021" },
    bio: "A young artist who became one of the best-selling NFT artists while still in his teens. His bright, personal work sold at Christie's, and his sneaker collaboration with RTFKT sold out in minutes.",
    photo: null,
    hue: 300,
    works: [
      { title: "Hello, I'm Victor (FEWOCiOUS) and This Is My Life", year: "2021", note: "Christie's sale, $2.16M", image: null },
      { title: "FEWO × RTFKT sneakers", year: "2021", note: "Digital sneaker drop with RTFKT", image: null },
    ],
  },
];
