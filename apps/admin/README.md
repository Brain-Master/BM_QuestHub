# Quest Hub content admin (static UI)

JSON editor for catalog, map, and site-config snapshots. Talks to [`yandex-content-admin`](../yandex-content-admin/) (Bearer token).

## Local dev

```bash
cp .env.example .env
npm install
npm run dev
```

Set `CONTENT_ADMIN_TOKEN` on the function and paste the same value in the UI.

## Build

```bash
npm run build
```

Deploy `dist/` to S3 under `admin/` or open locally. CORS on S3 bucket is **not** required (API proxy on Yandex Function).
