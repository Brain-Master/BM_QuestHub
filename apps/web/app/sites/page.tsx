import type { Metadata } from "next";
import { Suspense } from "react";

import { CommunityConnectPanel } from "@/components/community-connect-panel";
import { LiveSites } from "@/components/live-sites";
import { PortalHero } from "@/components/portal-hero";
import { communityConnectCopy } from "@/lib/community-connect-copy";
import { loadQuestsShell, loadVenues, loadWorlds } from "@/lib/content/load";

export const metadata: Metadata = {
  title: "Площадки",
};

export default async function SitesPage() {
  const [baseQuests, venues, worlds] = await Promise.all([
    loadQuestsShell(),
    loadVenues(),
    loadWorlds(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <PortalHero
        eyebrow="Площадки BrainMaster"
        title="Выберите площадку"
        description={
          "Начните с удобной локации: так проще найти подходящую смену, расписание и формат занятий."
        }
        showBadges={false}
      />

      <Suspense fallback={<div className="h-40 rounded-2xl bg-white/5" />}>
        <LiveSites baseQuests={baseQuests} venues={venues} worlds={worlds} />
      </Suspense>

      <CommunityConnectPanel
        variant="card"
        className="mt-12"
        {...communityConnectCopy.sitesBeforePick}
      />
    </main>
  );
}
