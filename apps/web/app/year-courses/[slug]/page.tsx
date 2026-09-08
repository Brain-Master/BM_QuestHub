import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { yearPrograms } from "@/content/year-programs";
import { CoursePhoto, programmeMedia, WorkshopVideo } from "@/components/year-course-media";
import { YearCourseContact } from "@/components/year-course-contact";
import { YearScheduleLink } from "@/components/year-schedule-link";
import "../year-courses.css";

export function generateStaticParams() { return yearPrograms.map(program => ({slug:program.id})); }
export const dynamicParams = false;
type Props = {params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata> {
  const {slug}=await params; const program=yearPrograms.find(p=>p.id===slug);
  return {title: program ? `${program.title} | BrainMaster` : "Программа не найдена", description:program?.description};
}
export default async function ProgrammePage({params}:Props) {
  const {slug}=await params; const program=yearPrograms.find(p=>p.id===slug); if(!program) notFound();
  const media=programmeMedia[program.id];
  return <main className="yc-page">
    <nav className="yc-breadcrumbs" aria-label="Хлебные крошки"><Link href="/">Главная</Link><span aria-hidden>/</span><Link href="/year-courses/">Годовые курсы</Link><span aria-hidden>/</span><span aria-current="page">{program.title}</span></nav>
    <section className="yc-hero yc-detail"><div className="yc-hero-copy"><p className="yc-label">{program.audience}</p><h1>{program.title}</h1><p className="yc-lead">{program.tagline}</p>{program.id === "shmi" ? <Link className="yc-button" href="/year-courses/schedule/">Выбрать группу и время <span aria-hidden>↗</span></Link> : <a className="yc-button" href="#course-contact-title">Обсудить направление <span aria-hidden>↓</span></a>}</div><figure className="yc-hero-picture"><CoursePhoto name={media.name} alt={media.alt} priority /><figcaption>{media.caption}<small>Фото из архива BrainMaster · иллюстрация направления</small></figcaption></figure></section>
    <section className="yc-intro"><h2>Интерес —<br />точка старта.</h2><div><p className="yc-lead">{program.description}</p><ul className="yc-skills">{program.skills.map(skill=><li key={skill}>{skill}</li>)}</ul><p className="yc-outcome"><span className="yc-label">Что даёт обучение</span>{program.outcome}</p></div></section>
    <section className="yc-process" aria-labelledby="programme-content"><p className="yc-label">Задачи и инструменты</p><h2 id="programme-content">Что будем исследовать</h2><div className="yc-process-grid">{program.stages.map((stage,i)=><article key={stage.title}><span className="yc-label">0{i+1}</span><h3>{stage.title}</h3><p>{stage.text}</p></article>)}</div><p className="yc-note">Это примеры из материалов BrainMaster. Последовательность, состав проектов и формат конкретной группы уточняются перед записью.</p></section>
    {program.id === "shmi" && <YearScheduleLink />}
    <WorkshopVideo /><YearCourseContact />
    <nav aria-label="Другие направления" className="yc-other"><h2>А что ещё можно попробовать?</h2>{yearPrograms.filter(p=>p.id!==slug).map(p=><Link className="yc-link" key={p.id} href={`/year-courses/${p.id}/`}>{p.title} <span aria-hidden>↗</span></Link>)}</nav>
  </main>;
}
