/* Where the artwork and artist photos live.

   Their home is public/assets/ (nft/ and creators/). Older copies of the project kept
   them in private/, which is still read when public/assets/ does not exist yet. */

import { existsSync } from "node:fs";
import path from "node:path";

const PUBLIC_ASSETS = path.join(process.cwd(), "public", "assets");
const OLD_PRIVATE = path.join(process.cwd(), "private");

export const ASSETS = existsSync(PUBLIC_ASSETS) || !existsSync(OLD_PRIVATE) ? PUBLIC_ASSETS : OLD_PRIVATE;
export const NFT_DIR = path.join(ASSETS, "nft");
export const CREATORS_DIR = path.join(ASSETS, "creators");

/** A path as shown in messages, relative to the project folder. */
export const shown = (p) => path.relative(process.cwd(), p).split(path.sep).join("/");
