import Link from "next/link";
import "@/app/year-courses/year-courses.css";

export function YearScheduleLink() {
  return <aside className="ys-entry" aria-label="Расписание годовых курсов"><div><p className="yc-label">Годовые занятия · 2026–2027</p><h2>Выберите школу и удобный день</h2><p>Группы ШМИ, еженедельное расписание и ссылки на mos.ru. Данные на 8 сентября 2026.</p></div><Link className="yc-button" href="/year-courses/schedule/">Смотреть расписание <span aria-hidden>↗</span></Link></aside>;
}
