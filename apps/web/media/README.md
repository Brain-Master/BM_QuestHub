# Media for Object Storage (`media/` prefix)

Upload-ready assets for Timeweb Object Storage. Layout:

```text
media/quests/<quest-slug>/hero.mp4
media/quests/<quest-slug>/poster.webp
media/worlds/<world-slug>/hero.mp4
media/worlds/<world-slug>/poster.webp
```

Public URLs:

```text
{NEXT_PUBLIC_S3_PUBLIC_BASE_URL}/media/quests/<slug>/hero.mp4
```

## Hero video (pilot)

| Slug | Sheet field | S3 key |
|------|-------------|--------|
| `cyber-rhythm` | `hero_video_file_url` | `media/quests/cyber-rhythm/hero.mp4` |
| `minecraft-taina-drevnih-inzhenerov` | `hero_video_file_url` | `media/quests/minecraft-taina-drevnih-inzhenerov/hero.mp4` |

VK full version: `hero_video_embed_url` (embed, loads on click).

Encode from source (requires **ffmpeg**):

```bash
node scripts/encode-hero-video.mjs --slug cyber-rhythm --source /path/to/source.mp4
node scripts/encode-hero-video.mjs --slug cyber-rhythm --kind world --source /path/to/source.mp4
make s3-sync-media
```

Egress planning: [hero-video-egress.md](../../docs/deployment/hero-video-egress.md).

## Images (schedule / catalog)

```text
media/quests/<quest-slug>/hero.webp
media/quests/<quest-slug>/compact.webp
```

Sync: `make s3-sync-media` (requires AWS CLI or SDK and `scripts/s3.env` — see [timeweb-object-storage-setup.md](../../docs/deployment/timeweb-object-storage-setup.md)).
