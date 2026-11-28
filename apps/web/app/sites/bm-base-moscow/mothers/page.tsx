import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Дом, в котором живёт свет · Мехвариум",
  description: "Семейный инженерный мастер-класс ко Дню матери. 29 ноября, 14:00–15:30, Рязанский проспект, 38.",
};

export default function MothersWorkshopPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/sites/bm-base-moscow/" className="text-sm underline">← Площадка «Мехвариум»</Link>
      <article className="mt-6 grid items-start gap-8 md:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-primary">Семейный мастер-класс ко Дню матери</p>
          <h1 className="mt-2 font-heading text-4xl font-bold">Дом, в котором живёт свет</h1>
          <p className="mt-4 leading-relaxed">Мама и ребёнок вместе соберут пряничный домик с помощью 3D-ручек, украсят его узорами и окошками и добавят подсветку. Готовый домик семья заберёт с собой.</p>
          <ul className="mt-5 space-y-2">
            <li><time dateTime="2026-11-29T14:00:00+03:00">29 ноября 2026, воскресенье, 14:00–15:30</time></li>
            <li>Для мам и детей 6–10 лет (1–4 классы)</li>
            <li>«Мехвариум», Рязанский проспект, 38</li>
            <li><strong>1 490 ₽</strong> за маму и ребёнка</li>
            <li>До 12 пар «мама + ребёнок»</li>
          </ul>
          <a href="https://s.b-master.pro/Mothers" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-2 font-semibold text-primary-foreground">Записаться на мастер-класс</a>
          <p className="mt-4">Вопросы по участию <a className="underline" href="tel:+79859544133">+7 985 954 41 33</a></p>
        </div>
        <Image src="/sites/bm-base-moscow/mothers-2026.png" alt="Афиша мастер-класса «Дом, в котором живёт свет»" width={960} height={1280} sizes="(min-width: 768px) 480px, 100vw" className="h-auto w-full rounded-2xl" />
      </article>
    </main>
  );
}
