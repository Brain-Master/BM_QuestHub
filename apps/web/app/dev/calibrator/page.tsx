import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteMapCalibrator } from "@/components/dev/site-map-calibrator";
import { loadQuests, loadVenues, loadWorlds } from "@/lib/content/load";
import { getSchoolScopes } from "@/lib/offers/agenda";
import { buildSiteScopeCards } from "@/lib/sites/scope-card";

export const metadata: Metadata = {
  title: "Калибратор карты",
};

export default async function DevCalibratorPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const [quests, venues, worlds] = await Promise.all([
    loadQuests(),
    loadVenues(),
    loadWorlds(),
  ]);
  const sites = buildSiteScopeCards({
    scopes: getSchoolScopes(venues),
    quests,
    venues,
    worlds,
  });

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10">
      <div className="mb-6">
        <p className="text-[11px] text-cyan-200/80 uppercase tracking-[0.22em]">
          Dev only
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight">
          Калибратор точек карты
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground text-sm leading-relaxed">
          Перетащите пины на WebP-подложке, затем скопируйте объект в
          <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5">
            apps/web/lib/sites/map-calibration.ts
          </code>
          .
        </p>
      </div>

      <SiteMapCalibrator sites={sites} />
    </main>
  );
}
