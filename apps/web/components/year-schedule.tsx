"use client";

import { useState } from "react";
import type { YearScheduleData } from "@/lib/year-schedule";
import Link from "next/link";

const days=["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье"];
const dateLabel=(date:string)=>date.split("-").reverse().join(".");
const rub=(amount:number)=>new Intl.NumberFormat("ru-RU").format(amount)+" ₽";

export function YearSchedule({data}:{data:YearScheduleData}) {
  const [school,setSchool]=useState("");
  const [location,setLocation]=useState("");
  const [day,setDay]=useState("");
  const [query,setQuery]=useState("");
  const [openOnly,setOpenOnly]=useState(false);
  const locations=new Map(data.locations.map(l=>[l.id,l]));
  const schools=Array.from(new Set(data.locations.map(l=>l.school)));
  const filtered=data.groups.filter(g=>{
    const place=locations.get(g.locationId);
    if(!place) return false;
    const needle=query.trim().toLocaleLowerCase("ru-RU");
    return (!school||place.school===school)&&(!location||g.locationId===location)
      &&(!day||g.slots.some(s=>s.weekday===day))&&(!openOnly||g.status==="open")
      &&(!needle||[g.title,g.teacher,g.groupCode,g.listingId,place.address].filter(Boolean).join(" ").toLocaleLowerCase("ru-RU").includes(needle));
  });
  function reset(){setSchool("");setLocation("");setDay("");setQuery("");setOpenOnly(false);}
  return <section className="ys-workspace" aria-labelledby="schedule-list-title">
    <div className="ys-notice"><strong>Срез mos.ru на <time dateTime={data.asOf}>{dateLabel(data.asOf)}</time></strong><p>Расписание, стоимость, статус приёма и свободные места — из предоставленной выгрузки, не в реальном времени. Перед записью проверьте условия на mos.ru. Каникулы и переносы занятий уточняйте у школы.</p></div>
    <div className="ys-filters">
      <label>Школа<select value={school} onChange={e=>{setSchool(e.target.value);setLocation("");}}><option value="">Все школы</option>{schools.map(s=><option key={s}>{s}</option>)}</select></label>
      <label>Адрес<select value={location} onChange={e=>setLocation(e.target.value)}><option value="">Все адреса</option>{data.locations.filter(l=>!school||l.school===school).map(l=><option key={l.id} value={l.id}>{l.address}</option>)}</select></label>
      <label>День недели<select value={day} onChange={e=>setDay(e.target.value)}><option value="">Любой день</option>{days.map(d=><option key={d}>{d}</option>)}</select></label>
      <label className="ys-search">Поиск по названию, педагогу или коду<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Например, ШМИ2 или 2521221" /></label>
      <label className="ys-checkbox"><input type="checkbox" checked={openOnly} onChange={e=>setOpenOnly(e.target.checked)} />Только с открытым приёмом на дату среза</label>
      <button type="button" className="ys-reset" onClick={reset}>Сбросить фильтры</button>
    </div>
    <div className="ys-result-heading"><h2 id="schedule-list-title">Группы ШМИ</h2><p role="status" aria-live="polite">Найдено групп: {filtered.length} из {data.groups.length}</p></div>
    {filtered.length===0?<div className="ys-empty"><h3>Таких групп в выгрузке нет</h3><p>Выберите другой день или школу либо сбросьте фильтры.</p><button type="button" className="yc-button" onClick={reset}>Показать все группы</button></div>:
    <div className="ys-grid">{filtered.map(g=>{
      const place=locations.get(g.locationId); if(!place)return null;
      return <article key={g.id} className="ys-card" data-group-id={g.id}>
        <div className="ys-card-top"><span className={g.status==="open"?"ys-open":"ys-closed"}>{g.status==="open"?"Приём открыт":"Приём закрыт"}</span><span className="ys-asof">на {dateLabel(data.asOf)}</span></div>
        <p className="yc-label">{place.school}</p><h3>{g.title}</h3>
        <ul className="ys-slots" aria-label="Еженедельные занятия">{g.slots.map(s=><li key={s.weekday+s.start}><span>{s.weekday}</span><strong>{s.start}–{s.end}</strong></li>)}</ul>
        <p className="ys-period">Период обучения: {dateLabel(g.courseStart)} — {dateLabel(g.courseEnd)}</p>
        <dl><div><dt>Где</dt><dd>{place.address}{place.metro&&<span className="ys-secondary">Метро: {place.metro}</span>}</dd></div>
        <div><dt>Возраст</dt><dd>{g.ageMin===null||g.ageMax===null?"Уточните у школы":`${g.ageMin}–${g.ageMax} лет`}</dd></div>
        <div><dt>Педагог</dt><dd>{g.teacher||"Уточните у школы"}</dd></div>
        <div><dt>Стоимость</dt><dd>{g.lessonPrice===null?"За занятие — уточните у школы":`${rub(g.lessonPrice)} / занятие`}{g.coursePrice!==null&&<span className="ys-secondary">{rub(g.coursePrice)} за курс по карточке</span>}</dd></div>
        <div><dt>Свободно</dt><dd>{g.freeSeats===null||g.totalSeats===null?"Количество мест не подтверждено":`${g.freeSeats} из ${g.totalSeats} на ${dateLabel(data.asOf)}`}</dd></div></dl>
        {g.limitedSource&&<p className="ys-limited">Данные группы неполные. Возраст, педагога, стоимость и вместимость уточните у школы.</p>}
        <div className="ys-card-bottom"><p>Номер занятия: {g.listingId}{g.groupCode&&<span className="ys-secondary">Группа: {g.groupCode}</span>}</p><a className="ys-action" href={g.link} target="_blank" rel="noopener noreferrer">{g.linkKind==="card"?"Карточка на mos.ru":"Найти на mos.ru"} <span aria-hidden>↗</span><span className="sr-only"> — {g.listingId}, новое окно</span></a></div>
      </article>;
    })}</div>}
    <p className="yc-note">Нет подходящего времени? <Link className="yc-link" href="/year-courses/shmi/">Узнайте больше о ШМИ</Link> или обсудите группу с командой BrainMaster.</p>
  </section>;
}
