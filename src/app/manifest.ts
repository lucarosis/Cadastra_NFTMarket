import type { MetadataRoute } from "next";

/* Lets phones add Cadastra to the home screen with its own icon and colours. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cadastra — the NFT marketplace by Terra Ledger",
    short_name: "Cadastra",
    description: "Real estate, art and games on Tezos.",
    start_url: "/",
    display: "standalone",
    background_color: "#07070c",
    theme_color: "#07070c",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
