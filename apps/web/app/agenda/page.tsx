import type { Metadata } from "next";

import { OfferAgenda } from "@/components/offer-agenda";
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
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
      <PreferredSchoolBanner mode="agenda" />

      <OfferAgenda
        groups={groups}
        sitesHref="/sites"
      />
    </main>
  );
}
