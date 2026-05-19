import type { Metadata } from "next";

import { LiveAgenda } from "@/components/live-agenda";
import { PreferredSchoolBanner } from "@/components/preferred-school-banner";
import { loadQuestsShell, loadVenues, loadWorlds } from "@/lib/content/load";

export const metadata: Metadata = {
  title: "Расписание смен",
};

export default async function AgendaPage() {
  const [baseQuests, venues, worlds] = await Promise.all([
    loadQuestsShell(),
    loadVenues(),
    loadWorlds(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
      <PreferredSchoolBanner mode="agenda" />

      <LiveAgenda
        baseQuests={baseQuests}
        venues={venues}
        worlds={worlds}
        sitesHref="/sites"
      />
    </main>
  );
}
