# Структура media/inbox (Google Drive Sync)

Рабочая папка ingest локально: [`apps/web/media/inbox/`](../../../apps/web/media/inbox/).  
На Google Drive — то же дерево в **`BM_QuestHub_Media/Sync/`**:

**[Открыть BM_QuestHub_Media](https://drive.google.com/drive/folders/1mnzEh2-aqkzFaxg2oOtxX1E5KGrj0_1F)** → папка **`Sync`**

Реальные фото **не коммитим** в git (`media/inbox/**` в `.gitignore`). В репозитории только `.gitkeep` и заглушки в `media/placeholders/`.

GitHub Actions `sheet-sync.yml` читает это же дерево через service account (Drive pull перед sync).  
Папка `BM_QuestHub_Media` должна быть расшарена на `client_email` из `GOOGLE_SERVICE_ACCOUNT_JSON` минимум с правом Viewer.

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
    │   ├── photo-01-16x10.source.jpg … photo-04
    │   ├── landing-30s.mp4              # опционально, school agenda
    │   ├── landing-poster.source.jpg    # опционально
    │   └── activity-gallery/
    │       ├── gallery-01.source.jpg … gallery-12
    │       └── gallery-01.caption.txt   # опционально
    ├── venues/_default/                 # универсальный альбом / видео по умолчанию
    │   ├── landing-30s.mp4
    │   ├── landing-poster.source.jpg
    │   └── activity-gallery/
    │       └── gallery-01.source.jpg …
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

## School agenda landing (видео + галерея)

Медиа для `/sites/{school}/agenda/` **не** задаются в Cold Sheet. Только файлы в **Sync/** → `make media-push` → S3 + [`media-ingest-manifest.json`](../../../apps/web/data/media-ingest-manifest.json).

| Ситуация | Галерея | Видео | Постер |
|----------|---------|-------|--------|
| Альбом площадки пуст | только `_default/activity-gallery/` | venue mp4 → `_default` mp4 → нет блока | venue → default → 1-е фото галереи |
| Альбом площадки есть | сначала площадка, потом `_default` | то же | то же |
| `_default` и площадка пусты | блок скрыт | нет default mp4 → нет блока | — |

Подробнее: [school-agenda-landing-media.md](../school-agenda-landing-media.md).

## Связанные документы



- [handbook.ru.md](handbook.ru.md) — workflow для дизайнера
- [school-agenda-landing-media.md](../school-agenda-landing-media.md) — видео и галерея school agenda (в Design Pack: `03_School_agenda_media.pdf`)
- [image-templates-index.md](../image-templates-index.md) — safe area по слотам
- [apps/web/media/README.md](../../../apps/web/media/README.md) — пути после ingest
