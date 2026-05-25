# Yandex Lead Receiver

HTTP receiver for Quest Hub lead forms. It is designed for Yandex Cloud
Functions and keeps private integrations outside the static Next.js bundle.

**Документация:** [static-hosting-s3-yandex.md](../../docs/deployment/static-hosting-s3-yandex.md) · [все YCF](../../docs/deployment/yandex-cloud-functions.md).

## Handler

Use `index.handler` as the function entry point.

The function accepts:

- `OPTIONS` for CORS preflight.
- `POST` with the JSON payload sent by `apps/web/lib/lead-submit-client.ts`.

On a valid lead it:

1. Sends a Telegram message.
2. Appends a row to Google Sheets.
3. Forwards a copy to n8n as best-effort automation.

The function returns `200 OK` only after Telegram and Google Sheets succeed.
n8n failures are logged and returned as `n8nForwarded: false`, but do not fail
the lead.

## Environment

See `.env.example` for the full list.

Required:

- `ALLOWED_ORIGINS`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_LEADS_SHEET_RANGE`

Optional:

- `N8N_WEBHOOK_URL`
- `N8N_TIMEOUT_MS`
- `OPS_REPORT_URL` / `OPS_REPORT_TOKEN` — notify [`apps/yandex-lead-ops-reporter`](../yandex-lead-ops-reporter/) on 400/502

On validation or delivery failure the receiver POSTs `lead.server_error` to the ops function (fire-and-forget).

## Google Sheet Columns

The append row currently writes columns `A:S`:

1. `receivedAt`
2. `submittedAt`
3. `requestId`
4. `leadType`
5. `registrationChannel`
6. `parentName`
7. `contact`
8. `childName`
9. `childAge`
10. `questTitle`
11. `questSlug`
12. `venueName`
13. `venueSlug`
14. `offerId`
15. `variantId`
16. `variantTitle`
17. `schoolSlug`
18. `comment`
19. `source`
