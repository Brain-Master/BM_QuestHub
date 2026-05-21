# Yandex Lead Ops Reporter

Serverless ops endpoint for Quest Hub lead submission failures. Sends admin Telegram alerts, structured Cloud logs, and optional Google Sheet rows.

## Events

| `event` | `source` | When |
|---------|----------|------|
| `lead.server_error` | `bm-lead-receiver` | Receiver returns 400/502 (with `X-Ops-Token`) |
| `lead.client_submit_failed` | `bm-questhub-static` | Browser submit failed (CORS + rate limit) |
| `site.health_check_failed` | `bm-site-health` | Scheduled HTTP check failed ([`site-health.yml`](../../.github/workflows/site-health.yml)) |

Telegram messages use Russian titles (not raw event codes).

## Handler

Use `index.handler` as the Yandex Cloud Function entry point.

- `OPTIONS` — CORS preflight
- `POST` — accept ops event, respond `202` immediately after best-effort delivery

## Auth

- **Server** (`bm-lead-receiver`): header `X-Ops-Token` = `OPS_REPORT_TOKEN`
- **Browser**: no token; `Origin` must be listed in `ALLOWED_ORIGINS`. Client events are rate-limited (default 1/min per `contact+offerId+IP`).

## Google Sheet (`GOOGLE_OPS_SHEET_RANGE`)

Create the **Ops** tab on the leads spreadsheet:

```bash
node scripts/setup-ops-sheet.mjs
```

Default range: `Ops!A:M` (13 columns).

| Col | Field |
|-----|-------|
| A | `receivedAt` |
| B | `occurredAt` |
| C | `requestId` |
| D | `event` |
| E | `source` |
| F | `httpStatus` |
| G | `errorCode` |
| H | `errorMessage` |
| I | `issues` |
| J | `parentName` |
| K | `contact` |
| L | `questTitle` |
| M | `offerId` |

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
