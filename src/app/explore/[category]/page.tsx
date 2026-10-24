import type { Metadata } from "next";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { ExploreSection } from "@/components/ExploreSection";
import { getCategoryBySlug } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const found = await getCategoryBySlug(category);
  return found
    ? { title: `${found.name} — Cadastra`, description: found.blurb }
    : { title: "Explore assets — Cadastra" };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  return (
    <>
      <TopBar />
      <main>
        <ExploreSection category={category} />
      </main>
      <SiteFooter />
    </>
  );
}
