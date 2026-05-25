# Миграция Object Storage (cold → hot)

Переход на новый бакет **без правок кода** — только env и один служебный скрипт копирования.

## Профили

| Профиль | Бакет (default) | Назначение |
|---------|-----------------|------------|
| **hot** | `bm-quest-s3-hot` | Активный: сайт, YCF `ops/*`, publish |
| **legacy** | `bm-questhub` | Старый cold; только чтение при migrate |

Переключение:

```bash
# активный (по умолчанию после migrate)
S3_STORAGE_PROFILE=hot
S3_BUCKET=bm-quest-s3-hot
NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://bm-quest-s3-hot.s3.twcstorage.ru

# откат на старый бакет (временно)
S3_STORAGE_PROFILE=legacy
S3_BUCKET=bm-questhub
NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://bm-questhub.s3.twcstorage.ru
```

Файлы (все gitignored, кроме `*.example`):

| Файл | Роль |
|------|------|
| `scripts/s3-hot.env` | Креды hot + `S3_LEGACY_BUCKET` |
| `scripts/s3.env` | **Активный** профиль для make/deploy/YCF |
| `secret/bm-questhub-s3-hot.txt` | Экспорт ключей из Timeweb |
| `apps/web/.env.local` | `NEXT_PUBLIC_S3_PUBLIC_BASE_URL` для `dev:host` |

Код читает только `process.env.S3_*` / `NEXT_PUBLIC_S3_PUBLIC_BASE_URL` — см. `scripts/lib/s3-storage.mjs`.

## Одноразовая миграция данных

```bash
# 1. Записать s3.env из secret (не коммитить)
node scripts/setup-s3-hot-env.mjs --write-web-env

# 2. Проверка списка (dry-run)
node scripts/migrate-s3-bucket.mjs --dry-run

# 3. Копирование bm-questhub → bm-quest-s3-hot
node scripts/migrate-s3-bucket.mjs

# 4. CORS + public policy на новом бакете (Timeweb UI)
#    Скопировать с legacy или scripts/timeweb-s3-cors.example.json

# 5. Redeploy YCF с новым s3.env
# 6. App Platform: NEXT_PUBLIC_S3_PUBLIC_BASE_URL на hot URL
```

## Проверка latency из YCF

```bash
make deploy-yandex-s3-connectivity-probe
make invoke-s3-connectivity-probe
```

## Dev

```bash
make setup-s3-hot-env
make dev-host
# или: cp apps/web/.env.hot.example apps/web/.env.local
```

## Следующая смена бакета

1. Создать бакет в Timeweb, ключи в `secret/…`.
2. Обновить `S3_STORAGE_DEFAULTS.hot` в `scripts/lib/s3-storage.mjs` (одна константа) или только env.
3. `node scripts/migrate-s3-bucket.mjs --source <old> --dest <new>`.
4. `setup-s3-hot-env.mjs`, redeploy YCF, Timeweb env.

## Статус (2026-05-25)

- Данные скопированы: `bm-questhub` → `bm-quest-s3-hot` (`make migrate-s3-to-hot`).
- Активный бакет в `scripts/s3.env`: **`bm-quest-s3-hot`**.
- YCF runtime: redeploy sync / controller / traffic с hot `S3_BUCKET`.

## Decommission legacy `bm-questhub`

После **7–14 дней** без инцидентов на hot:

1. Убедиться: App Platform, dev, YCF, GitHub `S3_BUCKET` → `bm-quest-s3-hot`.
2. `make verify-s3-docs` — нет активных URL на `bm-questhub.s3`.
3. `curl` / браузер — только hot URL.
4. Опционально: финальный `migrate-s3-bucket` для дельты, если что-то писали в legacy.
5. В Timeweb: удалить бакет **`bm-questhub`** (cold) или оставить архив read-only.
6. **`YCF_PACKAGE_BUCKET`**: zip деплоя функций можно оставить в legacy до переноса префикса `ycf/` в hot.

Откат (временно): `S3_STORAGE_PROFILE=legacy` в `scripts/s3.env` (см. таблицу выше).

## Timeweb panel (ручное)

| Пункт | Действие |
|-------|----------|
| CORS | `bm-quest-s3-hot`: GET/HEAD, `https://*.b-master.pro`, localhost |
| Policy | [`timeweb-s3-bucket-policy.example.json`](../../scripts/timeweb-s3-bucket-policy.example.json) |
| App Platform | `NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://bm-quest-s3-hot.s3.twcstorage.ru` |
| GitHub secret | `S3_BUCKET=bm-quest-s3-hot` |

```bash
make verify-s3-docs
```

Связано: [timeweb-object-storage-setup.md](./timeweb-object-storage-setup.md), [yandex-cloud-functions.md](./yandex-cloud-functions.md).
