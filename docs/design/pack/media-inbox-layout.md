# Структура media/inbox (зеркало Google Drive)

Рабочая папка ingest: [`apps/web/media/inbox/`](../../../apps/web/media/inbox/).  
На Google Drive — тот же layout в `BM_QuestHub_Media/`.

Реальные фото **не коммитим** в git (`media/inbox/**` в `.gitignore`). В репозитории только `.gitkeep` и заглушки в `media/placeholders/`.

## Дерево

```text
BM_QuestHub_Media/          # Drive = apps/web/media/inbox/
├── README.txt
├── _templates/             # копия PSD из make design-pack
├── quests/{slug}/
│   ├── hero-16x9.source.jpg
│   ├── catalog-4x3.source.jpg
│   ├── hero.mp4            # опционально
│   └── og-1200x630.source.jpg
├── worlds/{slug}/
│   ├── hero-16x9.source.jpg
│   └── hero.mp4            # опционально
├── venues/{school-scope-slug}/
│   ├── logo-256.source.png
│   └── photo-01-16x10.source.jpg … photo-04
└── schedule/{shift_group_id}/
    ├── hero-16x9.source.jpg
    └── compact-4x3.source.jpg
```

## Форматы

| Слой | Формат |
|------|--------|
| Inbox (дизайнер) | `.source.jpg`, `.source.png`, `.mp4` |
| После `publish-sheet-cold` / `hot` | `.webp`, `hero.mp4` (H.264) на S3 |
| Заглушки в git | `media/placeholders/*.placeholder.webp` |

## Имена файлов

Имена **жёсткие** — см. [`design-pack-slots.ts`](../../../apps/web/lib/media/design-pack-slots.ts) и CSV в Design Pack (`presets/vse_sloty.csv`).

При каждом cold/hot publish, если исходника нет, в inbox копируется **заглушка с разметкой зон** (лог `placeholder`). Замените `.source.*` своим экспортом из PSD и снова запустите publish.

## Google Sheets

Медиа **не** хранятся в таблице (ни URL, ни файлы). Исключение: `hero_video_embed_url` — ссылка на VK/YouTube, не файл.

Текст и структура (slug, даты, цены, описания) — только в Sheet.

## Связанные документы

- [handbook.ru.md](handbook.ru.md) — workflow для дизайнера
- [image-templates-index.md](../image-templates-index.md) — safe area по слотам
- [apps/web/media/README.md](../../../apps/web/media/README.md) — пути после ingest
