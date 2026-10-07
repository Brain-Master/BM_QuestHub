"use client";
import Link from 'next/link';
import style from './course-finder.module.css';
import {useEffect,useRef} from 'react';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import {getSchoolScopes,resolveSchoolScope,type AgendaOfferItem} from '@/lib/offers/agenda';
import {campActive,campMatches,campNeedsClarification,campSteps,type CampSelection} from '@/lib/offers/camp-finder';
import {scheduleHref} from '@/lib/offers/schedule-routes';
import {buildScheduleBoardItem} from '@/lib/offers/schedule-board';
import {ScheduleBoardCard} from '@/components/schedule-board-card';
import {useScheduleClock} from '@/lib/offers/use-schedule-clock';
import type {Venue} from '@/lib/schemas';

type Props={items:AgendaOfferItem[];venues:Venue[];schoolSlug?:string;venueSlug?:string;embedded?:boolean;status:string};
const field='min-h-11 w-full rounded-xl border border-white/20 bg-background px-3 py-2';
const button='inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-4 py-2 hover:bg-white/10 focus-visible:outline-2';
export function CampFinder({items,venues,schoolSlug,venueSlug,embedded=false,status}:Props){
 const query=useSearchParams(),pathname=usePathname(),router=useRouter(),clock=useScheduleClock();
 const schoolInput=schoolSlug??query.get('school')??'all';const school=resolveSchoolScope(venues,schoolInput);
 const selection:CampSelection={school:school?.slug??schoolInput,venue:venueSlug??query.get('venue')??'all',period:query.get('period')??'all',age:query.get('age')??'all',archive:query.get('archive')==='1'};
 const now=clock?new Date(clock):undefined;
 const schools=getSchoolScopes(venues).filter(s=>items.some(i=>(i.venue.schoolScopeSlug??i.venue.slug)===s.slug&&campActive(i,now)));
 const campuses=(school?.venues??(selection.school==='all'?venues:[])).filter(v=>items.some(i=>i.venue.slug===v.slug&&campActive(i,now)));
 const scoped=items.filter(i=>(selection.school==='all'||(i.venue.schoolScopeSlug??i.venue.slug)===selection.school)&&(selection.venue==='all'||i.venue.slug===selection.venue));
 const periods=[...new Set(scoped.filter(i=>selection.archive||campActive(i,now)).map(i=>i.offer.startDate).filter(Boolean))].sort();
 const invalid=(selection.school!=='all'&&!school)||(selection.venue!=='all'&&!(school?.venues??venues).some(v=>v.slug===selection.venue))||(!['all','pending',...periods].includes(selection.period));
 const filtered=invalid?[]:items.filter(i=>campMatches(i,selection,now));
 const ordered=[...filtered].sort((a,b)=>Number(campNeedsClarification(a,selection))-Number(campNeedsClarification(b,selection))||(a.offer.startDate||'9999').localeCompare(b.offer.startDate||'9999'));
 const steps=campSteps(items,schoolSlug,venueSlug,now);const wizard=!embedded&&query.get('view')==='wizard';
 const requested=query.get('step');const step=wizard?(requested&&steps.includes(requested)?requested:steps[0]):'results';
 const heading=useRef<HTMLHeadingElement>(null);const previous=useRef(step);useEffect(()=>{if(previous.current!==step)heading.current?.focus();previous.current=step;},[step]);
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
  let targetSchool=selection.school,targetVenue=selection.venue;
  if('school'in patch){targetSchool=patch.school;targetVenue='all';q.delete('venue');q.delete('period');}
  if('venue'in patch){targetVenue=patch.venue;q.delete('period');}
  q.delete('school');q.delete('venue');
  const base=scheduleHref('camp',targetSchool,targetVenue,venues),url=new URL(base,'https://schedule.invalid');for(const[k,v]of q)url.searchParams.set(k,v);
  const href=url.pathname+(url.searchParams.size?'?'+url.searchParams:'');
  if(url.pathname===pathname)window.history.pushState(null,'',href);else {
   if(wizard)try{sessionStorage.setItem('brainmaster:camp-finder-focus',`${url.pathname}?${url.searchParams}`);}catch{ /* Optional focus handoff. */ }
   router.push(href,{scroll:false});
  }
 }
 function result(){update({view:'wizard',step:'results'});}
 const location=<>
  <label className="grid gap-2">Школа / площадка<select className={field} aria-label="Школа / площадка" value={selection.school} onChange={e=>update({school:e.target.value})}><option value="all">Все площадки</option>{schools.map(s=><option value={s.slug} key={s.slug}>{s.name}</option>)}{selection.school!=='all'&&!schools.some(s=>s.slug===selection.school)&&<option value={selection.school}>{school?.name??'Площадка не найдена'} — нет смен</option>}</select></label>
  <label className="grid gap-2">Корпус / адрес<select className={field} aria-label="Корпус / адрес лагеря" value={selection.venue} onChange={e=>update({venue:e.target.value})}><option value="all">Все корпуса</option>{campuses.map(v=><option key={v.slug} value={v.slug}>{v.address}</option>)}{selection.venue!=='all'&&!campuses.some(v=>v.slug===selection.venue)&&<option value={selection.venue}>{venues.find(v=>v.slug===selection.venue)?.address??'Адрес не найден'} — нет смен</option>}</select></label>
 </>;
 const dates=<label className="grid gap-2">Начало смены<select className={field} aria-label="Начало смены" value={selection.period} onChange={e=>update({period:e.target.value})}><option value="all">Любые даты / пока не знаю</option>{periods.map(p=><option value={p} key={p}>{p.split('-').reverse().join('.')}</option>)}<option value="pending">Даты уточняются</option>{!['all','pending',...periods].includes(selection.period)&&<option value={selection.period}>Дата недоступна</option>}</select></label>;
 const age=<label className="grid gap-2">Возраст ребёнка<select className={field} aria-label="Возраст ребёнка в лагере" value={selection.age} onChange={e=>update({age:e.target.value})}><option value="all">Пока не указывать</option>{Array.from({length:16},(_,i)=>String(i+3)).map(a=><option key={a} value={a}>{a} лет</option>)}</select></label>;
 const next=steps[steps.indexOf(step)+1]??'results';
 const boardItems=ordered.map(i=>buildScheduleBoardItem(i,i.venue.schoolScopeSlug??i.venue.slug,clock?new Date(clock):undefined));
 return <section className="space-y-5" data-testid="camp-finder">
  {wizard ? <div className={style.finder} data-view="wizard" data-screen={step==='results'?'results':'question'}>
   <div className={style.topbar}><span className={style.wordmark}>brainmaster<span aria-hidden> / </span><small>лагерные смены</small></span><button type="button" onClick={()=>update({view:'',step:''})}>Все смены ↗</button></div>
   <div className={style.inner}>
    <header className={style.intro}>
     <p className={style.eyebrow}>ПОДБЕРЁМ ЛАГЕРЬ · {school?.name??'BRAINMASTER'}</p>
     <Heading ref={heading} tabIndex={-1}>{step==='place'?'Где удобнее заниматься?':step==='dates'?'Когда удобнее прийти?':step==='age'?'Сколько лет ребёнку?':'Выберите лагерную смену'}</Heading>
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
     <div className={style.footer}>{steps.indexOf(step)>0?<button type="button" onClick={()=>update({step:steps[steps.indexOf(step)-1]})}>← Назад</button>:<button type="button" onClick={()=>update({view:'',step:''})}>Все смены</button>}<button type="button" className={style.primary} onClick={()=>update({step:next})}>{next==='results'?'Посмотреть смены →':'Далее →'}</button></div>
     <button type="button" className={style.textButton} onClick={result}>Показать подходящие смены ({filtered.length})</button>
    </>}
   </div>
  </div>:<header className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><Heading ref={heading} tabIndex={-1} className="font-heading text-3xl font-semibold">Лагерные смены</Heading><button className={button} onClick={()=>update({view:'wizard',step:steps[0]})}>Подобрать по шагам</button></div><p className="text-muted-foreground">Программы на каникулы: выбирайте место, даты и занятия по интересам. Неизвестные условия уточним перед зачислением.</p></header>}
  {step==='results'&&<>
   {!embedded&&<details className="rounded-2xl border border-white/15 p-4"><summary className="min-h-11 cursor-pointer font-semibold">Условия выбора · найдено {filtered.length}</summary><div className="mt-4 grid gap-4 sm:grid-cols-2">{location}{dates}{age}<label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={selection.archive} onChange={e=>update({archive:e.target.checked?'1':''})}/>Показать архив смен</label><button className={button} onClick={()=>update({period:'all',age:'all',archive:''})}>Сбросить даты и возраст</button></div></details>}
   {selected&&!filtered.some(i=>i.offer.id===selected)&&status!=='loading'&&<p role="status">Выбранная смена недоступна по этим условиям.</p>}
   {!filtered.length&&status!=='loading'&&<div role="status" className="rounded-2xl border border-white/15 p-5"><p>{status==='error'?'Не удалось загрузить смены. Повторите загрузку расписания.':invalid?'Не удалось найти указанную площадку или условия.':'По этим условиям лагерных смен пока нет.'}</p><div className="mt-3 flex flex-wrap gap-3"><Link className={button} href={scheduleHref('camp',school?.slug,undefined,venues)}>Все корпуса этой площадки</Link><Link className={button} href="/camp/">Все лагерные смены</Link></div></div>}
   <div className="grid gap-5 md:grid-cols-2">{boardItems.map((item,index)=><div key={item.offer.id} className="min-w-0">{campNeedsClarification(ordered[index],selection)&&<p className="mb-2 rounded-xl bg-amber-400/10 p-3 text-sm">Нужно уточнить соответствие выбранным датам или возрасту</p>}<ScheduleBoardCard item={item} mode="detailed" bookingSchoolSlug={item.venue.schoolScopeSlug??item.venue.slug} highlighted={selected===item.offer.id}/><Link className="inline-flex min-h-11 items-center text-sm text-primary underline" href={scheduleHref('camp',item.venue.schoolScopeSlug??item.venue.slug,item.venue.slug,venues)}>Все смены по этому адресу →</Link></div>)}</div>
  </>}
 </section>;
}
