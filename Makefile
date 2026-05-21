# Quest Hub — единственное место с целями make (run / check / dev-host / dev-restart).
# Из apps/web/Makefile цели только пробрасываются сюда через `make -C`.
# Требуется GNU Make + npm (Git Bash / WSL / macOS / Linux).
#
# «npm run dev --host» в экосистеме Next.js: флаг --host у CLI нет;
# эквивалент — next dev --hostname 0.0.0.0 --port 3000 (скрипт apps/web: dev:host).

WEB := apps/web

.PHONY: run check dev-host dev-restart brand-assets docs-index validate-snapshots export-yaml-snapshots content-publish content-publish-hot sync-sheet-hot sync-sheet-cold publish-sheet-hot publish-sheet-cold seed-sheet-headers encode-hero-video media-deps media-placeholders media-scaffold media-checkout media-pull media-commit media-push media-publish-site media-drive-push media-drive-pull data-import-sheets data-checkout data-pull data-commit data-push data-publish-site data-docs-push design-pack design-pack-oauth-login design-pack-publish-drive scripts-s3-deps timeweb-s3-setup timeweb-setup s3-sync-data s3-sync-data-hot s3-sync-data-cold s3-sync-media s3-sync-static s3-sync-all timeweb-deploy

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

setup-ops-sheet:
	node scripts/setup-ops-sheet.mjs

site-health-check:
	node scripts/site-health-check.mjs

setup-github-ops:
	node scripts/github-ops-setup.mjs

ops-verify-all:
	node scripts/ops-verify-all.mjs

# Медиа ↔ Google Drive Sync/ (см. docs/design/pack/media-inbox-layout.md)
#   make media-pull     — снимок сайта → папка Sync на Drive (для дизайнера)
#   make media-push     — Sync → inbox → publish → S3 (обновить сайт)
# Алиасы: media-checkout = media-pull, media-commit = media-push

media-deps:
	cd $(WEB) && npm install
	cd scripts && npm install --omit=dev

media-placeholders:
	node scripts/generate-media-placeholders.mjs

media-scaffold:
	node scripts/media-scaffold.mjs

media-drive-push: media-deps
	node scripts/sync-media-inbox-to-drive.mjs

media-drive-pull: media-deps
	node scripts/pull-media-inbox-from-drive.mjs

media-checkout: media-drive-push

media-pull: media-drive-push

media-publish-site: media-deps
	node scripts/pull-media-inbox-from-drive.mjs
	$(MAKE) publish-sheet-cold
	$(MAKE) publish-sheet-hot
	$(MAKE) s3-sync-media

media-commit: media-publish-site

media-push: media-publish-site

# Данные ↔ Google Sheets (см. docs/data/drive/BM_QuestHub_Data-layout.md)
#   make data-pull   — JSON snapshot → Google Sheets (для редакторов)
#   make data-push   — Sheets → S3 (+ cold → Timeweb rebuild)
#   make data-docs-push — FOR_EDITORS → BM_QuestHub_Data (отдельный ID на Drive)

data-import-sheets:
	node scripts/import-site-data-to-sheets.mjs

data-checkout: data-import-sheets

data-pull: data-import-sheets

data-publish-site:
	$(MAKE) publish-sheet-cold
	$(MAKE) publish-sheet-hot
	$(MAKE) s3-sync-data-cold
	$(MAKE) s3-sync-data-hot

data-commit: data-publish-site

data-push: data-publish-site

data-docs-push: media-deps
	node scripts/sync-data-docs-to-drive.mjs

design-pack-psd:
	node scripts/generate-design-pack-psd.mjs

design-pack: media-placeholders design-pack-psd
	cd scripts && npm install --omit=dev
	node scripts/build-design-pack.mjs

design-pack-oauth-login:
	cd scripts && npm install --omit=dev
	node scripts/google-drive-oauth-login.mjs

design-pack-publish-drive:
	node scripts/publish-design-pack-to-drive.mjs

# Encode hero MP4 + poster for S3: make encode-hero-video SLUG=cyber-rhythm SOURCE=/path/to/in.mp4
encode-hero-video:
	@test -n "$(SLUG)" || (echo "Set SLUG=quest-or-world-slug" && exit 1)
	@test -n "$(SOURCE)" || (echo "Set SOURCE=/path/to/source.mp4" && exit 1)
	node scripts/encode-hero-video.mjs --slug "$(SLUG)" --source "$(SOURCE)" $(if $(KIND),--kind $(KIND),)

setup-sheets-env:
	node scripts/setup-sheets-env.mjs

setup-content-admin:
	node scripts/setup-content-admin.mjs

import-site-data-to-sheets:
	node scripts/import-site-data-to-sheets.mjs

backfill-shift-group-ids:
	node scripts/backfill-shift-group-ids.mjs

deploy-yandex-content-admin:
	node scripts/deploy-yandex-content-admin.mjs

deploy-yandex-lead-ops-reporter:
	node scripts/deploy-yandex-lead-ops-reporter.mjs

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

# Full data/ tree — bootstrap and legacy YAML publish only
s3-sync-data: scripts-s3-deps
	$(S3_SYNC) data

s3-sync-data-hot: scripts-s3-deps
	$(S3_SYNC) data-hot

s3-sync-data-cold: scripts-s3-deps
	$(S3_SYNC) data-cold

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
