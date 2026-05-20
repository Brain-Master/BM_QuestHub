# Content deploy vs code deploy (hybrid)

**Статус, диагностика и план работ:** [content-pipeline-status-plan.md](./content-pipeline-status-plan.md) (актуальный сводный документ).

Static Timeweb App with **Google Sheets** as editor UI (этап 1) and optional CMS later (этап 2).

| Tier | Source | On site | Timeweb rebuild |
|------|--------|---------|-----------------|
| **Hot** | [Hot spreadsheet](../data/google-sheets-editor-guide.md) → `offers-snapshot.json` | ~60s (browser poll) | **No** |
| **Cold** | [Cold spreadsheet](../data/google-sheets-editor-guide.md) → catalog/map/detail | 2–5 min | **Yes** |

## Editor workflow (Sheets)

1. Edit hot or cold Google Sheet.
2. **BrainMaster → Опубликовать** (Apps Script → `POST /sync/hot` or `/sync/cold` on Yandex content-admin).
3. GitHub Actions [`sheet-sync.yml`](../../.github/workflows/sheet-sync.yml) runs sync → tier-specific S3 upload → (cold) Timeweb deploy.

## S3 upload (tier-isolated)

| Target | CLI / CI | S3 path |
|--------|----------|---------|
| **Hot** | `data-hot` — [`sync-s3-public.mjs`](../../scripts/sync-s3-public.mjs) | `data/offers-snapshot.json` only (no delete of `data/v2/`) |
| **Cold** | `data-cold` | `data/v2/**` only (does not touch schedule snapshot) |
| **Bootstrap** | `data` — `make s3-sync-data` | full `data/` tree |

Cold publish must not upload the whole `data/` folder: checkout can contain a stale `offers-snapshot.json` from git and overwrite the live schedule on S3.

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

`make publish-sheet-cold` and GitHub Actions call [`scripts/timeweb-deploy.mjs`](../../scripts/timeweb-deploy.mjs). In CI, `GITHUB_SHA` is passed so deploy does not depend on Timeweb’s GitHub VCS API. Locally, commit SHA is resolved from the app’s branch (`TIMEWEB_DEPLOY_BRANCH` in `scripts/timeweb.env`) unless `TIMEWEB_COMMIT_SHA` is set.

## Code deploy

Git push → Timeweb — React/TS only.

## API

[`apps/yandex-content-admin`](../../apps/yandex-content-admin/): `POST /sync/hot`, `POST /sync/cold`, `POST /publish?tier=`.

## Related

- [hot-schedule-data.md](../data/hot-schedule-data.md) — структура HOT (Sheets → snapshot → UI)
- [google-sheets-editor-guide.md](../data/google-sheets-editor-guide.md)
- [cms-roadmap.md](./cms-roadmap.md)
- [catalog-snapshot-contract.md](../data/catalog-snapshot-contract.md)
- [schedule-snapshot-contract.md](../data/schedule-snapshot-contract.md)
