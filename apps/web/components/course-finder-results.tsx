"use client";

import Link from "next/link";
import { reviewedTeacher } from "@/content/annual-group-overrides";
import { OfferBookingAction } from "@/components/offer-booking-action";
import { finderAgeLabel, groupFinderWeek, itemSchool, itemStudyYear, type FinderState } from "@/lib/offers/course-finder";
import type { ScheduleBoardItem } from "@/lib/offers/schedule-board";
import s from "./course-finder.module.css";

export function CourseFinderResults({ items, state, onShare }: {
  items: ScheduleBoardItem[];
  state: FinderState;
  onShare: (item: ScheduleBoardItem) => void;
}) {
  // One offer can meet on several days. Each disclosure is unique; booking keeps the original offer.
  const groups = new Map<string, { title: string; address?: string; items: ScheduleBoardItem[] }>();
  for (const item of items) {
    const key = state.grouping === "venues" ? item.venue.slug : item.quest.slug;
    const group = groups.get(key) ?? {
      title: state.grouping === "venues" ? item.venue.displayName ?? item.venue.name : item.quest.title,
      address: state.grouping === "venues" ? item.venue.address : undefined,
      items: [],
    };
    group.items.push(item);
    groups.set(key, group);
  }
  return <div className={s.resultGroups} data-testid="finder-results">
    {[...groups].map(([key, group]) => <section key={key} className={s.resultGroup}
      data-campus={state.grouping === "venues" ? key : undefined}
      data-programme={state.grouping === "programmes" ? key : undefined}>
      <header className={s.groupHeader}><h3>{group.title}</h3>{group.address && <p>{group.address}</p>}</header>
      {groupFinderWeek(group.items, state.day).map(day => <section key={day.day} className={s.day} data-weekday={day.day}>
        <h4>{day.day}</h4>
        <div className={s.dayRows}>{day.rows.map(({ key: rowKey, item, start, end }) => {
          const year = itemStudyYear(item);
          const metadata = item.offer.annual;
          const selected = state.offer === item.offer.id;
          const map = item.venue.longitude != null && item.venue.latitude != null
            ? `https://yandex.ru/maps/?pt=${item.venue.longitude},${item.venue.latitude}&z=17&l=map` : null;
          return <article key={rowKey} className={s.slot} data-annual-group={item.offer.id}
            data-selected={selected || undefined}>
            <div className={s.slotSummary}>
              <span className={s.time}>{start ?? "Уточняется"}{end && <small>до {end}</small>}</span>
              <span className={s.slotName}><strong>{item.quest.slug === "shmi" && year ? `ШМИ-${year} · ${year}-й год` : item.quest.title}</strong>
                <span>{finderAgeLabel(item)}{item.quest.slug === "shmi" && !year ? " · Уровень уточняется" : ""}</span>
                <span>{item.venue.address}</span>
              </span>
              <span className={s.slotStatus}>{item.status.label}</span>
            </div>
            <div className={s.compactActions}>{item.variants.map(variant => <div key={variant.id} className={s.tariff} data-booking-variant={variant.id}>
              <span><strong>{variant.priceLabel}</strong>{item.variants.length > 1 && <small>{variant.type}</small>}</span>
              <OfferBookingAction quest={item.quest} offer={item.offer} venue={item.venue}
                schoolSlug={itemSchool(item)} variant={variant} mode={variant.bookingMode} showIncludedNote={false} />
            </div>)}</div>
            <details open={selected || undefined}>
              <summary>Подробнее <span className="sr-only">о группе {metadata?.groupCode ?? metadata?.listingId}, {day.day}, {start}</span></summary>
            <div className={s.slotBody}>
              <p><strong>Группа {metadata?.groupCode ?? metadata?.listingId ?? item.offer.id}</strong></p>
              <p>Все занятия этой группы: {item.offer.weeklySlots?.length ? item.offer.weeklySlots.map(slot => `${slot.weekday}, ${slot.start}–${slot.end}`).join("; ") : "дни и время уточняются"}.</p>
              {(item.offer.weeklySlots?.length ?? 0) > 1 && <p>Это одна группа с занятиями в несколько дней, не разные варианты на выбор.</p>}
              <p>Преподаватель: {metadata?.teacher ?? "уточняется"}</p>
              {metadata?.teacher && metadata.teacher === reviewedTeacher(itemSchool(item), year) ? <p className={s.muted}>Преподаватель подтверждён командой BrainMaster. Служебные поля mos.ru могут отличаться.</p> : metadata?.teacherSourceConflict && <p className={s.muted}>В описании и служебных полях mos.ru указаны разные сотрудники. Преподаватель приведён по описанию группы; уточните его у школы.</p>}
              <p>Места на дату среза: {metadata?.freeSeats ?? "не указаны"}{metadata?.totalSeats != null ? ` из ${metadata.totalSeats}` : ""}. Актуальное наличие проверьте на mos.ru.</p>
              {metadata?.asOf && <p className={s.muted}>Источник: mos.ru, {metadata.refreshedAt ? `карточка проверена ${new Date(metadata.refreshedAt).toLocaleString("ru-RU", {timeZone:"Europe/Moscow"})} (МСК)` : `срез от ${metadata.asOf}`}. {metadata.linkKind === "search" ? "Ссылка ведёт в поиск mos.ru — сверяйте код группы и адрес." : "Перед записью сверяйте карточку и адрес."}</p>}
              {metadata?.refreshError && <p role="note">Последняя проверка этой карточки не удалась. Показаны последние подтверждённые сведения.</p>}
              <div className={s.actions}>
                <Link href={item.questHref}>О курсе и этой группе</Link>
                {map && <a href={map} target="_blank" rel="noopener noreferrer">Адрес на карте ↗</a>}
                <button type="button" onClick={() => onShare(item)}>Поделиться группой</button>
              </div>
            </div>
            </details>
          </article>;
        })}</div>
      </section>)}
    </section>)}
  </div>;
}
