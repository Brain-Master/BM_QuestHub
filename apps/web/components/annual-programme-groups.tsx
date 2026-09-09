"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { AnnualProgrammeGroup } from "@/lib/offers/annual-programme-groups";
import type { ScheduleBoardItem } from "@/lib/offers/schedule-board";

export function AnnualProgrammeGroups({groups,highlightedOfferId,renderGroup}:{groups:AnnualProgrammeGroup[];highlightedOfferId?:string|null;renderGroup:(item:ScheduleBoardItem)=>ReactNode}) {
  return <div className="mb-8 space-y-8" data-testid="annual-programmes">
    {groups.map(programme=><section key={programme.slug} data-programme={programme.slug} className="min-w-0 rounded-2xl border border-white/15 bg-card/40 p-4 sm:p-6">
      <header className="mb-6 flex min-w-0 flex-wrap items-center gap-4">
        {programme.imageUrl&&<Image src={programme.imageUrl} alt={programme.title} width={160} height={107} className="h-24 w-36 rounded-xl object-cover" sizes="144px" />}
        <div className="min-w-0 flex-1 basis-48"><p className="text-xs text-muted-foreground">Годовая программа</p><h2 className="font-heading break-words text-xl font-semibold sm:text-2xl">{programme.title}</h2><Link className="text-sm text-primary underline" href={`/year-courses/${programme.slug}/`}>О программе</Link></div>
      </header>
      {programme.campuses.some(c=>c.items.some(i=>i.offer.annual))&&<p className="mb-5 text-sm text-muted-foreground">Даты срезов mos.ru: {[...new Set(programme.campuses.flatMap(c=>c.items.map(i=>i.offer.annual?.asOf).filter(Boolean)))].join(", ")}. Расписание, приём и места не подтверждаются в реальном времени — перед записью проверьте карточку на mos.ru.</p>}
      <div className="space-y-6">{programme.campuses.map(campus=><section key={campus.slug} data-campus={campus.slug} className="min-w-0 space-y-3">
        <header><h3 className="font-semibold">{campus.name}</h3><p className="break-words text-sm text-muted-foreground">{campus.address}</p><Link className="text-sm text-primary underline" href={`/sites/${campus.schoolSlug}/campuses/${campus.slug}/agenda/`}>Расписание этого адреса</Link></header>
        {campus.items.map(item=><details key={item.offer.id} data-annual-group={item.offer.id} open={highlightedOfferId===item.offer.id||undefined} className="min-w-0 rounded-xl border border-white/10 bg-background/40 open:bg-background/70">
          <summary className="cursor-pointer rounded-xl p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <span className="break-words font-medium">{item.displayTitle}</span>
            <span className="mt-1 block break-words text-sm">{item.timeLabel}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{item.status.label} · {item.offer.annual?.groupCode?`Группа ${item.offer.annual.groupCode}`:`Занятие ${item.offer.annual?.listingId??item.offer.id}`} · Подробнее и запись</span>
          </summary>
          <div className="min-w-0 p-2 sm:p-4">{renderGroup(item)}</div>
        </details>)}
      </section>)}</div>
    </section>)}
  </div>;
}
