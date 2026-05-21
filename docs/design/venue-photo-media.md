# Venue Photo Media Guide

Фото площадки в сайдбаре страницы школы: [`apps/web/app/sites/[school]/page.tsx`](../../apps/web/app/sites/[school]/page.tsx).

Slot ID: `venue_photo`. Индекс: [image-templates-index.md](image-templates-index.md).

## Назначение

Блок «Фото площадки»: до четырёх кадров с подписью (`figcaption`). Изображение в `aspect-[16/10]`, `object-cover`, ширина колонки до ~24rem на desktop.

| Параметр | Значение |
|----------|----------|
| Соотношение | **16:10** |
| Минимум | 1280×800 |
| Safe area | центральные 60%×60% |
| Crop | `object-cover` |

## Шаблон

[`assets/venue-photo/photo-safe-area.svg`](assets/venue-photo/photo-safe-area.svg)

Легенда: [assets/_legend.svg](assets/_legend.svg).

## Данные

`venue.photos[]` — массив `{ url, alt? }` в Cold snapshot.

**Ingest (Cold Sheet):** колонка `photos_source_urls` (до 4 URL через `;`), опционально `photos_alt`. Если `photos_urls` пусто — при `make publish-sheet-cold` скачиваются исходники, обрабатываются пресетом `venue_photo`, пишутся в `public/venues/photos/{venue-slug}/1.webp` … `4.webp`, в snapshot подставляются пути `/venues/photos/{slug}/N.webp`. Если `photos_urls` уже заполнены — ingest фото пропускается (override). Источники: HTTPS или Google Drive; VK — нет.

Ручная заливка без Sheet: положить WebP в `public/venues/photos/{slug}/` и указать пути в `photos_urls`.

## Правила приёмки

- Вход, фасад или зал узнаваемы после crop 16:10.
- Без текста на фото (подпись — в UI под кадром).
- Главный объект в safe area при ширине сайдбара ~375px и ~384px (lg).
- Несколько фото одной площадки — единый стиль кадрирования.
