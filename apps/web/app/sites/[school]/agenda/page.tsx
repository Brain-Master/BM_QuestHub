import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LiveAgenda } from "@/components/live-agenda";
import { RememberSchoolOnVisit } from "@/components/remember-school-on-visit";
import { loadQuestsShell, loadVenues, loadWorlds } from "@/lib/content/load";
import { getSchoolScopes, resolveSchoolScope } from "@/lib/offers/agenda";

type Props = {
  params: Promise<{ school: string }>;
};

export async function generateStaticParams() {
  const venues = await loadVenues();
  return getSchoolScopes(venues).flatMap((school) =>
    school.routeSlugs.map((routeSlug) => ({ school: routeSlug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { school: schoolSlug } = await params;
  const venues = await loadVenues();
  const school = resolveSchoolScope(venues, schoolSlug);
  if (!school) return { title: "Площадка не найдена" };
  return {
    title: `Расписание · ${school.name}`,
    description: `Смены BrainMaster для площадки ${school.name}.`,
  };
}

export default async function SchoolAgendaPage({ params }: Props) {
  const { school: schoolSlug } = await params;
  const [baseQuests, venues, worlds] = await Promise.all([
    loadQuestsShell(),
    loadVenues(),
    loadWorlds(),
  ]);
  const school = resolveSchoolScope(venues, schoolSlug);
  if (!school) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
      <RememberSchoolOnVisit slug={school.slug} name={school.name} />

      <LiveAgenda
        baseQuests={baseQuests}
        venues={venues}
        worlds={worlds}
        schoolSlug={school.slug}
        schoolName={school.name}
        allAgendaHref="/agenda"
        sitesHref="/sites"
      />
    </main>
  );
}
