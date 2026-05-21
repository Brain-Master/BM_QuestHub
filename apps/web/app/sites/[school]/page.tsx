import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  DoorOpen,
  ExternalLink,
  Grid2X2,
  MapPin,
  Navigation,
} from "lucide-react";

import { CommunityConnectPanel } from "@/components/community-connect-panel";
import { PortalHero } from "@/components/portal-hero";
import { RememberSchoolOnVisit } from "@/components/remember-school-on-visit";
import { buttonVariants } from "@/components/ui/button";
import { communityConnectCopy } from "@/lib/community-connect-copy";
import { loadQuests, loadVenues, loadWorlds } from "@/lib/content/load";
import { resolvePublicMediaUrl } from "@/lib/media/public-media-url";
import { getSchoolScopes, resolveSchoolScope } from "@/lib/offers/agenda";
import { buildSiteScopeCards, type SiteCampus } from "@/lib/sites/scope-card";
import { filterQuestsForSchool } from "@/lib/school-scope";
import {
  buildYandexMapsHref,
  buildYandexMapWidgetSrc,
} from "@/lib/sites/yandex-map";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ school: string }>;
};

function hasCoordinates(campus: SiteCampus): boolean {
  return typeof campus.latitude === "number" && typeof campus.longitude === "number";
}

function campusTransitLabel(campus: SiteCampus): string | undefined {
  const parts = [
    campus.metro && campus.metro !== "—" ? `м. ${campus.metro}` : undefined,
    campus.district,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : undefined;
}

function campusAccessSteps(campus: SiteCampus): string[] {
  if (campus.directions.length > 0) return campus.directions;

  return [
    "Откройте маршрут до адреса площадки в Яндекс.Картах.",
    "Перед стартом смены мы подтвердим вход, место встречи и кабинет.",
  ];
}

function campusVisitNote(campus: SiteCampus): string {
  return (
    campus.entranceNote ??
    "Если у школы есть пропускной режим, скажите на входе, что вы на занятия BrainMaster."
  );
}

function uniqueSitePhotos(site: { campuses: SiteCampus[] }) {
  const seen = new Set<string>();
  return site.campuses
    .flatMap((campus) =>
      campus.photos.map((photo) => ({
        ...photo,
        campusName: campus.name,
      })),
    )
    .filter((photo) => {
      if (seen.has(photo.url)) return false;
      seen.add(photo.url);
      return true;
    });
}

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
    title: `Площадка · ${school.name}`,
    description: `Адрес, карта и расписание BrainMaster для площадки ${school.name}.`,
  };
}

export default async function SchoolPage({ params }: Props) {
  const { school: schoolSlug } = await params;
  const [quests, venues, worlds] = await Promise.all([
    loadQuests(),
    loadVenues(),
    loadWorlds(),
  ]);
  const school = resolveSchoolScope(venues, schoolSlug);
  if (!school) notFound();

  const site = buildSiteScopeCards({
    scopes: [school],
    quests,
    venues,
    worlds,
  })[0];
  if (!site) notFound();

  const primaryCampus =
    site.campuses.find((campus) => hasCoordinates(campus)) ?? site.campuses[0];
  if (!primaryCampus) notFound();

  const mapSrc = buildYandexMapWidgetSrc({
    siteName: site.name,
    campus: primaryCampus,
  });
  const mapHref = buildYandexMapsHref({
    siteName: site.name,
    campus: primaryCampus,
  });
  const siteQuests = filterQuestsForSchool(quests, venues, school.slug);
  const sitePhotos = uniqueSitePhotos(site);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
      <RememberSchoolOnVisit slug={school.slug} name={school.name} />

      <PortalHero
        eyebrow="Площадка BrainMaster"
        title={site.name}
        description={`${site.locationSummary}. Посмотрите адрес, откройте карту и перейдите к расписанию или курсам этой площадки.`}
        aside={
          <div className="grid gap-3 rounded-3xl border border-white/10 bg-black/20 p-4 text-sm backdrop-blur">
            <div>
              <p className="text-cyan-100/70 text-xs uppercase tracking-[0.16em]">
                Сейчас доступно
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-center">
                  <p className="font-heading text-2xl font-semibold text-white">
                    {site.courseCount}
                  </p>
                  <p className="text-cyan-50/70 text-xs">курсов</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-center">
                  <p className="font-heading text-2xl font-semibold text-white">
                    {site.shiftCount}
                  </p>
                  <p className="text-cyan-50/70 text-xs">групп</p>
                </div>
              </div>
            </div>
            <div className="grid gap-2 pt-1">
              <Link
                href={`/sites/${site.slug}/agenda`}
                className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}
              >
                <CalendarDays className="size-4" aria-hidden />
                Расписание
              </Link>
              <Link
                href={`/sites/${site.slug}/catalog`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-2 border-white/10 bg-transparent hover:bg-white/5",
                )}
              >
                <Grid2X2 className="size-4" aria-hidden />
                Курсы площадки
              </Link>
            </div>
          </div>
        }
        showBadges={false}
      />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)]">
        <div className="rounded-[1.5rem] border border-white/10 bg-card/50 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-md sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <MapPin className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                Адрес и корпуса
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-relaxed">
                Проверьте адрес, ближайшее метро и схему прохода. Если у корпуса
                есть пропускной режим, актуальные детали встречи подтвердим перед
                стартом смены.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {site.campuses.map((campus) => {
              const transit = campusTransitLabel(campus);
              const campusHref = buildYandexMapsHref({ siteName: site.name, campus });

              return (
                <article
                  key={campus.slug}
                  className="rounded-2xl border border-white/10 bg-black/15 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{campus.name}</p>
                      <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                        {campus.address}
                      </p>
                      {transit ? (
                        <p className="mt-2 text-primary text-xs leading-relaxed">
                          {transit}
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href={campusHref}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "gap-2 border-white/10 bg-transparent hover:bg-white/5",
                      )}
                    >
                      Маршрут
                      <ExternalLink className="size-3.5" aria-hidden />
                    </Link>
                  </div>
                  <div className="mt-4 grid gap-3 border-white/10 border-t pt-4">
                    <div className="flex items-start gap-2 rounded-xl bg-white/[0.04] p-3 text-sm">
                      <DoorOpen className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      <p className="text-muted-foreground leading-relaxed">
                        {campusVisitNote(campus)}
                      </p>
                    </div>
                    <ol className="grid gap-2">
                      {campusAccessSteps(campus).map((step, index) => (
                        <li
                          key={`${campus.slug}-step-${index}`}
                          className="flex gap-2 text-muted-foreground text-sm leading-relaxed"
                        >
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 font-medium text-[11px] text-primary">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                    {campus.contactNote ? (
                      <p className="rounded-xl border border-white/10 bg-black/10 p-3 text-muted-foreground text-xs leading-relaxed">
                        {campus.contactNote}
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <aside className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-card/50 shadow-[0_24px_90px_rgba(2,6,23,0.35)] backdrop-blur-md">
          <div className="flex items-start gap-3 border-white/10 border-b p-4 sm:p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-200/10 text-cyan-100">
              <Navigation className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-heading font-semibold text-lg text-foreground">
                Карта проезда
              </h2>
              <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                Виджет ведет к основному корпусу. Для остальных корпусов используйте
                кнопку «Маршрут» в карточке адреса.
              </p>
            </div>
          </div>

          <div className="aspect-[4/3] bg-black/20">
            <iframe
              src={mapSrc}
              title={`Яндекс Карта: ${site.name}`}
              className="size-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          <div className="p-4 sm:p-5">
            <Link
              href={mapHref}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "w-full gap-2")}
            >
              Открыть в Яндекс.Картах
              <ExternalLink className="size-3.5" aria-hidden />
            </Link>
          </div>
        </aside>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)]">
        <div className="rounded-[1.5rem] border border-white/10 bg-card/50 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-md sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <CheckCircle2 className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                Что проходит на площадке
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-relaxed">
                Здесь собраны активные курсы и открытые смены для этой локации,
                чтобы можно было выбрать площадку и сразу перейти к записи.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
                Курсы
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                {site.courseCount}
              </p>
              <p className="mt-1 text-muted-foreground text-sm">
                {siteQuests.slice(0, 3).map((quest) => quest.title).join(", ") ||
                  "Список обновляется"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
                Открытые группы
              </p>
              <p className="mt-2 font-heading text-3xl font-semibold text-foreground">
                {site.shiftCount}
              </p>
              <p className="mt-1 text-muted-foreground text-sm">
                Расписание показывает корпус, адрес, даты, время и доступность мест.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/sites/${site.slug}/agenda`}
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}
            >
              <CalendarDays className="size-4" aria-hidden />
              Смотреть расписание
            </Link>
            <Link
              href={`/sites/${site.slug}/catalog`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-2 border-white/10 bg-transparent hover:bg-white/5",
              )}
            >
              <Grid2X2 className="size-4" aria-hidden />
              Курсы площадки
            </Link>
          </div>
        </div>

        <aside className="rounded-[1.5rem] border border-white/10 bg-card/50 p-5 shadow-[0_24px_90px_rgba(2,6,23,0.28)] backdrop-blur-md sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-200/10 text-cyan-100">
              <Camera className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                Фото площадки
              </h2>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                Фото помогают заранее узнать вход, холл и учебный кабинет. Показываем
                только согласованные материалы.
              </p>
            </div>
          </div>

          {sitePhotos.length > 0 ? (
            <div className="mt-5 grid gap-3">
              {sitePhotos.slice(0, 4).map((photo) => (
                <figure
                  key={photo.url}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                >
                  {(() => {
                    const photoSrc = resolvePublicMediaUrl(photo.url);
                    return photoSrc ? (
                      <div className="relative aspect-[16/10]">
                        <Image
                          src={photoSrc}
                          alt={photo.alt ?? `Фото площадки ${site.name}`}
                          fill
                          sizes="(min-width: 1024px) 24rem, 100vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[16/10] items-center justify-center bg-white/[0.04] p-6 text-center text-muted-foreground text-sm">
                        Фото площадки пока не загружены.
                      </div>
                    );
                  })()}
                  <figcaption className="px-3 py-2 text-muted-foreground text-xs">
                    {photo.alt ?? photo.campusName}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-black/15 p-4 text-muted-foreground text-sm leading-relaxed">
              Фотографии добавим после согласования с площадкой. До визита
              ориентируйтесь на адрес, карту и схему прохода выше.
            </div>
          )}
        </aside>
      </section>

      <CommunityConnectPanel
        variant="card"
        className="mt-6"
        {...communityConnectCopy.siteMorePhotos}
      />
    </main>
  );
}
