# Миграция Object Storage

Переключение активного бакета **без правок кода** — только env и скрипты копирования. См. `scripts/lib/s3-storage.mjs`.

## Профили (текущее)

| Профиль | Бакет (default) | Endpoint | Назначение |
|---------|-----------------|----------|------------|
| **hot** | `bm-questhub` | `https://storage.yandexcloud.net` | Активный: сайт, YCF `ops/*`, publish, `ycf/` zip |
| **legacy** | `bm-quest-s3-hot` | `https://s3.twcstorage.ru` | Timeweb rollback / источник cross-migrate |

Публичный URL hot:

```text
https://storage.yandexcloud.net/bm-questhub/<key>
```

Переключение:

```bash
# активный YC (по умолчанию)
S3_STORAGE_PROFILE=hot
S3_BUCKET=bm-questhub
S3_ENDPOINT=https://storage.yandexcloud.net
AWS_DEFAULT_REGION=ru-central1
NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://storage.yandexcloud.net/bm-questhub

# откат на Timeweb hot (временно)
S3_STORAGE_PROFILE=legacy
S3_BUCKET=bm-quest-s3-hot
S3_ENDPOINT=https://s3.twcstorage.ru
NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://bm-quest-s3-hot.s3.twcstorage.ru
```

Файлы (gitignored, кроме `*.example`):

| Файл | Роль |
|------|------|
| `scripts/s3-yc.env` | Креды YC + legacy Timeweb refs |
| `scripts/s3.env` | **Активный** профиль для make/deploy/YCF |
| `secret/bm-questhub-s3-yc.txt` | Ключи YC SA |
| `secret/bm-questhub-s3-hot.txt` | Ключи Timeweb hot (migrate source / rollback) |
| `apps/web/.env.local` | `NEXT_PUBLIC_S3_PUBLIC_BASE_URL` для `dev:host` |

## Timeweb hot → Yandex Cloud (`bm-questhub`)

**Зачем:** YCF в Yandex Cloud → Timeweb S3 давал cross-cloud таймауты (`s3_timeout`, `state_read_failed`). Активный SSOT в том же облаке, что и функции.

`migrate-s3-bucket.mjs` (CopyObject) **не подходит** между провайдерами — используйте cross-migrate:

```bash
# 1. Секреты (не в git): secret/bm-questhub-s3-yc.txt, secret/bm-questhub-s3-hot.txt
make setup-s3-yc-env

# 2. Dry-run, затем копирование Get→Put
node scripts/migrate-s3-cross.mjs --dry-run
make migrate-s3-to-yc

# 3. Проверка объекта
curl -sI https://storage.yandexcloud.net/bm-questhub/data/offers-snapshot.json
```

### Redeploy YCF (из `scripts/s3.env`)

```bash
make setup-s3-yc-env
make redeploy-yandex-mos-sync-controller
make redeploy-yandex-mos-enrolled-sync
make redeploy-yandex-schedule-traffic
make deploy-yandex-s3-connectivity-probe
make invoke-s3-connectivity-probe
```

Env на функциях: `S3_BUCKET=bm-questhub`, `S3_ENDPOINT=https://storage.yandexcloud.net`, `AWS_DEFAULT_REGION=ru-central1`, `YCF_PACKAGE_BUCKET=bm-questhub` (префикс `ycf/` в том же бакете).

### Timeweb App Platform + GitHub

| Место | Значение |
|-------|----------|
| App Platform | `NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://storage.yandexcloud.net/bm-questhub`, `SITE_SNAPSHOT_SOURCE=s3` |
| GitHub secret `S3_BUCKET` | `bm-questhub` |
| GitHub var `S3_PUBLIC_BASE_URL` | `https://storage.yandexcloud.net/bm-questhub` |
| Локально | `make setup-s3-yc-dev` |

CORS на YC: GET/HEAD для `https://*.b-master.pro` и localhost (см. [yandex-object-storage-setup.md](./yandex-object-storage-setup.md)).

### Приёмка

```bash
make verify-s3-docs
make verify-mos-sync-adaptive
make diagnose-mos-sync-ycf
curl -sI https://storage.yandexcloud.net/bm-questhub/ops/mos-sync-state.json
```

| Проверка | Ожидание |
|----------|----------|
| `make invoke-s3-connectivity-probe` | parallel GET &lt; 1s, `readOpsJson` ok |
| `ops/mos-sync-state.json` на YC | `lastSyncAt`, `nextDueAt`, `lockUntil: null` |
| Сайт | JSON/медиа с `storage.yandexcloud.net/bm-questhub` |

### Откат на Timeweb hot

```bash
make setup-s3-hot-env   # пишет legacy profile в scripts/s3.env
# App Platform URL → https://bm-quest-s3-hot.s3.twcstorage.ru
# redeploy YCF с Timeweb s3.env
```

Данные на Timeweb hot **не удалять** 7–14 дней.

---

## История: cold Timeweb → hot Timeweb

Ранее: `bm-questhub` (cold) → `bm-quest-s3-hot` (hot) через `make migrate-s3-to-hot` (`migrate-s3-bucket.mjs`, один endpoint).

```bash
make setup-s3-hot-env
make migrate-s3-to-hot
```

Статус (2026-05): данные на Timeweb hot сохранены; активный профиль перенесён на **YC `bm-questhub`**.

## Decommission Timeweb hot

После **7–14 дней** стабильной работы на YC:

1. App Platform, dev, YCF, GitHub → `bm-questhub` / YC URL.
2. `make verify-s3-docs`.
3. Опционально: `migrate-s3-cross` для дельты.
4. Удалить бакет **`bm-quest-s3-hot`** в Timeweb или оставить read-only архив.

Связано: [yandex-object-storage-setup.md](./yandex-object-storage-setup.md) (primary), [timeweb-object-storage-setup.md](./timeweb-object-storage-setup.md) (legacy/rollback), [yandex-cloud-functions.md](./yandex-cloud-functions.md).
