import { brainmasterCommunityUrl } from "@/content/year-programs";

export function YearCourseContact() {
  return <section className="yc-contact" aria-labelledby="course-contact-title">
    <div><p className="yc-label">Следующий шаг — познакомиться</p><h2 id="course-contact-title">Что увлекает<br />вашего ребёнка?</h2></div>
    <div><p>Расскажите, что он уже пробовал и что хотел бы создать. Вместе выберем направление и подходящую группу.</p><a className="yc-button" href={brainmasterCommunityUrl}>Обсудить обучение в VK <span aria-hidden>↗</span></a><p className="yc-note">Возраст, площадку, расписание, стоимость и наличие мест уточняйте у команды. Примеры проектов не заменяют программу конкретной группы.</p></div>
  </section>;
}
