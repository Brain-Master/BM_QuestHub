# Content deploy vs code deploy (hybrid)

Static Timeweb App with **Google Sheets** as editor UI (этап 1) and optional CMS later (этап 2).

| Tier | Source | On site | Timeweb rebuild |
|------|--------|---------|-----------------|
| **Hot** | [Hot spreadsheet](../data/google-sheets-editor-guide.md) → `offers-snapshot.json` | ~60s (browser poll) | **No** |
| **Cold** | [Cold spreadsheet](../data/google-sheets-editor-guide.md) → catalog/map/detail | 2–5 min | **Yes** |

## Editor workflow (Sheets)

1. Edit hot or cold Google Sheet.
2. **BrainMaster → Опубликовать** (Apps Script → `POST /sync/hot` or `/sync/cold` on Yandex content-admin).
3. GitHub Actions [`sheet-sync.yml`](../../.github/workflows/sheet-sync.yml) runs sync → S3 → (cold) Timeweb deploy.

## Local commands

```bash
cp scripts/sheets.env.example scripts/sheets.env
# GOOGLE_SERVICE_ACCOUNT_JSON + share spreadsheets with client_email

make seed-sheet-headers    # first-time column headers
make publish-sheet-hot     # schedule → S3
make publish-sheet-cold    # catalog → S3 + Timeweb

# Legacy / dev
make export-yaml-snapshots
make content-publish-hot
make content-publish
```

## Hot path (runtime)

Browser fetches `${NEXT_PUBLIC_S3_PUBLIC_BASE_URL}/data/offers-snapshot.json` (SWR, 60s). **CORS** on S3 — [`scripts/timeweb-s3-cors.example.json`](../../scripts/timeweb-s3-cors.example.json).

## Cold path (SEO HTML)

Timeweb build with `SITE_SNAPSHOT_SOURCE=s3` bakes catalog/map into HTML after deploy.

## Code deploy

Git push → Timeweb — React/TS only.

## API

[`apps/yandex-content-admin`](../../apps/yandex-content-admin/): `POST /sync/hot`, `POST /sync/cold`, `POST /publish?tier=`.

## Related

- [google-sheets-editor-guide.md](../data/google-sheets-editor-guide.md)
- [cms-roadmap.md](./cms-roadmap.md)
- [catalog-snapshot-contract.md](../data/catalog-snapshot-contract.md)
- [schedule-snapshot-contract.md](../data/schedule-snapshot-contract.md)
