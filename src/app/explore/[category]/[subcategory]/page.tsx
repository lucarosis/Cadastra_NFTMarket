import type { Metadata } from "next";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { ExploreSection } from "@/components/ExploreSection";
import { getCategoryBySlug } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; subcategory: string }>;
}): Promise<Metadata> {
  const { category, subcategory } = await params;
  const found = await getCategoryBySlug(category);
  const sub = found?.subcategories.find((s) => s.slug === subcategory);
  return sub
    ? { title: `${sub.name} — ${found?.name} — Cadastra` }
    : { title: "Explore assets — Cadastra" };
}

export default async function SubcategoryPage({
  params,
}: {
  params: Promise<{ category: string; subcategory: string }>;
}) {
  const { category, subcategory } = await params;
  return (
    <>
      <TopBar />
      <main>
        <ExploreSection category={category} subcategory={subcategory} />
      </main>
      <SiteFooter />
    </>
  );
}
