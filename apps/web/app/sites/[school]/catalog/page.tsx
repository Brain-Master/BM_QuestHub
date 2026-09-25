import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CommunityConnectPanel } from "@/components/community-connect-panel";
import { LiveCatalog } from "@/components/live-catalog";
import { StaticCatalog } from "@/components/static-course-content";
import { RememberSchoolOnVisit } from "@/components/remember-school-on-visit";
import { communityConnectCopy } from "@/lib/community-connect-copy";
import { loadQuests, loadVenues, loadWorlds } from "@/lib/content/load";
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
    title: `Курсы · ${school.name}`,
    description: `Курсы BrainMaster для площадки ${school.name}.`,
  };
}

export default async function SchoolCatalogPage({ params }: Props) {
  const { school: schoolSlug } = await params;
  const [baseQuests, venues, worlds] = await Promise.all([
    loadQuests(),
    loadVenues(),
    loadWorlds(),
  ]);
  const school = resolveSchoolScope(venues, schoolSlug);
  if (!school) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
      <RememberSchoolOnVisit slug={school.slug} name={school.name} />

      <Suspense
        fallback={
          <StaticCatalog quests={baseQuests} venues={venues} school={school.slug} />
        }
      >
        <LiveCatalog
          baseQuests={baseQuests}
          venues={venues}
          worlds={worlds}
          fixedSchool={{ slug: school.slug, name: school.name }}
          title="Курсы площадки"
          heading="h1"
          emptyMessage="Для этой площадки пока нет активных миссий."
        />
      </Suspense>

      <CommunityConnectPanel
        variant="card"
        className="mt-12"
        {...communityConnectCopy.catalogDoubt}
      />
    </main>
  );
}
