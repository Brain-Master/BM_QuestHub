# Google Sheets — редактор контента

Две таблицы для менеджеров. Один сервисный аккаунт (`GOOGLE_SERVICE_ACCOUNT_JSON`), email из `client_email` — **Editor** на обеих таблицах.

## Таблицы

| Tier | Ссылка | Spreadsheet ID |
|------|--------|----------------|
| **Hot** (расписание) | [Открыть](https://docs.google.com/spreadsheets/d/1ut5AhfJqx9wrJE3tTCzrkrQdCmWsCPB8cueHH3QsLy8/edit) | `1ut5AhfJqx9wrJE3tTCzrkrQdCmWsCPB8cueHH3QsLy8` |
| **Cold** (курсы, площадки, миры) | [Открыть](https://docs.google.com/spreadsheets/d/1fqeVC8BhjGWtOR20NhCUQuhwgchkCCzYsmiudpGE4jc/edit) | `1fqeVC8BhjGWtOR20NhCUQuhwgchkCCzYsmiudpGE4jc` |

## Вкладки

### Hot: «Группы» + «Форматы»

**Подробная схема данных (pipeline, ID, snapshot):** [hot-schedule-data.md](./hot-schedule-data.md)

Связь **1 : N** по колонке `shift_group_id`:

| Лист | Строка = | Обязательные поля |
|------|----------|-------------------|
| **Группы** | одна смена (карточка на сайте) | `shift_group_id`, `program_name_h2`, `quest_slug`, `venue_slug`, `start_date`, `end_date`, `address`, `status` |
| **Форматы** | один тариф внутри смены | `shift_group_id`, `start_time`, `end_time`, `price` |

На листе **Группы** — общие данные: `program_name_h1` (вселенная, h1), `program_name_h2` (курс, h2), `school_name`, `description`, …  
На листе **Группы** также: `allow_waitlist_when_sold_out` (лист ожидания при «Мест нет» для всей смены).  
На листе **Форматы** — тариф: `format_type`, `registration_channel`, `enrolled`, `mos_ru_code`, `age_group`, …

Подпись «Мехвариум: Лаборатория…» = `program_name_h1` + `program_name_h2` (двоеточие только в UI). Старая колонка `program_name` при sync делится по первому `:`.

Несколько строк на **Форматы** с одним `shift_group_id` → одна карточка на сайте с несколькими тарифами.

Колонки `format_time` в таблице **нет** — расписание тарифа на сайте считается из дат группы и `start_time`/`end_time` формата.

**Цена:** допустимы `8500`, `'8500`, `8 500`, `14'000,00`, `8 500 ₽` — нормализуются в [`sheet-field-parsers.ts`](../../apps/web/lib/offers/sheet-field-parsers.ts).

Полные списки колонок — [`sheet-contract.ts`](../../apps/web/lib/offers/sheet-contract.ts) (`GROUP_REQUIRED_HEADERS`, `FORMAT_REQUIRED_HEADERS`).

```bash
make seed-sheet-headers              # создать листы и шапки «Группы» / «Форматы»
make import-site-data-to-sheets --hot-only   # заполнить из snapshot
make backfill-shift-group-ids        # пересчитать shift_group_id на листе «Группы»
```

Лист `Расписание` (старый плоский формат) **больше не читается** sync-ом.

### Cold

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
