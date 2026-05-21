# Quest Catalog Card Media Guide

Превью в каталоге: [`apps/web/components/quest-card.tsx`](../../apps/web/components/quest-card.tsx).

Slot ID: `quest_catalog`. Индекс: [image-templates-index.md](image-templates-index.md).

## Назначение

Верх карточки: `aspect-[4/3]`, `object-cover`, градиент снизу `from-black/70`, radial highlight сверху. Текст заголовка — **под** изображением.

| Параметр | Значение |
|----------|----------|
| Соотношение | **4:3** |
| Минимум | 1200×900 |
| Желательно | 1600×1200 |
| Safe area | центральные 60%×60%; **нижние 35%** — зона градиента |
| Формат | WebP |

Обычно тот же `hero_image_url`, что и баннер; для каталога можно сделать отдельный кадр с крупным объектом по центру.

Ingest: пресет `course_hero_image` с crop **16:10** max 1200×750 для legacy cover — дизайн-эталон для каталога остаётся **4:3**; при расхождении приоритет у этого гайда.

## Шаблон

[`assets/quest-catalog/catalog-safe-area.svg`](assets/quest-catalog/catalog-safe-area.svg)

## Правила приёмки

- Сюжет читается в квадратной сетке каталога (1–3 колонки).
- Нет важных деталей в нижней трети кадра.
- Hover scale 1.03 не обрезает лицо за пределы safe area.
