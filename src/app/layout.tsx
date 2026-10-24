import type { Metadata, Viewport } from "next";
import { Unbounded, Manrope, JetBrains_Mono } from "next/font/google";
import { AccountProvider } from "@/lib/account";
import { getViewer } from "@/lib/viewer";
import { PriceStrip } from "@/components/PriceStrip";
import { ToastProvider } from "@/components/Toaster";
import "./globals.css";
import "./site.css";

const display = Unbounded({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});
const body = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

/* Absolute address for link previews: SITE_URL if set, else the Vercel production domain */
const siteUrl =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const viewport: Viewport = { themeColor: "#07070c" };

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Cadastra",
  openGraph: { siteName: "Cadastra", type: "website" },
  twitter: { card: "summary_large_image" },
  title: "Cadastra — The NFT marketplace by Terra Ledger",
  description:
    "Cadastra is Terra Ledger's NFT marketplace where collectors buy and sell digital assets in tez, and where new creations launch every season with long-term client partners.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  /* Resolve the session here so the header renders signed-in on first paint. */
  /* if the database is unreachable, render signed-out: the pages that need data show
     the error page, which points to /api/health */
  const account = await getViewer().catch(() => null);

  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <AccountProvider initialAccount={account}>
          <ToastProvider>
            <PriceStrip />
            {children}
          </ToastProvider>
        </AccountProvider>
      </body>
    </html>
  );
}
