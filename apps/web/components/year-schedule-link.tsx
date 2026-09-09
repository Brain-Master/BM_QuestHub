import Link from "next/link";
import "@/app/year-courses/year-courses.css";

export function YearScheduleLink({ programme }: { programme?: "shmi" }) {
  const query = new URLSearchParams({ view: "wizard", step: "school", ...(programme ? { programme } : {}) });
  return <aside className="ys-entry" aria-label="Расписание годовых курсов"><div><p className="yc-label">Годовые занятия · 2026–2027</p><h2>Подберём кружок шаг за шагом</h2><p>Выберите площадку, программу или возраст — затем сравните дни и время в удобных корпусах.</p></div><Link className="yc-button" href={`/agenda/?${query}`}>Подобрать кружок <span aria-hidden>↗</span></Link></aside>;
}
