# Site Snapshot V2 contract

Public CDN/S3 payloads for BrainMaster Quest Hub. **Private CRM/DB remains source of truth**;
producer validates, strips denylisted fields, and publishes versioned JSON.

V1 schedule contract remains valid for transition: [schedule-snapshot-contract.md](./schedule-snapshot-contract.md).

## Snapshot set (production)

| File | Purpose |
|------|---------|
| `data/v2/site-manifest.json` | Atomic version pointer, schema hashes |
| `data/v2/site-snapshot.json` | Brand, navigation, dictionaries, legal metadata |
| `data/v2/catalog-snapshot.json` | Course/universe cards for catalog filters |
| `data/v2/schedule-snapshot.json` | Events, variants, capacity, registration |
| `data/v2/map-snapshot.json` | Venues, coordinates, metro anchors, event ids |

Optional: `data/v2/detail/<courseSlug>.json` for heavy course pages.

### Manifest shape

```json
{
  "version": 2,
  "generatedAt": "2026-05-19T12:00:00.000Z",
  "source": "bm-questhub-producer",
  "snapshots": {
    "site": { "path": "data/v2/site-snapshot.json", "contentHash": "sha256:…" },
    "catalog": { "path": "data/v2/catalog-snapshot.json", "contentHash": "sha256:…" },
    "schedule": { "path": "data/v2/schedule-snapshot.json", "contentHash": "sha256:…" },
    "map": { "path": "data/v2/map-snapshot.json", "contentHash": "sha256:…" }
  }
}
```

Producer must upload all files, then swap manifest last.

## Environment (site loader)

| Variable | Role |
|----------|------|
| `SITE_SNAPSHOT_MANIFEST_URL` | Full URL to manifest (overrides local) |
| `NEXT_PUBLIC_S3_PUBLIC_BASE_URL` | Base for relative snapshot paths when source is `s3` |
| `SITE_SNAPSHOT_SOURCE` | `local` (default) or `s3` |
| `SITE_CONFIG_PATH` | Override path to `site-config.json` fallback |

Schedule V1 compatibility (unchanged):

- `OFFERS_SNAPSHOT_URL`, `OFFERS_SNAPSHOT_PATH`, `OFFERS_SNAPSHOT_SOURCE`

## Top-level `SiteSnapshotV2` (logical model)

Implemented in `apps/web/lib/data/v2/site-snapshot.ts`. Logical bundle used by adapters;
physical files may split fields across manifest members.

Required top-level keys when bundled:

- `version`: literal `2`
- `generatedAt`: ISO-8601
- `source`: producer id string
- `integrity`: `{ schemaHash?: string, contentHash?: string }`
- `brand`, `navigation`, `dictionaries`, `legal`
- `universes`, `courses`, `venues`, `cities`, `events`

## Core entities

### `EventV2`

- `id`, optional `slug`
- `relations.courseId`, `relations.venueId` (must reference catalog ids)
- `schedule.startDate`, `endDate`, `timezone`, `slots[]`
- `status.value`: normalized enum (see below)
- `status.sourceRaw`: optional audit copy from sheet
- `registration`: channel, allowBooking, allowWaitlist, optional externalUrl
- `presentation`: semantic overrides only (no CSS)
- `variants[]`: `EventVariantV2`

### `EventStatus` (normalized)

`planning | recruiting | in_progress | join_late | sold_out | waitlist | finished | cancelled`

Russian labels, colors, and CTA text live in `dictionaries.eventStatus`, not in raw status strings.

### `EventVariantV2`

Replaces informal “format” rows: time, price label, age, mos.ru code, per-variant registration.

### Presentation guardrail

Allowed: `featured`, `badge`, `visualTreatment`, `imageFocalPoint`, `sortOrder`, `highlightReason`.

**Not allowed** in snapshots: `className`, `tailwind`, pixel heights, component variant names.

## Private field denylist

Keys matching (case-insensitive, any depth) are rejected by `validate-public-snapshot`:

- `managerEmail`, `managerPhone`, `internalNote`, `draft`, `crmSecret`
- `apiKey`, `password`, `serviceAccount`, `privateKey`
- `sheetRowId` (unless explicitly allowlisted later)

See `apps/web/lib/data/v2/private-field-denylist.ts`.

## Cache behavior

| Asset | TTL guidance |
|-------|----------------|
| Manifest | Short (60s–300s) or `cache: no-store` at build |
| Snapshots | Short CDN TTL; immutable when URL includes content hash |
| Media | Long TTL, versioned paths |

Runtime: on fetch/parse failure, keep last good in-memory snapshot (build) or fall back to
`data/v2/site-config.json` + local V1 `offers-snapshot.json`.

Build: `SITE_SNAPSHOT_STRICT=1` fails build if bundled public JSON fails schema + denylist.

## V1 → V2 mapping (schedule)

| V1 (`VenueOffer`) | V2 |
|-------------------|-----|
| `id` | `Event.id` |
| `venueSlug` | `relations.venueId` |
| quest slug key in `offersByQuest` | `relations.courseId` |
| `startDate` / `endDate` | `schedule` |
| `scheduleCard.*` | `presentation` |
| `scheduleCard.variants` | `variants` |
| `sheetStatus` | `status.sourceRaw` + mapped `status.value` |
| `enrolled` / `maxCapacity` | `capacity` |

Adapter: `apps/web/lib/data/v2/v1-to-v2.ts`.

## Compatibility

- Site continues to load YAML + V1 offers until producer ships V2 schedule snapshot.
- `loadSiteConfig()` supplies navigation/cities/brand/dictionaries immediately.
- UI status resolver unchanged; copy loaded from config dictionaries.
