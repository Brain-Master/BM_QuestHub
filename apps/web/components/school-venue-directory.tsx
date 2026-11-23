import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Camera, GraduationCap, MapPin } from "lucide-react";

import { MetroLabel } from "@/components/metro-label";
import { buttonVariants } from "@/components/ui/button";
import { school1416 } from "@/content/school-1416";
import { BRAINMASTER_SUPPORT_PHONE, BRAINMASTER_SUPPORT_PHONE_HREF, BRAINMASTER_SUPPORT_TELEGRAM_URL } from "@/lib/site-contact";
import { buildYandexMapWidgetSrc } from "@/lib/sites/yandex-map";
import { cn } from "@/lib/utils";

const school = school1416;
const map = new URL(buildYandexMapWidgetSrc({
  siteName: school.name,
  campuses: school.buildings.map((building) => ({
    ...building,
    headline: building.name,
    metro: school.metro,
    directions: [],
    photos: [],
  })),
}));
map.searchParams.set("mode", "map");
map.searchParams.delete("text");
map.searchParams.set("pt", map.searchParams.getAll("pt").join("~"));

const panel = "rounded-3xl border border-white/10 bg-card/65 p-5 sm:p-7";
const external = "inline-flex min-h-11 items-center gap-1.5 text-primary underline underline-offset-4";

export function SchoolVenueDirectory() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-9">
      <Link href="/sites/" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Все площадки
      </Link>

      <section className="grid overflow-hidden rounded-[2rem] border border-cyan-100/15 bg-gradient-to-br from-[#102e39] via-[#102330] to-[#111a28] shadow-2xl lg:grid-cols-[1fr_1.12fr]" aria-labelledby="school-venue-title">
        <div className="flex flex-col justify-center p-6 sm:p-9">
          <div className="mb-5 flex flex-wrap items-center gap-4">
            <Image src={school.logoUrl} alt="Официальный логотип школы № 1416" width={72} height={72} className="rounded-2xl bg-white p-1" />
            <div className="space-y-1 text-sm text-cyan-100">
              <p>Москва · СВАО · {school.district}</p>
              <MetroLabel metro={school.metro} />
            </div>
          </div>
          <h1 id="school-venue-title" className="font-heading text-3xl font-bold tracking-tight text-white sm:text-5xl">{school.name}</h1>
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-slate-200 sm:text-base">{school.description}</p>
          <p className="mt-5 rounded-xl border border-cyan-200/20 bg-cyan-100/10 px-4 py-3 text-sm font-medium text-cyan-50">{school.scheduleStatus}</p>
          <nav aria-label="Разделы площадки" className="mt-5 flex flex-wrap gap-2">
            <a href="#school-buildings" className={cn(buttonVariants(), "min-h-11")}>Корпуса и карта</a>
            <a href="#school-photos" className={cn(buttonVariants({ variant: "outline" }), "min-h-11 bg-black/15")}>Фото</a>
            <a href="#school-contacts" className={cn(buttonVariants({ variant: "outline" }), "min-h-11 bg-black/15")}>Контакты</a>
          </nav>
        </div>
        <figure className="flex flex-col justify-center border-white/10 bg-black/20 lg:border-l">
          <Image src={school.cover.url} alt={school.cover.alt} width={1600} height={901} sizes="(min-width: 1024px) 52vw, 100vw" className="h-auto w-full" priority />
          <figcaption className="px-5 py-2 text-xs text-slate-300">
            <a className="inline-flex min-h-8 items-center gap-1 underline underline-offset-4" href={school.galleryUrl} target="_blank" rel="noreferrer">
              Фото с официального сайта школы <ArrowUpRight className="size-3" aria-hidden />
            </a>
          </figcaption>
        </figure>
      </section>

      <section id="school-buildings" className={cn(panel, "mt-6 scroll-mt-24")} aria-labelledby="school-buildings-title">
        <h2 id="school-buildings-title" className="flex items-center gap-2 font-heading text-2xl font-semibold">
          <MapPin className="size-6 shrink-0 text-primary" aria-hidden /> Корпуса школы
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Эти адреса опубликованы школой. Адрес занятий BrainMaster появится вместе с расписанием.
        </p>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.12fr_1fr]">
          <ul className="grid gap-2 sm:grid-cols-2">
            {school.buildings.map((building) => {
              const route = new URL("https://yandex.ru/maps/");
              route.searchParams.set("rtext", `~${building.latitude},${building.longitude}`);
              route.searchParams.set("rtt", "pd");
              return (
                <li key={building.slug} data-school-building={building.slug} className="flex flex-col rounded-xl border border-white/10 bg-background/35 p-3.5">
                  <p className="text-xs font-semibold text-primary">{building.name}</p>
                  <p className="mt-1 text-sm font-medium">{building.address}</p>
                  <a href={route.href} target="_blank" rel="noreferrer" className={cn(external, "mt-auto text-xs")} aria-label={`Маршрут · ${building.address}`}>
                    Маршрут <ArrowUpRight className="size-3.5" aria-hidden />
                  </a>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-col gap-3">
            <div className="min-h-72 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-background/35">
              <iframe title="Карта восьми зданий школы № 1416" src={map.href} loading="lazy" className="min-h-72 w-full border-0 lg:h-full" />
            </div>
            <a href={school.contactsUrl} target="_blank" rel="noreferrer" className={cn(external, "text-sm")}>
              Контакты всех подразделений <ArrowUpRight className="size-4" aria-hidden />
            </a>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.12fr_1fr]">
        <section id="school-photos" className={cn(panel, "scroll-mt-24")} aria-labelledby="school-photos-title">
          <h2 id="school-photos-title" className="flex items-center gap-2 font-heading text-2xl font-semibold">
            <Camera className="size-6 shrink-0 text-primary" aria-hidden /> Фотографии
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {school.photos.map((photo) => (
              <figure key={photo.url} className="overflow-hidden rounded-2xl border border-white/10 bg-background/35">
                <div className="relative aspect-[3/4]">
                  <Image src={photo.url} alt={photo.alt} fill sizes="(min-width: 1024px) 24vw, 45vw" className="object-cover" />
                </div>
                <figcaption className="p-3 text-xs leading-relaxed text-muted-foreground">{photo.caption}</figcaption>
              </figure>
            ))}
          </div>
          <a href={school.albumUrl} target="_blank" rel="noreferrer" className={cn(external, "mt-2 text-sm")}>
            Альбом «Школьные отделения» <ArrowUpRight className="size-4" aria-hidden />
          </a>
        </section>

        <div className="grid content-start gap-6">
          <section className={panel} aria-labelledby="school-about-title">
            <h2 id="school-about-title" className="flex items-center gap-2 font-heading text-2xl font-semibold">
              <GraduationCap className="size-6 shrink-0 text-primary" aria-hidden /> О школе
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              В школе есть дошкольное, начальное, основное, среднее общее и дополнительное образование. Учредитель — Департамент образования и науки города Москвы.
            </p>
            <h3 className="mt-4 text-sm font-semibold">Городские образовательные проекты</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {school.projects.map((project) => <li key={project}>{project}</li>)}
            </ul>
            <div className="mt-3 flex flex-wrap gap-x-4">
              <a href={school.informationUrl} target="_blank" rel="noreferrer" className={cn(external, "text-sm")}>Сведения о школе <ArrowUpRight className="size-4" aria-hidden /></a>
              <a href={school.accessibilityUrl} target="_blank" rel="noreferrer" className={cn(external, "text-sm")}>Доступная среда <ArrowUpRight className="size-4" aria-hidden /></a>
            </div>
          </section>

          <section id="school-contacts" className={cn(panel, "scroll-mt-24")} aria-labelledby="school-contacts-title">
            <h2 id="school-contacts-title" className="font-heading text-2xl font-semibold">Контакты</h2>
            <h3 className="mt-4 text-sm font-semibold">Приёмная школы</h3>
            <div className="grid justify-items-start text-sm">
              <a href={school.phoneHref} className={external}>{school.phone}</a>
              <a href={`mailto:${school.email}`} className={external}>{school.email}</a>
              <a href={school.website} target="_blank" rel="noreferrer" className={external}>Официальный сайт школы <ArrowUpRight className="size-4" aria-hidden /></a>
            </div>
            <div className="mt-3 border-t border-white/10 pt-4">
              <h3 className="text-sm font-semibold">Вопросы о занятиях BrainMaster</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={BRAINMASTER_SUPPORT_TELEGRAM_URL} target="_blank" rel="noreferrer" className={cn(buttonVariants(), "min-h-11 gap-2")}>
                  Написать BrainMaster <ArrowUpRight className="size-4" aria-hidden />
                </a>
                <a href={BRAINMASTER_SUPPORT_PHONE_HREF} className={cn(buttonVariants({ variant: "outline" }), "min-h-11")}>{BRAINMASTER_SUPPORT_PHONE}</a>
              </div>
            </div>
          </section>
        </div>
      </div>
      <p className="mt-5 text-xs text-muted-foreground">Сведения проверены {school.verifiedAt} по официальному сайту школы.</p>
    </main>
  );
}
