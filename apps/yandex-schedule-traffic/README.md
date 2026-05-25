# bm-schedule-traffic (Yandex Cloud Function)

POST pulse визитов со страниц расписания → S3 `ops/schedule-traffic.json`.

Сайт: `NEXT_PUBLIC_SCHEDULE_PULSE_URL` = URL функции (см. `secret/mos-sync-adaptive.deploy.txt`).

Деплой: `make deploy-yandex-mos-sync-adaptive`.

Документация: [mos-enrolled-sync.md](../../docs/data/mos-enrolled-sync.md) · [все YCF](../../docs/deployment/yandex-cloud-functions.md).
