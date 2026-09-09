import type { Metadata } from "next";

import { LiveAgenda } from "@/components/live-agenda";
import { PreferredSchoolBanner } from "@/components/preferred-school-banner";
import {
  loadQuestsShell,
  loadScheduleSnapshotGeneratedAt,
  loadVenues,
  loadWorlds,
} from "@/lib/content/load";

export const metadata: Metadata = {
  title: "Расписание занятий и подбор кружка",
};

export default async function AgendaPage() {
  const [baseQuests, venues, worlds, initialSnapshotGeneratedAt] = await Promise.all([
    loadQuestsShell(),
    loadVenues(),
    loadWorlds(),
    loadScheduleSnapshotGeneratedAt(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
      <PreferredSchoolBanner mode="agenda" />

      <LiveAgenda
        baseQuests={baseQuests}
        venues={venues}
        worlds={worlds}
        initialSnapshotGeneratedAt={initialSnapshotGeneratedAt}
        sitesHref="/sites"
      />
    </main>
  );
}
