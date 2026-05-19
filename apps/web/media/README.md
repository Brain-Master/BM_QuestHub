# Media for Object Storage (`media/` prefix)

Upload-ready assets for Timeweb Object Storage. Layout matches the public CDN convention:

```text
media/quests/<quest-slug>/<file>
media/worlds/<world-slug>/<file>
```

After upload, URLs look like:

```text
{NEXT_PUBLIC_S3_PUBLIC_BASE_URL}/media/quests/<slug>/hero.webp
```

Sync: `make s3-sync-media` (requires AWS CLI and `scripts/s3.env` — see [timeweb-object-storage-setup.md](../../../docs/deployment/timeweb-object-storage-setup.md)).
