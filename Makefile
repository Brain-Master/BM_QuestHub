# Quest Hub — единственное место с целями make (run / check / dev-host / dev-restart).
# Из apps/web/Makefile цели только пробрасываются сюда через `make -C`.
# Требуется GNU Make + npm (Git Bash / WSL / macOS / Linux).
#
# «npm run dev --host» в экосистеме Next.js: флаг --host у CLI нет;
# эквивалент — next dev --hostname 0.0.0.0 --port 3000 (скрипт apps/web: dev:host).

WEB := apps/web

.PHONY: run check dev-host dev-restart brand-assets docs-index validate-snapshots export-yaml-snapshots content-publish content-publish-hot sync-sheet-hot sync-sheet-cold publish-sheet-hot publish-sheet-cold seed-sheet-headers scripts-s3-deps timeweb-s3-setup timeweb-setup s3-sync-data s3-sync-media s3-sync-static s3-sync-all timeweb-deploy

# PNG/WebP/ICO из assets/brand/brainmaster-logo.png → assets/brand/generated/ (+ Next app/ + public/brand/)
brand-assets:
	python -m pip install -q -r scripts/requirements-brand-assets.txt
	python scripts/generate_brainmaster_assets.py --sync-next

# Индексы кода: docs/indexes/* из исходников и DocAsCode-тегов
docs-index:
	python scripts/generate_indexes.py

# Проверки: линтер + production build
check:
	cd $(WEB) && npm run check

# Публичные JSON без denylisted полей (перед s3-sync-data)
validate-snapshots:
	node scripts/validate-public-snapshot.mjs

export-yaml-snapshots:
	node scripts/export-yaml-to-snapshots.mjs

content-publish: export-yaml-snapshots validate-snapshots scripts-s3-deps
	node apps/producer/publish.mjs

content-publish-hot: validate-snapshots scripts-s3-deps
	node apps/producer/publish.mjs --hot-only --skip-export

sync-sheet-hot:
	node scripts/run-sheet-sync.mjs hot

sync-sheet-cold:
	node scripts/run-sheet-sync.mjs cold

publish-sheet-hot:
	node scripts/publish-sheet-hot.mjs

publish-sheet-cold:
	node scripts/publish-sheet-cold.mjs

seed-sheet-headers:
	node scripts/seed-google-sheet-headers.mjs

setup-sheets-env:
	node scripts/setup-sheets-env.mjs

setup-content-admin:
	node scripts/setup-content-admin.mjs

import-site-data-to-sheets:
	node scripts/import-site-data-to-sheets.mjs

deploy-yandex-content-admin:
	node scripts/deploy-yandex-content-admin.mjs

setup-github-repo:
	node scripts/setup-github-repo.mjs

timeweb-deploy:
	node scripts/timeweb-deploy.mjs

# Loads scripts/s3.env + scripts/timeweb.env via Node (Windows-friendly)
S3_SYNC = node scripts/run-s3-sync.mjs

scripts-s3-deps:
	cd scripts && npm install --omit=dev

# TIMEWEB_API_TOKEN in scripts/timeweb.env → create bucket + scripts/s3.env
timeweb-s3-setup:
	node scripts/timeweb-provision-s3.mjs --setup bm-questhub

timeweb-setup: scripts-s3-deps
	node scripts/timeweb-setup.mjs

s3-sync-data: scripts-s3-deps
	$(S3_SYNC) data

s3-sync-media: scripts-s3-deps
	$(S3_SYNC) media

s3-sync-static: scripts-s3-deps
	$(S3_SYNC) static

s3-sync-all: scripts-s3-deps
	$(S3_SYNC) all

# Сначала проверки, затем dev-сервер, доступный в LAN (0.0.0.0)
run: check
	cd $(WEB) && npm run dev:host

# Только dev по сети, без проверок (быстрый старт)
dev-host:
	cd $(WEB) && npm run dev:host

# Освободить порт 3000 и поднять dev-сервер заново на том же порту
dev-restart:
	npm run dev:restart
