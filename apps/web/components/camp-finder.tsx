"use client";
import Link from 'next/link';
import style from './course-finder.module.css';
import layout from './camp-finder.module.css';
import {useEffect,useRef,useState} from 'react';
import {usePathname,useSearchParams} from 'next/navigation';
import {getSchoolScopes,resolveSchoolScope,type AgendaOfferItem} from '@/lib/offers/agenda';
import {campChoiceCount,campPresentation,campActive,campMatches,campNeedsClarification,campSteps,type CampSelection} from '@/lib/offers/camp-finder';
import {sharedAgeQuery,wizardHref} from '@/lib/offers/unified-wizard';
import {scheduleHref} from '@/lib/offers/schedule-routes';
import {buildScheduleBoardItem} from '@/lib/offers/schedule-board';
import {ScheduleBoardCard} from '@/components/schedule-board-card';
import {useScheduleClock} from '@/lib/offers/use-schedule-clock';
import type {Venue} from '@/lib/schemas';

type Props={items:AgendaOfferItem[];venues:Venue[];schoolSlug?:string;venueSlug?:string;embedded?:boolean;unified?:boolean;activityKind?:'camp'|'other';status:string};
const field='min-h-11 w-full rounded-xl border border-white/20 bg-background px-3 py-2';
const button='inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-4 py-2 hover:bg-white/10 focus-visible:outline-2';
export function CampFinder({items,venues,schoolSlug,venueSlug,embedded=false,unified=false,activityKind='camp',status}:Props){
 const activities=activityKind==='other';
 const incomingQuery=useSearchParams(),pathname=usePathname(),clock=useScheduleClock();
 const query=embedded&&incomingQuery.get("kind")==="all"?sharedAgeQuery(incomingQuery):incomingQuery;
 const schoolInput=schoolSlug??query.get('school')??'all';const school=resolveSchoolScope(venues,schoolInput);
 const selection:CampSelection={school:school?.slug??schoolInput,venue:venueSlug??query.get('venue')??'all',period:query.get('period')??'all',age:query.get('age')??'all',archive:query.get('archive')==='1',programme:query.get('programme')??'all'};
 const now=clock?new Date(clock):undefined;
 const count=(field:'school'|'venue'|'programme'|'period'|'age',value:string)=>campChoiceCount(items,selection,field,value,now);
 const schools=getSchoolScopes(venues).filter(s=>count('school',s.slug)>0);
 const campuses=(school?.venues??(selection.school==='all'?venues:[])).filter(v=>count('venue',v.slug)>0);
 const programmes=[...new Map(items.map(i=>[i.quest.slug,i.quest])).values()];
 const availableProgrammes=programmes.filter(p=>count('programme',p.slug)>0);
 const periods=[...new Set(items.filter(i=>selection.archive||campActive(i,now)).map(i=>i.offer.startDate).filter(Boolean))].sort().filter(p=>count('period',p)>0);
 const ages=Array.from({length:16},(_,i)=>String(i+3)).filter(a=>count('age',a)>0);
 const invalid=(selection.school!=='all'&&!school)||(selection.venue!=='all'&&!(school?.venues??venues).some(v=>v.slug===selection.venue))||(selection.programme!=='all'&&!programmes.some(p=>p.slug===selection.programme))||(!['all','pending',...items.map(i=>i.offer.startDate)].includes(selection.period));
 const filtered=invalid?[]:items.filter(i=>campMatches(i,selection,now));
 const ordered=[...filtered].sort((a,b)=>Number(campNeedsClarification(a,selection))-Number(campNeedsClarification(b,selection))||(a.offer.startDate||'9999').localeCompare(b.offer.startDate||'9999'));
 const steps=campSteps(items,schoolSlug,venueSlug,now);const {wizard,step}=campPresentation(query,steps,embedded);
 const [filtersOpen,setFiltersOpen]=useState(false);
 const heading=useRef<HTMLHeadingElement>(null);const previous=useRef(`${wizard}:${step}`);useEffect(()=>{const screen=`${wizard}:${step}`;if(previous.current!==screen)heading.current?.focus();previous.current=screen;},[wizard,step]);
 useEffect(()=>{
  try{
   if(sessionStorage.getItem('brainmaster:camp-finder-focus')!==`${pathname}?${query}`)return;
   sessionStorage.removeItem('brainmaster:camp-finder-focus');heading.current?.focus();
  }catch{ /* Optional focus handoff; navigation works without storage. */ }
 },[pathname,query]);
 const selected=query.get('offer');
 useEffect(()=>{if(selected&&step==='results')document.getElementById(`schedule-offer-${selected}`)?.scrollIntoView({block:'center'});},[selected,step]);
 const Heading=embedded?'h2':'h1';
 function update(patch:Record<string,string>){
  const q=new URLSearchParams(query);q.delete('format');q.delete('offer');for(const[k,v]of Object.entries(patch)){if(v==='all'||v==='')q.delete(k);else q.set(k,v);}
  if(step==='results'&&!('step'in patch)&&!('view'in patch))q.set('step','results');
  let targetSchool=selection.school,targetVenue=selection.venue;
  if('school'in patch){targetSchool=patch.school;targetVenue='all';q.delete('venue');q.delete('period');}
  if('venue'in patch){targetVenue=patch.venue;q.delete('period');}
  q.delete('school');q.delete('venue');
  const base=unified||activities?wizardHref(targetSchool,targetVenue):scheduleHref('camp',targetSchool,targetVenue,venues),url=new URL(base,'https://schedule.invalid');for(const[k,v]of q)url.searchParams.set(k,v);if(unified||activities)url.searchParams.set('kind',activityKind);
  const href=url.pathname+(url.searchParams.size?'?'+url.searchParams:'');
  if(url.pathname===pathname)window.history.pushState(null,'',href);else {
   if(wizard)try{sessionStorage.setItem('brainmaster:camp-finder-focus',`${url.pathname}?${url.searchParams}`);}catch{ /* Optional focus handoff. */ }
   // Cross-scope navigation must use this exact URL; a cached static route can restore an older query.
   window.location.assign(href);
  }
 }
 function result(){update({view:'wizard',step:'results'});}
 const location=<>
  <label className="grid gap-2">Школа / площадка<select className={field} aria-label="Школа / площадка" value={selection.school} onChange={e=>update({school:e.target.value})}><option value="all">Все площадки</option>{schools.map(s=><option value={s.slug} key={s.slug}>{s.name}</option>)}{selection.school!=='all'&&!schools.some(s=>s.slug===selection.school)&&<option value={selection.school} disabled>{school?.name??'Площадка не найдена'} — нет смен</option>}</select></label>
  <label className="grid gap-2">Корпус / адрес<select className={field} aria-label="Корпус / адрес лагеря" value={selection.venue} onChange={e=>update({venue:e.target.value})}><option value="all">Все корпуса</option>{campuses.map(v=><option key={v.slug} value={v.slug}>{v.address}</option>)}{selection.venue!=='all'&&!campuses.some(v=>v.slug===selection.venue)&&<option value={selection.venue} disabled>{venues.find(v=>v.slug===selection.venue)?.address??'Адрес не найден'} — нет смен</option>}</select></label>
 </>;
 const dates=<label className="grid gap-2">{activities?'Дата мероприятия':'Начало смены'}<select className={field} aria-label="Начало смены" value={selection.period} onChange={e=>update({period:e.target.value})}><option value="all">Любые даты / пока не знаю</option>{periods.map(p=><option value={p} key={p}>{p.split('-').reverse().join('.')}</option>)}<option value="pending" disabled={count('period','pending')===0}>Даты уточняются</option>{!['all','pending',...periods].includes(selection.period)&&<option value={selection.period} disabled>{selection.period} — нет подходящих смен</option>}</select></label>;
 const age=<label className="grid gap-2">Возраст ребёнка<select className={field} aria-label="Возраст ребёнка в лагере" value={selection.age} onChange={e=>update({age:e.target.value})}><option value="all">Пока не указывать</option>{ages.map(a=><option key={a} value={a}>{a} лет</option>)}{selection.age!=='all'&&!ages.includes(selection.age)&&<option value={selection.age} disabled>{selection.age} — нет подходящих смен</option>}</select></label>;
 const programme=<label>Программа<select aria-label="Программа лагеря" value={selection.programme} onChange={e=>update({programme:e.target.value})}><option value="all">Все программы</option>{availableProgrammes.map(p=><option key={p.slug} value={p.slug}>{p.title}</option>)}{selection.programme!=='all'&&!availableProgrammes.some(p=>p.slug===selection.programme)&&<option value={selection.programme} disabled>{programmes.find(p=>p.slug===selection.programme)?.title??'Программа не найдена'} — нет смен</option>}</select></label>;
 const filters=<div className={style.fields}>{location}{programme}{dates}{age}<label className={layout.archive}><input type="checkbox" checked={selection.archive} onChange={e=>update({archive:e.target.checked?'1':''})}/>{activities?'Показать архив мероприятий':'Показать архив смен'}</label><button type="button" className={style.textButton} onClick={()=>update({school:schoolSlug??'all',venue:venueSlug??'all',programme:'all',period:'all',age:'all',archive:''})}>Сбросить условия</button></div>;
 const summary=[school?.name??(selection.school==='all'?'Все площадки':'Площадка не найдена'),selection.venue==='all'?'Все корпуса':venues.find(v=>v.slug===selection.venue)?.address??'Адрес не найден',selection.programme==='all'?'Все программы':programmes.find(p=>p.slug===selection.programme)?.title??'Программа не найдена',selection.period==='all'?'Любые даты':selection.period==='pending'?'Даты уточняются':selection.period.split('-').reverse().join('.'),selection.age==='all'?'Любой возраст':`${selection.age} лет`,...(selection.archive?['Включая архив']:[])].join(' · ');
 function catalogueHref(school?:string,venue?:string){
  const target=new URL(unified||activities?wizardHref(school,venue):scheduleHref('camp',school,venue,venues),'https://schedule.invalid');
  target.searchParams.set('view','catalogue');if(unified||activities)target.searchParams.set('kind',activityKind);return target.pathname+target.search;
 }
 const next=steps[steps.indexOf(step)+1]??'results';
 const boardItems=ordered.map(i=>buildScheduleBoardItem(i,i.venue.schoolScopeSlug??i.venue.slug,clock?new Date(clock):undefined));
 return <section className="space-y-5" data-testid="camp-finder">
  {wizard ? <div className={style.finder} data-view="wizard" data-screen={step==='results'?'results':'question'}>
   <div className={style.topbar}><span className={style.wordmark}>brainmaster<span aria-hidden> / </span><small>{activities?'мероприятия':'лагерные смены'}</small></span><button type="button" onClick={()=>update({view:'catalogue',step:'results'})}>{activities?'Все мероприятия ↗':'Все смены ↗'}</button></div>
   <div className={style.inner}>
    <header className={style.intro}>
     <p className={style.eyebrow}>{activities?'ПОДБЕРЁМ ЗАНЯТИЕ':'ПОДБЕРЁМ ЛАГЕРЬ'} · {school?.name??'BRAINMASTER'}</p>
     <Heading ref={heading} tabIndex={-1}>{step==='place'?'Где удобнее заниматься?':step==='dates'?'Когда удобнее прийти?':step==='age'?'Сколько лет ребёнку?':activities?'Выберите мероприятие':'Выберите лагерную смену'}</Heading>
     <p>{step==='place'?'Выберите площадку и удобный адрес. Можно сравнить смены во всех корпусах.':step==='dates'?'Выберите начало смены. Если ещё не определились, оставьте любые даты.':step==='age'?'Покажем подходящие смены и отдельно отметим те, где возраст ещё уточняется.':'Сравните программы, даты и стоимость. Условия предварительной записи уточним перед зачислением.'}</p>
    </header>
    <ol className={style.steps} aria-label="Шаги подбора лагеря">{steps.map((s,i)=><li key={s} aria-current={step===s?'step':undefined}><button type="button" onClick={()=>update({step:s})}><span>{i+1}</span>{s==='place'?'Где':s==='dates'?'Когда':s==='age'?'Возраст':'Смены'}</button></li>)}</ol>
    {step==='place'&&<div className="space-y-6">
     <details key={selection.school} open={selection.school==='all'?true:undefined} className="space-y-3">
      <summary className="min-h-11 cursor-pointer rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">{school?`Площадка: ${school.name} · изменить`:'Выбрать площадку'}</summary>
     <div className={style.choices} role="group" aria-label="Школа / площадка">
      <button type="button" aria-pressed={selection.school==='all'} onClick={()=>update({school:'all'})}><strong>Все площадки</strong><span>Сравнить лагерные смены в разных школах</span><b aria-hidden>{selection.school==='all'?'✓':'+'}</b></button>
      {schools.map(s=><button type="button" key={s.slug} aria-pressed={selection.school===s.slug} onClick={()=>update({school:s.slug})}><strong>{s.name}</strong><span>Выбрать площадку и посмотреть её адреса</span><b aria-hidden>{selection.school===s.slug?'✓':'+'}</b></button>)}
     </div>
     </details>
     {selection.school!=='all'&&<div className="space-y-3"><h2>Корпус / адрес</h2><div className={style.choices} role="group" aria-label="Корпус / адрес лагеря">
      <button type="button" aria-pressed={selection.venue==='all'} onClick={()=>update({venue:'all'})}><strong>Все корпуса</strong><span>Сравнить смены на всех адресах площадки</span><b aria-hidden>{selection.venue==='all'?'✓':'+'}</b></button>
      {campuses.map(v=><button type="button" key={v.slug} aria-pressed={selection.venue===v.slug} onClick={()=>update({venue:v.slug})}><strong>{v.address}</strong><span>Лагерные смены по этому адресу</span><b aria-hidden>{selection.venue===v.slug?'✓':'+'}</b></button>)}
     </div></div>}
    </div>}
    {step==='dates'&&<div className={style.choices} role="group" aria-label="Начало смены">
     {[{value:'all',label:'Любые даты / пока не знаю',description:'Посмотреть все доступные смены'},...periods.map(p=>({value:p,label:p.split('-').reverse().join('.'),description:'Дата начала смены'})),{value:'pending',label:'Даты уточняются',description:'Оставить предварительную заявку и уточнить даты'}].map(option=><button type="button" key={option.value} aria-pressed={selection.period===option.value} onClick={()=>update({period:option.value})}><strong>{option.label}</strong><span>{option.description}</span><b aria-hidden>{selection.period===option.value?'✓':'+'}</b></button>)}
    </div>}
    {step==='age'&&<div className={style.ageChoice}>{age}<p>Если возраст для смены пока не указан, мы сохраним её в подборке и отметим, что условия нужно уточнить.</p></div>}
    {step!=='results'&&<>
     {invalid&&<p className={style.footnote} role="status">Условия из ссылки не найдены. Выберите другую площадку или дату.</p>}
     <div className={style.footer}>{steps.indexOf(step)>0?<button type="button" onClick={()=>update({step:steps[steps.indexOf(step)-1]})}>← Назад</button>:<button type="button" onClick={()=>update({view:'catalogue',step:'results'})}>{activities?'Все мероприятия':'Все смены'}</button>}<button type="button" className={style.primary} onClick={()=>update({step:next})}>{next==='results'?activities?'Посмотреть мероприятия →':'Посмотреть смены →':'Далее →'}</button></div>
     <button type="button" className={style.textButton} onClick={result}>{activities?'Показать подходящие мероприятия':'Показать подходящие смены'} ({filtered.length})</button>
    </>}
   </div>
  </div>:<header className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><Heading ref={heading} tabIndex={-1} className="font-heading text-3xl font-semibold">{activities?'Квесты и другие мероприятия':'Лагерные смены'}</Heading><button className={button} onClick={()=>update({view:'wizard',step:steps[0]})}>Подобрать по шагам</button></div><p className="text-muted-foreground">{activities?'Выбирайте место, даты и занятие по интересам. Неизвестные условия уточним перед записью.':'Программы на каникулы: выбирайте место, даты и занятия по интересам. Неизвестные условия уточним перед зачислением.'}</p></header>}
  {step==='results'&&<>
   {!embedded&&<div className={`${style.finder} ${layout.conditions}`} data-view="catalogue" data-catalogue={!wizard}><button type="button" className={layout.summary} aria-expanded={filtersOpen} aria-controls="camp-filters" onClick={()=>setFiltersOpen(!filtersOpen)}>{summary}<strong>{filtersOpen?'Скрыть условия ↑':'Изменить условия ↓'}</strong></button></div>}
   <div className={layout.workspace} data-catalogue={!wizard&&!embedded}>
    {!embedded&&<section id="camp-filters" aria-label="Условия подбора лагеря" className={`${style.finder} ${layout.filters}`} data-view="catalogue" data-open={filtersOpen} onFocusCapture={()=>setFiltersOpen(true)}><h2>Ваши условия</h2>{filters}</section>}
    <div className="min-w-0 space-y-4">
     <h2 className="text-xl font-semibold" aria-live="polite" aria-atomic="true">{activities?'Найдено мероприятий':'Найдено смен'}: <span data-testid="camp-count">{filtered.length}</span></h2>
   {selected&&!filtered.some(i=>i.offer.id===selected)&&status!=='loading'&&<p role="status">Выбранная смена недоступна по этим условиям.</p>}
   {!filtered.length&&status!=='loading'&&<div role="status" className="rounded-2xl border border-white/15 p-5"><p>{status==='error'?'Не удалось загрузить смены. Повторите загрузку расписания.':invalid?'Не удалось найти указанную площадку или условия.':activities?'По этим условиям мероприятий пока нет.':'По этим условиям лагерных смен пока нет.'}</p><div className="mt-3 flex flex-wrap gap-3"><Link className={button} href={catalogueHref(school?.slug)}>Все корпуса этой площадки</Link><Link className={button} href={catalogueHref()}>{activities?'Все мероприятия':'Все лагерные смены'}</Link></div></div>}
   <div className={layout.cards}>{boardItems.map((item,index)=><div key={item.offer.id} className="min-w-0">{campNeedsClarification(ordered[index],selection)&&<p className="mb-2 rounded-xl bg-amber-400/10 p-3 text-sm">Нужно уточнить соответствие выбранным датам или возрасту</p>}<ScheduleBoardCard item={item} mode="detailed" bookingSchoolSlug={item.venue.schoolScopeSlug??item.venue.slug} highlighted={selected===item.offer.id}/><Link className="inline-flex min-h-11 items-center text-sm text-primary underline" href={catalogueHref(item.venue.schoolScopeSlug??item.venue.slug,item.venue.slug)}>{activities?'Все мероприятия по этому адресу →':'Все смены по этому адресу →'}</Link></div>)}</div>
    </div>
   </div>
  </>}
 </section>;
}
