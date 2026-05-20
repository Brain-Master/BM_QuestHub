# Pilot: cyber-rhythm hero video

Place source as `source.mp4` (or pass any path), then from repo root:

```bash
node scripts/encode-hero-video.mjs --slug cyber-rhythm --source path/to/short-clip.mp4
make s3-sync-media
```

Snapshot field: `heroVideoFileUrl: "media/quests/cyber-rhythm/hero.mp4"`.
