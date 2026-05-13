import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogToolbar } from "@/components/catalog-toolbar";
import { PortalHero } from "@/components/portal-hero";
import { QuestGrid } from "@/components/quest-grid";
import { filterCatalog } from "@/lib/catalog-filters";
import { loadQuests, loadVenues, loadWorlds } from "@/lib/content/load";

export const metadata: Metadata = {
  title: "Каталог квестов",
};

type Search = Record<string, string | string[] | undefined>;

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Search>;
}) {
  const sp = (await searchParams) ?? {};
  const format =
    typeof sp.format === "string" ? sp.format : undefined;
  const world = typeof sp.world === "string" ? sp.world : undefined;
  const school = typeof sp.school === "string" ? sp.school : undefined;

  const [quests, venues, worlds] = await Promise.all([
    loadQuests(),
    loadVenues(),
    loadWorlds(),
  ]);

  const filtered = filterCatalog(quests, venues, {
    format,
    world,
    school,
  });

  const worldNames = Object.fromEntries(worlds.map((w) => [w.slug, w.name]));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <PortalHero
        eyebrow="BrainMaster Quest Hub"
        title="Вселенная Инженерных Квестов"
        description="Выберите миссию, площадку и смену. Запись часто завершается на mos.ru; если ссылки ещё нет — откроется форма заявки прямо из расписания."
      />

      <Suspense
        fallback={
          <div className="mb-10 h-28 animate-pulse rounded-2xl bg-white/5" />
        }
      >
        <div className="mb-10">
          <CatalogToolbar worlds={worlds} />
        </div>
      </Suspense>

      <section className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              Каталог миссий
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Показано квестов:{" "}
              <span className="font-medium text-foreground">{filtered.length}</span>
            </p>
          </div>
          {school ? (
            <p className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-muted-foreground text-sm">
              Школьный скоуп:{" "}
              <span className="font-medium text-foreground">{school}</span>
            </p>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-card/30 px-6 py-16 text-center">
            <p className="text-lg text-muted-foreground">
              Ничего не найдено — ослабьте фильтры или сбросьте школьный скоуп.
            </p>
          </div>
        ) : (
          <QuestGrid
            quests={filtered}
            worldNames={worldNames}
            schoolSlug={school}
          />
        )}
      </section>
    </main>
  );
}
