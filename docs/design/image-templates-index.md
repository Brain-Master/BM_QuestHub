# Индекс шаблонов изображений

Источник правды для дизайнеров. Технические пресеты CI: [`apps/web/lib/media/media-presets.ts`](../../apps/web/lib/media/media-presets.ts) — те же **slot ID**, другие имена пресетов ingest.

Легенда зон: [assets/_legend.svg](assets/_legend.svg).

| Зона | В шаблоне | Смысл |
|------|-----------|--------|
| Видимая | Пунктир cyan | Safe area — главный объект |
| Градиент | Чёрная заливка | Затемнение под текст UI |
| Скрытая | Красная заливка | Бейджи, Play, перекрытия |

## Сводная таблица слотов

| Slot ID | Где в UI | Соотношение | Min / ideal px | Inbox filename | S3 / public | Гайд | Шаблон |
|---------|----------|-------------|----------------|----------------|-------------|------|--------|
| `schedule_hero` | Detailed-карточка расписания | 16:9, fluid height | 1600×900 / 2400×1350 | `schedule/{shift_group_id}/hero-16x9.source.jpg` | `media/schedule/{id}/hero.webp` | [schedule-card-media.md](schedule-card-media.md) | да |
| `schedule_compact` | Compact-карточка | 4:3, fade справа | 1200×800 | `…/compact-4x3.source.jpg` | `…/compact.webp` | schedule-card-media | да |
| `schedule_mobile_thumb` | Мобильный список смен | ~1:1 миниатюра | reuse compact | compact ?? hero | то же | schedule-card-media | да |
| `quest_hero` | Страница квеста, баннер | 16:9 master | 1920×1080 / 2400×1350 | `quests/{slug}/hero-16x9.source.jpg` | `media/quests/{slug}/hero.webp` | [quest-hero-media.md](quest-hero-media.md) | да |
| `quest_hero_poster` | Постер до Play | 16:9 | 1280×720 | `hero.mp4` → ffmpeg | `media/quests/{slug}/poster.webp` | quest-hero-media | да |
| `world_hero` | Хаб мира | как quest_hero | как quest_hero | `worlds/{slug}/hero-16x9.source.jpg` | `media/worlds/{slug}/hero.webp` | [world-hero-media.md](world-hero-media.md) | alias quest |
| `quest_catalog` | Карточка в каталоге | 4:3 | 1200×900 / 1600×1200 | `catalog-4x3.source.jpg` | `media/quests/{slug}/catalog.webp` | [quest-catalog-media.md](quest-catalog-media.md) | да |
| `city_card` | Выбор города | 16:10 | 1280×800 | (вне inbox v1) | `public/cities/…` | [city-card-media.md](city-card-media.md) | да |
| `venue_logo` | Логотип площадки | 1:1 contain | 256×256 → 128×128 | `venues/{scope}/logo-256.source.png` | `media/venues/logos/{scope}.webp` | [venue-logo-media.md](venue-logo-media.md) | да |
| `venue_photo` | Фото площадки (сайдбар) | 16:10 | 1280×800 | `photo-01-16x10.source.jpg` … | `media/venues/photos/{slug}/NN.webp` | [venue-photo-media.md](venue-photo-media.md) | да |
| `venue_landing_poster` | School agenda: постер видео | 16:9 | 1920×1080 | `venues/{scope}/landing-poster.source.jpg` | `media/venues/{scope}/landing-poster.webp` | [school-agenda-landing-media.md](school-agenda-landing-media.md) | reuse venue-photo |
| `venue_activity_gallery` | School agenda: галерея | 16:10 | 1600×1000 | `…/activity-gallery/gallery-01.source.jpg` … `12` | `…/activity-gallery/NN.webp` | school-agenda-landing-media | reuse venue-photo |
| `venue_landing_video` | School agenda: ~30 с MP4 | 16:9 | 1280×720 | `…/landing-30s.mp4` | `…/landing-30s.mp4` (H.264) | school-agenda-landing-media | — |
| `og_social` | Open Graph | 1.91:1 | 1200×630 | `og-1200x630.source.jpg` | `media/quests/{slug}/og.webp` | [og-share-media.md](og-share-media.md) | да |

## Маппинг ingest → design slot

| Пресет `media-presets.ts` | Design slot ID |
|---------------------------|----------------|
| `course_hero_image` | `quest_hero` |
| `course_catalog_image` | `quest_catalog` |
| `course_hero_video` (+ poster) | `quest_hero_poster` |
| `world_hero_image` | `world_hero` |
| `venue_logo` | `venue_logo` |
| `venue_photo` | `venue_photo` |
| `venue_landing_poster` | `venue_photo` (reuse safe area) |
| `venue_activity_gallery` | `venue_photo` (reuse 16:10) |
| `schedule_card_hero` | `schedule_hero` |
| `schedule_card_compact` | `schedule_compact` |
| `og_share` | `og_social` |

## Общий чеклист приёмки

- Главный объект в safe area на ширинах **375px**, **768px**, **1440px**.
- Нет критичного текста на фото (текст — в UI).
- После градиентов и бейджей сюжет остаётся читаемым.
- Формат отдачи: **WebP** (JPEG допустим как исходник в Drive).
- Для расписания: отдельные кадры hero и compact, если crop сильно различается.

## Компоненты (для разработчиков)

| Slot | Компонент |
|------|-----------|
| schedule_* | `apps/web/components/schedule-media.tsx` |
| quest_hero, world_hero | `apps/web/components/hero-media-stack.tsx` |
| quest_catalog | `apps/web/components/quest-card.tsx` |
| city_card | `apps/web/components/city-selection-grid.tsx` |
| venue_logo | `apps/web/components/site-selection-grid.tsx` (`LogoMark`) |
| venue_photo | `apps/web/app/sites/[school]/page.tsx` |
| venue_landing_poster, venue_activity_gallery | `apps/web/app/sites/[school]/agenda/page.tsx`, `school-landing-video.tsx`, `activity-photo-gallery.tsx` |
