# BM_QuestHub_Data на Google Drive

Текстовые данные сайта редактируются в **Google Sheets** (не в файлах на Drive).  
Папка **BM_QuestHub_Data** — инструкции для маркетолога, менеджера (на **одном уровне** с **BM_QuestHub_Media**, не внутри неё).

```text
Google Drive (Мой диск)
├── BM_QuestHub_Media/     ← GOOGLE_MEDIA_DRIVE_FOLDER_ID
│   ├── Sync/              ← фото (make media-pull / media-push)
│   └── FOR_DESIGNER/      ← PDF/PSD (make design-pack)
└── BM_QuestHub_Data/      ← GOOGLE_DATA_DRIVE_FOLDER_ID
    └── FOR_EDITORS/       ← инструкции (make data-docs-push)
```

Создайте **две отдельные папки** на Drive и укажите **два ID** в `scripts/design-pack.env`.

| Папка | Ссылка |
|-------|--------|
| BM_QuestHub_Media | [открыть](https://drive.google.com/drive/folders/1mnzEh2-aqkzFaxg2oOtxX1E5KGrj0_1F) |
| BM_QuestHub_Data | [открыть](https://drive.google.com/drive/folders/1Z4QNUW02CFjF6bbWwIUqG1EvIVroqp7T) |

## Таблицы (источник правды)

| Tier | Назначение | Ссылка |
|------|------------|--------|
| **Hot** | Расписание, смены, тарифы | [Google Sheet Hot](https://docs.google.com/spreadsheets/d/1ut5AhfJqx9wrJE3tTCzrkrQdCmWsCPB8cueHH3QsLy8/edit) |
| **Cold** | Миры, площадки, курсы | [Google Sheet Cold](https://docs.google.com/spreadsheets/d/1fqeVC8BhjGWtOR20NhCUQuhwgchkCCzYsmiudpGE4jc/edit) |

Подробно: [google-sheets-editor-guide.md](../google-sheets-editor-guide.md), [hot-schedule-data.md](../hot-schedule-data.md).

## Команды (разработчик)

| Команда | Действие |
|---------|----------|
| **`make data-pull`** | Снимок с сайта (JSON в репо) → **Google Sheets** |
| **`make data-push`** | Sheets → S3 (`publish-sheet-cold` + `hot` + `s3-sync-data-*`) |
| `make data-docs-push` | Обновить TXT в **BM_QuestHub_Data/FOR_EDITORS** |
| `make data-checkout` | = `data-pull` |
| `make data-commit` | = `data-push` |

Публикация из таблицы: **BrainMaster → Опубликовать** ([google-apps-script-publish.js](../google-apps-script-publish.js)).

## Workflow

**Команда:** `make data-pull` → редакторы правят **Sheets** → `make data-push` (или кнопка в Sheet).

**Дизайнер:** [BM_QuestHub_Media/Sync/](https://drive.google.com/drive/folders/1mnzEh2-aqkzFaxg2oOtxX1E5KGrj0_1F) — `make media-pull` / `make media-push` ([media-inbox-layout.md](../../design/pack/media-inbox-layout.md)).
