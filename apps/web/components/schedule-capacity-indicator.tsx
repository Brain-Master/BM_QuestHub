"use client";

import { useScheduleClock } from '@/lib/offers/use-schedule-clock';
import { AVAILABILITY_MAX_AGE_MS } from '@/lib/offers/annual-freshness';
import type { ScheduleCapacityView } from "@/lib/offers/schedule-board";
import { cn } from "@/lib/utils";
import s from "./schedule-capacity-indicator.module.css";

type Props = {
  capacity: ScheduleCapacityView;
  archived?: boolean;
  compact?: boolean;
  className?: string;
  checkedAt?: string;
  sourceDate?: string;
  failed?: boolean;
  showUnknown?: boolean;
  pageNotice?: boolean;
};

export function ScheduleCapacityIndicator({
  capacity,
  archived = false,
  compact = false,
  className,
  checkedAt, sourceDate, failed = false, showUnknown = false, pageNotice = false,
}: Props) {
  const clock=useScheduleClock();
  if (archived || (!capacity && !showUnknown)) return null;
  const dated = !!(checkedAt || sourceDate || showUnknown);
  const stale = dated && (failed || !checkedAt || clock <= 0 || !Number.isFinite(Date.parse(checkedAt)) ||
    Date.parse(checkedAt) > clock + 60_000 || clock-Date.parse(checkedAt)>AVAILABILITY_MAX_AGE_MS);
  const date = checkedAt ? new Date(checkedAt).toLocaleString("ru-RU", {
    timeZone:"Europe/Moscow", day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit",
  }) : sourceDate;

  return (
    <div
      data-testid="schedule-capacity"
      data-stale={stale || undefined}
      className={cn(s.capacity, compact && s.compact, className)}
    >
      {capacity ? <>
        <div className={s.numbers}>
          <strong className={stale?s.stale:capacity.isSoldOut?s.full:s.free}>{stale?`Было свободно ${capacity.left} из ${capacity.total}`:capacity.isSoldOut?"Свободных мест нет":`Свободно ${capacity.left} из ${capacity.total}`}</strong>
          <span className={s.note}>{stale?"было занято":"занято"} {capacity.booked}</span>
        </div>
        <div role="meter" aria-label={stale?"Занятые места по последним данным":"Занятые места в группе"} aria-valuemin={0}
          aria-valuemax={capacity.total} aria-valuenow={capacity.booked}
          aria-valuetext={`Занято ${capacity.booked} из ${capacity.total}, свободно ${capacity.left}`}
          className={s.track}>
          <span className={stale?s.staleFill:capacity.isSoldOut?s.fullFill:s.fill} style={{width:`${capacity.percent}%`}} />
        </div>
      </> : <span className={s.note}>Количество мест не указано на mos.ru</span>}
      {date && <small className={s.note}>mos.ru · {stale?"последние данные":"проверено"} {date}{checkedAt?" МСК":""}</small>}
      {!pageNotice && (failed||stale) && <small className={s.note}>Наличие мест и приём проверьте на mos.ru.</small>}
    </div>
  );
}
