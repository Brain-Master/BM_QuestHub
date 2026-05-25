# bm-s3-connectivity-probe

YCF для проверки доступа к Timeweb S3 из сети Yandex Cloud (тот же путь, что у `bm-mos-enrolled-sync`).

## Деплой

```bash
make deploy-yandex-s3-connectivity-probe
# или
node scripts/deploy-yandex-s3-connectivity-probe.mjs
```

Требуется `scripts/s3.env` и `YC_TOKEN` (или профиль `bm-deploy-sa`).

## Запуск

```bash
make invoke-s3-connectivity-probe
# или
yc serverless function invoke --name bm-s3-connectivity-probe --data '{"sendTelegram":true}'
```

Результат: логи в консоли YCF + сообщение в Telegram (если заданы `TELEGRAM_*`).

Переменные:

| Env | Default |
|-----|---------|
| `S3_PROBE_ROUNDS` | 3 |
| `S3_PROBE_TG` | `1` (0 = без Telegram) |
| `MOS_OPS_S3_TIMEOUT_MS` | как у sync (15000 в deploy) |
