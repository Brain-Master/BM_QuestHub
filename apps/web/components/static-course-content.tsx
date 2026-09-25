import Link from "next/link";
import type { Quest, Venue } from "@/lib/schemas";
import { filterCatalog } from "@/lib/catalog-filters";

/** Visible without JavaScript; replaced by interactive filters after hydration. */
export function StaticCatalog({ quests, venues, school, heading = "h1" }: {
  quests: Quest[]; venues: Venue[]; school?: string; heading?: "h1" | "h2";
}) {
  const courses = filterCatalog(quests, venues, { school });
  const Heading = heading;
  const CourseHeading = heading === "h1" ? "h2" : "h3";
  return <section className="mb-10 space-y-4" data-testid="static-catalog">
    <Heading className="font-heading text-3xl font-semibold">{school ? "Курсы площадки" : "Курсы BrainMaster"}</Heading>
    <p className="text-muted-foreground">Сохранённый каталог. Поиск и фильтры появятся после загрузки страницы.</p>
    {courses.length ? <ul className="grid gap-4 sm:grid-cols-2">{courses.map(course => <li key={course.slug} className="rounded-2xl border border-white/15 p-5">
      <CourseHeading className="font-heading text-xl font-semibold"><Link className="underline underline-offset-4" href={`/quests/${course.slug}/${school ? `?school=${encodeURIComponent(school)}` : ""}`}>{course.title}</Link></CourseHeading>
      <p className="mt-2">{course.tagline}</p><p className="mt-2 text-sm text-muted-foreground">{course.ageLabel}</p>
    </li>)}</ul> : <p>На этой площадке пока нет текущих групп. <Link className="underline" href="/sites/">Посмотреть другие площадки</Link></p>}
  </section>;
}

export function StaticAgenda({ quests, venues, school, campus, embedded }: {
  quests: Quest[]; venues: Venue[]; school?: string; campus?: string; embedded?: boolean;
}) {
  const courses = filterCatalog(quests, venues, { school, format: "year" });
  const Heading = embedded ? "h2" : "h1";
  const GroupHeading = embedded ? "h3" : "h2";
  const rows = courses.flatMap(course => course.offers.filter(offer => !campus || offer.venueSlug === campus).map(offer => ({course,offer})));
  return <section className="space-y-4" data-testid="static-agenda">
    <Heading className="font-heading text-3xl font-semibold">Расписание занятий</Heading>
    <p className="text-muted-foreground">Сохранённое расписание. Интерактивный подбор появится после загрузки страницы. Места и приём проверяйте на mos.ru.</p>
    {rows.length ? <ul className="grid gap-3 sm:grid-cols-2">{rows.map(({course,offer}) => {
      const venue = venues.find(v => v.slug === offer.venueSlug);
      return <li key={offer.id} data-static-offer={offer.id} className="space-y-2 rounded-xl border border-white/15 p-4">
        <GroupHeading className="font-semibold">{offer.shiftLabel ?? course.title}</GroupHeading>
        <p>{venue?.name} · {venue?.address}</p><p>{offer.daySchedule}</p><p>{offer.priceLabel}</p>
        <Link className="inline-flex min-h-11 items-center underline" href={`/quests/${course.slug}/?offer=${encodeURIComponent(offer.id)}`}>Программа и группа →</Link>
      </li>;
    })}</ul> : <p>Текущих групп пока нет. <Link className="underline" href="/sites/">Другие площадки</Link></p>}
  </section>;
}
