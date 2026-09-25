import type { Metadata } from "next";
import { Suspense } from "react";

import { CommunityConnectPanel } from "@/components/community-connect-panel";
import { LiveCatalog } from "@/components/live-catalog";
import { StaticCatalog } from "@/components/static-course-content";
import { PreferredSchoolBanner } from "@/components/preferred-school-banner";
import { communityConnectCopy } from "@/lib/community-connect-copy";
import { loadQuests, loadVenues, loadWorlds } from "@/lib/content/load";

export const metadata: Metadata = {
  title: "Курсы BrainMaster",
};

export default async function CatalogPage() {
  const [baseQuests, venues, worlds] = await Promise.all([
    loadQuests(),
    loadVenues(),
    loadWorlds(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
      <PreferredSchoolBanner mode="catalog" />

      <Suspense
        fallback={
          <StaticCatalog quests={baseQuests} venues={venues} />
        }
      >
        <LiveCatalog baseQuests={baseQuests} venues={venues} worlds={worlds} heading="h1" />
      </Suspense>

      <CommunityConnectPanel
        variant="card"
        className="mt-12"
        {...communityConnectCopy.catalogDoubt}
      />
    </main>
  );
}
