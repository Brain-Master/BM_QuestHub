# Quest Hub — единственное место с целями make (run / check / dev-host / dev-restart).
# Из apps/web/Makefile цели только пробрасываются сюда через `make -C`.
# Требуется GNU Make + npm (Git Bash / WSL / macOS / Linux).
#
# «npm run dev --host» в экосистеме Next.js: флаг --host у CLI нет;
# эквивалент — next dev --hostname 0.0.0.0 --port 3000 (скрипт apps/web: dev:host).

WEB := apps/web

.PHONY: run check dev-host dev-restart brand-assets docs-index validate-snapshots s3-sync-data s3-sync-media s3-sync-static s3-sync-all

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

# bash: подгружает scripts/s3.env (Git Bash / WSL / macOS / Linux)
S3_SYNC = bash -c 'set -a; [ -f scripts/s3.env ] && . ./scripts/s3.env; set +a; node scripts/sync-s3-public.mjs'

s3-sync-data:
	$(S3_SYNC) data

s3-sync-media:
	$(S3_SYNC) media

s3-sync-static:
	$(S3_SYNC) static

s3-sync-all:
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
