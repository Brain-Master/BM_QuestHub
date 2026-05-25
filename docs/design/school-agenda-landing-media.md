# School agenda landing media

Страница `/sites/{school}/agenda/`: короткое видео (~30 с) и горизонтальная галерея «Как проходят наши занятия».

Медиа **не** задаются в Google Sheet / Cold YAML. Workflow такой же, как у остального сайта:

1. `make media-pull` — снимок структуры на Drive **Sync/**
2. Дизайнер кладёт или заменяет файлы **с теми же именами**
3. `make media-push` — ingest → S3

## Папки на Drive (Sync/)

```text
venues/_default/                    # универсальный альбом и видео по умолчанию
  landing-30s.mp4                   # опционально
  landing-poster.source.jpg
  activity-gallery/
    gallery-01.source.jpg … gallery-12.source.jpg
     gallery-01.caption.txt         # опционально, подпись в lightbox

venues/school-17/                   # school-scope-slug (как logo)
  landing-30s.mp4
  landing-poster.source.jpg
  activity-gallery/
    gallery-01.source.jpg …
```

Имена жёсткие — см. [`design-pack-slots.ts`](../../apps/web/lib/media/design-pack-slots.ts).

## Правила на сайте

| Элемент | Площадка | Fallback `_default` | Если оба пусты |
|---------|----------|---------------------|----------------|
| Галерея | фото 01…12 | если у площадки нет своих — только default; если у площадки есть — сначала они, потом default | блок скрыт |
| Видео | `landing-30s.mp4` | default mp4 | блок скрыт |
| Постер | `landing-poster` | default poster | первое фото галереи |

Подписи к фото: файл `gallery-NN.caption.txt` рядом с `gallery-NN.source.jpg`.

## После push

Файлы на S3:

```text
media/venues/school-17/landing-30s.mp4
media/venues/school-17/landing-poster.webp
media/venues/school-17/activity-gallery/01.webp
media/venues/_default/activity-gallery/01.webp
```

Индекс опубликованных файлов — [`apps/web/data/media-ingest-manifest.json`](../../apps/web/data/media-ingest-manifest.json). Сайт читает manifest при сборке.

## Связанные документы

- [media-inbox-layout.md](pack/media-inbox-layout.md) — полное дерево Sync
- [apps/web/media/README.md](../../apps/web/media/README.md) — команды pipeline
- Design Pack ZIP: `03_School_agenda_media.pdf`, `02_Структура_inbox.pdf`
