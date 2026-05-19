# Data inventory V2 (migration matrix)

Inventory for unified data model V2. **Status**: `migrated` | `in-code` | `intentional` | `content-yaml` | `snapshot`.

## Legend

| Status | Meaning |
|--------|---------|
| `migrated` | In `apps/web/data/v2/site-config.json` or loaded from snapshot |
| `in-code` | Product data still hardcoded in TS (backlog) |
| `intentional` | Stays in TypeScript by design (algorithms, layout, validation) |
| `content-yaml` | Canonical in `content/*.yaml` until producer |
| `snapshot` | In `data/offers-snapshot.json` or future CDN snapshots |

## Content YAML

| Field group | Location | Status | V2 entity |
|-------------|----------|--------|-----------|
| World / quest / venue facts | `content/worlds`, `quests`, `venues` | `content-yaml` | Universe, Course, Venue |
| World card visuals (gradient, icon) | `content/worlds/*.yaml` `presentation` | `content-yaml` | Universe.presentation |
| Shift rows | `data/offers-snapshot.json` | `snapshot` | Event + EventVariant |

## Migrated to site-config.json

| Field | Was | Status |
|-------|-----|--------|
| World nav groups | `site-header.tsx` | `migrated` |
| Cities (label, gradient, sort) | `city-card.ts` | `migrated` |
| Metro lines | `metro-label.tsx` | `migrated` |
| Map bounds, metro anchors, fallback | `map-projection.ts` | `migrated` |
| Map site points, geo control, image | `map-calibration.ts` | `migrated` → `site-config.map` |
| Brand contacts | `site-contact.ts` | `migrated` |
| Registration flow copy | `registration-flow.ts` | `migrated` |
| Event status labels + variants | `schedule-board.ts` | `migrated` → `dictionaries.eventStatus` |
| Schedule CTA labels | `schedule-board.ts` | `migrated` → `dictionaries.scheduleCta` |
| Capacity / planning sheet statuses | `schedule-board.ts` | `migrated` → `dictionaries` |
| Program name → quest_slug hints | `quest-slug.ts` | `migrated` → `dictionaries.programSlugFragments` |

## Sheet sync (producer path)

| Field | Location | Status |
|-------|----------|--------|
| `venue_slug`, `quest_slug` columns | Google Sheet | Required via `REQUIRED_SHEET_HEADERS` |
| School name → venue fallback | `venue-from-school.ts` | **Removed** — use `venue_slug` column |
| Quest slug resolution | `quest-slug.ts` | Explicit `quest_slug` required; optional fragments in config |

## Still in code (intentional)

| Concern | Location | Status |
|---------|----------|--------|
| Date formatting (`RU_MONTHS`) | `schedule-board.ts`, `agenda.ts` | `intentional` |
| Status resolution rules (sold-out, archived) | `schedule-board.ts` | `intentional` |
| Map projection math | `map-projection.ts` | `intentional` |
| Catalog / school filters | `catalog-filters.ts`, `school-scope.ts` | `intentional` |
| Lead form validation | `schemas.ts` | `intentional` |
| Legal document bodies | `content/legal/*.ts` | `intentional` / future `legal[]` |
| Marketing metadata copy | `app/**/page.tsx`, footer, hero | `intentional` |
| Dev map calibrator | `components/dev/*` | `intentional` |

## Runtime

| Path | Status |
|------|--------|
| `loadQuests()` | Uses `loadScheduleSnapshotV2()` → `scheduleV2ToOffersByQuest()` |
| V1 `offers-snapshot.json` | Fallback inside `loadScheduleSnapshotV2` until native V2 schedule file |

## Guardrails

| Check | Location |
|-------|----------|
| Private field denylist on public JSON | `scripts/validate-public-snapshot.mjs` |
| No legacy hardcoded map/sheet constants in `lib/` | `scripts/audit-hardcoded-data.mjs` |

## Private / denylisted (never on CDN)

Manager contacts, drafts, API keys, internal sheet row IDs — see `private-field-denylist.ts`.
