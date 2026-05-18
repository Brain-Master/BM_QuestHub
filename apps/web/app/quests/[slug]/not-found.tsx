import Link from "next/link";

export default function QuestNotFound() {
  return (
    <main className="mx-auto max-w-2xl flex-1 px-4 py-16">
      <h1 className="font-heading text-2xl font-semibold">Квест не найден</h1>
      <p className="mt-3 text-muted-foreground">
        Возможно, карточка снята с кампании или slug изменился.
      </p>
      <Link className="mt-6 inline-block text-primary underline" href="/">
        Вернуться к курсам
      </Link>
    </main>
  );
}
