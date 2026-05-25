# Venue Photo Media Guide

Фото площадки в сайдбаре страницы школы: [`apps/web/app/sites/[school]/page.tsx`](../../apps/web/app/sites/[school]/page.tsx).

Slot ID: `venue_photo`. Индекс: [image-templates-index.md](image-templates-index.md).

> **Не путать** с галереей school agenda (`activity-gallery/gallery-01…` на `/sites/{school}/agenda/`). Там отдельные слоты — см. [school-agenda-landing-media.md](school-agenda-landing-media.md).

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

**Ingest (Cold Sheet):** inbox `venues/{scope}/photo-01-16x10.source.jpg` … → пресет `venue_photo` → `media/venues/photos/{venue-slug}/01.webp` … `04.webp` на S3; в snapshot — `media/venues/photos/…` (старые `/venues/photos/…` тоже резолвятся в S3 через `resolvePublicMediaUrl`).

Ручная заливка: исходники в `media/inbox/venues/{scope}/`, затем `make publish-sheet-cold` или `make media-push`.

## Правила приёмки

- Вход, фасад или зал узнаваемы после crop 16:10.
- Без текста на фото (подпись — в UI под кадром).
- Главный объект в safe area при ширине сайдбара ~375px и ~384px (lg).
- Несколько фото одной площадки — единый стиль кадрирования.
