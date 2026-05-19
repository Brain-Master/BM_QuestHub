# CMS roadmap (этап 2)

Этап 1 — [Google Sheets editor](../data/google-sheets-editor-guide.md).

## Цель

Формы вместо JSON/сырых таблиц: редактирование страниц, **preview**, **save** (черновик), **publish** (prod).

## Принципы

- S3 остаётся SSOT; Timeweb static + Yandex Function API.
- Расширение [`apps/admin`](../../apps/admin/), не Strapi/Directus.
- Sheets можно оставить для hot-расписания параллельно.

## MVP экраны

| Экран | Preview |
|-------|---------|
| Курс (detail) | `/quests/[slug]?preview=1` |
| Площадка | `/sites/[school]?preview=1` |
| Site config | главная / меню |

## API (черновик)

- `PUT /draft/{type}` — S3 prefix `draft/`
- `POST /publish` — validate → prod + cold/hot tier
- `GET /preview-bundle` — draft JSON для iframe

## Не в MVP

WYSIWYG всей вёрстки, роли, мульти-язычность.
