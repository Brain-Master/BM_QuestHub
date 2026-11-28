import Link from "next/link";

export function MechvariumMothersSchedule() {
  return (
    <section className="my-5 rounded-3xl border border-white/10 bg-card/50 p-5 sm:p-6">
      <p className="text-sm text-muted-foreground">Семейный мастер-класс · 29 ноября 2026 · 14:00–15:30</p>
      <h2 className="mt-2 font-heading text-2xl font-semibold">Дом, в котором живёт свет</h2>
      <p className="mt-2">1 490 ₽ за маму и ребёнка. До 12 пар «мама + ребёнок».</p>
      <Link className="mt-3 inline-flex min-h-11 items-center underline" href="/sites/bm-base-moscow/mothers/">Подробнее и запись</Link>
    </section>
  );
}
