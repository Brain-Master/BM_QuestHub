# Свойства скрипта (Apps Script)

В **каждой** таблице отдельный проект Apps Script. Значение `SYNC_TIER` разное.

| Свойство | Hot-таблица | Cold-таблица |
|----------|-------------|--------------|
| `SYNC_TIER` | `hot` | `cold` |
| `CONTENT_ADMIN_URL` | одинаковый | одинаковый |
| `CONTENT_ADMIN_TOKEN` | одинаковый | одинаковый |

## CONTENT_ADMIN_URL

Базовый URL функции Yandex **без** пути в конце:

```text
https://functions.yandexcloud.net/<id-функции>
```

Не добавляйте `/sync/hot` в свойство — YCF не принимает путь в URL. Apps Script передаёт `path` в JSON-теле запроса.

После локального деплоя смотрите `secret/content-admin.deploy.txt` (генерируется `node scripts/setup-content-admin.mjs`).

## CONTENT_ADMIN_TOKEN

Произвольная длинная строка-пароль (например 32+ символа). Должна **совпадать** с переменной `CONTENT_ADMIN_TOKEN` на Yandex Cloud Function `yandex-content-admin`.

Тот же токен можно вставить в [`apps/admin`](../../apps/admin/) (поле Bearer).

## SYNC_TIER

- **hot** — только в [таблице расписания](https://docs.google.com/spreadsheets/d/1ut5AhfJqx9wrJE3tTCzrkrQdCmWsCPB8cueHH3QsLy8/edit)
- **cold** — только в [таблице каталога](https://docs.google.com/spreadsheets/d/1fqeVC8BhjGWtOR20NhCUQuhwgchkCCzYsmiudpGE4jc/edit)

Код: [`google-apps-script-publish.js`](./google-apps-script-publish.js)
