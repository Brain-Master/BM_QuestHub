# Quest Hub — единственное место с целями make (run / check / dev-host / dev-restart).
# Из apps/web/Makefile цели только пробрасываются сюда через `make -C`.
# Требуется GNU Make + npm (Git Bash / WSL / macOS / Linux).
#
# «npm run dev --host» в экосистеме Next.js: флаг --host у CLI нет;
# эквивалент — next dev --hostname 0.0.0.0 --port 3000 (скрипт apps/web: dev:host).

WEB := apps/web

.PHONY: help run check secret-scan dev-host dev-restart brand-assets docs-index validate-snapshots export-yaml-snapshots content-publish content-publish-hot sync-sheet-hot sync-sheet-cold publish-sheet-hot publish-sheet-cold seed-sheet-headers restore-cold-design-from-backup encode-hero-video media-deps media-placeholders media-scaffold media-checkout media-pull media-commit media-push media-publish-site media-drive-push media-drive-pull data-import-sheets data-checkout data-pull data-commit data-push data-publish-site data-docs-push design-pack design-pack-oauth-login design-pack-publish-drive scripts-s3-deps timeweb-s3-setup timeweb-setup s3-sync-data s3-sync-data-hot s3-sync-data-cold s3-sync-media s3-sync-static s3-sync-all timeweb-build-check timeweb-deploy setup-ops-sheet site-health-check setup-github-ops ops-verify-all design-pack-psd setup-sheets-env setup-content-admin import-site-data-to-sheets backfill-shift-group-ids mos-enrolled-sync mos-enrolled-sync-dry mos-enrolled-sync-on mos-enrolled-sync-off mos-enrolled-sync-status mos-enrolled-sync-daemon upload-mos-enrolled-cookies setup-github-mos-enrolled-sync deploy-yandex-mos-enrolled-sync deploy-yandex-content-admin deploy-yandex-lead-ops-reporter setup-github-repo

# Печать целей с суффиксом «## @раздел …» (см. make help)
help: ## @meta Список целей make
	node scripts/print-make-help.mjs

# --- Dev & проверки ---

## @Dev & проверки
run: check ## run              check + Next dev на 0.0.0.0:3000 (LAN)
dev-host: ## dev-host          Next dev на 0.0.0.0:3000 без check
dev-restart: ## dev-restart    Освободить :3000 и перезапустить dev
check: ## check                Линтер + production build (apps/web)
secret-scan: ## secret-scan     Secretlint gate (tracked + untracked non-ignored)
brand-assets: ## brand-assets  PNG/WebP/ICO из brainmaster-logo → generated + Next
docs-index: ## docs-index      docs/indexes/* из исходников и DocAsCode-тегов

# --- Контент и снимки ---

## @Контент и снимки
validate-snapshots: ## validate-snapshots  Публичные JSON без denylist (перед S3)
export-yaml-snapshots: ## export-yaml-snapshots  YAML → JSON snapshots
content-publish: export-yaml-snapshots validate-snapshots scripts-s3-deps ## content-publish  YAML export + validate + producer publish
content-publish-hot: validate-snapshots scripts-s3-deps ## content-publish-hot  Hot-only publish (без export)
encode-hero-video: ## encode-hero-video  MP4+poster для S3 (SLUG=, SOURCE=, опц. KIND=)

# --- Google Sheets ---

## @Google Sheets
sync-sheet-hot: ## sync-sheet-hot    Синхронизация Hot-таблицы из Sheets
sync-sheet-cold: ## sync-sheet-cold   Синхронизация Cold-таблицы из Sheets
publish-sheet-hot: ## publish-sheet-hot   Hot snapshot → S3
publish-sheet-cold: ## publish-sheet-cold  Cold snapshot → S3
seed-sheet-headers: ## seed-sheet-headers  Заголовки колонок в Google Sheets
restore-cold-design-from-backup: ## restore-cold-design-from-backup  Дизайн Cold из бэкапа (--merge-design)
setup-sheets-env: ## setup-sheets-env  Настройка .env для Sheets API
import-site-data-to-sheets: ## import-site-data-to-sheets  JSON snapshot → Sheets (то же что data-pull)
backfill-shift-group-ids: ## backfill-shift-group-ids  Проставить shift group id в данных
mos-enrolled-sync: ## mos-enrolled-sync       Один проход (INTERVAL= DELAY= TIMEOUT= опц.)
mos-enrolled-sync-dry: ## mos-enrolled-sync-dry   Проход без записи в Sheet (--dry-run)
mos-enrolled-sync-on: ## mos-enrolled-sync-on    Включить + secret/mos-enrolled-sync.config.json
mos-enrolled-sync-off: ## mos-enrolled-sync-off   Выключить фоновый sync
mos-enrolled-sync-status: ## mos-enrolled-sync-status  Вкл/выкл и тайминги
mos-enrolled-sync-daemon: ## mos-enrolled-sync-daemon  Цикл (интервал из config, нужен sync-on)

# --- Медиа ↔ Drive ---

## @Медиа ↔ Google Drive (docs/design/pack/media-inbox-layout.md)
media-deps: ## media-deps        npm install в apps/web и scripts/
media-placeholders: ## media-placeholders  Заглушки медиа по манифесту
media-scaffold: ## media-scaffold  Каркас inbox по манифесту
media-drive-push: media-deps ## media-drive-push  Сайт → Sync/ на Drive (media-pull)
media-drive-pull: media-deps ## media-drive-pull  Sync/ → локальный inbox
media-pull: media-drive-push ## media-pull         Алиас media-drive-push (для дизайнера)
media-checkout: media-drive-push ## media-checkout  Алиас media-pull
media-publish-site: media-deps ## media-publish-site  Drive → sheets publish → s3-sync-media (media-push)
media-push: media-publish-site ## media-push         Алиас media-publish-site
media-commit: media-publish-site ## media-commit     Алиас media-push

# --- Данные ↔ Sheets ---

## @Данные ↔ Google Sheets (docs/data/drive/BM_QuestHub_Data-layout.md)
data-import-sheets: ## data-import-sheets  JSON snapshot → Google Sheets
data-pull: data-import-sheets ## data-pull           Алиас data-import-sheets
data-checkout: data-import-sheets ## data-checkout       Алиас data-import-sheets
data-publish-site: ## data-publish-site   Sheets → publish cold/hot → S3 (data-push)
data-push: data-publish-site ## data-push            Алиас data-publish-site
data-commit: data-publish-site ## data-commit          Алиас data-push
data-docs-push: media-deps ## data-docs-push      FOR_EDITORS → BM_QuestHub_Data на Drive

# --- Design pack ---

## @Design pack
design-pack-psd: ## design-pack-psd   PSD-заготовки для дизайн-пака
design-pack: media-placeholders design-pack-psd ## design-pack  Плейсхолдеры + PSD + сборка пака
design-pack-oauth-login: ## design-pack-oauth-login  OAuth для Google Drive (скрипты)
design-pack-publish-drive: ## design-pack-publish-drive  Опубликовать design pack на Drive

# --- Ops & setup ---

## @Ops & одноразовый setup
setup-ops-sheet: ## setup-ops-sheet   Ops-таблица в Google Sheets
site-health-check: ## site-health-check  Проверка доступности сайта/API
setup-github-ops: ## setup-github-ops  GitHub Actions / ops для репозитория
ops-verify-all: ## ops-verify-all    Сводная проверка ops-скриптов
setup-content-admin: ## setup-content-admin  Настройка content admin
setup-github-repo: ## setup-github-repo  Первичная настройка GitHub repo
deploy-yandex-mos-enrolled-sync: ## deploy-yandex-mos-enrolled-sync  YCF bm-mos-enrolled-sync + timer 15m
deploy-yandex-mos-sync-adaptive: ## deploy-yandex-mos-sync-adaptive  Adaptive stack (controller+traffic, no 15m sync timer)
provision-mos-ymq: ## provision-mos-ymq  YMQ bm-mos-enrolled-batch + DLQ
deploy-yandex-mos-ymq-pipeline: ## deploy-yandex-mos-ymq-pipeline  Planner + worker + finalizer YCF
smoke-mos-ymq-pipeline: ## smoke-mos-ymq-pipeline  Dry-run planner invoke
verify-mos-sync-lib: ## verify-mos-sync-lib  Unit-тесты mos-sync lib (+ --ycf для smoke)
verify-mos-sync-adaptive: ## verify-mos-sync-adaptive  YCF functions + controller timer
diagnose-mos-sync-ycf: ## diagnose-mos-sync-ycf  S3 state + yc invoke controller/sync
clear-mos-sync-lock: ## clear-mos-sync-lock  Сброс lockUntil в ops/mos-sync-state.json (hot S3)
redeploy-yandex-mos-sync-controller: ## redeploy-yandex-mos-sync-controller  Только controller после правок lib
redeploy-yandex-mos-enrolled-sync: ## redeploy-yandex-mos-enrolled-sync  Только sync после правок lib
deploy-yandex-s3-connectivity-probe: ## deploy-yandex-s3-connectivity-probe  YCF probe S3 Timeweb + TG
invoke-s3-connectivity-probe: ## invoke-s3-connectivity-probe  Запуск bm-s3-connectivity-probe
setup-s3-yc-env: ## setup-s3-yc-env  scripts/s3.env из secret/bm-questhub-s3-yc.txt (YC active)
setup-s3-yc-dev: ## setup-s3-yc-dev  s3.env + apps/web/.env.local для YC dev:host
migrate-s3-to-yc: ## migrate-s3-to-yc  Timeweb bm-quest-s3-hot → YC bm-questhub (cross)
setup-s3-hot-env: ## setup-s3-hot-env  Timeweb rollback s3.env из secret/bm-questhub-s3-hot.txt
migrate-s3-to-hot: ## migrate-s3-to-hot  Копировать bm-questhub → bm-quest-s3-hot (same provider)
setup-s3-hot-dev: ## setup-s3-hot-dev  Timeweb rollback s3.env + .env.local
verify-s3-docs: ## verify-s3-docs  Нет активных Timeweb hot URL в docs/apps
export-mos-enrolled-stats: ## export-mos-enrolled-stats  CSV из ops/mos-enrolled-stats.json
upload-mos-enrolled-cookies: ## upload-mos-enrolled-cookies  Cookies → S3 для YCF
setup-github-mos-enrolled-sync: ## setup-github-mos-enrolled-sync  GitHub secret для Actions workflow
deploy-yandex-content-admin: ## deploy-yandex-content-admin  Деплой Yandex content admin
deploy-yandex-lead-ops-reporter: ## deploy-yandex-lead-ops-reporter  Деплой lead ops reporter

# --- Timeweb & S3 ---

## @Timeweb & S3
scripts-s3-deps: ## scripts-s3-deps   npm install в scripts/ (S3 sync)
timeweb-s3-setup: ## timeweb-s3-setup  Создать bucket + scripts/s3.env (TIMEWEB_API_TOKEN)
timeweb-setup: scripts-s3-deps ## timeweb-setup       Полная настройка Timeweb
timeweb-build-check: ## timeweb-build-check  Проверка сборки перед деплоем
timeweb-sync-app-env: ## timeweb-sync-app-env  Синхрон env App Platform из timeweb.app.env.example
verify-prod-media-urls: ## verify-prod-media-urls  Smoke: прод не отдаёт HTML на /media/*
timeweb-deploy: timeweb-build-check ## timeweb-deploy       Деплой на Timeweb
s3-sync-data: scripts-s3-deps ## s3-sync-data      Всё дерево data/ (bootstrap, legacy YAML)
s3-sync-data-hot: scripts-s3-deps ## s3-sync-data-hot  Hot JSON → S3
s3-sync-data-cold: scripts-s3-deps ## s3-sync-data-cold Cold JSON → S3
s3-sync-media: scripts-s3-deps ## s3-sync-media     Медиа → S3
s3-sync-static: scripts-s3-deps ## s3-sync-static    Статика → S3
s3-sync-all: scripts-s3-deps ## s3-sync-all       data + media + static → S3

# --- Recipes (без ## в help: только зависимости выше) ---

run:
	cd $(WEB) && npm run dev:host

dev-host:
	cd $(WEB) && npm run dev:host

dev-restart:
	npm run dev:restart

check:
	cd $(WEB) && npm run check

secret-scan:
	node scripts/secret-scan.mjs

brand-assets:
	python -m pip install -q -r scripts/requirements-brand-assets.txt
	python scripts/generate_brainmaster_assets.py --sync-next

docs-index:
	python scripts/generate_indexes.py

validate-snapshots:
	node scripts/validate-public-snapshot.mjs

export-yaml-snapshots:
	node scripts/export-yaml-to-snapshots.mjs

content-publish:
	node apps/producer/publish.mjs

content-publish-hot:
	node apps/producer/publish.mjs --hot-only --skip-export

encode-hero-video:
	@test -n "$(SLUG)" || (echo "Set SLUG=quest-or-world-slug" && exit 1)
	@test -n "$(SOURCE)" || (echo "Set SOURCE=/path/to/source.mp4" && exit 1)
	node scripts/encode-hero-video.mjs --slug "$(SLUG)" --source "$(SOURCE)" $(if $(KIND),--kind $(KIND),)

sync-sheet-hot:
	node scripts/run-sheet-sync.mjs hot

sync-sheet-cold:
	node scripts/run-sheet-sync.mjs cold

publish-sheet-hot:
	node scripts/publish-sheet-hot.mjs

sync-offers-snapshot-timeweb:
	node scripts/sync-offers-snapshot-timeweb.mjs

publish-sheet-cold:
	node scripts/publish-sheet-cold.mjs

seed-sheet-headers:
	node scripts/seed-google-sheet-headers.mjs

restore-cold-design-from-backup:
	node scripts/restore-cold-from-backup.mjs --merge-design

setup-ops-sheet:
	node scripts/setup-ops-sheet.mjs

site-health-check:
	node scripts/site-health-check.mjs

setup-github-ops:
	node scripts/github-ops-setup.mjs

ops-verify-all:
	node scripts/ops-verify-all.mjs

media-deps:
	cd $(WEB) && npm install
	cd scripts && npm install --omit=dev

media-placeholders:
	node scripts/generate-media-placeholders.mjs

media-scaffold:
	node scripts/media-scaffold.mjs

media-drive-push:
	node scripts/sync-media-inbox-to-drive.mjs

media-drive-pull:
	node scripts/pull-media-inbox-from-drive.mjs

media-publish-site:
	node scripts/pull-media-inbox-from-drive.mjs
	$(MAKE) publish-sheet-cold
	$(MAKE) publish-sheet-hot
	$(MAKE) s3-sync-media

data-import-sheets:
	node scripts/import-site-data-to-sheets.mjs

data-publish-site:
	$(MAKE) publish-sheet-cold
	$(MAKE) publish-sheet-hot
	$(MAKE) s3-sync-data-cold
	$(MAKE) s3-sync-data-hot

data-docs-push:
	node scripts/sync-data-docs-to-drive.mjs

design-pack-psd:
	node scripts/generate-design-pack-psd.mjs

design-pack:
	cd scripts && npm install --omit=dev
	node scripts/build-design-pack.mjs

design-pack-oauth-login:
	cd scripts && npm install --omit=dev
	node scripts/google-drive-oauth-login.mjs

design-pack-publish-drive:
	node scripts/publish-design-pack-to-drive.mjs

setup-sheets-env:
	node scripts/setup-sheets-env.mjs

setup-content-admin:
	node scripts/setup-content-admin.mjs

import-site-data-to-sheets:
	node scripts/import-site-data-to-sheets.mjs

backfill-shift-group-ids:
	node scripts/backfill-shift-group-ids.mjs

# Тайминги: secret/mos-enrolled-sync.config.json или INTERVAL= DELAY= TIMEOUT= (мин/мс)
mos-enrolled-sync:
	$(if $(INTERVAL),set MOS_ENROLLED_INTERVAL_MINUTES=$(INTERVAL)&&) $(if $(DELAY),set MOS_ENROLLED_URL_DELAY_MS=$(DELAY)&&) $(if $(TIMEOUT),set MOS_ENROLLED_FETCH_TIMEOUT_MS=$(TIMEOUT)&&) node scripts/sync-mos-enrolled.mjs --once

mos-enrolled-sync-dry:
	$(if $(INTERVAL),set MOS_ENROLLED_INTERVAL_MINUTES=$(INTERVAL)&&) $(if $(DELAY),set MOS_ENROLLED_URL_DELAY_MS=$(DELAY)&&) $(if $(TIMEOUT),set MOS_ENROLLED_FETCH_TIMEOUT_MS=$(TIMEOUT)&&) node scripts/sync-mos-enrolled.mjs --once --dry-run

mos-enrolled-sync-on:
	node scripts/sync-mos-enrolled.mjs --enable

mos-enrolled-sync-off:
	node scripts/sync-mos-enrolled.mjs --disable

mos-enrolled-sync-status:
	node scripts/sync-mos-enrolled.mjs --status

mos-enrolled-sync-daemon:
	node scripts/sync-mos-enrolled.mjs --daemon

deploy-yandex-mos-enrolled-sync:
	node scripts/deploy-yandex-mos-enrolled-sync.mjs

deploy-yandex-mos-sync-adaptive:
	node scripts/deploy-yandex-mos-sync-adaptive.mjs

provision-mos-ymq:
	node scripts/provision-mos-ymq.mjs

deploy-yandex-mos-ymq-pipeline:
	node scripts/deploy-yandex-mos-ymq-pipeline.mjs

smoke-mos-ymq-pipeline:
	node scripts/smoke-mos-ymq-pipeline.mjs

verify-mos-sync-lib:
	node scripts/verify-mos-sync-lib.mjs

verify-mos-sync-adaptive:
	node scripts/verify-mos-sync-adaptive.mjs

diagnose-mos-sync-ycf:
	node scripts/diagnose-mos-sync-ycf.mjs

clear-mos-sync-lock:
	node scripts/clear-mos-sync-lock.mjs

redeploy-yandex-mos-sync-controller:
	node scripts/redeploy-yandex-mos-sync-controller.mjs

redeploy-yandex-mos-enrolled-sync:
	node scripts/redeploy-yandex-mos-enrolled-sync.mjs

deploy-yandex-s3-connectivity-probe:
	node scripts/deploy-yandex-s3-connectivity-probe.mjs

invoke-s3-connectivity-probe:
	node scripts/invoke-s3-connectivity-probe.mjs

setup-s3-yc-env:
	node scripts/setup-s3-yc-env.mjs

setup-s3-yc-dev:
	node scripts/setup-s3-yc-env.mjs --write-web-env

migrate-s3-to-yc:
	node scripts/migrate-s3-cross.mjs

setup-s3-hot-env:
	node scripts/setup-s3-hot-env.mjs

setup-s3-hot-dev:
	node scripts/setup-s3-hot-env.mjs --write-web-env

verify-s3-docs:
	node scripts/verify-s3-docs.mjs

migrate-s3-to-hot:
	node scripts/migrate-s3-bucket.mjs

export-mos-enrolled-stats:
	node scripts/export-mos-enrolled-stats.mjs

upload-mos-enrolled-cookies:
	node scripts/upload-mos-enrolled-cookies.mjs

setup-github-mos-enrolled-sync:
	node scripts/setup-github-mos-enrolled-sync.mjs

deploy-yandex-content-admin:
	node scripts/deploy-yandex-content-admin.mjs

deploy-yandex-lead-ops-reporter:
	node scripts/deploy-yandex-lead-ops-reporter.mjs

setup-github-repo:
	node scripts/setup-github-repo.mjs

timeweb-build-check:
	node scripts/timeweb-build-check.mjs

timeweb-sync-app-env:
	node scripts/timeweb-sync-app-env.mjs

verify-prod-media-urls:
	node scripts/verify-prod-media-urls.mjs

timeweb-deploy:
	node scripts/timeweb-deploy.mjs

S3_SYNC = node scripts/run-s3-sync.mjs

scripts-s3-deps:
	cd scripts && npm install --omit=dev

timeweb-s3-setup:
	node scripts/timeweb-provision-s3.mjs --setup bm-questhub

timeweb-setup:
	node scripts/timeweb-setup.mjs

s3-sync-data:
	$(S3_SYNC) data

s3-sync-data-hot:
	$(S3_SYNC) data-hot

s3-sync-data-cold:
	$(S3_SYNC) data-cold

s3-sync-media:
	$(S3_SYNC) media

s3-sync-static:
	$(S3_SYNC) static

s3-sync-all:
	$(S3_SYNC) all
