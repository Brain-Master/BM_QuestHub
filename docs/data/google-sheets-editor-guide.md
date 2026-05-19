# Google Sheets — редактор контента

Две таблицы для менеджеров. Один сервисный аккаунт (`GOOGLE_SERVICE_ACCOUNT_JSON`), email из `client_email` — **Editor** на обеих таблицах.

## Таблицы

| Tier | Ссылка | Spreadsheet ID |
|------|--------|----------------|
| **Hot** (расписание) | [Открыть](https://docs.google.com/spreadsheets/d/1ut5AhfJqx9wrJE3tTCzrkrQdCmWsCPB8cueHH3QsLy8/edit) | `1ut5AhfJqx9wrJE3tTCzrkrQdCmWsCPB8cueHH3QsLy8` |
| **Cold** (курсы, площадки, миры) | [Открыть](https://docs.google.com/spreadsheets/d/1fqeVC8BhjGWtOR20NhCUQuhwgchkCCzYsmiudpGE4jc/edit) | `1fqeVC8BhjGWtOR20NhCUQuhwgchkCCzYsmiudpGE4jc` |

## Вкладки

**Hot:** `Расписание` — одна строка = одна смена. Обязательные колонки: `program_name`, `quest_slug`, `venue_slug`, `start_date`, `end_date`, `start_time`, `end_time`, `price`, `school_name`, `address`, `status`. Полный список — [`sheet-contract.ts`](../../apps/web/lib/offers/sheet-contract.ts).

**Cold:**

- `Миры` — вселенные (slug, name, description, theme_key, …)
- `Площадки` — venues (slug, name, type, address, …)
- `Курсы` — курсы без смен (slug, world_slug, title, story, …)

Первый запуск (локально):

```bash
# JSON ключ: secret/bm-questhub-*.json
make setup-sheets-env
make seed-sheet-headers
node scripts/setup-content-admin.mjs   # токен для Apps Script → secret/content-admin.deploy.txt
```

Подробнее про свойства скрипта: [google-apps-script-properties.md](./google-apps-script-properties.md).

## Публикация

1. Отредактировать таблицу.
2. Меню **BrainMaster → Опубликовать** (Apps Script — см. [`google-apps-script-publish.js`](./google-apps-script-publish.js)).
3. Дождаться ответа (запускается GitHub Actions `sheet-sync.yml`).

| Кнопка | Эффект на сайте |
|--------|-----------------|
| Hot | S3 `offers-snapshot.json` → обновление за ~1 мин (без rebuild) |
| Cold | S3 catalog/map + **Timeweb deploy** → 2–5 мин |

Порядок при новой площадке/курсе: сначала **Cold**, затем **Hot**.

## Локально (разработчик)

```bash
cp scripts/sheets.env.example scripts/sheets.env
# + GOOGLE_SERVICE_ACCOUNT_JSON в scripts/sheets.env или apps/web/.env.local

make publish-sheet-hot
make publish-sheet-cold
```

## Env

См. [`scripts/sheets.env.example`](../../scripts/sheets.env.example) и [`apps/web/.env.example`](../../apps/web/.env.example).

GitHub Actions secrets: `GOOGLE_SERVICE_ACCOUNT_JSON`, S3 keys, `CONTENT_REBUILD_GITHUB_TOKEN`; vars: `GOOGLE_SHEETS_HOT_SPREADSHEET_ID`, `GOOGLE_SHEETS_COLD_SPREADSHEET_ID`, `TIMEWEB_APP_ID`.

## Этап 2

Лёгкая CMS с формами и preview — [`cms-roadmap.md`](../deployment/cms-roadmap.md).
