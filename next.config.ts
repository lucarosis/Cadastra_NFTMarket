import type { NextConfig } from "next";
import { readFileSync } from "node:fs";

/* On a deployment without SESSION_SECRET, the build generates one
   (scripts/setup.mjs → .data/deploy-secret) and it is built into the server code
   here, so every server and the proxy share it. Never in git. */
function deploySecret(): string | undefined {
  if (process.env.SESSION_SECRET) return undefined;
  try {
    return readFileSync(".data/deploy-secret", "utf8").trim() || undefined;
  } catch {
    return undefined;
  }
}

const generated = deploySecret();

const nextConfig: NextConfig = {
  /* Database drivers must stay outside the bundle: pg is native,
     PGlite ships WebAssembly. */
  serverExternalPackages: ["@electric-sql/pglite", "pg"],

  ...(generated ? { env: { DEPLOY_SESSION_SECRET: generated } } : {}),

  /* Files read at run time must ship with the server code on serverless hosts:
     originals for the image routes, and the demo database the build prepared. */
  outputFileTracingIncludes: {
    "/**": ["./.data/deploy-db.tar.gz"],
    "/api/media/[id]": ["./public/assets/nft/**/*", "./private/nft/**/*"],
    "/api/media/creator/[slug]": ["./public/assets/creators/**/*", "./private/creators/**/*"],
    "/api/health": ["./public/assets/nft/catalog.csv", "./private/nft/catalog.csv"],
  },
};

export default nextConfig;
