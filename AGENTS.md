# AGENTS.md

## Cursor Cloud specific instructions

BM_QuestHub is a monorepo. The runnable product for local development is the Next.js 16
web app in `apps/web` (App Router, Turbopack, React 19, Node 22, npm). The root
`Makefile` is the single source of truth for dev/check targets — run `make help` to list
them (see also `apps/web/package.json`).

Non-obvious notes for running/testing here:

- Install deps in `apps/web` with `npm ci` (there is a `package-lock.json` there). The
  root `package.json` scripts just proxy into `apps/web`.
- Dev server: `make dev-host` (or `cd apps/web && npm run dev:host`) runs
  `next dev --hostname 0.0.0.0 --port 3000`. `make run` = `check` + dev. Only one process
  may hold port 3000 (`scripts/assert-port-free.mjs` fails fast); use `make dev-restart`
  to reclaim it.
- Build/lint: `cd apps/web && npm run build` / `npm run lint`. The build's `verify:s3`
  step (`scripts/verify-s3-snapshots.mjs`) is a **no-op unless** `SITE_SNAPSHOT_SOURCE`
  or `OFFERS_SNAPSHOT_SOURCE` is set to `s3`; by default the app reads committed snapshots
  under `apps/web/data`, so build + dev work fully offline with no cloud credentials.
- `apps/web` is a **modified Next.js** build — read `apps/web/AGENTS.md` and the guides in
  `node_modules/next/dist/docs/` before changing framework code.
- The other `apps/*` (the `yandex-*` functions, `admin`, `producer`) and most `scripts/*`
  are Yandex Cloud / Timeweb / Google Sheets deployment tooling that require external cloud
  credentials. They are out of scope for local web-app development and are not needed to
  run or test `apps/web`.
