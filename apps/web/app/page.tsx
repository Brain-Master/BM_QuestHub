import type { Metadata } from "next";
import { Suspense } from "react";

import { LiveCatalog } from "@/components/live-catalog";
import { PortalHero } from "@/components/portal-hero";
import { loadQuestsShell, loadVenues, loadWorlds } from "@/lib/content/load";

export const metadata: Metadata = {
  title: "Курсы BrainMaster",
};

export default async function HomePage() {
  const [baseQuests, venues, worlds] = await Promise.all([
    loadQuestsShell(),
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
        <LiveCatalog baseQuests={baseQuests} venues={venues} worlds={worlds} />
      </Suspense>
    </main>
  );
}
