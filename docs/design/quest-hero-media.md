# Quest Hero Media Guide

Баннер на странице квеста: [`apps/web/components/quest-hero-banner.tsx`](../../apps/web/components/quest-hero-banner.tsx) → [`HeroMediaStack`](../../apps/web/components/hero-media-stack.tsx).

Slot ID: `quest_hero`, `quest_hero_poster`. Индекс: [image-templates-index.md](image-templates-index.md).

## Назначение

- **hero** — фон баннера и постер до нажатия Play (если есть видео).
- С видео: контейнер `aspect-video` (16:9), max высота ~520px, `object-cover`.
- Без видео: min-height 200px (mobile) / 240px (desktop), ширина на всю колонку, `object-cover`.
- Поверх: градиент мира, при видео — затемнение (`brightness`, `opacity`), кнопка Play по центру.
- Заголовок и tagline — **ниже** баннера (не на фото), но при Play изображение остаётся под плеером.

## Мастер-кадр: 16:9

Ingest-пресет `course_hero_image` может отдавать 16:10 для каталога; **исходник для hero готовьте в 16:9**, чтобы совпадать с видео и `aspect-video`.

| Параметр | Значение |
|----------|----------|
| Соотношение | **16:9** |
| Минимум | 1920×1080 |
| Желательно | 2400×1350 |
| Формат | WebP (JPEG в Drive как исходник) |
| Safe area | центральные 60%×60% |

## Шаблоны SVG

Папка [`assets/quest-hero/`](assets/quest-hero/):

| Файл | Назначение |
|------|------------|
| `hero-safe-area.svg` | Мастер 16:9, safe area, Play, градиент снизу |
| `poster-safe-area.svg` | То же 1280×720 — постер / первый кадр видео |

Легенда: [assets/_legend.svg](assets/_legend.svg).

## Данные и пути

| Ввод | Snapshot / S3 |
|------|-----------------|
| Cold `hero_image_source_url` → ingest | `heroImageUrl`, S3 `media/quests/{slug}/hero.webp` |
| Видео ingest | `hero.mp4`, `poster.webp` |

См. [apps/web/media/README.md](../../apps/web/media/README.md).

## Правила приёмки

- Главный объект в safe area при 375 / 768 / 1440px.
- Центр кадра не перекрыт кнопкой Play (красная зона в шаблоне).
- Сюжет читается при затемнении под видео и world-gradient.
- Без мелкого текста на фото.
