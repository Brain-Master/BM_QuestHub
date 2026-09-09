"use client";

import { CatalogPageClient } from "@/components/catalog-page-client";
import { useLiveSchedule } from "@/lib/offers/use-live-schedule";
import type { Quest, Venue, World } from "@/lib/schemas";

type Props = {
  baseQuests: Quest[];
  venues: Venue[];
  worlds: World[];
  fixedSchool?: {
    slug: string;
    name: string;
  };
  title?: string;
  emptyMessage?: string;
};

export function LiveCatalog({
  baseQuests,
  venues,
  worlds,
  fixedSchool,
  title,
  emptyMessage,
}: Props) {
  const { quests, status } = useLiveSchedule(baseQuests);

  return (
    <div className="relative">
      {status === "loading" ? (
        <p className="mb-4 text-muted-foreground text-sm" role="status">
          Загружаем актуальное расписание…
        </p>
      ) : null}
      {status === "error" ? (
        <p className="mb-4 text-amber-200/90 text-sm" role="status">
          Не удалось обновить расписание. Доступные сохранённые данные могут быть устаревшими; отсутствие групп пока не подтверждено.
        </p>
      ) : null}
      <CatalogPageClient
        quests={quests}
        venues={venues}
        worlds={worlds}
        fixedSchool={fixedSchool}
        title={title}
        emptyMessage={status === "loading" ? "Проверяем наличие групп…" : status === "error" ? "Источник расписания недоступен. Попробуйте обновить страницу." : emptyMessage}
      />
    </div>
  );
}
