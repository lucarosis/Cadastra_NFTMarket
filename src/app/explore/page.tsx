import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { ExploreSection } from "@/components/ExploreSection";
import { listCategories } from "@/lib/repo";

/* Catalogue changes between deployments: read per request, never frozen into the build. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore assets — Cadastra",
  description: "Browse, search and collect NFT assets across art, real estate and gaming.",
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  /* Links made before Stage 4 used ?category=Art — send them to the new route. */
  const { category } = await searchParams;
  if (category) {
    const match = (await listCategories()).find(
      (c) => c.slug === category.toLowerCase() || c.name.toLowerCase() === category.toLowerCase(),
    );
    if (match) redirect(`/explore/${match.slug}`);
  }

  return (
    <>
      <TopBar />
      <main>
        <ExploreSection />
      </main>
      <SiteFooter />
    </>
  );
}
