import type { Metadata } from "next";

import { PortalHero } from "@/components/portal-hero";
import { SiteSelectionGrid } from "@/components/site-selection-grid";
import { loadVenues } from "@/lib/content/load";
import { getSchoolScopes } from "@/lib/offers/agenda";

export const metadata: Metadata = {
  title: "Площадки",
};

export default async function SitesPage() {
  const venues = await loadVenues();
  const schools = getSchoolScopes(venues);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <PortalHero
        eyebrow="School Selector"
        title="Выберите свою площадку"
        description="Откройте расписание или каталог конкретной школы. Выбор запомнится в браузере и поможет быстро возвращаться к нужной площадке."
      />

      <SiteSelectionGrid schools={schools} />
    </main>
  );
}
