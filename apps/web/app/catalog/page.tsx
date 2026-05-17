import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogPageClient } from "@/components/catalog-page-client";
import { PortalHero } from "@/components/portal-hero";
import { PreferredSchoolBanner } from "@/components/preferred-school-banner";
import { loadQuests, loadVenues, loadWorlds } from "@/lib/content/load";

export const metadata: Metadata = {
  title: "Каталог квестов",
};

export default async function CatalogPage() {
  const [quests, venues, worlds] = await Promise.all([
    loadQuests(),
    loadVenues(),
    loadWorlds(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <PortalHero
        eyebrow="BrainMaster Quest Hub"
        title="Глобальный каталог миссий"
        description="Все инженерные квесты и смены без фильтра по школе. Если вы уже выбрали площадку, можно быстро вернуться к её каталогу."
      />

      <PreferredSchoolBanner mode="catalog" />

      <Suspense
        fallback={
          <div className="mb-10 h-28 animate-pulse rounded-2xl bg-white/5" />
        }
      >
        <CatalogPageClient quests={quests} venues={venues} worlds={worlds} />
      </Suspense>
    </main>
  );
}
