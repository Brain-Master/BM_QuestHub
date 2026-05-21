# World Hero Media Guide

Баннер хаба мира: [`apps/web/components/world-hub-hero.tsx`](../../apps/web/components/world-hub-hero.tsx) → тот же [`HeroMediaStack`](../../apps/web/components/hero-media-stack.tsx), что и у квеста.

Slot ID: `world_hero` (alias логики `quest_hero`).

## Требования

Используйте те же правила и SVG, что в [quest-hero-media.md](quest-hero-media.md):

- Мастер **16:9**, min 1920×1080.
- Шаблоны: [`assets/quest-hero/hero-safe-area.svg`](assets/quest-hero/hero-safe-area.svg).

## Данные и пути

| Ввод | Результат |
|------|-----------|
| Cold лист «Миры» `hero_image_source_url` | `heroImageUrl` |
| S3 | `media/worlds/{slug}/hero.webp`, `poster.webp`, `hero.mp4` |

Ingest-пресет: `world_hero_image` → slot `world_hero`.
