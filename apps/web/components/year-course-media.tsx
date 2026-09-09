import Image from "next/image";

export const programmeMedia = {
  shmi: { name: "shmi-robot", alt: "Колёсный робот из конструктора с двумя датчиками — фото из архива BrainMaster", caption: "От деталей — к работающей конструкции" },
  "it-academy": { name: "academy", alt: "Наставник объясняет ученику устройство электронного узла", caption: "Разбираемся, как работает устройство" },
  projects: { name: "project", alt: "3D-принтер с красными печатными деталями из архива проектов BrainMaster", caption: "От модели на экране — к настоящему устройству" },
  "olympiad-league": { name: "olympiad", alt: "Групповое фото участников олимпиады на сцене", caption: "Олимпиадное движение · фото из архива" },
} as const;

export function CoursePhoto({ name, alt, priority = false, className = "" }: { name: string; alt: string; priority?: boolean; className?: string }) {
  return <Image src={`/editorial/year-courses/${name}-1280.webp`} alt={alt} width={1280} height={853} priority={priority} sizes="(max-width: 640px) 100vw, 640px" className={`yc-photo ${className}`} />;
}

export function WorkshopVideo() {
  return <section className="yc-film" aria-labelledby="workshop-film-title">
    <div><p className="yc-label">Не только на экране</p><h2 id="workshop-film-title">Здесь идеи можно<br />подержать в руках.</h2><p>Паяем, собираем, проверяем. Наставник помогает разобраться, а готовая вещь показывает, зачем нужны новые знания.</p><p className="yc-note">Фрагмент из архива каникулярного «КиберРитма», 30 секунд, без звука. Это иллюстрация подхода, а не учебный план годовой группы.</p></div>
    <figure><video controls preload="none" playsInline poster="/editorial/year-courses/video-poster.webp" aria-label="Практика в мастерской: фрагмент без звука" aria-describedby="workshop-film-description"><source src="/editorial/year-courses/workshop-excerpt.mp4" type="video/mp4" />Ваш браузер не поддерживает видео.</video><figcaption id="workshop-film-description">В кадре дети вместе с наставниками работают с платами, проводами и корпусами. <a href="/editorial/year-courses/workshop-excerpt.mp4">Открыть видео отдельно</a></figcaption></figure>
  </section>;
}
