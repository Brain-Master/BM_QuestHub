import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { yearPrograms } from "@/content/year-programs";
import { CoursePhoto, programmeMedia } from "@/components/year-course-media";
import "@/app/year-courses/year-courses.css";

export function YearProgramsSection({ overview = false }: { overview?: boolean }) {
  return <section id="programmes" aria-labelledby="year-programs-title" className="yc-programmes">
    <div className="yc-section-heading"><div><p className="yc-label">Четыре направления · один интерес к открытиям</p><h2 id="year-programs-title">Найдём своё дело.</h2><p>Можно начать с первых опытов — или пойти дальше со своей идеей.</p></div>{!overview && <Link className="yc-link" href="/year-courses/">Все годовые программы <ArrowUpRight size={18} aria-hidden /></Link>}</div>
    <div className="yc-card-grid">{yearPrograms.map((program, index) => {
      const media = programmeMedia[program.id];
      return <Link key={program.id} id={program.id} href={`/year-courses/${program.id}/`} className="yc-card">
        <div className="yc-card-image"><CoursePhoto name={media.name} alt={media.alt} /><span className="yc-number" aria-hidden>0{index + 1}</span></div>
        <div className="yc-card-body"><p className="yc-label">{program.audience}</p><h3>{program.title}</h3><p>{program.tagline}</p><span className="yc-link">О направлении <ArrowUpRight size={19} aria-hidden /></span></div>
      </Link>;
    })}</div>
  </section>;
}
