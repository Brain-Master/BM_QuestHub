# bm-mos-enrolled-sync (Yandex Cloud Function)

Синхронизация `enrolled` с mos.ru → Hot Google Sheet.

**Production:** входит в адаптивный стек — вызывается из `bm-mos-sync-controller`, **без** собственного таймера 15m.

```bash
make deploy-yandex-mos-sync-adaptive   # recommended
node scripts/verify-mos-sync-adaptive.mjs
```

Legacy (фиксированный таймер 15m на эту функцию): `make deploy-yandex-mos-enrolled-sync` — не вместе с adaptive.

Документация: [mos-enrolled-sync.md](../../docs/data/mos-enrolled-sync.md) · [все YCF](../../docs/deployment/yandex-cloud-functions.md).
