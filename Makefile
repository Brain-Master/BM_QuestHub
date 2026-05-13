# Quest Hub — единственное место с целями make (run / check / dev-host).
# Из apps/web/Makefile цели только пробрасываются сюда через `make -C`.
# Требуется GNU Make + npm (Git Bash / WSL / macOS / Linux).
#
# «npm run dev --host» в экосистеме Next.js: флаг --host у CLI нет;
# эквивалент — next dev --hostname 0.0.0.0 (скрипт apps/web: dev:host).

WEB := apps/web

.PHONY: run check dev-host brand-assets

# PNG/WebP/ICO из assets/brand/brainmaster-logo.png → assets/brand/generated/ (+ Next app/ + public/brand/)
brand-assets:
	python -m pip install -q -r scripts/requirements-brand-assets.txt
	python scripts/generate_brainmaster_assets.py --sync-next

# Проверки: линтер + production build
check:
	cd $(WEB) && npm run check

# Сначала проверки, затем dev-сервер, доступный в LAN (0.0.0.0)
run: check
	cd $(WEB) && npm run dev:host

# Только dev по сети, без проверок (быстрый старт)
dev-host:
	cd $(WEB) && npm run dev:host
