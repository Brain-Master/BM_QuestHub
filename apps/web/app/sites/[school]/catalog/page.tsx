import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CatalogPageClient } from "@/components/catalog-page-client";
import { RememberSchoolOnVisit } from "@/components/remember-school-on-visit";
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
    title: `Каталог · ${school.name}`,
    description: `Каталог квестов BrainMaster для площадки ${school.name}.`,
  };
}

export default async function SchoolCatalogPage({ params }: Props) {
  const { school: schoolSlug } = await params;
  const [quests, venues, worlds] = await Promise.all([
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
          <div className="mb-10 h-28 animate-pulse rounded-2xl bg-white/5" />
        }
      >
        <CatalogPageClient
          quests={quests}
          venues={venues}
          worlds={worlds}
          fixedSchool={{ slug: school.slug, name: school.name }}
          title="Каталог этой площадки"
          emptyMessage="Для этой площадки пока нет активных миссий."
        />
      </Suspense>
    </main>
  );
}
