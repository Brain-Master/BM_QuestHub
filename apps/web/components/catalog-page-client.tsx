"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { CatalogToolbar } from "@/components/catalog-toolbar";
import { QuestGrid } from "@/components/quest-grid";
import { filterCatalog } from "@/lib/catalog-filters";
import type { Quest, Venue, World } from "@/lib/schemas";

type Props = {
  quests: Quest[];
  venues: Venue[];
  worlds: World[];
};

export function CatalogPageClient({ quests, venues, worlds }: Props) {
  const searchParams = useSearchParams();
  const format = searchParams.get("format") ?? undefined;
  const world = searchParams.get("world") ?? undefined;
  const school = searchParams.get("school") ?? undefined;

  const filtered = useMemo(
    () => filterCatalog(quests, venues, { format, world, school }),
    [quests, venues, format, world, school],
  );
  const worldNames = useMemo(
    () => Object.fromEntries(worlds.map((w) => [w.slug, w.name])),
    [worlds],
  );

  return (
    <>
      <div className="mb-10">
        <CatalogToolbar worlds={worlds} />
      </div>

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
    </>
  );
}
