"use client";
import {Suspense,useEffect,useRef} from 'react';
import {usePathname,useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {CourseFinder} from './course-finder';
import {CampFinder} from './camp-finder';
import s from './course-finder.module.css';
import {useLiveSchedule} from '@/lib/offers/use-live-schedule';
import {useScheduleClock} from '@/lib/offers/use-schedule-clock';
import {buildAgendaItems,getSchoolScopes,resolveSchoolScope} from '@/lib/offers/agenda';
import {resolveWizardCategory,activityCategory,availableCategories,scopedActivities,wizardHref,categoryLabels} from '@/lib/offers/unified-wizard';
import {scheduleHref} from '@/lib/offers/schedule-routes';
import type {Quest,Venue,World} from '@/lib/schemas';
type Props={baseQuests:Quest[];venues:Venue[];worlds:World[];initialSnapshotGeneratedAt:string|null;schoolSlug?:string};
function Inner({baseQuests,venues,worlds,initialSnapshotGeneratedAt,schoolSlug}:Props){
 const query=useSearchParams(),pathname=usePathname(),clock=useScheduleClock();
 const live=useLiveSchedule(baseQuests,{initialSnapshotGeneratedAt});
 const schoolInput=schoolSlug??query.get('school')??'all',school=resolveSchoolScope(venues,schoolInput),schoolKey=school?.slug??schoolInput;
 const venue=query.get('venue')??query.get('campus')??'all';
 const invalid=(schoolKey!=='all'&&!school)||(venue!=='all'&&!(school?.venues??venues).some(v=>v.slug===venue));
 const items=buildAgendaItems({quests:live.quests,venues,worlds});
 const scoped=clock&&!invalid?scopedActivities(items,schoolKey,venue,new Date(clock)):[];
 const categories=availableCategories(scoped);
 const ready=!!clock&&(!live.liveEnabled||(live.hasLiveSnapshot&&live.status==='ready'));
 const requested=query.get('kind');
 const {kind,missing}=resolveWizardCategory(categories,requested,ready);
 const container=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(ready&&!invalid&&!requested&&kind&&kind!=='all'){const q=new URLSearchParams(query);q.set('kind',kind);window.history.replaceState(null,'',`${pathname}?${q}`);}},[ready,invalid,requested,kind,query,pathname]);
 const heading=useRef<HTMLHeadingElement>(null);const screen=`${kind}:${query.get('step')??''}`;const previous=useRef(screen);
 useEffect(()=>{if(previous.current!==screen)(heading.current??container.current?.querySelector<HTMLElement>('h1[tabindex]'))?.focus();previous.current=screen;},[screen]);
 function change(patch:Record<string,string>){
  const q=new URLSearchParams(query);for(const[k,v]of Object.entries(patch)){if(v==='all'&&k!=='kind'||v==='')q.delete(k);else q.set(k,v);}
  const targetSchool=patch.school??schoolKey,targetVenue='school'in patch?'all':patch.venue??venue;
  if('school'in patch||'venue'in patch){for(const key of ['kind','step','view','programme','period','offer','level','day','archive'])q.delete(key);}
  q.delete('school');q.delete('venue');q.delete('campus');
  const target=new URL(wizardHref(targetSchool,targetVenue),'https://schedule.invalid');for(const[k,v]of q)target.searchParams.set(k,v);
  const href=target.pathname+target.search;if(target.pathname===pathname)window.history.pushState(null,'',href);else window.location.assign(href);
 }
 const annual=scoped.filter(i=>activityCategory(i)==='year');
 const camp=scoped.filter(i=>activityCategory(i)==='camp');
 const other=scoped.filter(i=>activityCategory(i)==='other');
 const invalidAge=query.has('age')&&query.get('age')!=='all'&&!/^(?:[3-9]|1[0-8])$/.test(query.get('age')??'');
 const allResults=kind==='all'&&query.get('step')==='results'&&!invalidAge;
 const age=query.get('age')??'all';
 return <div ref={container} className="space-y-6" data-testid="unified-wizard">
  <section className={s.finder} data-view="wizard">
   <div className={s.topbar}><span className={s.wordmark}>brainmaster<span aria-hidden> / </span><small>подбор занятий</small></span><Link href={scheduleHref('all',schoolKey,venue,venues)}>Всё расписание ↗</Link><button type="button" onClick={live.refresh} disabled={live.isValidating}>Обновить список занятий</button></div>
   <div className="mt-5 grid gap-4 sm:grid-cols-2"><label>Площадка<select aria-label="Площадка общего подбора" value={schoolKey} onChange={e=>change({school:e.target.value})}><option value="all">Все площадки</option>{getSchoolScopes(venues).map(v=><option key={v.slug} value={v.slug}>{v.name}</option>)}{invalid&&!school&&schoolKey!=='all'&&<option value={schoolKey}>Площадка не найдена</option>}</select></label><label>Корпус / адрес<select aria-label="Адрес общего подбора" value={venue} onChange={e=>change({venue:e.target.value})}><option value="all">Все корпуса</option>{(school?.venues??venues).map(v=><option key={v.slug} value={v.slug}>{v.address}</option>)}{venue!=='all'&&!(school?.venues??venues).some(v=>v.slug===venue)&&<option value={venue}>Адрес не найден</option>}</select></label></div>
   {ready&&!invalid&&categories.length>1&&kind&&!missing&&<div className={s.footer}><button type="button" className={s.textButton} onClick={()=>change({kind:'',step:'',view:'',programme:'all',period:'all',level:'all',day:'all',offer:''})}>← Изменить категорию</button></div>}
   {!ready?<div className={s.source} role="status">{live.status==='error'?'Не удалось проверить категории. Это не означает, что занятий нет.':'Проверяем доступные занятия…'}<button type="button" onClick={live.refresh} disabled={live.isValidating}>{live.isValidating?'Обновляем…':'Повторить загрузку'}</button></div>:invalid?<div className={s.empty} role="status"><h1 ref={heading} tabIndex={-1}>Площадка или адрес не найдены</h1><p>Выберите площадку из списка.</p></div>:categories.length===0?<div className={s.empty} role="status"><h1 ref={heading} tabIndex={-1}>Занятий пока нет</h1><p>На выбранной площадке нет актуальных предложений. Выберите другой корпус или площадку.</p></div>:missing?<div className={s.empty} role="status"><h1 ref={heading} tabIndex={-1}>Категория недоступна</h1><p>По этой ссылке нет актуальных предложений на выбранной площадке.</p><button type="button" onClick={()=>change({kind:'',step:'',programme:'all',period:'all',view:''})}>Выбрать доступные занятия</button></div>:!kind?<div className={s.inner}>
    <header className={s.intro}><p className={s.eyebrow}>ПОДБЕРЁМ ЗАНЯТИЯ · {school?.name??'BRAINMASTER'}</p><h1 ref={heading} tabIndex={-1}>Что ищете?</h1><p>Показываем только категории с актуальными предложениями на выбранной площадке.</p></header>
    <div className={s.choices} data-testid="activity-categories">{categories.map(c=><button type="button" key={c.kind} data-category={c.kind} onClick={()=>change({kind:c.kind,step:'',view:'wizard',programme:'all',period:'all',level:'all',day:'all',offer:''})}><strong>{c.label}</strong><span>Предложений: {c.count}</span><b aria-hidden>→</b></button>)}<button type="button" onClick={()=>change({kind:'all',step:'age',view:'wizard',programme:'all',period:'all',day:'all',level:'all',offer:'',archive:''})}><strong>Пока не знаю — показать всё</strong><span>Сравнить занятия разных форматов</span><b aria-hidden>→</b></button></div>
   </div>:kind==='all'?<div className={s.inner}><header className={s.intro}><h1 ref={heading} tabIndex={-1}>{allResults?'Подходящие занятия':'Сколько лет ребёнку?'}</h1>{invalidAge&&<p role="status">Возраст из ссылки недоступен. Выберите возраст из списка.</p>}<p>Дни занятий и даты смен указаны рядом с каждым предложением. Неизвестный возраст уточним отдельно.</p></header><div className={s.ageChoice}><label>Возраст ребёнка<select aria-label="Возраст общего подбора" value={age} onChange={e=>change({age:e.target.value})}><option value="all">Любой возраст</option>{Array.from({length:16},(_,i)=>String(i+3)).map(a=><option key={a} value={a}>{a} лет</option>)}{age!=='all'&&!/^(?:[3-9]|1[0-8])$/.test(age)&&<option value={age} disabled>Возраст недоступен</option>}</select></label></div>{!allResults&&<div className={s.footer}><button type="button" className={s.primary} disabled={invalidAge} onClick={()=>change({step:'results'})}>Показать занятия →</button></div>}</div>:null}
  </section>
  {ready&&!invalid&&!missing&&categories.length>0&&<>
   {(kind==='year'||allResults&&annual.length>0)&&<section className="space-y-3">{allResults&&<h2 className="text-2xl font-semibold">{categoryLabels.year}</h2>}<CourseFinder items={annual} quests={live.quests} venues={venues} schoolSlug={school?.slug} venueSlug={venue==='all'?undefined:venue} embedded={allResults} defaultWizard unified status={live.status} isValidating={live.isValidating} snapshotGeneratedAt={live.snapshotGeneratedAt} onRefresh={live.refresh}/></section>}
   {(['camp','other'] as const).map(k=>(kind===k||allResults&&(k==='camp'?camp:other).length>0)?<section key={k} className="space-y-3">{allResults&&<h2 className="text-2xl font-semibold">{categoryLabels[k]}</h2>}<CampFinder items={k==='camp'?camp:other} venues={venues} schoolSlug={school?.slug} venueSlug={venue==='all'?undefined:venue} embedded={allResults} unified activityKind={k} status={live.status}/></section>:null)}
  </>}
 </div>;
}
export function UnifiedWizard(props:Props){return <Suspense fallback={<p role="status">Загружаем подбор занятий…</p>}><Inner {...props}/></Suspense>;}
