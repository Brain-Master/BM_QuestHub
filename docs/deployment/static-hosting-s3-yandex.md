# Static Hosting, S3, And Yandex Receiver

## Runtime Shape

- Timeweb serves the exported static site from `apps/web/out`.
- The site has no Next.js server, API routes, or server actions in production.
- Public media and optional public JSON data live in hot S3 storage.
- The browser submits leads only to `NEXT_PUBLIC_LEAD_SUBMIT_URL`.
- The Yandex receiver owns all private integrations: Telegram notifications, n8n forwarding, validation, rate limiting, and secrets.

## Timeweb Static Settings

If the Timeweb project root is the repository root:

- Build command: `npm run build`
- Build output directory: `apps/web/out`
- Project directory: empty

If the Timeweb project root is `apps/web`:

- Build command: `npm run build`
- Build output directory: `out`
- Project directory: `apps/web`

Do not enable SSR for the static deployment.

## School Subdomain Aliases

The app itself is path-first because static export cannot inspect request
hostnames at runtime. School-scoped links should target generated pages such as:

```text
https://quest.b-master.pro/sites/school-1517/agenda/
https://quest.b-master.pro/sites/school-1517/catalog/
https://quest.b-master.pro/sites/1517/agenda/
https://quest.b-master.pro/sites/1517/catalog/
```

Pretty school subdomains are a hosting/CDN concern. Configure aliases like
`1517.quest.b-master.pro` to serve the same static bundle and rewrite the root
path to the matching generated route, for example
`/sites/1517/agenda/`. The app also generates canonical
`/sites/school-1517/...` pages for internal links. Do not rely on Next.js
middleware or API routes for this in the static deployment.

## Public Environment Variables

The static bundle can only use public values:

- `NEXT_PUBLIC_SITE_URL`: canonical website origin.
- `NEXT_PUBLIC_YM_ID`: Yandex Metrika counter id.
- `NEXT_PUBLIC_LEAD_SUBMIT_URL`: Yandex Cloud Function/API Gateway URL for lead submission.
- `NEXT_PUBLIC_S3_PUBLIC_BASE_URL`: public base URL for S3-hosted assets/data.

Do not put Telegram bot tokens, n8n webhook URLs, Google service account JSON, or other private values into `NEXT_PUBLIC_*`.

## S3 Layout Convention

Use stable, cache-friendly paths:

```text
s3://<bucket>/media/quests/<quest-slug>/<file>
s3://<bucket>/media/worlds/<world-slug>/<file>
s3://<bucket>/data/offers-snapshot.json
```

For files that are replaced in place, use conservative cache headers or version the filename/path. Large media can use long cache headers when filenames are content-versioned.

## Lead Payload Contract

The browser sends JSON to Yandex:

```json
{
  "leadType": "booking",
  "parentName": "Имя",
  "contact": "+7...",
  "consent": true,
  "questSlug": "minecraft-taina-drevnih-inzhenerov",
  "questTitle": "Minecraft: Тайна Древних Инженеров",
  "offerId": "offer-id",
  "venueSlug": "school-1212-yasenevo",
  "venueName": "Школа ...",
  "schoolSlug": "school-1212",
  "submittedAt": "2026-05-16T08:00:00.000Z",
  "source": "bm-questhub-static"
}
```

Yandex should validate the payload again server-side, add its own trusted `receivedAt`, send the Telegram notification, then forward the normalized event to n8n.
`leadType` is `booking` for regular booking leads and `waitlist` for sold-out
offers that allow a waitlist CTA.

## Offers Update Flow

First cut: bake `apps/web/data/offers-snapshot.json` into the static build. Updating the schedule means:

1. Sync Google Sheet to `offers-snapshot.json`.
2. Commit or otherwise provide the updated snapshot to the build.
3. Rebuild and redeploy the static site.

Later, if schedule updates need to happen without redeploying, move the public snapshot to `data/offers-snapshot.json` in S3 and add client-side fetching with an explicit cache strategy.
The JSON shape is documented in `docs/data/schedule-snapshot-contract.md`.
For build-time reads from S3 before client-side refresh exists, set
`OFFERS_SNAPSHOT_URL` to the public snapshot URL, or set
`OFFERS_SNAPSHOT_SOURCE=s3` together with `NEXT_PUBLIC_S3_PUBLIC_BASE_URL`.
