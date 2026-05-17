# Schedule Snapshot Contract

`apps/web/data/offers-snapshot.json` is the normalized schedule input for the
Next.js app. Google Sheet is only the current producer. A future external
service can publish the same JSON shape to S3 without changing Schedule Board
components.

## Location

Current build-time file:

```text
apps/web/data/offers-snapshot.json
```

Future public S3 object:

```text
s3://<bucket>/data/offers-snapshot.json
https://<public-s3-base>/data/offers-snapshot.json
```

The app reads the local file by default. For build-time S3 reads, set either:

```text
OFFERS_SNAPSHOT_URL=https://<public-s3-base>/data/offers-snapshot.json
```

or:

```text
OFFERS_SNAPSHOT_SOURCE=s3
NEXT_PUBLIC_S3_PUBLIC_BASE_URL=https://<public-s3-base>
```

## Version 1 Shape

```json
{
  "version": 1,
  "generatedAt": "2026-05-17T00:00:00.000Z",
  "source": "s3_schedule_snapshot",
  "offersByQuest": {
    "minecraft-taina-drevnih-inzhenerov": [
      {
        "id": "sheet:minecraft-taina-drevnih-inzhenerov:school-1212:2026-06-01:2026-06-05:9:00",
        "venueSlug": "school-1212",
        "shiftLabel": "Minecraft · Школа 1212",
        "startDate": "2026-06-01",
        "endDate": "2026-06-05",
        "startTime": "9:00",
        "endTime": "12:30",
        "dateRange": "01.06.2026 — 05.06.2026",
        "daySchedule": "Ежедневно: 9:00–12:30",
        "priceLabel": "8 500 ₽",
        "mosBookingUrl": null,
        "sheetStatus": "Идёт набор",
        "enrolled": 8,
        "maxCapacity": 20,
        "scheduleCard": {
          "displayTitle": "Minecraft: Тайна Древних Инженеров",
          "description": "Инженерная смена с программированием и командными испытаниями.",
          "teacherName": "Алексей Иванов",
          "tags": ["Minecraft", "инженерия"],
          "formatType": "Интенсив",
          "formatTime": "9:00–12:30",
          "formatNote": "Подходит для участников 6–13 лет.",
          "mosRuCode": "2442453",
          "status": "Идёт набор",
          "isArchived": false,
          "allowWaitlistWhenSoldOut": true,
          "media": {
            "hero": {
              "url": "https://<public-s3-base>/media/quests/minecraft/hero.webp",
              "alt": "Дети собирают Minecraft-механизм",
              "focalPoint": { "x": 50, "y": 42 }
            },
            "compact": {
              "url": "https://<public-s3-base>/media/quests/minecraft/compact.webp",
              "alt": "Minecraft-интенсив"
            }
          }
        }
      }
    ]
  }
}
```

## Field Rules

- `version` is required and currently must be `1`.
- `generatedAt` is an ISO timestamp from the producer.
- `source` should be `google_sheet` for the current adapter or
  `s3_schedule_snapshot` for the external service.
- `offersByQuest` keys must match `content/quests/*.yaml` `slug` values.
- Each offer must satisfy `VenueOffer` from `apps/web/lib/schemas.ts`.
- `venueSlug` must match a known venue from `content/venues`.
- `startDate` and `endDate` use `YYYY-MM-DD`; `startTime` and `endTime` use
  `H:mm` or `HH:mm`.
- `scheduleCard` is optional for compatibility, but new producer data should
  fill it for Schedule Board quality.
- `scheduleCard.allowWaitlistWhenSoldOut=true` enables a waitlist CTA only when
  capacity is sold out.
- `scheduleCard.media.*.focalPoint` uses percentages from `0` to `100` for CSS
  `object-position`.

## Caching

For build-time reads, the snapshot can be cached normally by the build runner.
For future client-side reads without redeploys, publish either immutable
versioned paths or conservative cache headers for
`/data/offers-snapshot.json`, then fetch with an explicit refresh strategy.

## Migration Rule

Do not add UI-specific fields directly to page components. Add fields to
`VenueOffer.scheduleCard`, validate them through the snapshot parser, and keep
Schedule Board dependent on the normalized `VenueOffer` contract.
