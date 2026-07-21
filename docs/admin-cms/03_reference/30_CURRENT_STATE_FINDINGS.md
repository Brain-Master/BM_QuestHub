# Текущее состояние и исходные риски

## 1. Scope анализа

Зафиксированы:

- Google Sheets Cold/Hot Content;
- Google Drive media inbox;
- `apps/admin`;
- `apps/yandex-content-admin`;
- sheet sync scripts;
- snapshot compiler paths;
- GitHub Actions publication pipeline;
- `apps/web` package baseline.

Документ является starting snapshot, а не заменой нового preflight перед implementation.

## 2. Текущая модель данных

### Cold

- Миры;
- Площадки;
- Курсы.

Current sync validates rows and creates catalog/map/detail snapshots.

### Hot

- Группы;
- Форматы.

Current sync joins records by `shift_group_id`, validates relations and creates offers snapshot.

### Media

Drive `Sync/` содержит source files по convention-based paths. Имена файлов являются contract, после чего pipeline pulls/processes/uploads media.

## 3. Сильные стороны текущей системы

- Разделение hot/cold отражает различную частоту публикации.
- Существуют Zod/runtime validators.
- Проверяются relation slugs.
- Есть generatedAt и content hashes для части snapshots.
- Есть отдельные S3 upload targets hot/cold/media.
- Есть Telegram failure notification.
- Есть multi-campus work и текущие content adapters.
- Публичный сайт уже потребляет structured snapshots.

Эти активы следует переиспользовать через domain/compiler boundary.

## 4. `apps/admin`

Observed behavior:

- React/Vite project.
- Tabs `catalog`, `map`, `site`, `offers`, `publish`.
- Каждый snapshot хранится как JSON string.
- Main editor — `<textarea>`.
- `saveCurrent` парсит JSON и пишет snapshot напрямую.
- Shared token вводится пользователем и сохраняется в `sessionStorage`.
- Publish вызывает hot/cold sync.

Основные риски:

1. Пользователь редактирует generated output.
2. Нет entity-level forms.
3. Нет revisions/conflict handling.
4. Нет users/RBAC/audit.
5. Нет structured validation before direct write.
6. Нет нормального UI test baseline.

## 5. GET request defect

В current `apps/admin/src/api.ts` общий request helper формирует JSON body для любого method, включая GET `/snapshots`.

Browser Fetch запрещает body для GET/HEAD. Это P0 behavior defect и первая рекомендуемая code task после tooling adoption.

## 6. Current authentication

- один `CONTENT_ADMIN_TOKEN`;
- token header `x-content-token` или bearer;
- token доступен browser UI;
- token shared across users;
- Yandex function разрешает unauthenticated invoke на platform level и выполняет собственную token check;
- нет individual identity, session revocation, role/scope.

Целевой UI не должен расширять этот механизм. Он является legacy migration boundary.

## 7. Current backend mutation

`PUT /snapshots/{type}`:

- выбирает snapshot key;
- берёт `body.data` или body;
- добавляет generatedAt/source;
- пишет public JSON object.

На endpoint boundary отсутствуют entity-level permissions, revision/ETag, atomic multi-artifact release и full domain schema validation.

## 8. Publication pipeline

Current editorial path может включать:

```text
Browser admin / Apps Script
→ Yandex content-admin
→ GitHub workflow dispatch
→ Google Sheets/Drive pull
→ validation/generation
→ S3 upload
→ cold Timeweb deploy
```

Это полезный migration bridge, но слишком связан для целевого runtime publication.

## 9. Data quality findings in Sheets

### Duplicate header

В `Группы` обнаружен повтор `allow_waitlist_when_sold_out`. Current header validation проверяет required columns, но duplicate normalized header должен быть отдельным blocker.

### Mixed booleans

Используются `true/false` и `да/нет`. Boundary parser умеет нормализовать, но CMS должна использовать boolean controls.

### Venue duplication in shifts

`school_name`, `address`, `metro_station` повторяют данные `venue_slug`. Целевая модель использует relation + explicit overrides.

### Composite identity

`shift_group_id` включает course, venue и dates. Изменение даты меняет identity и media path. Целевая модель требует immutable UUID/ULID + external key.

### String-encoded lists

Highlights/skills/tags используют delimiters `|`/`;`. UI должен предоставлять structured list controls.

## 10. Risk register

| Priority | Risk | Consequence |
|---|---|---|
| P0 | GET body bug | admin snapshot load fails in browser |
| P0 | shared browser token | full CMS compromise from one token leak |
| P0 | direct raw snapshot write | invalid public content / broken site |
| P1 | no atomic release | mixed snapshot versions |
| P1 | no revision conflict | silent lost updates |
| P1 | no audit | no accountability/forensics |
| P1 | composite shift identity | broken history/media references |
| P1 | data duplication | divergence between venue and shift |
| P2 | no structured media UX | filename/path dependency on humans |
| P2 | no UI test/a11y baseline | regressions and false confidence |

## 11. Protected compatibility contracts

До явной migration task нельзя ломать:

- catalog snapshot v2 shape;
- map snapshot v2 shape;
- offers snapshot v1 shape;
- detail snapshots;
- site manifest paths;
- public media resolution;
- existing site page expectations.

## 12. Recommended first sequence

```text
M0 governance/tooling
→ M1 API client stabilization
→ M2 read-only UI shell
→ M3 auth/BFF
→ M4 DB/import
```

Не начинать с full CRUD поверх raw S3 API.
