"use client";
import Link from 'next/link';
import {scheduleHref,type ScheduleMode} from '@/lib/offers/schedule-routes';
import type {Venue} from '@/lib/schemas';
export function ScheduleModes({mode,school,venue,venues}:{mode:ScheduleMode;school?:string;venue?:string;venues:Venue[]}) {
 return <nav aria-label="Вид расписания" className="mb-6 grid grid-cols-3 gap-1 rounded-2xl border border-white/15 bg-white/5 p-1">
 {([['all','Всё'],['year','Годовые курсы'],['camp','Лагерные смены']] as const).map(([key,label])=><Link key={key} href={scheduleHref(key,school,venue,venues)} aria-current={mode===key?'page':undefined} className={`flex min-h-12 items-center justify-center rounded-xl px-2 py-3 text-center text-sm font-medium focus-visible:outline-2 ${mode===key?'bg-primary text-primary-foreground':'hover:bg-white/10'}`}>{label}</Link>)}
 </nav>;
}
