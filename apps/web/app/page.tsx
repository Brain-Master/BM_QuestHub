import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogPageClient } from "@/components/catalog-page-client";
import { PortalHero } from "@/components/portal-hero";
import { loadQuests, loadVenues, loadWorlds } from "@/lib/content/load";

export const metadata: Metadata = {
  title: "Каталог квестов",
};

export default async function HomePage() {
  const [quests, venues, worlds] = await Promise.all([
    loadQuests(),
    loadVenues(),
    loadWorlds(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <PortalHero
        eyebrow="BrainMaster Quest Hub"
        title="Вселенная Инженерных Квестов"
        description="Выберите миссию, площадку и смену. Запись часто завершается на mos.ru; если ссылки ещё нет — откроется форма заявки прямо из расписания."
      />

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
