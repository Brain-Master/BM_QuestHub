import Link from "next/link";
export default function NotFound() {
  return <main className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 py-16">
    <p className="text-muted-foreground">404 · Страница не найдена</p>
    <h1 className="font-heading text-3xl font-semibold">Похоже, ссылка устарела</h1>
    <p>Выберите площадку или откройте расписание — поможем найти нужную группу.</p>
    <nav aria-label="Куда перейти" className="flex flex-wrap gap-5">
      <Link className="inline-flex min-h-11 items-center underline" href="/agenda/">Расписание занятий</Link>
      <Link className="inline-flex min-h-11 items-center underline" href="/sites/">Площадки</Link>
      <Link className="inline-flex min-h-11 items-center underline" href="/">На главную</Link>
    </nav>
  </main>;
}
