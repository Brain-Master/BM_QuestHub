# Catalog and map snapshot contract

Public CDN/S3 payloads for course/universe/venue content. Replaces build-time YAML when published by the producer.

## Files

| File | Purpose |
|------|---------|
| `data/v2/catalog-snapshot.json` | `worlds[]` + `courses[]` (quests without `offers`) |
| `data/v2/map-snapshot.json` | `venues[]` |
| `data/v2/detail/<courseSlug>.json` | Optional full course body (same shape as catalog course) |
| `data/v2/site-manifest.json` | Points to catalog, map, schedule, site config |

## Top-level shape

### `catalog-snapshot.json`

- `version`: `2`
- `generatedAt`: ISO-8601
- `source`: producer id
- `integrity`: optional `{ contentHash }`
- `worlds`: array — [`worldSchema`](../../apps/web/lib/schemas.ts)
- `courses`: array — quest fields without `offers` (schedule merged at load)

### `map-snapshot.json`

- `version`, `generatedAt`, `source`, `integrity`
- `venues`: array — [`venueSchema`](../../apps/web/lib/schemas.ts)

### `detail/<slug>.json`

- `version`, `generatedAt`, `source`, `integrity`
- `course`: single course object (no `offers`)

## Loader behavior

[`apps/web/lib/content/load.ts`](../../apps/web/lib/content/load.ts):

1. Try catalog/map/detail from manifest paths (local or `SITE_SNAPSHOT_SOURCE=s3`).
2. Fall back to `content/**/*.yaml` when snapshots are missing.

## Export from YAML

```bash
node scripts/export-yaml-to-snapshots.mjs
make validate-snapshots
```

Updates `data/v2/site-manifest.json` snapshot pointers.

## Private fields

Same denylist as [site-snapshot-v2-contract.md](./site-snapshot-v2-contract.md). Validated by `make validate-snapshots`.
