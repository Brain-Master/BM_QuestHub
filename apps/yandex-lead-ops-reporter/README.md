# Yandex Lead Ops Reporter

Serverless ops endpoint for Quest Hub lead submission failures. Sends admin Telegram alerts, structured Cloud logs, and optional Google Sheet rows.

## Events

| `event` | `source` | When |
|---------|----------|------|
| `lead.server_error` | `bm-lead-receiver` | Receiver returns 400/502 (with `X-Ops-Token`) |
| `lead.client_submit_failed` | `bm-questhub-static` | Browser submit failed (CORS + rate limit) |

## Handler

Use `index.handler` as the Yandex Cloud Function entry point.

- `OPTIONS` — CORS preflight
- `POST` — accept ops event, respond `202` immediately after best-effort delivery

## Auth

- **Server** (`bm-lead-receiver`): header `X-Ops-Token` = `OPS_REPORT_TOKEN`
- **Browser**: no token; `Origin` must be listed in `ALLOWED_ORIGINS`. Client events are rate-limited (default 1/min per `contact+offerId+IP`).

## Google Sheet columns (`GOOGLE_OPS_SHEET_RANGE`)

1. `receivedAt`
2. `occurredAt`
3. `requestId`
4. `event`
5. `source`
6. `httpStatus`
7. `errorCode`
8. `errorMessage`
9. `issues`
10. `parentName`
11. `contact`
12. `questTitle`
13. `offerId`

## Environment

See [`.env.example`](./.env.example).

Deploy as `bm-lead-ops-reporter`. Set invoke URL as:

- `OPS_REPORT_URL` on `bm-lead-receiver`
- `NEXT_PUBLIC_OPS_REPORT_URL` on static site build (Timeweb)

## Tests

```bash
cd apps/yandex-lead-ops-reporter
npm test
```
