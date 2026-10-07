"use client";
import {Suspense,useEffect} from 'react';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {CourseFinder} from '@/components/course-finder';
import {CampFinder} from '@/components/camp-finder';
import {ScheduleModes} from '@/components/schedule-modes';
import {buildAgendaItems,getSchoolScopes,resolveSchoolScope} from '@/lib/offers/agenda';
import {scheduleHref,type ScheduleMode} from '@/lib/offers/schedule-routes';
import {useLiveSchedule} from '@/lib/offers/use-live-schedule';
import {useScheduleTrafficPulse} from '@/lib/schedule/use-schedule-traffic-pulse';
import type {Quest,Venue,World} from '@/lib/schemas';
type Props={baseQuests:Quest[];venues:Venue[];worlds:World[];initialSnapshotGeneratedAt?:string|null;schoolSlug?:string;venueSlug?:string;schoolName?:string;allAgendaHref?:string;sitesHref?:string;hideScheduleTitle?:boolean;hideCommunityPanel?:boolean;embedded?:boolean;mode?:ScheduleMode};
function LiveAgendaInner({baseQuests,venues,worlds,initialSnapshotGeneratedAt=null,schoolSlug,venueSlug,schoolName,embedded=false,mode='all'}:Props){
 const query=useSearchParams(),pathname=usePathname(),router=useRouter();
 const live=useLiveSchedule(baseQuests,{refreshInterval:60_000,initialSnapshotGeneratedAt});
 useScheduleTrafficPulse({page:'agenda',enabled:live.liveEnabled});
 const inputSchool=schoolSlug??query.get('school')??'all',scope=resolveSchoolScope(venues,inputSchool);
 const school=scope?.slug??inputSchool,venue=venueSlug??query.get('venue')??query.get('campus')??'all';
 const selected=Object.values(live.quests).flatMap(q=>q.offers.map(o=>({o,format:q.format}))).find(r=>r.o.id===query.get('offer'));
 const legacyMode:ScheduleMode|undefined=query.get('format')==='intensive'?'camp':query.get('format')==='year'?'year':mode==='all'&&(query.has('programme')||query.has('level'))?'year':mode==='all'&&selected?(selected.format==='year'?'year':'camp'):undefined;
 const activeMode=embedded?'all':legacyMode??mode;
 useEffect(()=>{
  if(embedded||!legacyMode)return;
  const target=new URL(scheduleHref(legacyMode,school,venue,venues),'https://schedule.invalid');
  for(const[k,v]of query)if(!['format','school','venue','campus'].includes(k))target.searchParams.set(k,v);
  const href=target.pathname+target.search;if(href!==pathname+'?'+query)router.replace(href,{scroll:false});
 },[embedded,legacyMode,school,venue,venues,query,pathname,router]);
 const invalid=(school!=='all'&&!scope)||(venue!=='all'&&!(scope?.venues??venues).some(v=>v.slug===venue));
 const allItems=buildAgendaItems({quests:live.quests,venues,worlds});
 const annual=allItems.filter(i=>i.quest.format==='year');const camps=allItems.filter(i=>i.quest.format!=='year');
 const Heading=embedded?'h2':'h1';
 return <div className="space-y-6">
  {!embedded&&<ScheduleModes mode={activeMode} school={school} venue={venue} venues={venues}/>}
  {(scope||venue!=='all')&&<div className="rounded-2xl border border-white/15 p-4"><p className="font-semibold">{schoolName??scope?.name??'Площадка не найдена'}</p><p>{venue!=='all'?(venues.find(v=>v.slug===venue)?.address??'Адрес не найден'):'Все корпуса'}</p>{venue!=='all'&&<Link className="inline-flex min-h-11 items-center text-primary underline" href={scheduleHref(activeMode,school,undefined,venues)}>Другие корпуса этой школы →</Link>}</div>}
  {activeMode==='all'&&<><Heading className="font-heading text-3xl font-semibold">Всё расписание</Heading><div className="grid gap-4 rounded-2xl border border-white/15 p-4 sm:grid-cols-2"><label className="grid gap-2">Площадка<select className="min-h-11 rounded-lg border border-white/20 bg-background px-3" value={school} onChange={e=>router.push(scheduleHref('all',e.target.value,undefined,venues))}><option value="all">Все площадки</option>{getSchoolScopes(venues).map(s=><option key={s.slug} value={s.slug}>{s.name}</option>)}</select></label><label className="grid gap-2">Корпус / адрес<select className="min-h-11 rounded-lg border border-white/20 bg-background px-3" value={venue} onChange={e=>router.push(scheduleHref('all',school,e.target.value,venues))}><option value="all">Все корпуса</option>{(scope?.venues??venues).map(v=><option key={v.slug} value={v.slug}>{v.address}</option>)}</select></label></div></>}
  {(live.status==='error'||live.status==='loading'||activeMode==='camp')&&<div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 p-3 text-sm"><p>{live.status==='error'?'Не удалось обновить расписание. Сохранённые данные могут быть устаревшими.':live.status==='loading'?'Загружаем расписание…':live.isValidating?'Обновляем расписание…':'Предварительная заявка не означает зачисление или бронь места. Условия участия подтвердим отдельно.'}</p><button className="min-h-11 text-primary underline" onClick={live.refresh} disabled={live.isValidating}>Обновить расписание</button></div>}
  {invalid?<div role="status"><p>Указанная площадка или корпус не найдены. Выбор не расширен на другие адреса.</p><Link className="inline-flex min-h-11 items-center text-primary underline" href={scheduleHref(activeMode)}>Открыть всё расписание этого формата →</Link></div>:<>
   {activeMode!=='camp'&&<section className="space-y-4">{activeMode==='all'&&<div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-semibold">Годовые курсы</h2><Link className="inline-flex min-h-11 items-center text-primary underline" href={scheduleHref('year',school,venue,venues)}>Открыть годовые курсы →</Link></div>}<CourseFinder embedded={embedded||activeMode==='all'} items={annual} quests={live.quests} venues={venues} schoolSlug={scope?.slug} venueSlug={venue==='all'?undefined:venue} status={live.status} isValidating={live.isValidating} snapshotGeneratedAt={live.snapshotGeneratedAt} onRefresh={live.refresh}/></section>}
   {activeMode!=='year'&&<section className="space-y-4 border-t border-white/15 pt-6">{activeMode==='all'&&<Link className="inline-flex min-h-11 items-center text-primary underline" href={scheduleHref('camp',school,venue,venues)}>Открыть лагерные смены →</Link>}<CampFinder items={camps} venues={venues} schoolSlug={scope?.slug} venueSlug={venue==='all'?undefined:venue} embedded={embedded||activeMode==='all'} status={live.status}/></section>}
  </>}
 </div>;
}
export function LiveAgenda(props:Props){return <Suspense fallback={<div role="status" className="min-h-40 py-8">Загружаем расписание…</div>}><LiveAgendaInner {...props}/></Suspense>;}
