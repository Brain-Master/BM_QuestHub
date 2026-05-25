import Link from "next/link";

import { formatSnapshotTime } from "@/lib/offers/snapshot-stamp";
import { SCHEDULE_DICTIONARIES } from "@/lib/offers/schedule-dictionaries";
import { cn } from "@/lib/utils";

const DEFAULT_NOTICE = {
  enabled: true,
  title: "Свободные места — ориентир, не гарантия",
  body: "Данные подтягиваются с mos.ru и могут отставать. Точное число мест и запись — на карточке смены на mos.ru (кнопки «Запись» ведут на портал).",
  linkLabel: "Портал mos.ru",
  linkHref: "https://www.mos.ru",
};

function resolveNotice() {
  const fromConfig = SCHEDULE_DICTIONARIES.mosCapacityNotice;
  if (!fromConfig) return DEFAULT_NOTICE;
  return {
    enabled: fromConfig.enabled !== false,
    title: fromConfig.title?.trim() || DEFAULT_NOTICE.title,
    body: fromConfig.body?.trim() || DEFAULT_NOTICE.body,
    linkLabel: fromConfig.linkLabel?.trim() || DEFAULT_NOTICE.linkLabel,
    linkHref: fromConfig.linkHref?.trim() || DEFAULT_NOTICE.linkHref,
  };
}

type Props = {
  snapshotGeneratedAt?: string | null;
  showSnapshotTime?: boolean;
  className?: string;
};

export function MosCapacityDataNotice({
  snapshotGeneratedAt,
  showSnapshotTime = false,
  className,
}: Props) {
  const notice = resolveNotice();
  if (!notice.enabled) return null;

  const snapshotLabel = showSnapshotTime
    ? formatSnapshotTime(snapshotGeneratedAt)
    : null;

  return (
    <div
      data-testid="mos-capacity-notice"
      role="status"
      className={cn(
        "rounded-xl border border-amber-400/35 bg-amber-400/10 p-4 text-sm leading-relaxed text-amber-50/95",
        className,
      )}
    >
      <p className="mb-1 flex items-start gap-2 font-semibold text-amber-100">
        <span aria-hidden className="mt-0.5 text-base leading-none">
          ⚠
        </span>
        {notice.title}
      </p>
      <p className="text-amber-50/85">{notice.body}</p>
      {snapshotLabel ? (
        <p
          className="mt-2 text-amber-100/70 text-xs"
          data-testid="mos-capacity-snapshot-time"
        >
          Снимок на сайте: {snapshotLabel} (MSK)
        </p>
      ) : null}
      <p className="mt-2">
        <Link
          href={notice.linkHref}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-amber-100 underline decoration-amber-200/50 underline-offset-2 hover:text-white"
        >
          {notice.linkLabel}
        </Link>
      </p>
    </div>
  );
}
