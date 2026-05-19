# Timeweb App Platform — Quest Hub (static Next.js)

Deploy the static export from [`apps/web`](../../apps/web) (`output: "export"` → `apps/web/out`).

**Related:** [timeweb-object-storage-setup.md](./timeweb-object-storage-setup.md), [timeweb-deploy-checklist.md](./timeweb-deploy-checklist.md), [static-hosting-s3-yandex.md](./static-hosting-s3-yandex.md), [SECURITY-api-keys.md](./SECURITY-api-keys.md)

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
SITE_SNAPSHOT_STRICT=1
```

Build runs `verify:s3` before `next build` when snapshot sources are `s3`; empty or missing S3 data fails the build instead of shipping an empty schedule.

Do not set `AWS_*` or `GOOGLE_*` here.

## Domains and school subdomains

| Host | Role |
|------|------|
| `quest.b-master.pro` | Primary site |
| `b-master.pro` | Marketing / redirect (optional, separate config) |
| `1517.b-master.pro`, other `*.b-master.pro` | School aliases (client redirect to `/sites/<routeSlug>/...`) |

DNS wildcard `*` to the app IP is enough for routing; **TLS** may still need a wildcard certificate
or per-host binding in the panel.

School aliases are implemented in the static bundle — see [static-hosting § School Subdomain Aliases](./static-hosting-s3-yandex.md#school-subdomain-aliases).
Regenerate hosts after adding a venue: `node scripts/generate-host-aliases.mjs`.

Update Yandex lead receiver `ALLOWED_ORIGINS` for each new school host (or use the env-patch script) —
see [`apps/yandex-lead-receiver/.env.example`](../../apps/yandex-lead-receiver/.env.example).

## Post-deploy checks

- Home, `/agenda`, `/catalog`, a school page load.
- Lead form POST returns 200 (CORS origins include production URL).
- Media/JSON URLs use `*.s3.twcstorage.ru` when configured in data.

## Automation scripts

With `TIMEWEB_API_TOKEN` in `scripts/timeweb.env`:

```bash
make timeweb-setup          # S3 bucket + upload data/
node scripts/timeweb-apps.mjs repos   # list GitHub repos (after linking provider)
node scripts/timeweb-apps.mjs create --name bm-questhub --branch main
node scripts/timeweb-domains.mjs link --app 195536 --host quest.b-master.pro --create-subdomain
node scripts/timeweb-domains.mjs link --app 195536 --host 1517.b-master.pro --create-subdomain
```

DNS uses Timeweb API v2: A record + `app_id` (see [panel docs](https://timeweb.cloud/docs/apps/upravlenie-apps-v-paneli#привязка-домена)). SSL is issued automatically when the domain is linked to the app.

Yandex lead receiver CORS (keeps existing secrets):

```bash
node scripts/yandex-lead-receiver-env-patch.mjs --source <version-id> --set ALLOWED_ORIGINS=https://quest.b-master.pro,https://1517.b-master.pro,...
```

GitHub must be linked in the panel first. If `create` fails, use the panel wizard (Next.js, SSR off) — see [timeweb-deploy-checklist.md](./timeweb-deploy-checklist.md).
