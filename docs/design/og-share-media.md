# Open Graph / Social Share Media Guide

Превью при шаринге ссылок на квест или мир: [`apps/web/app/quests/[slug]/page.tsx`](../../apps/web/app/quests/[slug]/page.tsx), [`apps/web/app/worlds/[slug]/page.tsx`](../../apps/web/app/worlds/[slug]/page.tsx) — `og:image` = `heroImageUrl`.

Slot ID: `og_social`.

## Назначение

Соцсети и мессенджеры показывают картинку **без** UI-сайта. Кроп платформы непредсказуем — готовьте отдельный кадр или центрируйте сюжет в safe area.

| Параметр | Значение |
|----------|----------|
| Соотношение | **1.91:1** (стандарт OG) |
| Размер | **1200×630** |
| Формат | WebP или JPEG |
| Safe area | центральные ~65%×75% |

## Шаблон

[`assets/og-share/og-safe-area.svg`](assets/og-share/og-safe-area.svg)

## Связь с hero

- Можно экспортировать отдельный OG-кадр из мастера 16:9 (центральный crop).
- Ingest-пресет `og_share` — отдельный выход 1200×630 (см. `media-presets.ts`).

## Правила приёмки

- Заголовок квеста **не** на изображении (он в meta title).
- Лицо/логотип не у самого края — Telegram/Facebook обрежут.
- Контраст достаточный на тёмном фоне превью в ленте.
