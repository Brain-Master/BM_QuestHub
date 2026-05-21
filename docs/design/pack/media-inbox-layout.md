# Структура media/inbox (Google Drive Sync)

Рабочая папка ingest локально: [`apps/web/media/inbox/`](../../../apps/web/media/inbox/).  
На Google Drive — то же дерево в **`BM_QuestHub_Media/Sync/`**:

**[Открыть BM_QuestHub_Media](https://drive.google.com/drive/folders/1mnzEh2-aqkzFaxg2oOtxX1E5KGrj0_1F)** → папка **`Sync`**

Реальные фото **не коммитим** в git (`media/inbox/**` в `.gitignore`). В репозитории только `.gitkeep` и заглушки в `media/placeholders/`.

| Команда | Кто | Действие |
|---------|-----|----------|
| `make media-pull` | Команда | Снимок сайта → **Sync/** (заглушки + локальные исходники) |
| `make media-push` | Разработчик | **Sync/** → inbox → publish → S3 |

Подпапка **`FOR_DESIGNER`** — только PDF/PSD из Design Pack, не рабочие `.source.*`.

## Дерево (внутри Sync/)

```text
BM_QuestHub_Media/
├── FOR_DESIGNER/           ← инструкции и PSD (не сюда кладут фото квестов)
└── Sync/                   ← рабочие исходники дизайнера (= media/inbox)
    ├── README.txt
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
    └── schedule/{shift_group_id}/     ← опционально; без своих фото — на сайте hero квеста
        ├── hero-16x9.source.jpg
        └── compact-4x3.source.jpg

`shift_group_id` в таблице может содержать `:` (например `quest:venue:2026-06-22:2026-06-26`).
В **Sync/** и `media/inbox/` папка называется с `__` вместо `:` (требование Windows).
На S3 путь остаётся с каноническим id: `media/schedule/{shift_group_id}/hero.webp`.
```

## Форматы

| Слой | Формат |
|------|--------|
| Inbox / Sync (дизайнер) | `.source.jpg`, `.source.png`, `.mp4` |
| После `publish-sheet-cold` / `hot` | `.webp`, `hero.mp4` (H.264) на S3 |
| Заглушки в git | `media/placeholders/*.placeholder.webp` |

## Имена файлов

Имена **жёсткие** — см. [`design-pack-slots.ts`](../../../apps/web/lib/media/design-pack-slots.ts) и CSV в Design Pack (`presets/vse_sloty.csv`).

На Drive при push: если файла ещё нет — заглушка или локальный исходник; **если дизайнер уже положил файл — push не перезаписывает** (сохраняем правки). Перезапись с локали: `make media-drive-push -- --force`.

## Google Sheets

Медиа **не** хранятся в таблице (ни URL, ни файлы). Исключение: `hero_video_embed_url` — ссылка на VK/YouTube, не файл.

Текст и структура (slug, даты, цены, описания) — только в Sheet.

## Связанные документы

- [handbook.ru.md](handbook.ru.md) — workflow для дизайнера
- [image-templates-index.md](../image-templates-index.md) — safe area по слотам
- [apps/web/media/README.md](../../../apps/web/media/README.md) — пути после ingest
