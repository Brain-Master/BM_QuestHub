"use client";

import { useSyncExternalStore } from 'react';
import type { ScheduleCapacityView } from "@/lib/offers/schedule-board";
import { cn } from "@/lib/utils";
import s from "./schedule-capacity-indicator.module.css";

const clockSnapshot=()=>Math.floor(Date.now()/60_000)*60_000;
const serverClockSnapshot=()=>0;
function subscribeClock(notify:()=>void) {
  const timer=setInterval(notify,60_000);
  return ()=>clearInterval(timer);
}

type Props = {
  capacity: ScheduleCapacityView;
  archived?: boolean;
  compact?: boolean;
  className?: string;
  checkedAt?: string;
  sourceDate?: string;
  failed?: boolean;
  showUnknown?: boolean;
};

export function ScheduleCapacityIndicator({
  capacity,
  archived = false,
  compact = false,
  className,
  checkedAt, sourceDate, failed = false, showUnknown = false,
}: Props) {
  const clock=useSyncExternalStore(subscribeClock,clockSnapshot,serverClockSnapshot);
  if (archived || (!capacity && !showUnknown)) return null;
  const stale = !!checkedAt && clock-Date.parse(checkedAt)>15*60_000;
  const date = checkedAt ? new Date(checkedAt).toLocaleString("ru-RU", {
    timeZone:"Europe/Moscow", day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit",
  }) : sourceDate;

  return (
    <div
      data-testid="schedule-capacity"
      className={cn(s.capacity, compact && s.compact, className)}
    >
      {capacity ? <>
        <div className={s.numbers}>
          <strong className={capacity.isSoldOut?s.full:s.free}>{capacity.isSoldOut?"Свободных мест нет":`Свободно ${capacity.left} из ${capacity.total}`}</strong>
          <span className={s.note}>занято {capacity.booked}</span>
        </div>
        <div role="meter" aria-label="Занятые места в группе" aria-valuemin={0}
          aria-valuemax={capacity.total} aria-valuenow={capacity.booked}
          aria-valuetext={`Занято ${capacity.booked} из ${capacity.total}, свободно ${capacity.left}`}
          className={s.track}>
          <span className={capacity.isSoldOut?s.fullFill:s.fill} style={{width:`${capacity.percent}%`}} />
        </div>
      </> : <span className={s.note}>Количество мест не указано на mos.ru</span>}
      {date && <small className={s.note}>mos.ru · {checkedAt?"проверено":"данные от"} {date}{checkedAt?" МСК":""}</small>}
      {(failed||stale) && <small className={s.note}>{failed?"Обновление не удалось.":"Данные требуют повторной проверки."} Наличие мест проверьте на mos.ru.</small>}
    </div>
  );
}
