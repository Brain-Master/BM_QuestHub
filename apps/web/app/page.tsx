import type { Metadata } from "next";
import { Suspense } from "react";

import { CommunityConnectPanel } from "@/components/community-connect-panel";
import { LiveCatalog } from "@/components/live-catalog";
import { StaticCatalog } from "@/components/static-course-content";
import { PortalHero } from "@/components/portal-hero";
import { YearProgramsSection } from "@/components/year-programs-section";
import { communityConnectCopy } from "@/lib/community-connect-copy";
import { loadQuests, loadVenues, loadWorlds } from "@/lib/content/load";

export const metadata: Metadata = {
  title: "Курсы BrainMaster",
};

export default async function HomePage() {
  const [baseQuests, venues, worlds] = await Promise.all([
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
        aside={
          <CommunityConnectPanel
            variant="aside"
            showPhone={false}
            {...communityConnectCopy.homeHeroAside}
          />
        }
      />

      <YearProgramsSection />

      <Suspense
        fallback={
          <StaticCatalog quests={baseQuests} venues={venues} heading="h2" />
        }
      >
        <LiveCatalog baseQuests={baseQuests} venues={venues} worlds={worlds} />
      </Suspense>
    </main>
  );
}
