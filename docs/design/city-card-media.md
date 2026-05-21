# City Card Media Guide

Карточка города в сетке выбора: [`apps/web/components/city-selection-grid.tsx`](../../apps/web/components/city-selection-grid.tsx).

Slot ID: `city_card`.

| Параметр | Значение |
|----------|----------|
| Соотношение | **16:10** |
| Минимум | 1280×800 |
| Safe area | центральные 60%×60% |
| Crop | `object-cover`, hover `scale-[1.03]` |

## Шаблон

[`assets/city-card/city-safe-area.svg`](assets/city-card/city-safe-area.svg)

## Данные

`City.imageUrl` — путь в `public/` (например `/cities/moscow.webp`).

## Правила приёмки

- Город/ландмарк узнаваем после лёгкого zoom.
- Без текста на фото (название города в UI).
