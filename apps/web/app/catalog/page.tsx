import type { Metadata } from "next";
import { Suspense } from "react";

import { CommunityConnectPanel } from "@/components/community-connect-panel";
import { LiveCatalog } from "@/components/live-catalog";
import { PreferredSchoolBanner } from "@/components/preferred-school-banner";
import { communityConnectCopy } from "@/lib/community-connect-copy";
import { loadQuestsShell, loadVenues, loadWorlds } from "@/lib/content/load";

export const metadata: Metadata = {
  title: "Курсы BrainMaster",
};

export default async function CatalogPage() {
  const [baseQuests, venues, worlds] = await Promise.all([
    loadQuestsShell(),
    loadVenues(),
    loadWorlds(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
      <PreferredSchoolBanner mode="catalog" />

      <Suspense
        fallback={
          <div className="mb-10 h-28 animate-pulse rounded-2xl bg-white/5" />
        }
      >
        <LiveCatalog baseQuests={baseQuests} venues={venues} worlds={worlds} />
      </Suspense>

      <CommunityConnectPanel
        variant="card"
        className="mt-12"
        {...communityConnectCopy.catalogDoubt}
      />
    </main>
  );
}
