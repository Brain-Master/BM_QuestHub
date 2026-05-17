import type { Metadata } from "next";

import { OfferAgenda } from "@/components/offer-agenda";
import { PortalHero } from "@/components/portal-hero";
import { PreferredSchoolBanner } from "@/components/preferred-school-banner";
import { loadQuests, loadVenues, loadWorlds } from "@/lib/content/load";
import { buildAgendaItems, groupAgendaItems } from "@/lib/offers/agenda";

export const metadata: Metadata = {
  title: "Расписание смен",
};

export default async function AgendaPage() {
  const [quests, venues, worlds] = await Promise.all([
    loadQuests(),
    loadVenues(),
    loadWorlds(),
  ]);
  const groups = groupAgendaItems(buildAgendaItems({ quests, venues, worlds }));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <PortalHero
        eyebrow="Расписание лагерей"
        title="Глобальная повестка смен"
        description="Все смены всех площадок в режиме таймлайна: дата, программа, место и запись в одной карточке."
      />

      <PreferredSchoolBanner mode="agenda" />

      <OfferAgenda
        groups={groups}
        catalogHref="/catalog"
        sitesHref="/sites"
      />
    </main>
  );
}
