import type { Metadata } from "next";
import Link from "next/link";
import { YearProgramsSection } from "@/components/year-programs-section";
import { CoursePhoto, WorkshopVideo } from "@/components/year-course-media";
import { YearCourseContact } from "@/components/year-course-contact";
import { YearScheduleLink } from "@/components/year-schedule-link";
import "./year-courses.css";

export const metadata: Metadata = {
  title: "Годовые курсы — учиться, создавать, находить своё | BrainMaster",
  description: "Школа Молодого IT-Инженера, Инженерная IT-Академия, проектная деятельность и Олимпиадная Лига. Узнайте о подходе BrainMaster и выберите направление.",
};

export default function YearCoursesPage() {
  return <main className="yc-page">
    <nav className="yc-breadcrumbs" aria-label="Хлебные крошки"><Link href="/">Главная</Link><span aria-hidden>/</span><span aria-current="page">Годовые курсы</span></nav>
    <section className="yc-hero">
      <div className="yc-hero-copy"><p className="yc-label">BrainMaster / Годовые программы</p><h1>Не просто<br />изучать.<br /><span>Создавать.</span></h1><p className="yc-lead">Робот, который едет. Схема, которая работает. И ребёнок, который говорит: «Я сделал это сам».</p><p>Инженерные занятия, где интерес становится навыком, а идея — настоящим проектом.</p><a className="yc-button" href="#programmes">Найти своё направление <span aria-hidden>↓</span></a></div>
      <figure className="yc-hero-picture"><CoursePhoto name="academy" alt="Наставник вместе с учеником разбирает электронный узел за рабочим столом" priority /><figcaption><span className="yc-status-dot" aria-hidden />Настоящие инструменты. Настоящие открытия.<small>Кадры из жизни BrainMaster</small></figcaption></figure>
    </section>
    <div className="yc-principles"><span>01 / Пробуем руками</span><span>02 / Разбираемся вместе</span><span>03 / Доводим до результата</span></div>
    <YearScheduleLink />
    <YearProgramsSection overview />
    <WorkshopVideo />
    <section className="yc-process" aria-labelledby="process-title"><p className="yc-label">Как рождается инженерный опыт</p><h2 id="process-title">От «а что, если?»<br />до «смотри, работает!»</h2><div className="yc-process-grid">{[
      ["Исследуем", "Задаём вопросы, знакомимся с инструментами и выбираем задачу, которую интересно решить."],
      ["Собираем", "Соединяем конструкцию, электронику и код. Наставник помогает пройти трудные места."],
      ["Проверяем", "Замечаем, что не работает, пробуем другое решение и объясняем, что получилось."],
    ].map(([title,text],i)=><article key={title}><span className="yc-label">0{i+1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="yc-faq" aria-labelledby="faq-title"><h2 id="faq-title">Перед первым занятием</h2>{[
      ["А если ребёнок никогда не программировал?", "Расскажите команде о его интересах и опыте. Для первого знакомства есть Школа Молодого IT-Инженера; подходящий уровень и программу группы подберём вместе."],
      ["Можно сразу заниматься своим проектом?", "Это зависит от идеи и подготовки. Обсудим, какие навыки уже есть, где нужна помощь наставника и какой формат проектной работы подходит."],
      ["Где посмотреть стоимость и расписание?", "Откройте расписание годовых курсов: там есть школы, дни занятий, стоимость и ссылки на mos.ru для групп ШМИ. У каждой записи указан срез данных; актуальные условия проверьте перед записью. Каникулярные квесты — отдельный формат занятий."],
    ].map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>
    <YearCourseContact />
    <Link className="yc-link" href="/catalog/">Ищете занятия на каникулы? Посмотрите инженерные квесты ↗</Link>
  </main>;
}
