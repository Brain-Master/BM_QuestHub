# Дизайн: шаблоны изображений

Заготовки и гайды для подготовки фото и иллюстраций под сайт BM QuestHub. Дизайнер открывает **один индекс**, скачивает SVG под нужный слот, кладёт главный объект в safe area — UI не обрежет важное случайно.

## С чего начать

1. [image-templates-index.md](image-templates-index.md) — все слоты, соотношения, пути inbox/S3.
2. [pack/handbook.ru.md](pack/handbook.ru.md) — workflow дизайнера; **`make design-pack`** → `dist/design-pack/BM_QuestHub_Design_Pack_v1.zip` (PDF, PSD, CSV, previews).
3. [pack/media-inbox-layout.md](pack/media-inbox-layout.md) — дерево `media/inbox` (не колонки Sheet).
4. [school-agenda-landing-media.md](school-agenda-landing-media.md) — видео и галерея на `/sites/{school}/agenda/` (Sync, не Sheet).
5. [assets/_legend.svg](assets/_legend.svg) — общая легенда зон (видимая / градиент / скрытая).
6. Гайд по конкретному слоту из таблицы ниже.

## Гайды по слотам

| Слот | Документ | SVG |
|------|----------|-----|
| Расписание: hero / compact / mobile | [schedule-card-media.md](schedule-card-media.md) | [assets/schedule-card-media/](assets/schedule-card-media/) |
| Hero квеста / постер | [quest-hero-media.md](quest-hero-media.md) | [assets/quest-hero/](assets/quest-hero/) |
| Hero мира | [world-hero-media.md](world-hero-media.md) | тот же, что quest hero |
| Каталог квестов | [quest-catalog-media.md](quest-catalog-media.md) | [assets/quest-catalog/](assets/quest-catalog/) |
| Карточка города | [city-card-media.md](city-card-media.md) | [assets/city-card/](assets/city-card/) |
| Логотип площадки | [venue-logo-media.md](venue-logo-media.md) | [assets/venue-logo/](assets/venue-logo/) |
| Фото площадки | [venue-photo-media.md](venue-photo-media.md) | [assets/venue-photo/](assets/venue-photo/) |
| School agenda: landing video / галерея | [school-agenda-landing-media.md](school-agenda-landing-media.md) | reuse venue-photo 16:10 / 16:9 |
| Open Graph / соцсети | [og-share-media.md](og-share-media.md) | [assets/og-share/](assets/og-share/) |

## Связанные документы

- Загрузка в S3: [apps/web/media/README.md](../../apps/web/media/README.md)
- Inbox и publish: [apps/web/media/README.md](../../apps/web/media/README.md), `make publish-sheet-cold`
- Hot Sheet (без URL медиа): [docs/data/hot-schedule-data.md](../data/hot-schedule-data.md)
- Пресеты ingest (машинные размеры): [apps/web/lib/media/media-presets.ts](../../apps/web/lib/media/media-presets.ts)
