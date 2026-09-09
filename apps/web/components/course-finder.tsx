"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CourseFinderResults } from "@/components/course-finder-results";
import { getSchoolScopes, resolveSchoolScope } from "@/lib/offers/agenda";
import { buildScheduleBoardItem, type ScheduleBoardItem } from "@/lib/offers/schedule-board";
import type { AgendaOfferItem } from "@/lib/offers/agenda";
import { changeFinderState, finderChoices, finderChoiceCount, finderItemMatches, finderQuery, itemSchool, readFinderState, type FinderState } from "@/lib/offers/course-finder";
import { weekdays } from "@/lib/offers/annual-schedule";
import type { Quest, Venue } from "@/lib/schemas";
import s from "./course-finder.module.css";

type Props = {
  items: AgendaOfferItem[]; quests: Quest[]; venues: Venue[];
  schoolSlug?: string; venueSlug?: string;
  embedded?: boolean;
  status: "idle" | "loading" | "error" | "ready";
  isValidating: boolean; snapshotGeneratedAt: string | null; onRefresh: () => void;
};
const programmeCopy: Record<string, string> = {
  shmi: "Знакомство с технологиями, электроникой и инженерией. Три года обучения.",
  "it-academy": "Инженерная подготовка и работа с IT-технологиями.",
  "olympiad-league": "Олимпиадные задачи и подготовка к соревнованиям.",
  projects: "Собственная идея, работа над проектом и его защита.",
};

export function CourseFinder({ items: agendaItems, quests, venues, schoolSlug, venueSlug, embedded = false, status, isValidating, snapshotGeneratedAt, onRefresh }: Props) {
  const query = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const schools = useMemo(() => getSchoolScopes(venues), [venues]);
  const rawState = readFinderState(query, schoolSlug, venueSlug, embedded);
  const state = { ...rawState, school: resolveSchoolScope(venues, rawState.school)?.slug ?? rawState.school };
  const school = schools.find(candidate => candidate.slug === state.school);
  const campuses = school?.venues ?? (state.school === "all" ? venues : []);
  const programmes = quests.filter(quest => quest.format === "year");
  const items = useMemo(() => agendaItems.filter(item => item.quest.format === "year")
    .map(item => buildScheduleBoardItem(item, item.venue.schoolScopeSlug ?? item.venue.slug)), [agendaItems]);
  const availableSchools = schools.filter(entry => finderChoiceCount(items, state, "school", entry.slug) > 0);
  const availableCampuses = campuses.filter(venue => finderChoiceCount(items, state, "venue", venue.slug) > 0);
  const availableProgrammes = programmes.filter(quest => finderChoiceCount(items, state, "programme", quest.slug) > 0);
  const levels = finderChoices(items, state, "level", ["1", "2", "3"]);
  const ages = finderChoices(items, state, "age", Array.from({ length: 16 }, (_, i) => String(i + 3)));
  const days = finderChoices(items, state, "day", weekdays.map((_, i) => String(i + 1)));
  const unavailable = (value: string, available: string[], label: string) => value !== "all" && !available.includes(value)
    ? <option value={value} disabled>{label} — {status === "loading" ? "проверяем" : "нет подходящих групп"}</option> : null;
  const Heading = embedded ? "h2" : "h1";
  const matches = items.filter(item => finderItemMatches(item, state));
  const invalid = (state.school !== "all" && !school) || (state.venue !== "all" && !campuses.some(venue => venue.slug === state.venue)) ||
    (state.programme !== "all" && !programmes.some(quest => quest.slug === state.programme));
  const results = invalid ? [] : matches;
  const selectedMissing = !!state.offer && status !== "loading" && !(status === "error" && !items.length) && !results.some(item => item.offer.id === state.offer);
  const isResults = state.step === "results" || state.view === "catalogue";
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const previousScreen = useRef(`${state.view}:${state.step}`);
  const shareInput = useRef<HTMLInputElement>(null);
  const revealedOffer = useRef("");
  useEffect(() => {
    const screen = `${state.view}:${state.step}`;
    if (previousScreen.current !== screen) heading.current?.focus();
    previousScreen.current = screen;
  }, [state.view, state.step]);
  useEffect(() => {
    try {
      const target = sessionStorage.getItem("brainmaster:finder-focus");
      if (target !== `${pathname}?${query}`) return;
      sessionStorage.removeItem("brainmaster:finder-focus");
      heading.current?.focus();
    } catch { /* Storage may be unavailable; native navigation remains usable. */ }
  }, [pathname, query]);
  useEffect(() => {
    if (!state.offer) { revealedOffer.current = ""; return; }
    if (revealedOffer.current === state.offer) return;
    const selected = document.querySelector<HTMLElement>("[data-selected='true'] summary");
    if (!selected) return;
    revealedOffer.current = state.offer;
    selected?.scrollIntoView({ block: "center", behavior: "instant" });
    selected?.focus({ preventScroll: true });
  }, [state.offer, items]);
  useEffect(() => { if (shareUrl) { shareInput.current?.focus(); shareInput.current?.select(); } }, [shareUrl]);

  function update(patch: Partial<FinderState>) {
    const next = changeFinderState(state, patch);
    setShareUrl(""); setShareMessage("");
    // Exact-campus routes remain authoritative. Switching address leaves that route explicitly.
    const nextPath = (schoolSlug && next.school !== schoolSlug) ? "/agenda/" :
      venueSlug && next.venue !== venueSlug ? `/sites/${schoolSlug}/agenda/` : pathname;
    const nextRouteSchool = nextPath === "/agenda/" ? undefined : schoolSlug;
    const compact = finderQuery(next, nextRouteSchool, nextPath === pathname ? venueSlug : undefined, embedded && nextPath === pathname);
    const href = `${nextPath}${compact ? `?${compact}` : ""}`;
    if (nextPath !== pathname) {
      try { sessionStorage.setItem("brainmaster:finder-focus", `${nextPath}?${compact}`); } catch { /* Optional focus handoff only. */ }
      router.push(href, { scroll: false });
    }
    else window.history.pushState(null, "", href);
  }
  function reset() {
    update({ school: schoolSlug ?? "all", venue: venueSlug ?? "all", programme: "all", level: "all", age: "all", day: "all", offer: "" });
  }
  async function share(item?: ScheduleBoardItem) {
    const selection = item ? { ...state, school: itemSchool(item), venue: item.venue.slug, programme: item.quest.slug, offer: item.offer.id, step: "results" as const } : state;
    const url = `${window.location.origin}/sites/${selection.school === "all" ? "" : `${selection.school}/agenda/`}`;
    const compact = finderQuery(selection, selection.school === "all" ? undefined : selection.school);
    const href = `${selection.school === "all" ? `${window.location.origin}/agenda/` : url}${compact ? `?${compact}` : ""}`;
    setShareUrl(href);
    try { await navigator.clipboard.writeText(href); setShareMessage("Ссылка скопирована. В ней сохранены адрес, программа и фильтры."); }
    catch { setShareMessage("Скопируйте выделенную ссылку. В ней сохранены ваши условия."); }
  }
  const campusName = campuses.find(venue => venue.slug === state.venue)?.address ?? (state.venue === "all" ? "Все корпуса" : "Адрес не найден");
  const programmeName = programmes.find(quest => quest.slug === state.programme)?.title ?? (state.programme === "all" ? "Все программы" : "Программа не найдена");
  const total = new Set(results.map(item => item.offer.id)).size;
  const sourceNotice = <div className={s.source} role="status">{status === "error" ? items.length ? "Не удалось обновить расписание. Показываем сохранённые данные; они могут быть устаревшими." : "Источник расписания недоступен. Мы пока не можем проверить наличие групп." : status === "loading" ? "Загружаем расписание…" : isValidating ? "Обновляем расписание…" : "Расписание — по загруженному срезу. Места и приём уточняйте на mos.ru."}
    <button type="button" onClick={onRefresh} disabled={isValidating}>{status === "error" ? "Повторить загрузку" : "Обновить расписание"}</button>
  </div>;
  const filters = <div className={s.fields}>
    <label>Площадка<select aria-label="Площадка" value={state.school} onChange={e => update({ school: e.target.value })}>
      <option value="all">Все площадки</option>{availableSchools.map(entry => <option key={entry.slug} value={entry.slug}>{entry.name}</option>)}
      {unavailable(state.school, availableSchools.map(v=>v.slug), school?.name ?? "Площадка не найдена")}
    </select></label>
    <label>Корпус / адрес<select aria-label="Корпус / адрес" value={state.venue} onChange={e => update({ venue: e.target.value })}>
      <option value="all">Все корпуса</option>{availableCampuses.map(venue => <option key={venue.slug} value={venue.slug}>{venue.address}</option>)}
      {unavailable(state.venue, availableCampuses.map(v=>v.slug), campusName)}
    </select></label>
    <label>Программа<select aria-label="Программа" value={state.programme} onChange={e => update({ programme: e.target.value })}>
      <option value="all">Все программы</option>{availableProgrammes.map(quest => <option key={quest.slug} value={quest.slug}>{quest.title}</option>)}
      {unavailable(state.programme, availableProgrammes.map(v=>v.slug), programmeName)}
    </select></label>
    {state.programme === "shmi" && <label>Год обучения<select aria-label="Год обучения" value={state.level} onChange={e => update({ level: e.target.value })}>
      <option value="all">Все, включая неуказанный</option>{levels.map(year => <option key={year} value={year}>ШМИ · {year}-й год</option>)}
      {unavailable(state.level, levels, `ШМИ-${state.level}`)}
    </select></label>}
    <label>Возраст ребёнка<select aria-label="Возраст ребёнка" value={state.age} onChange={e => update({ age: e.target.value })}>
      <option value="all">Любой возраст</option>{ages.map(age => <option key={age} value={age}>{age} лет</option>)}
      {unavailable(state.age, ages, `${state.age} лет`)}
    </select></label>
    <label>День занятий<select aria-label="День занятий" value={state.day} onChange={e => update({ day: e.target.value })}>
      <option value="all">Все дни</option>{days.map(day => <option key={day} value={day}>{weekdays[Number(day)-1]}</option>)}
      {unavailable(state.day, days, weekdays[Number(state.day)-1])}
    </select></label>
    <button type="button" className={s.textButton} onClick={reset}>Сбросить условия</button>
  </div>;

  return <section className={s.finder} data-view={state.view} data-screen={isResults ? "results" : "question"} data-testid="course-finder">
    <div className={s.topbar}><span className={s.wordmark}>brainmaster<span aria-hidden> / </span><small>годовые курсы</small></span>
      <button type="button" onClick={() => update({ view: state.view === "wizard" ? "catalogue" : "wizard", step: state.view === "wizard" || state.completed === "yes" ? "results" : state.school === "all" ? "school" : "campus" })}>
        {state.view === "wizard" ? "Полное расписание ↗" : "Подобрать кружок →"}</button></div>
    <div className={s.inner}>
      <header className={s.intro}>
        <p className={s.eyebrow}>{state.view === "wizard" ? `ПОДБЕРЁМ КРУЖОК · ${school?.name ?? "BRAINMASTER"}` : "ВЫБИРАЙТЕ И СРАВНИВАЙТЕ"}</p>
        <Heading ref={heading} tabIndex={-1}>{isResults ? state.view === "catalogue" ? "Расписание занятий" : "Выберите удобное время" : state.step === "school" ? "Где будем заниматься?" : state.step === "campus" ? "В каком корпусе удобнее?" : "Что интересно ребёнку?"}</Heading>
        <p>{isResults ? "Выбирайте группу по дням и времени. Адрес всегда рядом — соседний корпус может оказаться удобнее." : state.step === "school" ? "Сначала выберем площадку. Дальше — интересы ребёнка и удобное время." : state.step === "campus" ? "Можно смотреть все адреса школы сразу и выбрать подходящий по расписанию." : "Начните с программы или возраста. Дни и время посмотрим на следующем шаге."}</p>
      </header>
      {state.view === "wizard" && <ol className={s.steps} aria-label="Шаги подбора">
        {[{ label: "Где", step: state.school === "all" ? "school" : "campus" }, { label: "Что интересно", step: "interest" }, { label: "Когда", step: "results" }].map((entry, i) => <li key={entry.label} aria-current={(i === 0 && ["school", "campus"].includes(state.step)) || entry.step === state.step ? "step" : undefined}>
          <button type="button" onClick={() => update({ step: entry.step as FinderState["step"] })}><span>{i + 1}</span>{entry.label}</button>
        </li>)}
      </ol>}
      {(status === "error" || status === "loading") && sourceNotice}
      {shareUrl && <div className={s.shareBox}><label>Ссылка на выбранное расписание<input ref={shareInput} readOnly value={shareUrl} onFocus={event => event.currentTarget.select()} /></label><p role="status">{shareMessage}</p><button type="button" onClick={() => { setShareUrl(""); heading.current?.focus(); }}>Закрыть ссылку</button></div>}
      {!isResults ? <div className={s.question}>
        {!results.length && status !== "loading" && <p role="status">{status === "error" && !items.length ? "После загрузки расписания появятся доступные варианты." : "По сохранённым условиям нет групп."} Выбрано: {school?.name ?? state.school} · {campusName} · {programmeName}{state.level !== "all" ? ` · ШМИ-${state.level}` : ""}{state.age !== "all" ? ` · ${state.age} лет` : ""}{state.day !== "all" ? ` · ${weekdays[Number(state.day) - 1]}` : ""}. <button type="button" onClick={reset}>Сбросить условия</button></p>}
        {state.step === "interest" && <p className={s.footnote}>Выбрано: {school?.name ?? "Все площадки"} · {campusName}. {state.programme !== "all" ? `${programmeName}. ` : ""}{state.age !== "all" ? `Возраст: ${state.age} лет.` : ""}</p>}
        {state.step === "school" && <>
          <div className={s.choices}>{availableSchools.map(entry => <button type="button" key={entry.slug} aria-pressed={state.school === entry.slug} onClick={() => update({ school: entry.slug, step: "campus" })}>
            <strong>{entry.name}</strong><span>Подходящих групп: {finderChoiceCount(items, state, "school", entry.slug)}</span><b aria-hidden>→</b>
          </button>)}</div>
          <button className={s.textButton} type="button" onClick={() => update({ school: "all", step: "interest" })}>Показать программы на всех площадках</button>
        </>}
        {state.step === "campus" && <>
          {!school ? <p>Площадка не найдена. <button type="button" onClick={() => update({ school: "all", step: "school" })}>Выбрать площадку</button></p> : <>
            <div className={s.choices}>
              <button type="button" aria-pressed={state.venue === "all"} onClick={() => update({ venue: "all" })}><strong>Все корпуса · {school.name}</strong><span>Сравнить время на всех адресах школы</span><b aria-hidden>{state.venue === "all" ? "✓" : "+"}</b></button>
              {availableCampuses.map(venue => <button type="button" key={venue.slug} aria-pressed={state.venue === venue.slug} onClick={() => update({ venue: venue.slug })}>
                <strong>{venue.address}</strong><span>Групп по текущим условиям: {finderChoiceCount(items, state, "venue", venue.slug)}</span><b aria-hidden>{state.venue === venue.slug ? "✓" : "+"}</b>
              </button>)}
            </div>
            <div className={s.footer}><button type="button" onClick={() => update({ step: "school" })}>Другая площадка</button><button type="button" className={s.primary} onClick={() => update({ step: "interest" })}>Дальше →</button></div>
          </>}
        </>}
        {state.step === "interest" && <>
          <div className={s.segment} role="group" aria-label="Способ подбора"><button type="button" aria-pressed={state.method === "programme"} onClick={() => update({ method: "programme", age: "all" })}>По программе</button><button type="button" aria-pressed={state.method === "age"} onClick={() => update({ method: "age", programme: "all", level: "all" })}>По возрасту</button></div>
          {state.method === "programme" ? <>
            <div className={s.choices}>{availableProgrammes.map(quest => <button type="button" key={quest.slug} aria-pressed={state.programme === quest.slug} onClick={() => update({ programme: quest.slug })}>
              <strong>{quest.title}</strong><span>{programmeCopy[quest.slug] ?? quest.catalogTagline}</span><b aria-hidden>{state.programme === quest.slug ? "✓" : "+"}</b>
            </button>)}</div>
            {state.programme === "shmi" && <fieldset className={s.levels}><legend>Год обучения · необязательно</legend>{["all", ...levels].map(level => <button type="button" key={level} aria-pressed={state.level === level} onClick={() => update({ level })}>{level === "all" ? "Пока не знаю" : `ШМИ-${level}`}</button>)}<p>Это год программы, не класс школы и не возраст ребёнка.</p></fieldset>}
          </> : <div className={s.ageChoice}><label>Сколько лет ребёнку?<select value={state.age} onChange={e => update({ age: e.target.value })}><option value="all">Не ограничивать по возрасту</option>{ages.map(age => <option key={age} value={age}>{age} лет</option>)}{unavailable(state.age, ages, `${state.age} лет`)}</select></label><p>Покажем группы с подходящими границами возраста и отдельно отметим те, где возраст не указан.</p></div>}
          <div className={s.footer}><button type="button" onClick={() => update({ step: school ? "campus" : "school" })}>← Назад</button><button type="button" className={s.primary} onClick={() => update({ step: "results" })}>Посмотреть время →</button></div>
          <button type="button" className={s.textButton} onClick={() => update({ programme: "all", level: "all", age: "all", step: "results" })}>Пока не знаю — показать все программы</button>
        </>}
      </div> : <>
        <div className={s.conditions}><button type="button" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen} aria-controls="finder-filters">{school?.name ?? "Все площадки"} · {campusName} · {programmeName}{state.level !== "all" ? ` · ${state.level}-й год` : ""}{state.age !== "all" ? ` · ${state.age} лет` : ""}{state.day !== "all" ? ` · ${weekdays[Number(state.day) - 1]}` : ""}<strong>Изменить условия ↓</strong></button></div>
        <div className={s.workspace}>
          <aside id="finder-filters" className={s.filterPanel} data-open={filtersOpen} onFocusCapture={() => setFiltersOpen(true)}><h2>Ваши условия</h2>{filters}</aside>
          <div className={s.schedule}>
            <div className={s.resultsBar}><h2 aria-live="polite" aria-atomic="true">Найдено групп: <span data-testid="finder-count">{total}</span></h2><button type="button" onClick={() => void share()}>Поделиться</button></div>
            <div className={s.segment} role="group" aria-label="Группировка расписания"><button type="button" aria-pressed={state.grouping === "venues"} onClick={() => update({ grouping: "venues" })}>По площадкам</button><button type="button" aria-pressed={state.grouping === "programmes"} onClick={() => update({ grouping: "programmes" })}>По программам</button></div>
            {school && availableCampuses.length > 1 && <div className={s.campusSwitch} role="group" aria-label="Быстрое переключение корпуса"><button type="button" aria-pressed={state.venue === "all"} onClick={() => update({ venue: "all" })}>Все корпуса</button>{availableCampuses.map(venue => <button type="button" key={venue.slug} aria-pressed={state.venue === venue.slug} onClick={() => update({ venue: venue.slug })}>{venue.address}</button>)}</div>}
            {invalid || selectedMissing ? <div className={s.empty} role="alert"><h3>{selectedMissing ? "Группа из ссылки не найдена" : "Условия из ссылки не найдены"}</h3><p>Ссылка могла устареть или указывать на другой корпус. Мы не подменяем выбранную группу похожей.</p><button type="button" onClick={reset}>Показать расписание площадки</button></div> : null}
            {!invalid && !selectedMissing && total > 0 && <CourseFinderResults items={results} state={state} onShare={item => void share(item)} />}
            {!invalid && !selectedMissing && total === 0 && <div className={s.empty}><h3>{status === "loading" ? "Проверяем расписание" : status === "error" && !items.length ? "Не удалось получить расписание" : "По этим условиям пока нет групп"}</h3><p>{status === "loading" || (status === "error" && !items.length) ? "Наличие групп станет известно после загрузки." : "Это не означает, что программа не проводится. Попробуйте соседний корпус или снимите часть условий."}</p>{status !== "loading" && <button type="button" onClick={reset}>Сбросить условия</button>}</div>}
            <p className={s.footnote}>Группа с несколькими днями показана в каждом из них, но посчитана один раз. Неуказанный год обучения не определяется по возрасту. {snapshotGeneratedAt ? `Снимок сайта: ${snapshotGeneratedAt}.` : ""}</p>
          </div>
        </div>
      </>}
      {status !== "error" && status !== "loading" && sourceNotice}
    </div>
  </section>;
}
