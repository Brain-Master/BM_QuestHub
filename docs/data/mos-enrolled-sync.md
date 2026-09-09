# Синхронизация `enrolled` с mos.ru

Автоматически подтягивает число записавшихся с карточек **mos.ru** (`pgu2/activity/card/{id}`) в колонку **`enrolled`** листа **«Форматы»** Hot Google Sheet, публикует snapshot на сайт и (в production) регулирует частоту опроса по трафику расписания.

Связанные документы: [hot-schedule-data.md](./hot-schedule-data.md), [content-deploy.md](../deployment/content-deploy.md).  
Сводка **всех** YCF: [yandex-cloud-functions.md](../deployment/yandex-cloud-functions.md).

---

## Production (Yandex Cloud)

| Компонент | Имя / артефакт |
|-----------|----------------|
| Регулятор | YCF `bm-mos-sync-controller` + таймер **`bm-mos-sync-controller-timer`** (`0/2 * * * ? *`) |
| YMQ pipeline (по умолчанию) | `bm-mos-sync-planner` → YMQ `bm-mos-enrolled-batch` → `bm-mos-url-worker` → `bm-mos-sync-finalizer` |
| Monolith (откат) | YCF `bm-mos-enrolled-sync` с `MOS_SYNC_PIPELINE=legacy` |
| Pulse визитов | YCF `bm-schedule-traffic` → S3 `ops/schedule-traffic.json` |
| Деплой | `make provision-mos-ymq` → `make deploy-yandex-mos-ymq-pipeline` → `make redeploy-yandex-mos-sync-controller` |
| Сайт | `NEXT_PUBLIC_SCHEDULE_PULSE_URL` = `TRAFFIC_URL` из deploy-файла |

### YMQ pipeline

```text
controller (PID) → planner (Sheet → manifest S3 + YMQ)
                 → N × url-worker (batch fetch mos.ru → ops/mos-sync-runs/{runId}/batch-NNN.json)
                 → finalizer (merge → Sheet batchUpdate → snapshot → events/TG → sheet-sync)
```

S3: `ops/mos-sync-runs/{runId}/manifest.json`, `ops/mos-sync-state.json` (`runPhase`, `batchesDone/Total`).

Откат: `MOS_SYNC_PIPELINE=legacy` на controller + sync; monolith снова обрабатывает все URL в одном invoke (лимит 300s).

Rollout:

```bash
make provision-mos-ymq          # static key needs ymq.writer / ymq.editor
make deploy-yandex-mos-ymq-pipeline
make redeploy-yandex-mos-sync-controller   # MOS_SYNC_PIPELINE=ymq
make smoke-mos-ymq-pipeline
make verify-mos-sync-adaptive
```

Если `provision-mos-ymq` падает с IAM — создайте очереди в консоли YMQ и запишите URL/ARN в `secret/mos-ymq.deploy.txt`.

Проверка таймера после деплоя:

```bash
node scripts/verify-mos-sync-adaptive.mjs
```

---

## Цепочка данных

```text
mos.ru API → Hot Sheet «Форматы».enrolled
           → publish-sheet-hot → offers-snapshot.json (S3/CDN)
           → браузер (poll ~60 с, useLiveSchedule)
```

На страницах расписания: баннер `MosCapacityDataNotice` (конфиг `dictionaries.mosCapacityNotice`) + pulse в `bm-schedule-traffic` (не Metrika).

---

## Что не смешивать

| Нельзя одновременно | Почему |
|---------------------|--------|
| B1 (`deploy-yandex-mos-sync-adaptive`) + B2 (`deploy-yandex-mos-enrolled-sync` с таймером 15m) | Два планировщика sync |
| `make mos-enrolled-sync-daemon` + YCF adaptive | Два цикла sync |
| YCF timer + GHA [mos-sync-controller.yml](../../.github/workflows/mos-sync-controller.yml) с cron | Двойной тик controller |
| GHA [mos-enrolled-sync.yml](../../.github/workflows/mos-enrolled-sync.yml) cron + YCF | GHA cron **отключён** (только `workflow_dispatch`) |

Локальный `make mos-enrolled-sync` / `mos-enrolled-sync-dry` для отладки — **можно** при работающем YCF (разовые проходы).

---

## Быстрый старт (локально)

```bash
make setup-sheets-env

make mos-enrolled-sync-on      # secret/mos-enrolled-sync.config.json
make mos-enrolled-sync-status

make mos-enrolled-sync-dry     # без записи в Sheet
make mos-enrolled-sync         # с записью (нужен sync-on)
```

**Не используйте** `make mos-enrolled-sync --dry-run` — флаг относится к **make**, не к Node.

```bash
make mos-enrolled-sync-off
```

---

## Быстрый старт (production)

```bash
make setup-sheets-env

make deploy-yandex-mos-sync-adaptive
# → secret/mos-sync-adaptive.deploy.txt
# → secret/mos-controller-cron.secret.txt (для HTTP-вызова controller, если нужен)

node scripts/verify-mos-sync-adaptive.mjs
```

**Сайт (Timeweb / `.env.local`):**

```env
NEXT_PUBLIC_SCHEDULE_PULSE_URL=https://functions.yandexcloud.net/<TRAFFIC_ID>
```

Значение `TRAFFIC_URL` — в `secret/mos-sync-adaptive.deploy.txt`. После изменения env перезапустите dev (`make dev-restart`) или пересоберите Timeweb.

---

## Сайт: баннер и live snapshot

| Элемент | Где |
|---------|-----|
| Баннер «места — ориентир» | `ScheduleBoard` → `MosCapacityDataNotice` |
| Тексты | `apps/web/data/v2/site-config.json` → `dictionaries.mosCapacityNotice` |
| Время снимка | `useLiveSchedule().snapshotGeneratedAt` → prop в баннер |
| Pulse | `useScheduleTrafficPulse` на `/agenda` и странице квеста |

---

## Как работает sync

1. Читает лист **«Форматы»** (`GOOGLE_SHEETS_HOT_*`).
2. Уникальные `mos_ru_link` → `https://www.mos.ru/pgu2/activity/card/{id}`.
3. `GET /pgu2/activity/api/groups/{id}` → enrolled = `placeCount - freeSpace`.
4. Сравнение с HOT (логика `aggregateVariantEnrolled` на сайте).
5. Запись во все строки «Форматы» с тем же URL.

Строки без `mos_ru_link` и с **ценой 0** пропускаются.

После изменений (опционально):

```bash
make mos-enrolled-sync MOS_ENROLLED_AUTO_PUBLISH=1
# или node scripts/sync-mos-enrolled.mjs --once --publish
```

В YCF adaptive по умолчанию `MOS_ENROLLED_AUTO_PUBLISH=1` на sync-функции: при `updatedRows > 0` диспатчится GitHub `sheet-sync.yml` (hot), нужен `CONTENT_REBUILD_GITHUB_TOKEN` в env (как у content-admin).

---

## Включатель (локальный toggle)

| Способ | Состояние |
|--------|-----------|
| `make mos-enrolled-sync-on` | `secret/mos-enrolled-sync.enabled` + config |
| `make mos-enrolled-sync-off` | удаляет enabled |
| `MOS_ENROLLED_SYNC=1` / `0` | принудительно |

`make mos-enrolled-sync-daemon` — только для **локального** цикла (не production вместе с YCF).

---

## Тайминги локального daemon

`secret/mos-enrolled-sync.config.json` (при `make mos-enrolled-sync-on`):

| Поле | По умолчанию | Смысл |
|------|--------------|--------|
| `intervalMinutes` | 15 | пауза между циклами daemon |
| `urlDelayMs` | 400 | между URL (+ jitter ±50–150 ms в YCF) |
| `fetchTimeoutMs` | 25000 | HTTP timeout |
| `autoPublish` | false | после Sheet → publish |

---

## Переменные окружения (sync)

| Переменная | По умолчанию | Назначение |
|------------|--------------|------------|
| `MOS_ENROLLED_SYNC` | — | `1` / `0` |
| `MOS_ENROLLED_INTERVAL_MINUTES` | config / 15 | daemon |
| `MOS_ENROLLED_AUTO_PUBLISH` | config / `1` в YCF | publish после изменений |
| `MOS_ENROLLED_URL_DELAY_MS` | 400 | пауза между URL |
| `MOS_ENROLLED_FETCH_TIMEOUT_MS` | 25000 | timeout HTTP |
| `MOS_ENROLLED_COOKIES_S3_KEY` | `ops/mos-enrolled-sync.cookies.json` | опционально: cookies в S3 |
| `MOS_ENROLLED_SKIP_S3_COOKIES` | — | `1` — не читать/писать cookies в S3 (public API) |
| `MOS_ENROLLED_SKIP_LOCAL_COOKIE_WRITE` | — | `1` в YCF — не писать cookies на диск функции |
| `MOS_OPS_S3_TIMEOUT_MS` | 10000 | таймаут S3 для ops-файлов (YCF → Timeweb) |
| `MOS_SYNC_DEBUG` | — | `1` — отладочные логи `[mos-sync:debug]` (S3, fetch, state) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | — | локально / GHA |
| `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64` | — | YCF |

### Регулятор (controller YCF)

| Переменная | По умолчанию | Назначение |
|------------|--------------|------------|
| `MOS_SYNC_T_MIN_SEC` | 300 | min интервал между sync |
| `MOS_SYNC_T_MAX_SEC` | 86400 | max интервал |
| `MOS_SYNC_USE_PID` | 1 | PID-lite; `0` → tier fallback |
| `MOS_PID_KP`, `MOS_PID_KD`, `MOS_PID_KI` | см. код | коэффициенты |
| `MOS_ENROLLED_SYNC_FUNCTION_URL` | — | URL monolith sync (legacy invoke) |
| `MOS_SYNC_PIPELINE` | `ymq` | `legacy` = monolith; иначе planner/finalizer |
| `MOS_SYNC_PLANNER_FUNCTION_URL` | — | URL `bm-mos-sync-planner` |
| `MOS_SYNC_FINALIZER_FUNCTION_URL` | — | URL `bm-mos-sync-finalizer` |
| `MOS_YMQ_QUEUE_URL` | — | YMQ main queue (planner send) |
| `MOS_ENROLLED_BATCH_SIZE` | 8 | URL на сообщение YMQ |
| `MOS_ENROLLED_WORKER_TIMEOUT_MS` | 120000 | Бюджет url-worker (деплой YMQ pipeline) |
| `MOS_ENROLLED_BATCH_BUDGET_MS` | 105000 | Flush partial до kill YCF (worker − 15s) |
| `MOS_SYNC_RUN_STALE_MS` | 7200000 | сброс зависшего `processing` |

### Telegram / события

| Переменная | Назначение |
|------------|------------|
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | алерты и digest; при деплое копируются из `bm-lead-receiver`, если не заданы локально |
| `MOS_ENROLLED_TG_ENABLED` | `0` отключает digest |
| `MOS_ENROLLED_TG_FAILURE` | `0` отключает алерты при падении sync / S3 / timeout |
| `MOS_ENROLLED_TG_MIN_DELTA` | мин. сумма delta для TG |
| `MOS_ENROLLED_TG_MAX_LINES` | лимит строк в сообщении |
| `MOS_ENROLLED_EVENTS_RETENTION_DAYS` | 90 — ротация JSONL |

### Pulse (traffic YCF + сайт)

| Переменная | Назначение |
|------------|------------|
| `NEXT_PUBLIC_SCHEDULE_PULSE_URL` | URL `bm-schedule-traffic` (сайт) |
| `SCHEDULE_PULSE_ALLOWED_ORIGINS` | CORS (деплой) |
| `SCHEDULE_TRAFFIC_S3_KEY` | `ops/schedule-traffic.json` |

---

## S3 ops-артефакты

| Ключ | Назначение |
|------|------------|
| `ops/mos-enrolled-sync.cookies.json` | Опционально: запасная сессия mos.ru |
| `ops/schedule-traffic.json` | Визиты (корзины 5 мин, 48 ч) |
| `ops/mos-sync-state.json` | PID, `nextDueAt`, lock (`make clear-mos-sync-lock` при залипшем lock) |
| `ops/mos-enrolled-events.jsonl` | События прироста enrolled |
| `ops/mos-enrolled-stats.json` | Почасовые агрегаты |
| `ops/mos-enrolled-snapshot.json` | Diff между прогонами |

Экспорт: `make export-mos-enrolled-stats` → CSV.

---

## Yandex Cloud B1 (адаптивный стек)

```bash
make deploy-yandex-mos-sync-adaptive
```

Создаёт/обновляет:

- `bm-mos-enrolled-sync` — без таймера (удаляет legacy `bm-mos-enrolled-sync-timer`, если был)
- `bm-schedule-traffic` — публичный POST
- `bm-mos-sync-controller` — таймер **`bm-mos-sync-controller-timer`**

**Таймер `yc`:** имя передаётся **позиционным аргументом**:

```bash
yc serverless trigger create timer bm-mos-sync-controller-timer \
  --cron-expression "0/2 * * * ? *" \
  --invoke-function-name bm-mos-sync-controller \
  --invoke-function-tag '$latest' \
  --invoke-function-service-account-id <SA_ID>
```

Не используйте устаревший `--name` после `create timer` — в `yc` 1.8+ это ломает создание.

Пересборка только controller / traffic:

```bash
node scripts/redeploy-yandex-mos-sync-controller.mjs
node scripts/redeploy-yandex-schedule-traffic.mjs
```

Ручной dry-run sync:

```bash
yc serverless function invoke --name bm-mos-enrolled-sync --data '{"dryRun":true}'
```

Ручной тик controller (без HTTP-секрета, прямой invoke):

```bash
yc serverless function invoke --name bm-mos-sync-controller --data '{}'
```

---

## Yandex Cloud B2 (legacy, не с B1)

```bash
make deploy-yandex-mos-enrolled-sync   # + таймер 15m на sync
```

---

## GitHub Actions

| Workflow | Cron | Назначение |
|----------|------|------------|
| [mos-enrolled-sync.yml](../../.github/workflows/mos-enrolled-sync.yml) | **выкл** | Ручной sync (`workflow_dispatch`) |
| [mos-sync-controller.yml](../../.github/workflows/mos-sync-controller.yml) | **выкл** | Резервный тик controller; при активном YCF-таймере не настраивать |

Настройка secrets для **ручного** GHA sync (cookies, SA): `node scripts/setup-github-mos-enrolled-sync.mjs`.

---

## Cookies (опционально)

Sync ходит в публичный API `pgu2/activity/api/groups/{id}` **без обязательных cookies** (как `curl` с `Accept: application/json`).

Cookies — запасной путь, если mos.ru режет запросы с IP дата-центра (403/HTML вместо JSON):

```bash
copy scripts\mos-enrolled-sync.cookies.example.json secret\mos-enrolled-sync.cookies.json
make upload-mos-enrolled-cookies
```

Если cookies заданы, ответы с `Set-Cookie` по-прежнему сохраняются в S3.

Запросы к mos.ru — **без блокирующего VPN**.

---

## Диагностика

```bash
make diagnose-mos-sync-ycf
# или по шагам:
make verify-mos-sync-adaptive
yc serverless function invoke --name bm-mos-sync-controller --data '{}'
yc serverless function invoke --name bm-mos-enrolled-sync --data '{"dryRun":true}'
curl -s "https://storage.yandexcloud.net/bm-questhub/ops/mos-sync-state.json" | jq '{lastControllerAt,lastSyncAt,nextDueAt}'
```

| Симптом | Что проверить |
|---------|----------------|
| `UnknownError` в логах **controller** | Обычно сбой S3 (Timeweb) при записи `ops/mos-sync-state.json`. Проверьте `lastControllerAt`; после hardening controller возвращает JSON с `stateOk` / `stateError`, а не голый UnknownError |
| `invokeStatus: 412` async disabled | На версии sync: `--async-max-retries` + `--async-service-account-id` (`make redeploy-yandex-mos-enrolled-sync`) |
| `Code: 499 Request cancelled` на **sync** | Controller оборвал HTTP; нужен async invoke — redeploy sync + controller |
| `mos.ru blocked` / 403 в sync | Опционально `make upload-mos-enrolled-cookies`; проверьте VPN и доступ YCF к mos.ru |
| `lastSyncAt` null, `lockUntil` в будущем | S3 timeout на merge state; сброс: `make clear-mos-sync-lock` (hot bucket), redeploy controller+sync |
| `readOpsJson ops/mos-sync-state.json: s3_timeout` | Controller/sync не видят state — fail-closed (не запускают лишний sync); проверьте probe и redeploy |
| `504` / `300s` на sync | mos.ru timeouts + snapshot write; env: `FETCH_CONCURRENCY=1`, `SNAPSHOT_S3_ATTEMPTS=6` |
| `504 Execution timeout exceeded` на **url-worker** | batch=8 × fetch 25s > лимит 90s; redeploy pipeline (`MOS_ENROLLED_BATCH_SIZE=4`, `FETCH_TIMEOUT_MS=15000`, worker 120s) или дождаться partial flush |
| `runPhase=processing`, `batch-000.json` 404 | Worker убит до записи S3; см. url-worker timeout; `resetPipelineRunToIdle` или stale reset (2h) |
| `lastSyncAt` null, sync `ok: true` | `WARN mos-sync-state not saved (S3)` — Timeweb S3 из YCF; `MOS_SYNC_DEBUG=1` на функции |
| `cookies saved →` пусто / `s3_timeout` | При `SKIP_S3_COOKIES`+`SKIP_LOCAL` persist отключён (норма) |
| Дата «Снимок на сайте» старая | `data/offers-snapshot.json` → `generatedAt`; нужен **hot publish** (GHA sheet-sync или `make publish-sheet-hot`), не только mos sync |

**Auto-publish в YCF:** при `MOS_ENROLLED_AUTO_PUBLISH=1` и `updatedRows > 0` sync диспатчит GitHub `sheet-sync.yml` (tier=hot). Токен: `CONTENT_REBUILD_GITHUB_TOKEN` в env функции или `secret/github.token` (читается при `make redeploy-yandex-mos-enrolled-sync` / `deploy-yandex-mos-sync-adaptive`).

```bash
node scripts/sync-mos-enrolled.mjs --probe "https://www.mos.ru/pgu2/activity/card/842871"
node scripts/verify-mos-sync-adaptive.mjs
```

Тесты:

```bash
node --test scripts/lib/mos-enrolled-parse.test.mjs
node --test scripts/lib/mos-sync-state.test.mjs
```

---

## Make-цели и файлы

| Make | Действие |
|------|----------|
| `deploy-yandex-mos-sync-adaptive` | Production-стек B1 |
| `deploy-yandex-mos-enrolled-sync` | Legacy B2 |
| `upload-mos-enrolled-cookies` | Cookies → S3 |
| `export-mos-enrolled-stats` | CSV из stats |
| `diagnose-mos-sync-ycf` | S3 + invoke controller/sync |
| `redeploy-yandex-mos-sync-controller` | Только controller после правок lib |
| `redeploy-yandex-mos-enrolled-sync` | Только sync после правок lib |
| `clear-mos-sync-lock` | Сброс `lockUntil` в `ops/mos-sync-state.json` на active S3 |
| `mos-enrolled-sync*` | Локальный CLI/daemon |

| Путь | Роль |
|------|------|
| `scripts/sync-mos-enrolled.mjs` | CLI |
| `scripts/lib/mos-enrolled-sync.mjs` | Sheet + mos.ru |
| `scripts/lib/mos-sync-state.mjs` | PID / state |
| `scripts/lib/schedule-traffic.mjs` | Pulse |
| `scripts/lib/mos-enrolled-events.mjs` | JSONL / TG |
| `scripts/deploy-yandex-mos-sync-adaptive.mjs` | Деплой B1 |
| `scripts/verify-mos-sync-adaptive.mjs` | Проверка YCF |
| `apps/yandex-mos-enrolled-sync/` | YCF sync |
| `apps/yandex-mos-sync-controller/` | YCF controller |
| `apps/yandex-schedule-traffic/` | YCF pulse |
# Annual read-only refresh (local candidate, September 2026)

See [the annual audit](annual-schedule-audit-2026-09-09.md) for exact coverage,
unresolved identities, source evidence and deployment gates. The new hot workflow
reads the published baseline before Sheets regeneration, refreshes individual mos
card IDs, retains last-good values on a failed/partial card, and archives a strict
coverage report. Existing finalizer auto-publish enables this independently of
legacy row changes. No new timer is introduced. This source change alone does not
deploy the YCF function or prove successful production refresh.
