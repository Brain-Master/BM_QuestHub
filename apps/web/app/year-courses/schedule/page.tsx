import type { Metadata } from "next";
import Link from "next/link";
import { YearSchedule } from "@/components/year-schedule";
import { loadYearSchedule } from "@/lib/year-schedule";
import "../year-courses.css";

export const metadata:Metadata={
  title:"Расписание годовых курсов ШМИ — школы и группы | BrainMaster",
  description:"Еженедельные группы Школы Молодого IT-Инженера: школы, адреса, дни занятий, стоимость и ссылки на mos.ru. Выгрузка на 8 сентября 2026.",
};
export default function AnnualSchedulePage(){
 const data=loadYearSchedule();
 return <main className="yc-page">
   <nav className="yc-breadcrumbs" aria-label="Хлебные крошки"><Link href="/">Главная</Link><span aria-hidden>/</span><Link href="/year-courses/">Годовые курсы</Link><span aria-hidden>/</span><span aria-current="page">Расписание</span></nav>
   <header className="ys-heading"><p className="yc-label">Школа Молодого IT-Инженера / 2026–2027</p><h1>Время для<br /><span>новых открытий.</span></h1><p className="yc-lead">Найдите занятия рядом с домом — и выберите удобный день.</p><p>{data.groups.length} группа · {data.locations.length} адресов · {data.groups.reduce((sum,g)=>sum+g.slots.length,0)} еженедельных занятия</p></header>
   <YearSchedule data={data} />
 </main>;
}
