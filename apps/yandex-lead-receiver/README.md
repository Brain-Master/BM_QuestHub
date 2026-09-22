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

## Direct mos.ru click (separate, anonymous event)

The same endpoint additionally accepts JSON `event: "booking.mos_click"`,
`eventId` (UUIDv4), `questSlug`, `offerId`, `venueSlug`, optional `variantId`.
These are the **only** permitted fields. Requests containing `event` never enter
the lead, Sheets, n8n or lead-error reporting pipelines, even with extra contact
fields. A click is not an application, verified navigation, unique visitor or
confirmed enrollment. Optional contacts retain the existing `mos_assist` lead
wire contract and consent, but the Telegram title explicitly names contact help.

Click requests require JSON Content-Type and an exact Origin listed in
`ALLOWED_ORIGINS`; missing/null/wildcard origins fail closed. This is not auth:
non-browser clients can spoof Origin. All request bodies are limited to64KiB
before JSON parsing, including decoded base64. No contact details, cookie IDs,
page URL or referrer are accepted as event fields. Network infrastructure still
receives connection metadata; this is not a claim of anonymous infrastructure.

Names, address, programme, variant time and mos.ru URL are resolved together
from the fixed public `bm-questhub/data/offers-snapshot.json` and
`bm-questhub/data/v2/map-snapshot.json` objects on storage.yandexcloud.net.
Redirects and arbitrary destination hosts/paths are rejected; HTML is escaped.
Source reads run in parallel, each≤3s/2MiB; cache TTL30s; no stale fallback.
Telegram is≤3s/64KiB within an8s event budget. Only Telegram `ok:true` plus integer
message_id sets `notified:true`. Existing lead deadline/Sheet behavior is unchanged.
Known closed cards in the existing annual table are read-only links; their click
message explicitly includes closed admission. It does not enable enrollment.
The shared booking CTA's closed/archive/sold-out/review gates remain unchanged.

Per warm instance: at most30 admitted events/minute,256 ledger entries retained
10min,30s cooldown per target. Reservations happen before asynchronous I/O.
Same event/target returns200 only when previously acknowledged, otherwise202
with `notified:false`; target conflicts409, throttling429, unknown target400,
delivery failure502. No uncertain Telegram POST is retried. These in-memory
limits are NOT distributed abuse protection or exactly-once delivery. Limits
may suppress clicks from different parents for the same group. Do not interpret
message counts as visitor or conversion counts. Browser suppression is likewise
per tab/target30s; no durable user identifier or automatic retry.

Navigation is a native new-tab link and never waits for the best-effort request.
Blocked/offline browsers, no JS, rate limits and server faults can lose events.
Reliable/exactly-once capture would need a separately scoped durable architecture.

### Release gate (not executed by local implementation)

Package **both `index.js` and `mos-booking-click.js`** with package.json. Existing
single-file packaging must be adapted during the approved release, or the function
will fail to load. Deploy the receiver first, preserving credentials and the30s
lead execution timeout; configure the exact production origins (not `*`). Then
publish the frontend. Do not publish frontend first: the old handler treats the
new event as an invalid lead. Obtain explicit approval for a correlated synthetic
click and optional form test before sending real Telegram/Sheet writes. Verify
click-only Telegram (no Sheet row) separately from consent-based form delivery.
For rollback, restore frontend before restoring the old receiver. Local mocked
tests cannot establish production delivery.

## Delivery deadlines and failure evidence

Deployment requires **30s function execution timeout** (the prior10s configuration
has confirmed execution timeouts in Cloud Logging). The handler has one26s wall
clock budget starting at entry; the primary sequence shares22s and each request
gets at most12s or its remaining primary budget. This includes headers **and**
response bodies. Bodies are bounded to64KiB. HTTP error bodies are discarded,
not copied into logs. Do not deploy this handler with the old10s runtime limit.

Telegram JSON must confirm `ok:true`; Sheets append must confirm one updated row.
The OAuth request remains form-urlencoded; the Sheet row and21-column contract
are unchanged. There are no automatic non-idempotent POST retries.

n8n uses `min(N8N_TIMEOUT_MS, remaining handler budget)` and is skipped when no
budget remains. Ops uses at most2s within the same deadline and remains best
effort. Neither changes the primary result. All timers are cleared and requests
and response streams are cancelled on expiry.

Cloud logs contain only requestId, fixed phase/event/error code, timing, HTTP
status and outcomes. No lead fields, upstream response, endpoint/token, JWT or
Error stack is logged. The502 response includes requestId for correlation.
`confirmed` means an accepted response was observed; `unknown` means delivery
could have happened despite a lost response. Missing subsequent phase means
`not_started`. RequestId is **not idempotency**: a manual retry after a timeout
can duplicate a previously accepted Telegram message or Sheet row. This narrow
deadline repair does not introduce a persistent deduplication store.

Validation uses abort-aware HTTP fakes and controlled clocks, including a10.5s
primary response that exceeded the old runtime, stalled headers/body, shared
deadline exhaustion, partial delivery, optional n8n failure and log redaction.
Mocks do not prove real production delivery; that requires a separately approved
test lead plus readback or a correlated real application.

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

The append row currently writes columns `A:U`:

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
20. `policyVersion`
21. `consentAt`
