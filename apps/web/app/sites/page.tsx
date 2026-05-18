import type { Metadata } from "next";
import { Suspense } from "react";

import { PortalHero } from "@/components/portal-hero";
import { SiteSelectionGrid } from "@/components/site-selection-grid";
import { loadQuests, loadVenues, loadWorlds } from "@/lib/content/load";
import { getSchoolScopes } from "@/lib/offers/agenda";
import { buildCityOptions, buildSiteScopeCards } from "@/lib/sites/scope-card";

export const metadata: Metadata = {
  title: "Площадки",
};

export default async function SitesPage() {
  const [quests, venues, worlds] = await Promise.all([
    loadQuests(),
    loadVenues(),
    loadWorlds(),
  ]);
  const sites = buildSiteScopeCards({
    scopes: getSchoolScopes(venues),
    quests,
    venues,
    worlds,
  });
  const cityOptions = buildCityOptions(sites);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <PortalHero
        eyebrow="Площадки BrainMaster"
        title="Выберите площадку"
        description="Начните с удобной площадки, чтобы сразу видеть релевантные смены и курсы. Если хотите сравнить все варианты BrainMaster, полный список всегда рядом."
        showBadges={false}
      />

      <Suspense fallback={<div className="h-40 rounded-2xl bg-white/5" />}>
        <SiteSelectionGrid sites={sites} cityOptions={cityOptions} />
      </Suspense>
    </main>
  );
}
