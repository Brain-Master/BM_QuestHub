# Атомарный roadmap BM QuestHub CMS

## 1. Правила использования

- Выполнять только один Task ID за раз.
- Перед задачей создавать полный Task Packet.
- Строка roadmap не заменяет Task Packet.
- Если задача требует более 5–7 materially related source files или двух новых границ, split.
- Milestone gate блокирует следующий milestone.
- Любой `ADR` task read-only и не включает implementation.
- Любой `review` task не исправляет findings.
- Tasks с неизвестным provider/version не начинаются до ADR.
- `M10` production cutover требует явного разрешения владельца.

## 2. Milestone map

| Milestone | Результат | Количество задач |
|---|---|---:|
| M0 | Governance и воспроизводимый baseline | 12 |
| M1 | Заморозка контрактов и стабилизация текущей admin API границы | 12 |
| M2 | Read-only UX foundation | 14 |
| M3 | Безопасный Admin BFF, identity и RBAC | 14 |
| M4 | PostgreSQL foundation и контролируемый импорт | 16 |
| M5 | Worlds и Courses: полноценное редактирование | 15 |
| M6 | Venues и Campuses | 12 |
| M7 | Расписание и OfferFormats | 20 |
| M8 | Media library | 15 |
| M9 | Preview, compilation и immutable releases | 18 |
| M10 | Cutover from Google Sheets | 14 |
| M11 | Hardening, пилот и эксплуатация | 12 |

**Всего атомарных задач:** 174.

## 3. Dependency spine

```text
M0 → M1 → M2 → M3 → M4
                M4 → M5/M6/M7/M8
M5+M6+M7+M8 → M9 → M10 → M11
```

# M0. Governance и воспроизводимый baseline

| ID | Атомарный результат | Зависимости | Acceptance | Класс проверки |
|---|---|---|---|---|
| **M0-01** Зафиксировать read-only inventory | Получить branch, HEAD, worktree, package manifests, workflows и текущие admin/web commands; создать отчёт без edits. | — | Точный inventory с path:line и baseline results; никаких изменений. | `audit` |
| **M0-02** Разместить пакет документации | Скопировать пакет в `docs/admin-cms/` без изменения содержания. | M0-01 | Все документы доступны по стабильным путям; root diff содержит только docs. | `docs` |
| **M0-03** Принять root AGENTS.md | Создать root `AGENTS.md` из `20_AGENTS.md`, адаптировать только подтверждённые constants. | M0-02 | Нет placeholders; policy ссылается на реальные paths; review APPROVE. | `policy` |
| **M0-04** Принять PLANS.md | Создать root или docs-level `PLANS.md`, определить ExecPlan directory. | M0-03 | Шаблон и lifecycle documented; один sample empty plan не создаётся. | `policy` |
| **M0-05** Создать docs index | Добавить короткий index и reading rules для humans/agents. | M0-02 | Все cross-links валидны; нет дубликатов authority. | `docs` |
| **M0-06** Определить protected artifacts | Создать machine-readable или documented list generated/protected paths. | M0-03 | Snapshots, workflows, secrets и migrations покрыты; task override policy ясна. | `policy` |
| **M0-07** Зафиксировать baseline commands | Определить stable `check-fast/check/check-full` design без реализации чужих tools. | M0-01 | Команды и ownership описаны; missing commands оформлены отдельными tasks. | `planning` |
| **M0-08** Добавить admin typecheck script | Добавить воспроизводимый TypeScript check без behavior changes. | M0-07 | `npm --prefix apps/admin run typecheck` существует и падает на type error. | `tooling` |
| **M0-09** Добавить admin lint baseline | Настроить lint с минимальным scope без массового форматирования. | M0-08 | Lint запускается; baseline findings не скрыты; no unrelated fixes. | `tooling` |
| **M0-10** Добавить admin test runner | Выбрать и подключить test runner отдельным Task Packet. | M0-08 | Один smoke test реально запускается; zero-test false pass исключён. | `tooling` |
| **M0-11** Определить secret scan gate | Выбрать stable secret scan command и documented exclusions. | M0-03 | Команда работает локально/CI и не печатает секреты. | `security` |
| **M0-12** Создать ADR backlog | Создать placeholders только для решений, перечисленных в architecture doc. | M0-02 | ADR list содержит question/status/owner, но не выдуманные decisions. | `planning` |

## Exit gate

Политика принята, baseline команды известны, agent tooling реально запускается, unresolved constants оформлены blockers.

# M1. Заморозка контрактов и стабилизация текущей admin API границы

| ID | Атомарный результат | Зависимости | Acceptance | Класс проверки |
|---|---|---|---|---|
| **M1-01** Исправить GET body в admin client | GET `/snapshots` отправляется без body; mutation shape не меняется. | M0-10 | Focused tests подтверждают GET/PUT/POST request contracts; build PASS. | `api-client` |
| **M1-02** Добавить timeout/abort в client | Каждый request имеет bounded timeout и различает timeout/cancel. | M1-01 | Tests cover timeout and manual abort; no unbounded fetch. | `api-client` |
| **M1-03** Ввести error envelope mapping | Нормализовать 401/403/409/422/5xx в typed client errors. | M1-01 | UI boundary получает stable codes; raw payload не показывается. | `api-client` |
| **M1-04** Валидировать snapshot bundle на boundary | Добавить runtime schemas для read-only текущих snapshots. | M1-01 | Invalid fixture rejected with bounded diagnostic. | `domain-adapter` |
| **M1-05** Создать snapshot fixtures | Зафиксировать минимальные valid/invalid fixtures без production data dump. | M1-04 | Fixtures не содержат PII/secrets; tests deterministic. | `tests` |
| **M1-06** Создать read model selectors | Pure selectors для counts, statuses и entity summaries. | M1-04 | Selectors tested; UI не парсит raw object inline. | `domain-adapter` |
| **M1-07** Изолировать legacy token adapter | Спрятать sessionStorage token за temporary interface; не расширять использование. | M1-01 | Token access в одном module; marked deprecated; no log. | `security` |
| **M1-08** Добавить auth-failure state contract | 401 очищает runtime auth state, но сохраняет non-secret edit buffer. | M1-03 | Tests cover re-auth transition; no reload loop. | `state` |
| **M1-09** Зафиксировать current snapshot contract tests | Проверить required top-level fields и version compatibility. | M1-04 | Contract changes fail tests intentionally. | `contract` |
| **M1-10** Добавить no-raw-stack UI error formatter | Преобразовать client errors в безопасный русский copy. | M1-03 | Known/unknown errors mapped; correlation ID supported. | `ux` |
| **M1-11** Добавить API client observability hooks | Request ID/operation/duration без body/token logging. | M1-02 | Tests prove redaction and stable fields. | `observability` |
| **M1-12** Собрать baseline report | Документировать найденные contract risks и решение, что raw save остаётся legacy-only. | M1-01..11 | Report links evidence; no new behavior. | `docs` |

## Exit gate

Legacy admin API client детерминированно протестирован; GET bug устранён; raw snapshots валидируются на boundary.

# M2. Read-only UX foundation

| ID | Атомарный результат | Зависимости | Acceptance | Класс проверки |
|---|---|---|---|---|
| **M2-01** Создать app shell structure | Выделить shell/layout/navigation regions без изменения data API. | M1-06 | Shell renders loading/error/authorized states. | `ui-shell` |
| **M2-02** Добавить route skeleton | Создать routes/pages для dashboard, worlds, courses, venues, schedule, publishing. | M2-01 | Каждый route deep-linkable; placeholder states accessible. | `routing` |
| **M2-03** Добавить environment badge | Постоянно показывать environment label из safe public config. | M2-01 | Production/test visually and textually distinct. | `ui-shell` |
| **M2-04** Добавить global navigation | Permission-ready nav model без client authorization claim. | M2-02 | Active state, keyboard, collapse, mobile drawer tested. | `navigation` |
| **M2-05** Добавить global search shell | UI и state contract без backend search implementation. | M2-01 | Shortcut `/`, focus, empty/disabled state. | `search` |
| **M2-06** Создать read-only dashboard adapter | Преобразовать current snapshots в dashboard read model. | M1-06 | Pure adapter tests; no raw JSON in component. | `dashboard` |
| **M2-07** Реализовать dashboard attention cards | Показать loading, empty, error и draft/health placeholders. | M2-06 | UX scenarios A/M pass; responsive screenshots. | `dashboard` |
| **M2-08** Реализовать Worlds list read-only | Table/card list с status и course count. | M2-02,M1-06 | Search/filter state in URL; keyboard/a11y tests. | `worlds` |
| **M2-09** Реализовать Courses list read-only | World/status/issues filters и object links. | M2-02,M1-06 | Long Russian content and empty states covered. | `courses` |
| **M2-10** Реализовать Venues list read-only | Venue/campus grouping и address context. | M2-02,M1-06 | Multi-campus case covered. | `venues` |
| **M2-11** Реализовать Schedule list read-only | Dates/course/venue/status filters over current offer snapshot. | M2-02,M1-06 | URL filters, capacity display, mobile cards. | `schedule` |
| **M2-12** Создать object summary page pattern | Reusable repository template для header/status/tabs/history placeholder. | M2-08..11 | Used by two real object pages before extraction. | `ui-pattern` |
| **M2-13** Спрятать raw JSON editor из default navigation | Legacy editor остаётся behind explicit technical flag/route. | M2-08..12 | Обычный editor не видит textarea; no functionality deletion. | `legacy` |
| **M2-14** Провести read-only usability gate | Пройти scripted tasks поиска курса/смены и ориентации. | M2-07..13 | Findings documented; blockers split into tasks. | `ux-research` |

## Exit gate

Пользователь может безопасно ориентироваться и находить сущности read-only без raw JSON.

# M3. Безопасный Admin BFF, identity и RBAC

| ID | Атомарный результат | Зависимости | Acceptance | Класс проверки |
|---|---|---|---|---|
| **M3-01** Принять ADR auth/BFF | Выбрать BFF boundary и session mechanism без implementation. | M0-12,M2-14 | ADR approved with threat model and alternatives. | `adr` |
| **M3-02** Создать admin API error contract | OpenAPI/error codes для auth/profile/read endpoints. | M3-01 | Contract validates; examples redacted. | `api-contract` |
| **M3-03** Реализовать session storage server-side | Создать session lifecycle: create/read/expire/revoke. | M3-01 | Unit/integration tests; cookie flags asserted. | `auth` |
| **M3-04** Реализовать login/logout | Individual identity flow без shared token UI. | M3-03 | Login/logout/expired/disabled states E2E. | `auth` |
| **M3-05** Добавить CSRF protection | Защитить cookie-auth mutations. | M3-03 | Positive and denial tests. | `security` |
| **M3-06** Определить permissions catalog | Stable permissions для read/write/publish/admin. | M3-01 | No ambiguous `isAdmin`; documented mapping. | `rbac` |
| **M3-07** Реализовать server authorization middleware | Exact permission + scope checks. | M3-06 | Cross-scope denial tests; client hiding not relied on. | `rbac` |
| **M3-08** Добавить `/me` profile endpoint | Возвращает safe profile, roles, scopes, capabilities. | M3-03,M3-06 | No sensitive fields; cache policy correct. | `api` |
| **M3-09** Подключить UI session states | Login, expiry, 403 и permission-aware nav. | M3-04,M3-08 | No token in browser storage; UX H scenarios. | `ui-auth` |
| **M3-10** Добавить audit event skeleton | Логировать login/logout/denied sensitive mutations. | M3-03,M3-07 | Immutable append semantics tested. | `audit` |
| **M3-11** Добавить request correlation | Request ID through API/log/error response. | M3-02 | No secrets; stable format tests. | `observability` |
| **M3-12** Добавить rate/request-size limits | Login/admin endpoints bounded. | M3-02 | Boundary tests for oversized/rate-limited requests. | `security` |
| **M3-13** Удалить legacy token from default flow | Shared CONTENT_ADMIN_TOKEN не используется обычным UI. | M3-09 | Legacy route explicit admin-only or disabled; migration documented. | `security` |
| **M3-14** Security review gate | Independent review auth, CSRF, scopes, session and logging. | M3-03..13 | APPROVE required; fixes separate atomic tasks. | `review` |

## Exit gate

Shared token исключён из default flow; индивидуальные sessions, permissions и denial tests одобрены.

# M4. PostgreSQL foundation и контролируемый импорт

| ID | Атомарный результат | Зависимости | Acceptance | Класс проверки |
|---|---|---|---|---|
| **M4-01** Принять ADR PostgreSQL/tooling | Выбрать provider/version/query/migration stack. | M3-14 | Approved ADR; exact versions pinned. | `adr` |
| **M4-02** Создать local DB harness | Disposable PostgreSQL integration environment. | M4-01 | Readiness/cleanup bounded; no fixed port. | `db-tooling` |
| **M4-03** Создать migration runner baseline | Checksums, locking, ledger and failure recovery. | M4-02 | Replay/checksum drift/concurrent tests. | `migrations` |
| **M4-04** Создать identity tables | users, roles, permissions, scopes as selected design requires. | M4-03 | Least privilege and migration tests. | `db-schema` |
| **M4-05** Создать core content tables | worlds, courses, venues, campuses, shifts, offer_formats. | M4-03 | FK/invariants/indexes tested. | `db-schema` |
| **M4-06** Создать revision tables | Entity revisions and optimistic version fields. | M4-05 | Concurrent update conflict integration test. | `db-schema` |
| **M4-07** Создать audit tables | Append-only audit records and redaction policy. | M4-03 | Mutation cannot skip audit in tested use case. | `audit` |
| **M4-08** Создать release/job tables skeleton | Release metadata, artifacts, job phases, current pointer model. | M4-03 | No publication behavior yet; state constraints tested. | `db-schema` |
| **M4-09** Реализовать read repositories | Bounded list/get for core entities. | M4-05 | Parameterized queries and pagination tests. | `db` |
| **M4-10** Реализовать Google Sheet readers | Read-only adapters reuse existing parsers where possible. | M4-05 | No writes; fixtures for mixed booleans/duplicate headers. | `import` |
| **M4-11** Реализовать import dry-run model | Mapping new/update/conflict/error without DB mutation. | M4-10 | Transaction count unchanged in dry run. | `import` |
| **M4-12** Реализовать cold import batch | World/Course/Venue/Campus revisions in one controlled batch. | M4-11,M4-06 | Idempotent batch key; rollback on failure. | `import` |
| **M4-13** Реализовать hot import batch | Shift/OfferFormat with external key preservation. | M4-12 | New immutable IDs; enrolled/code ownership rules. | `import` |
| **M4-14** Добавить reconciliation report | Compare DB-generated domain read model with current snapshots. | M4-12,M4-13 | Differences classified, not silently normalized. | `migration` |
| **M4-15** Добавить dual-read feature flag | Admin can read DB in test scope while production source unchanged. | M4-14 | Safe fallback and explicit source label. | `migration` |
| **M4-16** DB foundation review gate | Security, migrations, indexes, transactions, imports. | M4-02..15 | APPROVE; production cutover forbidden. | `review` |

## Exit gate

DB/import foundation одобрена; parity измеряется; production source не переключён.

# M5. Worlds и Courses: полноценное редактирование

| ID | Атомарный результат | Зависимости | Acceptance | Класс проверки |
|---|---|---|---|---|
| **M5-01** Admin read API Worlds | Paginated list/get with ETag/revision. | M4-09,M3-07 | Auth, bounds, schema contract tests. | `api` |
| **M5-02** World command create | Create draft world with audit. | M5-01,M4-06 | Idempotency, validation, permission tests. | `domain` |
| **M5-03** World command update | Patch with If-Match conflict handling. | M5-02 | 409 conflict and revision tests. | `domain` |
| **M5-04** World form basic fields | Title/slug/description/theme selection. | M5-03 | Dirty/save/error/conflict/a11y. | `ui-form` |
| **M5-05** World highlights editor | Stable list IDs, reorder buttons and validation. | M5-04 | Keyboard reorder and persistence tests. | `ui-form` |
| **M5-06** World preview adapter | Compile/render current draft without publish. | M5-04 | Same domain schema; preview error state. | `preview` |
| **M5-07** Admin read API Courses | List/get relations, pagination, ETag. | M4-09,M3-07 | Auth/bounds/contract tests. | `api` |
| **M5-08** Course create command | Draft course linked to existing World. | M5-07 | Missing/archived World denied. | `domain` |
| **M5-09** Course update command | Patch with revision and domain validation. | M5-08 | Conflict/validation/audit tests. | `domain` |
| **M5-10** Course editor basic/catalog | Title, world, slug, tagline, age, format. | M5-09 | Structured fields; no raw delimiters. | `ui-form` |
| **M5-11** Course long-content sections | Story, parent skills, loot, approach limited rich text. | M5-10 | Paste sanitization and error recovery. | `ui-form` |
| **M5-12** Course skills/highlights components | Repeatable chips/list with stable IDs. | M5-10 | Keyboard and max/min tests. | `ui-form` |
| **M5-13** Course preview and readiness | Card/detail preview + completion/blockers. | M5-10..12 | Preview same data; blockers deep-link. | `preview` |
| **M5-14** World/Course archive flow | Dependency check, reason, audit; no physical delete. | M5-03,M5-09 | Active dependency policy tested. | `domain` |
| **M5-15** World/Course usability gate | Scripted create/edit/conflict/preview tests with users. | M5-04..14 | Findings recorded and prioritized. | `ux-research` |

## Exit gate

World/Course drafts редактируются с revisions, conflict handling, preview и audit.

# M6. Venues и Campuses

| ID | Атомарный результат | Зависимости | Acceptance | Класс проверки |
|---|---|---|---|---|
| **M6-01** Venue/Campus read API | List/get with multi-campus model. | M4-09,M3-07 | Current MDUC multi-campus fixture passes. | `api` |
| **M6-02** Venue create/update commands | Revision, slug/alias, audit. | M6-01 | Permission, uniqueness, conflict tests. | `domain` |
| **M6-03** Campus create/update commands | Address/coordinates/transit/instructions. | M6-02 | FK, coordinate bounds, conflict tests. | `domain` |
| **M6-04** Venue editor basic | Names, type, visibility, aliases. | M6-02 | Save/conflict/a11y states. | `ui-form` |
| **M6-05** Campus editor address | Structured address and manual coordinate fallback. | M6-03 | No map-only requirement; keyboard path. | `ui-form` |
| **M6-06** Campus map integration | Provider adapter, timeout/error/SSR-safe behavior. | M6-05 | Address remains usable without map. | `integration` |
| **M6-07** Instructions editor | Directions as ordered steps, entrance/contact notes. | M6-03 | No newline delimiter parsing in UI. | `ui-form` |
| **M6-08** Inheritance/override display | Show source value and reset behavior. | M6-04,M6-05 | UX-6 scenarios and tests. | `ui-pattern` |
| **M6-09** Venue related shifts panel | Read-only links and active counts. | M6-01 | Permission-aware, bounded. | `ui` |
| **M6-10** Campus duplicate detection | Suggest near-duplicate address without blocking valid case. | M6-03 | Deterministic normalization tests. | `domain` |
| **M6-11** Archive Venue/Campus flow | Block/guide when active shifts depend. | M6-02,M6-03 | Dependency report and audit. | `domain` |
| **M6-12** Venue usability/accessibility gate | Multi-campus, map failure, keyboard and mobile. | M6-04..11 | APPROVE or split fixes. | `review` |

## Exit gate

Venue/Campus multi-location model и inheritance UX работают.

# M7. Расписание и OfferFormats

| ID | Атомарный результат | Зависимости | Acceptance | Класс проверки |
|---|---|---|---|---|
| **M7-01** Shift read API | Paginated/filterable list/get with revision. | M4-09,M3-07 | Date/status/course/venue filters bounded. | `api` |
| **M7-02** OfferFormat read model | Nested formats, capacity/enrolled/availability ownership. | M7-01 | Mixed source fixtures correct. | `domain` |
| **M7-03** Shift create command | Immutable ID + optional external key. | M7-01 | No composite primary identity; audit/idempotency. | `domain` |
| **M7-04** Shift update command | Course/campus/dates/status/teacher/capacity with If-Match. | M7-03 | Invariant and conflict tests. | `domain` |
| **M7-05** OfferFormat create command | Time/price/age/channel/waitlist. | M7-04 | Validation and ownership rules. | `domain` |
| **M7-06** OfferFormat update command | Patch and conflict behavior. | M7-05 | Enrolled read-only unless permission. | `domain` |
| **M7-07** Schedule filters in URL | Dates, venue, course, status, issues. | M7-01 | Back/forward and reset tests. | `ui` |
| **M7-08** Schedule table operational columns | Dense table with status/capacity/registration. | M7-02,M7-07 | Responsive card fallback and a11y. | `ui` |
| **M7-09** Shift editor identity/basic | Course/campus/date/status sections. | M7-04 | Wrong-object risk reduced; save states. | `ui-form` |
| **M7-10** OfferFormats editable table | Add/edit/remove rows with stable IDs. | M7-06 | Keyboard, validation, error preservation. | `ui-form` |
| **M7-11** Address override pattern | Explicit inheritance toggle/reset. | M7-09,M6-08 | Source visible; audit diff. | `ui-form` |
| **M7-12** Copy shift dry-run | Show copy matrix and proposed changes. | M7-03 | No DB write in dry run. | `domain` |
| **M7-13** Copy shift execute | New ID, reset enrolled/external codes by default. | M7-12 | Exact copy policy tests. | `domain` |
| **M7-14** Duplicate/overlap detection | Detect same course/campus/date and time conflicts. | M7-03,M7-05 | Warnings vs blockers policy tested. | `domain` |
| **M7-15** Bulk update dry-run | Explicit changed fields and per-item preview. | M7-04 | No hidden clearing; conflict list. | `domain` |
| **M7-16** Bulk update execute | Idempotent per-item result and batch audit. | M7-15 | Partial success report; retry safe. | `domain` |
| **M7-17** mos.ru link/code validation | Syntax/ownership/status checks without live dependency in unit tests. | M7-06 | Invalid/missing states clear. | `integration` |
| **M7-18** Capacity alert rules | Overcapacity, sold-out, waitlist derivation. | M7-02 | Pure state machine tests. | `domain` |
| **M7-19** Schedule calendar view | Secondary view using same filters/read model. | M7-08 | No separate inconsistent data path. | `ui` |
| **M7-20** Schedule critical E2E | Find → edit price → save → preview readiness. | M7-08..18 | Keyboard and mobile smoke; no publish yet. | `e2e` |

## Exit gate

Critical schedule edit flow проходит E2E без publication.

# M8. Media library

| ID | Атомарный результат | Зависимости | Acceptance | Класс проверки |
|---|---|---|---|---|
| **M8-01** Принять ADR media processing | Storage, upload, processor, limits, variants. | M4-16 | Approved threat model and costs. | `adr` |
| **M8-02** Создать media tables | Asset, revision, variant, usage, processing job. | M8-01,M4-03 | Constraints and indexes tested. | `db-schema` |
| **M8-03** Upload intent endpoint | Authorized scoped upload with size/type policy. | M8-02,M3-07 | Oversize/type/scope denial tests. | `api` |
| **M8-04** Source finalize endpoint | Checksum/MIME verification and idempotency. | M8-03 | Fake extension rejected; retry safe. | `api` |
| **M8-05** Processing job state machine | selected/uploaded/processing/ready/failed. | M8-04 | Retry/cancel/timeout tests. | `domain` |
| **M8-06** Variant generator adapter | Deterministic image variants and metadata. | M8-05 | Golden dimensions/checksums; bounded resources. | `media` |
| **M8-07** Media library list | Grid/list, filters, processing states. | M8-02 | Loading/empty/error/mobile/a11y. | `ui` |
| **M8-08** Upload tray | Per-file progress, cancel/retry, persistent navigation. | M8-03..05 | No false ready state. | `ui` |
| **M8-09** Asset detail | Metadata, variants, usages, history. | M8-02 | Permission-aware and redacted. | `ui` |
| **M8-10** Alt/caption editor | Revisioned metadata and decorative option. | M8-09 | A11y requirements enforced. | `ui-form` |
| **M8-11** Crop/focal point | Accessible controls and preset preview. | M8-06,M8-09 | Keyboard alternative; reduced motion. | `ui` |
| **M8-12** Entity media slots | Course/World/Venue/Campus relation UI. | M8-09,M5,M6 | Required slots/readiness integration. | `ui` |
| **M8-13** Replace/archive policy | Usage-aware replacement and history preservation. | M8-12 | Cannot orphan published usage silently. | `domain` |
| **M8-14** Drive importer adapter | Read existing inbox as migration source, no production write. | M8-02 | Idempotent mapping and report. | `migration` |
| **M8-15** Media security review | Uploads, MIME, URLs, logs, resource bounds. | M8-03..14 | APPROVE required. | `review` |

## Exit gate

Media upload/processing/usage безопасны и audited.

# M9. Preview, compilation и immutable releases

| ID | Атомарный результат | Зависимости | Acceptance | Класс проверки |
|---|---|---|---|---|
| **M9-01** Зафиксировать golden snapshot contracts | Existing catalog/map/offers/detail/manifest fixtures. | M4-14 | Compiler drift fails tests. | `contract` |
| **M9-02** Вынести deterministic compiler boundary | Domain revisions → current snapshot shapes. | M9-01 | Same input same bytes/hash. | `compiler` |
| **M9-03** Compile validation report | Blockers/warnings/info with entity/field references. | M9-02 | UI-deep-linkable issues. | `compiler` |
| **M9-04** Preview release storage | Isolated temporary namespace + expiry. | M9-02,M8 | No production pointer impact. | `preview` |
| **M9-05** Preview API/job | Create/status/cancel preview compile. | M9-04,M3-07 | Auth/idempotency/timeout tests. | `api` |
| **M9-06** Preview UI | Affected pages, viewport, compile errors. | M9-05 | Same compiler; error recovery/a11y. | `ui` |
| **M9-07** Release preparation query | Collect unpublished revisions and group scope. | M4-08,M9-03 | Deterministic scope and permissions. | `domain` |
| **M9-08** Publication Center scope UI | Grouped entities, hot/cold impact, affected pages. | M9-07 | Blockers and warnings distinct. | `ui` |
| **M9-09** Immutable release writer | Upload all artifacts under release ID. | M9-02,M4-08 | Partial upload never current; checksum tests. | `release` |
| **M9-10** Atomic activation pointer | Activate only complete verified manifest. | M9-09 | Concurrent activation/rollback tests. | `release` |
| **M9-11** Public verification adapter | Check release ID, artifacts and critical pages. | M9-10 | Timeout/partial failure diagnostics. | `release` |
| **M9-12** Publication job orchestration | Queued→validated→compiled→uploaded→activated→verified. | M9-03,M9-09..11 | State transitions and recovery tests. | `release` |
| **M9-13** Publication job UI | Phase timeline, safe leave, failure recovery. | M9-12 | No fake percentage/success. | `ui` |
| **M9-14** Release detail UI | Changes/pages/artifacts/verification/audit. | M9-12 | Technical details progressive. | `ui` |
| **M9-15** Rollback command | Atomic pointer to compatible release, comment/audit. | M9-10 | Does not delete drafts; verification required. | `release` |
| **M9-16** Rollback UI | Current/target diff and consequence confirmation. | M9-15 | Permission and accessibility tests. | `ui` |
| **M9-17** Cold deployment adapter | If required, bounded downstream deploy and status. | M9-12 | No GitHub PAT in browser; failure phase explicit. | `integration` |
| **M9-18** Publication E2E | Draft→preview→publish→verify→rollback in test env. | M9-06..17 | Critical scenario deterministic. | `e2e` |

## Exit gate

Test environment поддерживает immutable release, verification и rollback.

# M10. Cutover from Google Sheets

| ID | Атомарный результат | Зависимости | Acceptance | Класс проверки |
|---|---|---|---|---|
| **M10-01** Определить cutover readiness matrix | Data parity, users, rollback, monitoring, support. | M9-18 | Owner-approved checklist. | `planning` |
| **M10-02** Запустить full import dry-run | Cold/hot/media mapping without mutation production. | M4,M8 | Report reviewed; no unknown silent rows. | `migration` |
| **M10-03** Исправить data mapping gaps | Одна категория conflict на task. | M10-02 | Re-run shows category resolved. | `migration` |
| **M10-04** Выполнить controlled import | Create DB revisions with batch ID. | M10-02,M10-03 | Counts/checksums/audit reconciled. | `migration` |
| **M10-05** Запустить dual-read parity | Compare DB/compiler vs current production snapshots. | M10-04,M9-02 | Differences zero or owner-approved. | `migration` |
| **M10-06** Pilot editor cohort | Limited users/scopes; Sheets still source. | M10-05 | Usability/issues recorded. | `pilot` |
| **M10-07** Enable CMS writes in pilot | DB source for pilot drafts, no public publish. | M10-06 | Revision/audit/recovery observed. | `pilot` |
| **M10-08** Shadow compile | Build releases without activation and compare. | M10-07 | Hashes/semantic diff acceptable. | `migration` |
| **M10-09** Hot publication cutover | CMS publishes schedule; Sheets read-only fallback. | M10-08 | Rollback plan tested; monitoring green. | `cutover` |
| **M10-10** Cold publication cutover | CMS publishes catalog/venues/media. | M10-09 | Static deployment/verification green. | `cutover` |
| **M10-11** Freeze Sheets writes | Permissions/read-only banner/export path. | M10-10 | No hidden writer remains. | `cutover` |
| **M10-12** Retire legacy raw admin | Remove/disable textarea and shared-token endpoints after retention. | M10-11 | No active usage; security review. | `cleanup` |
| **M10-13** Retire workflow runtime dependency | Remove editorial GitHub dispatch from production path. | M10-10 | CI remains; deployment docs updated. | `cleanup` |
| **M10-14** Archive migration adapters | Keep audited export/import tools, remove dual-source ambiguity. | M10-13 | Source of truth explicit everywhere. | `cleanup` |

## Exit gate

PostgreSQL/CMS — единственный production source of truth; legacy runtime paths retired.

# M11. Hardening, пилот и эксплуатация

| ID | Атомарный результат | Зависимости | Acceptance | Класс проверки |
|---|---|---|---|---|
| **M11-01** Accessibility full audit | WCAG critical journeys, manual screen-reader/zoom. | M10-10 | No critical/serious blockers. | `a11y` |
| **M11-02** Performance budgets | List/form/preview/job responsiveness and bundle budgets. | M10-10 | Budgets in CI/monitoring. | `performance` |
| **M11-03** Security penetration review | Auth, scopes, CSRF, uploads, SSRF, logs, release controls. | M10-10 | Findings remediated atomically. | `security` |
| **M11-04** Disaster recovery drill | DB restore, release pointer rollback, storage recovery. | M10-10 | RTO/RPO evidence and runbook. | `operations` |
| **M11-05** Publication failure drills | Compiler/upload/activation/verification/downstream failures. | M9 | Operators recover without direct data edits. | `operations` |
| **M11-06** Audit retention/export | Retention, search, export and tamper evidence. | M10 | Policy and tests. | `audit` |
| **M11-07** User onboarding | Role-specific onboarding and in-product help. | M10 | New editor completes core task. | `ux` |
| **M11-08** Support runbook | Known failures, correlation IDs, escalation, no secret exposure. | M10 | Reviewed by operator. | `operations` |
| **M11-09** Analytics instrumentation | Operational UX metrics, bounded labels, privacy review. | M10 | Metrics answer defined questions. | `observability` |
| **M11-10** Seasonal load rehearsal | Bulk schedule/import/publish under realistic data volume. | M10 | No unbounded query/UI regression. | `performance` |
| **M11-11** Post-cutover cleanup audit | Find stale Sheets/S3/raw snapshot write paths. | M10-14 | Every write path classified/removed/approved. | `audit` |
| **M11-12** Product acceptance review | Owner walkthrough against vision and UX scenarios. | M11-01..11 | Signed acceptance or new roadmap tasks. | `acceptance` |

## Exit gate

Security, accessibility, DR, performance и product acceptance закрыты evidence.

# 4. Правило превращения строки в Task Packet

Для выбранного ID оркестратор обязан:

1. Прочитать prerequisites и проверить, что они DONE.
2. Уточнить exact branch/HEAD.
3. Провести read-only path discovery.
4. Указать не более 1–5 write paths или split.
5. Подключить ровно релевантные UX scenarios.
6. Выписать negative acceptance.
7. Указать точные команды, которые существуют.
8. Указать `NO COMMIT`, если commit не разрешён.
9. Передать слабой модели только этот packet и необходимые файлы.
10. После final report не передавать следующий ID автоматически.
