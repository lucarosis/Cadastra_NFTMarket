import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/DashboardClient";
import {
  listCategories, listFairlyPriced, listHourlyHighs, listKpis, listPendingWorks,
  listSuggestions, listTopBuyers, listWorks,
} from "@/lib/repo";
import { getXtzUsd } from "@/lib/price";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  /* The role decides what is loaded, not just what is shown: anything passed
     to the client component ends up in the page, visible to whoever loads it. */
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/dashboard");
  const isSales = viewer.role === "sales";

  const [hourly, liked, categories, works, rate, sales] = await Promise.all([
    listHourlyHighs({ includeUnlisted: isSales }),
    listFairlyPriced(),
    listCategories(),
    listWorks({ status: isSales ? undefined : "Live" }),
    getXtzUsd(),
    isSales
      ? Promise.all([listKpis(), listTopBuyers(), listPendingWorks(), listSuggestions()])
      : null,
  ]);
  const [kpis, buyers, pending, suggestions] = sales ?? [[], [], [], []];

  return (
    <DashboardClient
      isSales={isSales}
      kpis={kpis}
      hourly={hourly}
      liked={liked}
      buyers={buyers}
      categories={categories}
      works={works}
      pending={pending}
      suggestions={suggestions}
      usdRate={rate.usdPerTez}
      updatedAt={new Date().toISOString()}
    />
  );
}
