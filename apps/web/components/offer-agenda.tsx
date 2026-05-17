"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin, Users } from "lucide-react";

import { OfferBookingAction } from "@/components/offer-booking-action";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { AgendaOfferGroup } from "@/lib/offers/agenda";
import { cn } from "@/lib/utils";
import { getWorldVisual } from "@/lib/world-visuals";

type Props = {
  groups: AgendaOfferGroup[];
  schoolSlug?: string;
  catalogHref: string;
  allAgendaHref?: string;
  sitesHref?: string;
};

function capacityLabel(item: AgendaOfferGroup["items"][number]): string | null {
  const { enrolled, maxCapacity } = item.offer;
  if (typeof enrolled !== "number" || typeof maxCapacity !== "number") return null;
  return `${enrolled}/${maxCapacity} мест`;
}

export function OfferAgenda({
  groups,
  schoolSlug,
  catalogHref,
  allAgendaHref,
  sitesHref = "/sites",
}: Props) {
  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-card/30 px-6 py-16 text-center">
        <p className="text-lg text-muted-foreground">
          Для выбранных фильтров пока нет смен.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {allAgendaHref ? (
            <Link
              href={allAgendaHref}
              className={buttonVariants({ variant: "outline" })}
            >
              Показать все площадки
            </Link>
          ) : null}
          <Link href={sitesHref} className={buttonVariants({ variant: "default" })}>
            Выбрать площадку
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Повестка смен
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Смен в расписании:{" "}
            <span className="font-medium text-foreground">
              {groups.reduce((sum, group) => sum + group.items.length, 0)}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={catalogHref}
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "border border-white/10 bg-white/5 hover:bg-white/10",
            )}
          >
            Перейти в каталог
          </Link>
          {allAgendaHref ? (
            <Link
              href={allAgendaHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-white/10 bg-transparent hover:bg-white/5",
              )}
            >
              Показать все площадки
            </Link>
          ) : (
            <Link
              href={sitesHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-white/10 bg-transparent hover:bg-white/5",
              )}
            >
              Выбрать площадку
            </Link>
          )}
        </div>
      </div>

      <ol className="relative space-y-8 before:absolute before:top-3 before:bottom-3 before:left-4 before:w-px before:bg-white/10 md:before:left-[7.5rem]">
        {groups.map((group) => (
          <li
            key={group.key}
            className="relative grid gap-4 pl-10 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-6 md:pl-0"
          >
            <div className="md:text-right">
              <div className="absolute top-2 left-2 size-4 rounded-full border border-primary/60 bg-background shadow-[0_0_18px_color-mix(in_oklch,var(--primary)_45%,transparent)] md:left-[7rem]" />
              <p className="font-heading text-lg font-semibold text-foreground">
                {group.label}
              </p>
              <p className="mt-1 text-muted-foreground text-xs uppercase tracking-[0.16em]">
                {group.items.length} смен
              </p>
            </div>

            <div className="grid gap-4">
              {group.items.map((item) => {
                const visual = getWorldVisual(item.quest.worldSlug);
                const Icon = visual.Icon;
                const seats = capacityLabel(item);
                const questHref = schoolSlug
                  ? `/quests/${item.quest.slug}?school=${encodeURIComponent(schoolSlug)}`
                  : `/quests/${item.quest.slug}`;

                return (
                  <article
                    key={item.offer.id}
                    className={cn(
                      "overflow-hidden rounded-2xl border border-white/10 bg-card/55 shadow-lg backdrop-blur-md transition hover:border-white/15",
                      visual.glow,
                    )}
                  >
                    <div className="grid gap-0 md:grid-cols-[9rem_minmax(0,1fr)]">
                      <div
                        className={cn(
                          "flex min-h-32 items-center justify-center bg-gradient-to-br p-6",
                          visual.gradient,
                        )}
                      >
                        <Icon className="size-14 text-white/90 drop-shadow-md" aria-hidden />
                      </div>
                      <div className="grid gap-5 p-5 md:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="mb-3 flex flex-wrap gap-2">
                              <Badge
                                variant="outline"
                                className="border-white/10 bg-white/[0.03]"
                              >
                                {item.world?.name ?? item.quest.worldSlug}
                              </Badge>
                              {item.offer.sheetStatus ? (
                                <Badge className="bg-primary/15 text-primary">
                                  {item.offer.sheetStatus}
                                </Badge>
                              ) : null}
                            </div>
                            <h3 className="font-heading text-xl font-semibold leading-snug text-foreground">
                              {item.quest.title}
                            </h3>
                            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                              {item.quest.catalogTagline ?? item.quest.tagline}
                            </p>
                          </div>
                          <OfferBookingAction
                            quest={item.quest}
                            offer={item.offer}
                            venue={item.venue}
                            schoolSlug={schoolSlug}
                            className="shrink-0"
                          />
                        </div>

                        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                          <div className="flex gap-2 rounded-xl border border-white/10 bg-black/15 p-3">
                            <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                            <span>
                              <span className="block text-muted-foreground text-xs">
                                Время
                              </span>
                              {item.offer.startTime}–{item.offer.endTime}
                            </span>
                          </div>
                          <div className="flex gap-2 rounded-xl border border-white/10 bg-black/15 p-3">
                            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                            <span>
                              <span className="block text-muted-foreground text-xs">
                                Площадка
                              </span>
                              {item.venue.name}
                            </span>
                          </div>
                          <div className="flex gap-2 rounded-xl border border-white/10 bg-black/15 p-3">
                            <Users className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                            <span>
                              <span className="block text-muted-foreground text-xs">
                                Возраст и места
                              </span>
                              {[item.quest.ageLabel, seats].filter(Boolean).join(" · ")}
                            </span>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-black/15 p-3">
                            <span className="block text-muted-foreground text-xs">
                              Стоимость
                            </span>
                            {item.offer.priceLabel}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-white/10 border-t pt-4">
                          <p className="text-muted-foreground text-xs">
                            {item.venue.metro ? `${item.venue.metro} · ` : null}
                            {item.venue.address}
                          </p>
                          <Link
                            href={questHref}
                            className="inline-flex items-center gap-1.5 text-sm text-primary transition hover:text-primary/80"
                          >
                            Открыть досье
                            <ArrowUpRight className="size-4" aria-hidden />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
