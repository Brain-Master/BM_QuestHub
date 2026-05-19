# Timeweb App Platform — Quest Hub (static Next.js)

Deploy the static export from [`apps/web`](../../apps/web) (`output: "export"` → `apps/web/out`).

**Related:** [timeweb-object-storage-setup.md](./timeweb-object-storage-setup.md), [static-hosting-s3-yandex.md](./static-hosting-s3-yandex.md), [SECURITY-api-keys.md](./SECURITY-api-keys.md)

## Prerequisites

1. Public JSON on Timeweb S3 (`make s3-sync-data`) — App build fetches snapshots over HTTP when `*_SNAPSHOT_SOURCE=s3`.
2. GitHub repo: `Brain-Master/BM_QuestHub`.
3. **SSR disabled** when creating the app (cannot be turned off later).

## Create app (panel)

[App Platform → Create](https://timeweb.cloud/my/apps/create)

| Setting | Value |
|---------|--------|
| Type | Next.js (frontend) |
| SSR | **Off** |
| Repository | `Brain-Master/BM_QuestHub` |
| Branch | `main` (recommended for production) |
| Root directory | repository root |
| Build command | `npm run build` |
| Output directory | `apps/web/out` |

Alternative if the UI only allows app subfolder:

| Setting | Value |
|---------|--------|
| Root directory | `apps/web` |
| Build command | `npm run build` |
| Output directory | `out` |

Connect GitHub OAuth, enable deploy on push if desired.

## Build environment variables

Copy from [`apps/web/timeweb.app.env.example`](../../apps/web/timeweb.app.env.example). Minimum:

```text
NEXT_PUBLIC_SITE_URL=https://quest.b-master.pro
NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://bm-questhub.s3.twcstorage.ru
NEXT_PUBLIC_LEAD_SUBMIT_URL=https://functions.yandexcloud.net/d4ellekng389grh5rck4
NEXT_PUBLIC_YM_ID=
OFFERS_SNAPSHOT_SOURCE=s3
SITE_SNAPSHOT_SOURCE=s3
```

Do not set `AWS_*` or `GOOGLE_*` here.

## Domains and school subdomains

| Host | Role |
|------|------|
| `quest.b-master.pro` | Primary site |
| `b-master.pro` | Marketing / redirect (optional, separate config) |
| `1517.b-master.pro`, other `*.b-master.pro` | School aliases → rewrite to `/sites/<id>/...` |

In App Platform: add domain → set DNS (CNAME) as shown in the panel → wait for SSL.

School subdomain routing is a **CDN / reverse-proxy** concern; the app uses path-based routes (`/sites/school-1517/...`). See [static-hosting § School Subdomains](./static-hosting-s3-yandex.md#school-subdomain-aliases).

Update Yandex lead receiver `ALLOWED_ORIGINS` — see [`apps/yandex-lead-receiver/.env.example`](../../apps/yandex-lead-receiver/.env.example).

## Post-deploy checks

- Home, `/agenda`, `/catalog`, a school page load.
- Lead form POST returns 200 (CORS origins include production URL).
- Media/JSON URLs use `*.s3.twcstorage.ru` when configured in data.

## API automation (optional)

Timeweb Cloud API: `POST https://api.timeweb.cloud/api/v1/apps` with `Authorization: Bearer $TIMEWEB_API_TOKEN`. Prefer the panel for the first deploy (GitHub linking).
