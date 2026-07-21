# Спецификации экранов

## Общий контракт

Каждый экран определяет purpose, primary user, entry points, primary/secondary actions, data requirements, loading/empty/error/permission/conflict states, keyboard behavior, responsive behavior, analytics/audit и acceptance criteria.

# S01. Login

## Purpose

Безопасно установить индивидуальную сессию.

## Layout

- logo/product name;
- environment label;
- login method;
- security note;
- support link;
- version/status footer.

## States

idle, authenticating, MFA challenge, expired link, disabled account, service unavailable.

## Acceptance

- нет token input;
- секреты не хранятся в local/session storage;
- redirect возвращает только safe internal route;
- open redirect невозможен;
- ошибки не раскрывают существование аккаунта.

# S02. Dashboard

Отвечает на вопросы:

1. Что требует внимания?
2. Что не опубликовано?
3. Какие смены скоро начинаются?
4. Работают ли публикации?

Блоки:

- attention: blockers, failed jobs, missing links, overcapacity, media failures;
- unpublished changes by entity;
- upcoming shifts 7/14/30 days;
- recent releases.

Empty state: `Пока нет задач, требующих внимания.`

# S03. Worlds list

Колонки: name, courses count, status, updated, unpublished changes, actions.

Actions: new, open, duplicate where allowed, archive.

Filters: status, updated by, validation issues.

# S04. World editor

Секции:

1. Основное.
2. Карточка.
3. Hero.
4. Highlights.
5. Theme.
6. Связанные курсы.
7. Preview.
8. History.

Правила:

- theme выбирается визуально;
- CSS gradient скрыт;
- highlights — reorderable list;
- slug после публикации меняется отдельным flow;
- sticky bar показывает save state, Save Draft и Preview.

# S05. Courses list

Колонки: title, world, age, format, active shifts, status, validation, updated.

Quick filters: unpublished, missing media, no active shifts, archived, blockers.

# S06. Course editor

## Header

Title, World, status, revision, primary actions.

## Section navigation

Основное, Каталог, Страница курса, Навыки, Результат, Медиа, SEO, Связи, История.

## Side panel

Completion, blockers, preview variants, related shifts.

## Field rules

- title и world обязательны;
- age структурирован;
- skills — chips/list;
- long text — limited rich blocks;
- raw delimiters запрещены;
- price hint маркирован как неавторитетный, если сохранён.

# S07. Venues list

Venue row может раскрывать campuses.

Колонки: organization, campuses, city, active shifts, listed, status, issues.

Map — secondary view, table — operational canonical view.

# S08. Venue/Campus editor

Venue fields: full name, display name, type, visibility, scope slug/aliases.

Campus fields: address, map, metro, district, access instructions, entrance note, contact note, media.

Inheritance panel объясняет источник значений.

# S09. Schedule list

Default — table.

Колонки: dates, course, venue/campus, formats, price range, enrolled/capacity, status, registration, issues.

Secondary views: calendar, by venue, by course.

Bulk actions: status, teacher, archive, copy, waitlist, export. Bulk price/time требует explicit field selection и diff.

# S10. Shift editor

Header identity:

```text
Minecraft: Пробуждение Стражей
Школа №17 · 15–19 июня 2026
```

Секции:

1. Course and venue.
2. Dates/status.
3. Teacher/capacity.
4. Overrides.
5. Offer formats.
6. Registration.
7. Media.
8. Preview.
9. History.

Offer formats table: type, time, price, age, capacity, enrolled, channel, link/code, waitlist.

Validation summary links to fields.

# S11. Media library

Views: grid, list, usage.

Filters: type, owner, processing status, missing alt, unused, author, date.

Asset detail: preview, metadata, variants, usages, revisions, replace, archive.

Upload tray persists while processing.

# S12. Publication Center

Sections:

- Scope: changes, hot/cold impact, affected pages.
- Validation: blockers, warnings, info.
- Preview: compile, URLs, viewport, before/after.
- Publish: comment, kind, expected phases, confirmation.

Primary action: `Опубликовать релиз`. Disabled reason visible.

# S13. Publication job

Timeline:

```text
В очереди
Проверка
Сборка
Загрузка
Активация
Проверка сайта
```

Failure показывает primary cause, phase, artifact, correlation ID и safe action. Stack trace скрыт.

# S14. Release detail

Header: release ID, state, author, time, current/not current.

Tabs: summary, changes, pages, artifacts, verification, audit.

Actions: affected pages, compare, rollback, download report.

# S15. Audit log

Filters: actor, action, entity, date, result, release.

Entry: human summary, before/after, technical context, request ID, reason. Sensitive values redacted.

# S16. Users and roles

User fields: name, identity, status, roles, scope, MFA, last active.

Actions: invite, suspend, revoke sessions, change role, set scope. Всё audited.

# S17. Import wizard

Steps:

1. Source.
2. Read.
3. Mapping.
4. Dry-run.
5. Conflict resolution.
6. Confirm.
7. Results.

No write before confirm, no auto publish, downloadable report, batch ID, idempotent retry.

# S18. System health

Показывает API, DB, object storage, compiler, publication queue, public verification и external integrations.

Statuses: healthy, degraded, unavailable, unknown.

# S19. 403

Показывает section/object, missing capability на пользовательском языке, safe navigation и request-access path. Не раскрывает hidden data.

# S20. 404

Различает never existed/inaccessible, archived, deleted и invalid route. Для archived при permission предлагает открыть запись.
