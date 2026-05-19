# Yandex Cloud Function — content admin API

Proxies snapshot reads from public S3, writes updates with S3 credentials, triggers GitHub `content-rebuild` workflow.

## Routes

| Method | Path | Description |
|--------|------|-------------|
| `OPTIONS` | `*` | CORS preflight |
| `GET` | `/snapshots` | Load catalog, map, site-config, manifest |
| `PUT` | `/snapshots/{catalog\|map\|site\|manifest}` | Save JSON body (`data` or root object) |
| `POST` | `/sync/hot` | Sheet → S3 offers (via GitHub `sheet-sync.yml`) |
| `POST` | `/sync/cold` | Sheet → S3 catalog/map + Timeweb deploy |
| `POST` | `/publish` | Same as `/sync/{tier}` (`tier`: hot \| cold) |

Authorization: `Authorization: Bearer <CONTENT_ADMIN_TOKEN>`.

## Deploy

```bash
cd apps/yandex-content-admin
npm install
zip -r function.zip index.js node_modules package.json
# Upload to Yandex Cloud Functions; set env from .env.example
```

Wire `VITE_CONTENT_ADMIN_URL` in [`apps/admin`](../admin/).
