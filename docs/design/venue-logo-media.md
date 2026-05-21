# Venue Logo Media Guide

Логотип площадки в карточках и на карте: [`apps/web/components/site-selection-grid.tsx`](../../apps/web/components/site-selection-grid.tsx) (`LogoMark`), [`sites-map-schematic.tsx`](../../apps/web/components/sites-map-schematic.tsx).

Slot ID: `venue_logo`.

## Назначение

Квадратный контейнер, **`object-contain`** (не cover), padding, белый фон, ring. Логотип не обрезается — важны отступы и прозрачный фон.

| Параметр | Значение |
|----------|----------|
| Исходник | **256×256** PNG/WebP с прозрачностью |
| Выход ingest | 128×128 WebP |
| Safe area | центральные **70%** — весь знак внутри |
| Фон | прозрачный; не класть мелкий текст к краям |

## Шаблон

[`assets/venue-logo/logo-safe-area.svg`](assets/venue-logo/logo-safe-area.svg)

## Данные

Inbox `venues/{school-scope-slug}/logo-256.source.png` → `media/venues/logos/{school-scope-slug}.webp` (S3), поле `logoUrl` в map snapshot после publish.

Ingest-пресет: `venue_logo`.

## Правила приёмки

- Читаемо в 56×56 и 64×64 px на экране.
- Контраст на белом фоне карточки.
