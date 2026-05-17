"use client";

import Link from "next/link";
import { CalendarDays, Grid2X2, MapPin, School } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { SchoolScope } from "@/lib/offers/agenda";
import { PREFERRED_SCHOOL_STORAGE_KEY } from "@/lib/preferred-school";
import { cn } from "@/lib/utils";

type Props = {
  schools: SchoolScope[];
};

function rememberSchool(school: SchoolScope) {
  localStorage.setItem(
    PREFERRED_SCHOOL_STORAGE_KEY,
    JSON.stringify({ slug: school.slug, name: school.name }),
  );
}

export function SiteSelectionGrid({ schools }: Props) {
  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Выберите площадку
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            После выбора мы запомним школу в этом браузере и покажем быстрый
            возврат в глобальных режимах.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/agenda"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-white/10 bg-transparent hover:bg-white/5",
            )}
          >
            Все расписание
          </Link>
          <Link href="/catalog" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Весь каталог
          </Link>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => {
          const primaryVenue = school.venues[0];
          return (
            <article
              key={school.slug}
              className="group flex min-h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-card/55 shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/15 hover:shadow-xl"
            >
              <div className="relative overflow-hidden bg-gradient-to-br from-violet-700/80 via-indigo-700/65 to-cyan-700/60 p-6">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.22),transparent_42%)]"
                />
                <School className="relative size-14 text-white drop-shadow-md" aria-hidden />
              </div>

              <div className="flex flex-1 flex-col gap-5 p-6">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
                    {school.slug}
                  </p>
                  <h3 className="mt-2 font-heading text-xl font-semibold text-foreground">
                    {school.name}
                  </h3>
                  {primaryVenue ? (
                    <p className="mt-3 flex gap-2 text-muted-foreground text-sm leading-relaxed">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      <span>
                        {primaryVenue.metro ? `${primaryVenue.metro} · ` : null}
                        {primaryVenue.address}
                      </span>
                    </p>
                  ) : null}
                </div>

                <div className="mt-auto grid gap-2">
                  <Link
                    href={`/sites/${school.slug}/agenda`}
                    className={cn(buttonVariants({ variant: "default" }), "gap-2")}
                    onClick={() => rememberSchool(school)}
                  >
                    <CalendarDays className="size-4" aria-hidden />
                    Смотреть расписание
                  </Link>
                  <Link
                    href={`/sites/${school.slug}/catalog`}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "gap-2 border-white/10 bg-transparent hover:bg-white/5",
                    )}
                    onClick={() => rememberSchool(school)}
                  >
                    <Grid2X2 className="size-4" aria-hidden />
                    Каталог этой площадки
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
