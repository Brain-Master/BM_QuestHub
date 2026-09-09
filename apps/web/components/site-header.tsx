"use client";

import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { yearPrograms } from "@/content/year-programs";
import { normalizePathname } from "@/lib/host-scope";
import { useHostScope } from "@/lib/use-host-scope";
import type { NavigationConfig } from "@/lib/data/v2/site-config";
import type { Quest, World } from "@/lib/schemas";
import { useLiveSchedule } from "@/lib/offers/use-live-schedule";
import { resolveScheduleStatusKey } from "@/lib/offers/schedule-board";
import { cn } from "@/lib/utils";

const navLink = "flex min-h-11 items-center rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** Native disclosure keeps collapsed links out of the tab order. */
function NavDisclosure({ label, children, mobile = false }: { label: string; children: React.ReactNode; mobile?: boolean }) {
  const ref = React.useRef<HTMLDetailsElement>(null);
  React.useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) ref.current.open = false;
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);
  return <details ref={ref} className="group/nav relative min-w-0" onKeyDown={event => {
    if (event.key === "Escape" && ref.current?.open) {
      event.stopPropagation(); ref.current.open = false; ref.current.querySelector("summary")?.focus();
    }
  }} onClick={event => {
    if ((event.target as Element).closest("a") && ref.current) ref.current.open = false;
  }}>
    <summary className={cn(navLink, "cursor-pointer list-none gap-2 [&::-webkit-details-marker]:hidden")}>
      {label}<ChevronDown className="size-4 shrink-0 group-open/nav:rotate-180" aria-hidden />
    </summary>
    <div className={cn("grid gap-1 rounded-xl border border-white/10 bg-background p-2", !mobile && "absolute right-0 top-full z-50 max-h-[calc(100dvh-8rem)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto shadow-xl")}>
      {children}
    </div>
  </details>;
}

export function SiteHeader({ worlds, navigation, baseQuests, scopeByVenue, schoolAliases }: { worlds: World[]; navigation: NavigationConfig; baseQuests:Quest[]; scopeByVenue:Record<string,string>; schoolAliases:Record<string,string> }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { school: hostSchool } = useHostScope();
  const pathSchoolSlug = pathname.match(/^\/sites\/([^/]+)/)?.[1] ?? null;
  // Only explicit route/hostname context scopes navigation. A remembered school is not a filter.
  const schoolSlug = pathSchoolSlug ?? hostSchool?.routeSlug;
  const { quests } = useLiveSchedule(baseQuests);
  const canonicalSchool = schoolSlug ? schoolAliases[schoolSlug] ?? schoolSlug : null;
  const availableLevels = [1,2,3].filter(level=>quests.some(q=>q.slug==="shmi"&&q.offers.some(o=>o.annual?.studyYear===level&&(!canonicalSchool||scopeByVenue[o.venueSlug]===canonicalSchool)&&!["finished","cancelled"].includes(resolveScheduleStatusKey(o)))));
  const agendaHref = hostSchool ? "/agenda/" : schoolSlug ? `/sites/${schoolSlug}/agenda/` : "/agenda/";
  const catalogHref = hostSchool ? "/catalog/" : schoolSlug ? `/sites/${schoolSlug}/catalog/` : "/catalog/";
  const sitesHref = hostSchool ? `/sites/${hostSchool.routeSlug}/` : "/sites/";
  const worldGroups = navigation.worldGroups.filter(group => worlds.some(world => world.slug === group.slug));
  const normalizedPath = normalizePathname(pathname);
  React.useEffect(() => {
    const onResize = () => { if (window.matchMedia("(min-width: 640px)").matches) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function links(mobile: boolean) {
    const close = () => setMenuOpen(false);
    return <>
      <Link className={navLink} href={agendaHref} aria-current={normalizedPath.endsWith("/agenda/") ? "page" : undefined} onClick={close}>Расписание</Link>
      <NavDisclosure label="Годовые курсы" mobile={mobile}>
        <Link className={navLink} href="/year-courses/" onClick={close}>Все годовые курсы</Link>
        {yearPrograms.map(programme => programme.id === "shmi" ? <details key={programme.id} className="min-w-0 rounded-lg border border-white/10">
          <summary className={cn(navLink, "cursor-pointer")}>{programme.title}</summary>
          <div className="grid gap-1 border-l border-white/15 pl-2">
            <Link className={navLink} href="/year-courses/shmi/" onClick={close}>О программе ШМИ</Link>
            {availableLevels.map(level => <Link key={level} className={navLink} href={`${agendaHref}?programme=shmi&level=${level}`} onClick={close}>ШМИ-{level} · {level}-й год обучения</Link>)}
          </div>
        </details> : <Link key={programme.id} className={navLink} href={`/year-courses/${programme.id}/`} onClick={close}>{programme.title}</Link>)}
      </NavDisclosure>
      <Link className={navLink} href={sitesHref} onClick={close}>Площадки</Link>
      <Link className={navLink} href={catalogHref} onClick={close}>Курсы</Link>
      {worldGroups.map(group => <NavDisclosure key={group.slug} label={group.label} mobile={mobile}>
        <Link className={navLink} href={`/worlds/${group.slug}/`} onClick={close}>Открыть мир {group.label}</Link>
        {group.programs.map(programme => <Link key={programme.slug} className={navLink} href={`/quests/${programme.slug}/`} onClick={close}>{programme.label}</Link>)}
      </NavDisclosure>)}
    </>;
  }

  return <header className="sticky top-0 z-50 border-b border-white/10 bg-background/95 backdrop-blur-xl">
    <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
      <Link href="/" className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <Image src="/brand/brainmaster-mark.png" alt="BrainMaster" width={40} height={40} className="shrink-0 rounded-xl bg-white/5 p-1" priority />
        <span className="flex min-w-0 flex-col leading-tight"><span className="font-heading text-sm font-semibold">Инженерные квесты</span><span className="text-[11px] text-muted-foreground">BrainMaster · Quest Hub</span></span>
      </Link>
      <nav aria-label="Основная навигация" className="hidden flex-wrap items-center justify-end gap-1 sm:flex">{links(false)}</nav>
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogTrigger aria-label="Открыть меню" className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/15 focus-visible:outline-2 focus-visible:outline-primary sm:hidden"><Menu className="size-5" aria-hidden /></DialogTrigger>
        <DialogContent showCloseButton={false} className="top-0 right-0 left-auto flex h-dvh w-[min(24rem,100vw)] max-w-full translate-x-0 translate-y-0 flex-col rounded-none p-4">
          <div className="flex items-center justify-between gap-3"><DialogTitle>Меню</DialogTitle><DialogClose aria-label="Закрыть меню" className="flex size-11 items-center justify-center rounded-xl border border-white/15"><X className="size-5" aria-hidden /></DialogClose></div>
          <DialogDescription>Выберите расписание, программу или площадку.</DialogDescription>
          <nav aria-label="Мобильная навигация" className="grid content-start gap-2 overflow-y-auto pb-4">{links(true)}</nav>
        </DialogContent>
      </Dialog>
    </div>
  </header>;
}
