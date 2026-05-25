# Yandex Object Storage — настройка бакета и выкладка

> **Primary production storage.** Активный бакет `bm-questhub`, endpoint `https://storage.yandexcloud.net`. Timeweb hot — [rollback / legacy](./timeweb-object-storage-setup.md). Миграция: [s3-storage-migration.md](./s3-storage-migration.md).

Пошаговая настройка публичного CDN на [Yandex Object Storage](https://cloud.yandex.ru/docs/storage/) для Quest Hub. Тарифы: [yandex-object-storage-pricing.md](./yandex-object-storage-pricing.md). Общая архитектура: [static-hosting-s3-yandex.md](./static-hosting-s3-yandex.md).

## 1. Каталог и биллинг

1. [Консоль Yandex Cloud](https://console.cloud.yandex.ru/) → каталог для Quest Hub.
2. Включить биллинг; при желании — бюджетный алерт.
3. Сверить тарифы в [калькуляторе](https://yandex.cloud/ru/prices?state=83e1258e152c#calculator).

## 2. Сервисный аккаунт и ключи

1. **Сервисные аккаунты** → создать, например `bm-questhub-s3-publisher`.
2. Роль на каталог: `storage.editor` (или узкая политика только на один бакет).
3. **Создать статический ключ доступа** (Access Key ID + Secret) — только для CI/локальной выкладки, не в git.
4. Экспорт ключей в `secret/bm-questhub-s3-yc.txt`, затем:

```bash
make setup-s3-yc-env
```

Или вручную из [`scripts/s3-yc.env.example`](../../scripts/s3-yc.env.example) → `scripts/s3.env` (`S3_ENDPOINT=https://storage.yandexcloud.net`, `AWS_DEFAULT_REGION=ru-central1`). Файлы в `.gitignore`.

## 3. Бакет

1. **Object Storage** → создать бакет, например `bm-questhub`, класс **Standard**, регион `ru-central1`.
2. Публичный URL объектов: `https://storage.yandexcloud.net/<bucket>/<key>`.
3. Для production задайте `NEXT_PUBLIC_S3_PUBLIC_BASE_URL` этим URL или URL CDN (см. §6).

### Структура ключей

```text
s3://<bucket>/data/offers-snapshot.json
s3://<bucket>/data/v2/site-manifest.json
s3://<bucket>/data/v2/site-config.json
s3://<bucket>/data/v2/schedule-snapshot.json
s3://<bucket>/media/quests/<quest-slug>/<file>
s3://<bucket>/media/worlds/<world-slug>/<file>
s3://<bucket>/…                    # full CDN: содержимое apps/web/out/
```

Локальные источники для sync: `apps/web/data/`, `apps/web/media/`, `apps/web/out/`.

## 4. Публичное чтение (bucket policy)

Разрешить анонимный `GetObject` на префиксы (листинг бакета не открывать):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadDataMedia",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": [
        "arn:aws:s3:::bm-questhub/data/*",
        "arn:aws:s3:::bm-questhub/media/*"
      ]
    }
  ]
}
```

Для **full CDN** (статика из `out/`) добавьте ресурс `arn:aws:s3:::bm-questhub/*` или отдельный префикс `www/*`, если статику кладёте в подпрефикс.

В консоли: бакет → **Политика доступа** (ACL/policy). Альтернатива — публичный доступ только через CDN с закрытым origin (сложнее; для старта достаточно policy выше).

## 5. Выкладка из репозитория

Требуется [AWS CLI v2](https://aws.amazon.com/cli/).

```bash
# Проверка публичных JSON перед upload
make validate-snapshots

# Загрузка (после настройки scripts/s3.env)
make s3-sync-data
make s3-sync-media    # пропускается, если apps/web/media пуст
make s3-sync-static   # нужен предварительный npm run build в apps/web
make s3-sync-all
```

Скрипт: [`scripts/sync-s3-public.mjs`](../../scripts/sync-s3-public.mjs). Endpoint: `https://storage.yandexcloud.net`.

**Порядок публикации V2:** загрузить все файлы снимков, **последним** — `data/v2/site-manifest.json` (атомарный указатель версии).

## 6. Yandex CDN (опционально, full CDN)

1. **Cloud CDN** → ресурс, origin = бакет (website endpoint или API endpoint бакета).
2. Подключить домен (например `cdn.quest.b-master.pro`), выпустить TLS.
3. `NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://cdn.quest.b-master.pro` (без `/` в конце).

### Статический сайт (Next `out/`)

- `trailingSlash: true` → каталоги с `index.html`.
- В CDN/хостинге бакета: индекс `index.html`, при необходимости custom error → `404.html`.
- School subdomain aliases — на уровне CDN/хостинга (см. [static-hosting-s3-yandex.md](./static-hosting-s3-yandex.md#school-subdomain-aliases)).

### CORS

Нужен только если браузер будет `fetch` JSON/медиа с другого origin. Build-time `fetch` в CI **не** требует CORS.

Пример правила (консоль YC или CLI):

```bash
yc storage bucket update bm-questhub \
  --cors "id=live-schedule,allowed-origins=https://quest.b-master.pro,allowed-origins=https://1517.b-master.pro,allowed-origins=https://b-master.pro,allowed-origins=https://www.b-master.pro,allowed-origins=http://localhost:3000,allowed-origins=http://127.0.0.1:3000,allowed-methods=method-get,allowed-methods=method-head,allowed-headers=*,expose-headers=ETag,max-age-seconds=3600"
```

XML-эквивалент:

```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>https://quest.b-master.pro</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
  </CORSRule>
</CORSConfiguration>
```

## 7. Переменные для сборки (Timeweb / CI)

Публичные (в окружении **до** `npm run build`):

| Переменная | Назначение |
|------------|------------|
| `NEXT_PUBLIC_SITE_URL` | Канонический origin сайта |
| `NEXT_PUBLIC_S3_PUBLIC_BASE_URL` | База CDN/S3 для медиа и ссылок в JSON |
| `NEXT_PUBLIC_LEAD_SUBMIT_URL` | Yandex Function для заявок |
| `NEXT_PUBLIC_YM_ID` | Метрика |

Build-time (не `NEXT_PUBLIC_*`):

| Переменная | Назначение |
|------------|------------|
| `OFFERS_SNAPSHOT_SOURCE=s3` | Читать `data/offers-snapshot.json` с S3 при сборке |
| `OFFERS_SNAPSHOT_URL` | Полный URL снимка (перекрывает source+base) |
| `SITE_SNAPSHOT_SOURCE=s3` | Манифест и V2 снимки с S3 |
| `SITE_SNAPSHOT_MANIFEST_URL` | Полный URL манифеста (опционально) |
| `SITE_SNAPSHOT_STRICT=1` | Падать при пустом расписании |

Пример для Timeweb (сборка из корня репо):

```text
NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://storage.yandexcloud.net/bm-questhub
OFFERS_SNAPSHOT_SOURCE=s3
SITE_SNAPSHOT_SOURCE=s3
```

Секреты `AWS_*` / `S3_*` — **только** на машине/CI, который выполняет `make s3-sync-*`, не в Timeweb build env.

Шаблон: [`apps/web/.env.example`](../../apps/web/.env.example).

## 8. Проверка после настройки

```bash
curl -sI "https://storage.yandexcloud.net/<bucket>/data/v2/site-manifest.json"
cd apps/web && OFFERS_SNAPSHOT_SOURCE=s3 NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://storage.yandexcloud.net/<bucket> npm run build
```

E2E с S3: [`apps/web/e2e/site-config-v2.spec.ts`](../../apps/web/e2e/site-config-v2.spec.ts) (локальные данные по умолчанию).
