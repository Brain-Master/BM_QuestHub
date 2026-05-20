# Hero video — egress estimate (S3 vs VK)

**Checked:** 2026-05-20. Pilot targets: `media/quests/cyber-rhythm/hero.mp4`, `media/quests/minecraft-taina-drevnih-inzhenerov/hero.mp4`.

## Assumptions

| Parameter | Pilot value |
|-----------|-------------|
| Encoded file size | **3–5 MB** per hero (720p, ≤45 s, no audio, CRF 28) |
| Hero views / month (both pilots combined) | 500 / 2 000 / 10 000 |
| VK iframe | Player + API traffic **not counted** here (varies, often heavier first load) |

## S3 egress (Timeweb Object Storage)

Formula: `views × file_size`.

| Monthly views | @ 4 MB/view | @ 5 MB/view |
|---------------|-------------|-------------|
| 500 | **2 GB** | 2.5 GB |
| 2 000 | **8 GB** | 10 GB |
| 10 000 | **40 GB** | 50 GB |

Timeweb entry plans often include **~100 GB/month** egress ([timeweb-object-storage-pricing.md](./timeweb-object-storage-pricing.md)). Two hero files at moderate traffic usually stay inside the free tier.

Repeat views: `Cache-Control: public, max-age=31536000, immutable` on `media/*` — browser and intermediates cache; egress counts unique full downloads.

## When to re-estimate

- More than **~5** quest/world heroes on S3
- Autoplay enabled (increases starts)
- File size **> 8 MB** (raise CRF or shorten clip)
- Traffic **> 100 GB/month** → consider Timeweb CDN in front of the bucket

## Encode + upload

```bash
node scripts/encode-hero-video.mjs --slug cyber-rhythm --source /path/to/source.mp4
make s3-sync-media
```

Verify: `curl -sI "https://bm-questhub.s3.twcstorage.ru/media/quests/cyber-rhythm/hero.mp4"` → `200`.
