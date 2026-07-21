# Целевая архитектура CMS

## 1. Архитектурная цель

Создать административную систему, которая управляет доменными сущностями и продолжает выпускать совместимые snapshots для существующего статического сайта.

## 2. Текущее состояние

```text
Google Sheets ─┐
               ├─ GitHub Actions / scripts ─ snapshots ─ S3 ─ public site
Google Drive ──┘
```

Текущий репозиторий уже содержит:

- `apps/admin` — Vite/React UI, редактирующий raw JSON;
- `apps/yandex-content-admin` — token-protected API поверх S3 и workflow dispatch;
- `apps/web` — Next.js сайт и доменные Zod-схемы;
- sheet sync scripts;
- media inbox pipeline;
- S3 publication scripts.

Эти элементы являются миграционными активами, а не готовой CMS.

## 3. Целевой контур

```text
┌────────────────────────────────────┐
│ Admin UI                           │
│ forms, tables, preview, releases   │
└────────────────┬───────────────────┘
                 │ secure session
┌────────────────▼───────────────────┐
│ Admin BFF / Content API            │
│ auth, RBAC, validation, audit      │
└──────────┬──────────────┬──────────┘
           │              │
┌──────────▼──────┐  ┌────▼──────────┐
│ PostgreSQL      │  │ Object Storage│
│ source of truth│  │ media/releases │
└──────────┬──────┘  └────┬──────────┘
           │ publish       │
┌──────────▼───────────────▼─────────┐
│ Snapshot compiler + release engine │
└────────────────┬───────────────────┘
                 │ current manifest
┌────────────────▼───────────────────┐
│ Existing public site               │
└────────────────────────────────────┘
```

## 4. Модульные границы

Рекомендуемая структура после стабилизации:

```text
apps/
  web/
  admin/
  content-api/             # либо BFF внутри admin, решение фиксируется ADR

packages/
  content-domain/          # schemas, invariants, commands, value objects
  content-db/              # schema, repositories, migrations
  snapshot-compiler/       # domain → existing public contracts
  content-client/          # typed client for admin UI
  admin-ui/                # reusable UI only after real reuse appears
```

На ранней стадии не требуется немедленно создавать все пакеты. Выделение выполняется только когда граница доказана реальным использованием.

## 5. Направление зависимостей

```text
UI / routes / adapters
          ↓
application use cases
          ↓
domain
```

Инфраструктурные адаптеры реализуют порты приложения:

```text
PostgreSQL adapter ─┐
S3 adapter          ├─→ application ports
Google importer     ┘
```

Запрещено:

- импортировать React/Next в доменные схемы;
- импортировать product-specific модели в общий UI-kit;
- читать process.env внутри чистых доменных функций;
- обращаться к S3 из React-компонента;
- генерировать snapshots внутри route handler без application boundary;
- дублировать Zod-схемы UI и API.

## 6. Источник истины

### Переходный период

До cutover источником истины остаются Google Sheets. CMS работает read-only или пишет через контролируемый адаптер только в пределах одобренного этапа.

### Целевой период

PostgreSQL становится source of truth. Google Sheets:

- импорт;
- экспорт;
- аварийный read-only reference;
- массовый перенос по явной операции.

Generated snapshots не являются source of truth ни на одном этапе.

## 7. API

Admin API должен быть отдельным от публичного API по:

- аутентификации;
- threat model;
- rate limits;
- стабильности;
- объёму данных;
- audit policy.

Каждый endpoint определяет:

- authentication;
- authorization;
- request size;
- timeout;
- idempotency;
- optimistic concurrency;
- error mapping;
- audit behavior;
- returned data.

Пример mutation contract:

```http
PATCH /admin/v1/courses/{id}
If-Match: "revision-17"
Idempotency-Key: <uuid>
```

Ответ:

```json
{
  "data": { "...": "..." },
  "revision": 18,
  "etag": "\"revision-18\"",
  "warnings": []
}
```

При конфликте:

```http
409 Conflict
```

с данными о текущей серверной ревизии.

## 8. Аутентификация и авторизация

Целевой вариант:

- индивидуальные пользователи;
- короткоживущая серверная сессия;
- `HttpOnly`, `Secure`, `SameSite=Lax/Strict` cookie;
- MFA для Publisher/Admin;
- server-side RBAC;
- CSRF protection для cookie-auth mutations;
- ротация и отзыв сессий;
- audit sensitive actions.

Роли:

```text
viewer
editor
publisher
admin
```

Permission проверяется на точное действие, например:

```text
course.read
course.write
release.preview
release.publish
release.rollback
user.manage
```

## 9. Сохранение и конкурентность

Форма работает с revision.

1. Пользователь открывает revision 17.
2. Изменяет поля.
3. Сохраняет с `If-Match: revision-17`.
4. Сервер создаёт revision 18.
5. Если сервер уже на revision 18, возвращается conflict.
6. UI показывает различия и предлагает:
   - загрузить текущую версию;
   - скопировать свои изменения;
   - повторить merge после сравнения.

Last-write-wins запрещён.

## 10. Публикация

### 10.1. Compile

Компилятор принимает точный набор revisions и выдаёт:

- catalog snapshot;
- map snapshot;
- offers snapshot;
- details;
- site manifest;
- validation report;
- content hashes.

### 10.2. Immutable release

```text
releases/{releaseId}/
  catalog-snapshot.json
  map-snapshot.json
  offers-snapshot.json
  site-config.json
  site-manifest.json
  detail/*.json
```

### 10.3. Activate

После загрузки и проверки меняется маленький указатель:

```json
{
  "releaseId": "01K...",
  "publishedAt": "...",
  "manifestPath": "releases/01K.../site-manifest.json",
  "contentHash": "sha256:..."
}
```

### 10.4. Verify

Publication job обязан проверить:

- объект доступен;
- JSON читается;
- hash совпадает;
- public site видит ожидаемый release ID;
- критические страницы отвечают;
- в случае cold release завершена требуемая сборка/деплой.

## 11. Preview

Preview должен использовать:

- те же доменные данные;
- тот же snapshot compiler;
- тот же rendering code или совместимый preview consumer;
- отдельный временный release namespace.

Нельзя делать preview через отдельную упрощённую модель, которая может расходиться с production.

## 12. Медиа

UI загружает файл в API, а не прямо в public bucket.

Pipeline:

```text
upload intent
→ size/type validation
→ isolated source storage
→ malware/content checks where applicable
→ metadata extraction
→ variants
→ moderation/alt text
→ entity relation
→ release inclusion
```

Обязательные защиты:

- лимит размера;
- проверка реального MIME;
- безопасное имя;
- checksum;
- запрет path traversal;
- авторизованная загрузка;
- bounded processing;
- отсутствие signed URL в логах.

## 13. Наблюдаемость

Для каждого request/job:

- request ID;
- actor ID;
- entity ID;
- revision/release ID;
- phase;
- duration;
- structured result;
- redacted diagnostics.

Публичные и административные ошибки разделяются. UI получает безопасный код и понятное сообщение; внутренние причины остаются в логах.

## 14. Deployment strategy

GitHub Actions остаётся для:

- CI;
- сборки;
- deployment кода;
- contract checks;
- scheduled maintenance.

Редакторская hot-публикация не должна зависеть от GitHub PAT и workflow dispatch после целевого cutover.

## 15. ADR, которые необходимо принять до соответствующих этапов

1. `ADR-001`: Next.js BFF или отдельный content-api.
2. `ADR-002`: PostgreSQL provider и точная версия.
3. `ADR-003`: authentication provider/session implementation.
4. `ADR-004`: ORM/query builder и миграции.
5. `ADR-005`: release pointer and S3 layout.
6. `ADR-006`: preview deployment.
7. `ADR-007`: media processing runtime.
8. `ADR-008`: Google Sheets cutover policy.

До одобрения ADR агент не должен сам выбирать крупную инфраструктурную технологию.
