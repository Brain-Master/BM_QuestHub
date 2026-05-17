import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OfferAgenda } from "@/components/offer-agenda";
import { PortalHero } from "@/components/portal-hero";
import { RememberSchoolOnVisit } from "@/components/remember-school-on-visit";
import { loadQuests, loadVenues, loadWorlds } from "@/lib/content/load";
import {
  buildAgendaItems,
  getSchoolScopes,
  groupAgendaItems,
  resolveSchoolScope,
} from "@/lib/offers/agenda";

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
  const [quests, venues, worlds] = await Promise.all([
    loadQuests(),
    loadVenues(),
    loadWorlds(),
  ]);
  const school = resolveSchoolScope(venues, schoolSlug);
  if (!school) notFound();

  const groups = groupAgendaItems(
    buildAgendaItems({ quests, venues, worlds, schoolSlug: school.slug }),
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <RememberSchoolOnVisit slug={school.slug} name={school.name} />

      <PortalHero
        eyebrow="Расписание площадки"
        title={`Смены: ${school.name}`}
        description="Таймлайн смен для выбранной школы. Общие базы BrainMaster остаются видимыми, если они доступны для любого школьного скоупа."
      />

      <OfferAgenda
        groups={groups}
        schoolSlug={school.slug}
        catalogHref={`/sites/${school.slug}/catalog`}
        allAgendaHref="/agenda"
        sitesHref="/sites"
      />
    </main>
  );
}
