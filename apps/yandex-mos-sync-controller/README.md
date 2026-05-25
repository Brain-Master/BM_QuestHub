# bm-mos-sync-controller (Yandex Cloud Function)

PID-lite регулятор: читает `ops/schedule-traffic.json` и `ops/mos-sync-state.json`, по расписанию вызывает `bm-mos-enrolled-sync`.

**Таймер:** `bm-mos-sync-controller-timer` — `0/2 * * * ? *` (создаётся при `make deploy-yandex-mos-sync-adaptive`).

```bash
yc serverless function invoke --name bm-mos-sync-controller --data '{}'
node scripts/verify-mos-sync-adaptive.mjs
```

Документация: [mos-enrolled-sync.md](../../docs/data/mos-enrolled-sync.md) · [все YCF](../../docs/deployment/yandex-cloud-functions.md).
