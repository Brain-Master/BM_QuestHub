"use client";

import { useState } from "react";
import { projectAnnualWorkspace } from "@/lib/year-schedule";
import type { Quest, Venue } from "@/lib/schemas";
import { useLiveSchedule } from "@/lib/offers/use-live-schedule";
import { annualBookingNeedsReview } from "@/lib/offers/annual-schedule";
import Link from "next/link";

const days=["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье"];
const dateLabel=(date:string)=>date.split("-").reverse().join(".");
const rub=(amount:number)=>new Intl.NumberFormat("ru-RU").format(amount)+" ₽";

export function YearSchedule({baseQuests,venues}:{baseQuests:Quest[];venues:Venue[]}) {
  const live=useLiveSchedule(baseQuests);
  const data=projectAnnualWorkspace(live.quests,venues);
  const [school,setSchool]=useState("");
  const [location,setLocation]=useState("");
  const [day,setDay]=useState("");
  const [query,setQuery]=useState("");
  const [openOnly,setOpenOnly]=useState(false);
  const locations=new Map(data.locations.map(l=>[l.id,l]));
  const matches=(g:typeof data.groups[number],skip="")=>{
    const place=locations.get(g.locationId);
    if(!place) return false;
    const needle=query.trim().toLocaleLowerCase("ru-RU");
    return (skip==="school"||!school||place.school===school)&&(skip==="school"||skip==="location"||!location||g.locationId===location)
      &&(skip==="day"||!day||g.slots.some(s=>s.weekday===day))&&(!openOnly||g.status==="open")
      &&(!needle||[g.title,g.sourceTitle,g.teacher,g.groupCode,g.listingId,place.address].filter(Boolean).join(" ").toLocaleLowerCase("ru-RU").includes(needle));
  };
  const filtered=data.groups.filter(g=>matches(g));
  const schools=Array.from(new Set(data.groups.filter(g=>matches(g,"school")).map(g=>locations.get(g.locationId)!.school)));
  const availableLocations=data.locations.filter(l=>data.groups.some(g=>g.locationId===l.id&&matches(g,"location")));
  const availableDays=days.filter(d=>data.groups.some(g=>g.slots.some(s=>s.weekday===d)&&matches(g,"day")));
  function reset(){setSchool("");setLocation("");setDay("");setQuery("");setOpenOnly(false);}
  if (!data.groups.length) return <section className="ys-workspace"><h2>Группы ШМИ</h2><p role="status">{live.status==="loading"?"Загружаем расписание…":live.status==="error"?"Расписание недоступно. Попробуйте обновить данные.":"В загруженном расписании нет годовых групп."}</p><button type="button" className="yc-button" onClick={live.refresh}>Обновить расписание</button></section>;
  return <section className="ys-workspace" aria-labelledby="schedule-list-title">
    {live.status==="error"&&<p role="status">Не удалось обновить расписание. Показаны последние загруженные данные. <button type="button" onClick={live.refresh}>Повторить</button></p>}
    <div className="ys-notice"><strong>Исходная выгрузка mos.ru: <time dateTime={data.asOf}>{dateLabel(data.asOf)}</time></strong><p>Даты последних проверок указаны у групп. Это сохранённые сведения, не проверка мест в реальном времени. Перед записью проверьте условия на mos.ru. Каникулы и переносы занятий уточняйте у школы.</p></div>
    <div className="ys-filters">
      <label>Школа<select value={school} onChange={e=>{setSchool(e.target.value);setLocation("");}}><option value="">Все школы</option>{schools.map(s=><option key={s}>{s}</option>)}{school&&!schools.includes(school)&&<option value={school} disabled>{school} — нет групп</option>}</select></label>
      <label>Адрес<select value={location} onChange={e=>setLocation(e.target.value)}><option value="">Все адреса</option>{availableLocations.map(l=><option key={l.id} value={l.id}>{l.address}</option>)}{location&&!availableLocations.some(l=>l.id===location)&&<option value={location} disabled>{locations.get(location)?.address??location} — нет групп</option>}</select></label>
      <label>День недели<select value={day} onChange={e=>setDay(e.target.value)}><option value="">Любой день</option>{availableDays.map(d=><option key={d}>{d}</option>)}{day&&!availableDays.includes(day)&&<option value={day} disabled>{day} — нет групп</option>}</select></label>
      <label className="ys-search">Поиск по названию, педагогу или коду<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Например, ШМИ2 или 2521221" /></label>
      <label className="ys-checkbox"><input type="checkbox" checked={openOnly} onChange={e=>setOpenOnly(e.target.checked)} />Только с открытым приёмом на дату среза</label>
      <button type="button" className="ys-reset" onClick={reset}>Сбросить фильтры</button>
    </div>
    <div className="ys-result-heading"><h2 id="schedule-list-title">Группы ШМИ</h2><p role="status" aria-live="polite">Найдено групп: {filtered.length} из {data.groups.length}</p></div>
    {filtered.length===0?<div className="ys-empty"><h3>Таких групп в выгрузке нет</h3><p>Выберите другой день или школу либо сбросьте фильтры.</p><button type="button" className="yc-button" onClick={reset}>Показать все группы</button></div>:
    <div className="ys-grid">{filtered.map(g=>{
      const place=locations.get(g.locationId); if(!place)return null;
      return <article key={g.id} className="ys-card" data-group-id={g.id}>
        <div className="ys-card-top"><span className={g.status==="open"?"ys-open":"ys-closed"}>{annualBookingNeedsReview(g)?"Карточка на проверке":g.status==="open"?"Приём открыт":"Приём закрыт"}</span><span className="ys-asof">на {dateLabel(g.refreshedAt?.slice(0,10)??data.asOf)}</span></div>
        <p className="yc-label"><Link href={`/sites/${place.schoolScopeSlug}/`}>{place.school} ↗</Link></p><h3>{g.title}</h3>
        <ul className="ys-slots" aria-label="Еженедельные занятия">{g.slots.map(s=><li key={s.weekday+s.start}><span>{s.weekday}</span><strong>{s.start}–{s.end}</strong></li>)}</ul>
        <p className="ys-period">Период обучения: {dateLabel(g.courseStart)} — {dateLabel(g.courseEnd)}</p>
        <dl><div><dt>Где</dt><dd>{place.address}{place.metro&&<span className="ys-secondary">Метро: {place.metro}</span>}{place.latitude!==undefined&&place.longitude!==undefined&&<a className="yc-link ys-secondary" href={`https://yandex.ru/maps/?pt=${place.longitude},${place.latitude}&z=17&l=map`} target="_blank" rel="noopener noreferrer">Здание на карте ↗<span className="sr-only"> — новое окно</span></a>}</dd></div>
        <div><dt>Возраст</dt><dd>{g.ageMin===null||g.ageMax===null?"Уточните у школы":`${g.ageMin}–${g.ageMax} лет`}</dd></div>
        <div><dt>Педагог</dt><dd>{g.teacher||"Уточните у школы"}</dd></div>
        <div><dt>Стоимость</dt><dd>{g.lessonPrice===null?"За занятие — уточните у школы":`${rub(g.lessonPrice)} / занятие`}{g.coursePrice!==null&&<span className="ys-secondary">{rub(g.coursePrice)} за курс по карточке</span>}</dd></div>
        <div><dt>Свободно</dt><dd>{g.freeSeats===null||g.totalSeats===null?"Количество мест не подтверждено":`${g.freeSeats} из ${g.totalSeats} на ${dateLabel(data.asOf)}`}</dd></div></dl>
        {g.limitedSource&&<p className="ys-limited">Данные группы неполные. Возраст, педагога, стоимость и вместимость уточните у школы.</p>}
        {g.refreshError&&<p>Последняя проверка карточки не удалась. Показаны последние подтверждённые сведения.</p>}
        <div className="ys-card-bottom"><p>Номер занятия: {g.listingId}{g.groupCode&&<span className="ys-secondary">Группа: {g.groupCode}</span>}</p>{annualBookingNeedsReview(g)?<span className="ys-secondary">Прямая карточка группы пока не подтверждена</span>:<a className="ys-action" href={g.link} target="_blank" rel="noopener noreferrer">{g.linkKind==="card"?"Карточка на mos.ru":"Найти на mos.ru"} <span aria-hidden>↗</span><span className="sr-only"> — {g.listingId}, новое окно</span></a>}</div>
      </article>;
    })}</div>}
    <p className="yc-note">Нет подходящего времени? <Link className="yc-link" href="/year-courses/shmi/">Узнайте больше о ШМИ</Link> или обсудите группу с командой BrainMaster.</p>
    <p className="yc-note">Координаты зданий: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>. Вход и кабинет уточняйте у школы.</p>
  </section>;
}
