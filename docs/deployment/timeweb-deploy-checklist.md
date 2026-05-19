# Timeweb deploy checklist (one-time)

Complete after merging Timeweb S3 + App Platform docs to `main`.

## Security

- [ ] Revoke any API key that was pasted in chat; create a new one.
- [ ] `scripts/s3.env` and `scripts/timeweb.env` exist locally only (gitignored).

## S3 bucket

- [ ] [Create public bucket](https://timeweb.cloud/my/storage) `bm-questhub` (Standard, ~1 GB tier).
- [ ] Apply policy from [`scripts/timeweb-s3-bucket-policy.example.json`](../../scripts/timeweb-s3-bucket-policy.example.json).
- [ ] Copy **S3** Access Key + Secret to `scripts/s3.env` (from bucket dashboard), **or** automated:
  - `cp scripts/timeweb.env.example scripts/timeweb.env` → paste **new** Cloud API JWT (revoke any key posted in chat).
  - `make timeweb-setup` — creates bucket `bm-questhub`, writes `scripts/s3.env`, uploads `data/`, verifies HTTP.
- [ ] Manual steps only: `make timeweb-s3-setup` then `make s3-sync-data`
- [ ] `curl -sI https://bm-questhub.s3.twcstorage.ru/data/v2/site-manifest.json` → 200
- [ ] `curl -sI https://bm-questhub.s3.twcstorage.ru/data/offers-snapshot.json` → 200 (non-zero `Content-Length`)
- [ ] `curl -sI https://bm-questhub.s3.twcstorage.ru/data/v2/site-config.json` → 200
- [ ] After JSON changes in S3: **redeploy** App Platform (static export reads S3 only at build time)

## App Platform

- [ ] [Create app](https://timeweb.cloud/my/apps/create) — Next.js, **SSR off**, repo `Brain-Master/BM_QuestHub`.
- [ ] Build: `npm run build`, output `apps/web/out` (see [timeweb-app-platform.md](./timeweb-app-platform.md)).
- [ ] Env from [`apps/web/timeweb.app.env.example`](../../apps/web/timeweb.app.env.example) (include `SITE_SNAPSHOT_STRICT=1`).
- [ ] Build log shows `[verify-s3] OK loaded …` and `[offers-snapshot]` / `[site-manifest]` info lines (not `remote read error`).
- [ ] Deploy succeeds; note public `*.twc1.net` URL in execution log.

## Domains

- [x] `quest.b-master.pro` → App Platform (DNS A + `app_id`, SSL auto) — `node scripts/timeweb-domains.mjs link --app 195536 --host quest.b-master.pro`
- [x] `1517.b-master.pro` → same app (school alias; client redirect in static bundle)
- [ ] After new school venue YAML: `node scripts/generate-host-aliases.mjs` + redeploy; extend `ALLOWED_ORIGINS`
- [x] Yandex Function `ALLOWED_ORIGINS` — `node scripts/yandex-lead-receiver-env-patch.mjs` (production origins, secrets preserved)
- [ ] Remove stray subdomain `quest.b-master.pro.b-master.pro` in panel if still listed

## Smoke

- [ ] `/`, `/agenda`, school catalog/agenda pages.
- [ ] Lead form → Telegram/Sheet.
