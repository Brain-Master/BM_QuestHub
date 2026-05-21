# Media for Object Storage (`media/` prefix)

Upload-ready assets for Timeweb Object Storage. **Исходники дизайнера** — [`media/inbox/`](inbox/) локально; на Drive — **`BM_QuestHub_Media/Sync/`** ([папка](https://drive.google.com/drive/folders/1mnzEh2-aqkzFaxg2oOtxX1E5KGrj0_1F)).

| Команда | Назначение |
|---------|------------|
| **`make media-pull`** | Снимок сайта → **Sync/** на Drive (заглушки + что есть локально; то же `media-checkout`) |
| **`make media-push`** | **Sync/** → `media/inbox/` → publish → S3 (обновить сайт; то же `media-commit`) |
| `make media-drive-push` / `media-drive-pull` | То же, старые имена |
| `make media-scaffold` | Только локальные заглушки в `media/inbox/` |

Layout: [docs/design/pack/media-inbox-layout.md](../../docs/design/pack/media-inbox-layout.md).

## Pipeline

```text
publish-sheet-cold / hot
  → sync Sheet (текст)
  → ensureMediaInboxScaffold (заглушки с разметкой)
  → ingestMediaFromInbox (JPG/PNG/MP4 → WebP)
  → snapshots + make s3-sync-media
```

Локально без полного publish: `make media-scaffold` (только scaffold по текущим snapshot).

## Выходные пути

```text
media/quests/<slug>/hero.webp
media/quests/<slug>/catalog.webp
media/quests/<slug>/hero.mp4
media/quests/<slug>/poster.webp
media/worlds/<slug>/hero.webp
media/schedule/<shift_group_id>/hero.webp
media/schedule/<shift_group_id>/compact.webp
media/venues/logos/<school-scope-slug>.webp  (S3, не в static `out/`)
media/venues/photos/<venue-slug>/01.webp … 04.webp
```

| Путь | Гайд |
|------|------|
| `media/quests/{slug}/hero.webp`, `catalog.webp`, `hero.mp4` | [quest-hero-media.md](../../docs/design/quest-hero-media.md), [quest-catalog-media.md](../../docs/design/quest-catalog-media.md) |
| `media/worlds/{slug}/hero.webp` | [world-hero-media.md](../../docs/design/world-hero-media.md) |
| `media/schedule/…` | [schedule-card-media.md](../../docs/design/schedule-card-media.md) |
| `media/venues/…` | [venue-logo-media.md](../../docs/design/venue-logo-media.md), [venue-photo-media.md](../../docs/design/venue-photo-media.md) |

Миграция с `public/venues/`: `node scripts/migrate-venue-public-to-media.mjs` → `make s3-sync-media`.

Пресеты: [`lib/media/media-presets.ts`](../lib/media/media-presets.ts), слоты inbox: [`lib/media/design-pack-slots.ts`](../lib/media/design-pack-slots.ts).

## Hero video

Положите `hero.mp4` в `media/inbox/quests/{slug}/` или `worlds/{slug}/`. В Sheet — только `hero_video_embed_url` (VK/YouTube).

```bash
make encode-hero-video SLUG=cyber-rhythm SOURCE=/path/to/in.mp4
make s3-sync-media
```

## Design Pack

`make design-pack` → `dist/design-pack/BM_QuestHub_Design_Pack_v1.zip` (PDF/DOCX, CSV, SVG, PSD).

Заглушки с зонами: `make media-placeholders` → `media/placeholders/*.placeholder.webp`.

Sync: `make s3-sync-media` — [timeweb-object-storage-setup.md](../../docs/deployment/timeweb-object-storage-setup.md).

