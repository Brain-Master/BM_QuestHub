# Annual mos.ru schedule — owner CSV import, 2026-09-08

## Source and scope
Owner-provided archive: `brainmaster_mosru_dataset_enriched_2026-09-08_csv.zip`, SHA256 `ecf2aa67d7490a5de15e1242ec333ac3c3b34ccc52167c4f0fcee474d98f8de7`. Original remains in `/mnt/d/WORK/00_Inbox/vkcom-brainmaster/` unchanged.

Read exactly cards.csv, groups.csv, locations.csv and schedule.csv. Ignore applications_1517.csv entirely in the importer; no application statistics, contacts, raw notes, filenames or registry identifiers enter the public projection. Programme mapping: all 30 supplied card titles identify SHMI. No supplied academy/projects/league groups are invented.

## Imported result
51 unique groups; 52 weekly time slots (К1981-26 has two); 30 listings; 8 exact school/address pairs across 6 schools. Source statuses: 46 open, 5 closed. Four known direct card IDs are reused by 13 groups; remaining 38 groups use supplied listing search links. Direct ID is never constructed from listing ID.

Two synthetic source group keys are preserved only as internal stable identifiers. Their displayed group code, teacher and capacity are withheld because those facts came from missing/inferred/registry-derived source fields. Missing price and age remain null, never free or zero. Capacity and enrolment status are independent source facts. Status is always labelled as the 8 September snapshot, not a live availability guarantee.

## Data flow and compatibility
CSV ZIP → `scripts/import-year-schedule.py` → `apps/web/content/year-schedule.generated.json` → strict Zod boundary in `apps/web/lib/year-schedule.ts` → server props → client filter/cards in `apps/web/components/year-schedule.tsx`.

Dedicated page `/year-courses/schedule/`; entry points from annual overview, SHMI (including first-screen CTA), and `/agenda/`. Separate weekly read model avoids misusing existing intensive shift adapters that produce daily schedules. Existing `apps/web/data/offers-snapshot.json` is unchanged, SHA256 `8cdfac12f5b181987b427c5507792c2de9f8436ee8fab5b919666e75bfa7f911`. Existing map, catalogue, booking and hot refresh contracts remain unchanged.

## Reproduce / verify
From repository root:

```sh
python3 scripts/import-year-schedule.py /mnt/d/WORK/00_Inbox/vkcom-brainmaster/brainmaster_mosru_dataset_enriched_2026-09-08_csv.zip --write
python3 scripts/import-year-schedule.py /mnt/d/WORK/00_Inbox/vkcom-brainmaster/brainmaster_mosru_dataset_enriched_2026-09-08_csv.zip --check
python3 -m unittest discover -s scripts -p test_import_year_schedule.py
node scripts/verify-year-schedule-ui.mjs
```

Node 22; browser script accepts PREVIEW_URL, CHROMIUM_PATH and QA_OUTPUT. Local run used Chromium 1228 via its explicit installed executable. UI runtime verification does not contact mos.ru or submit forms. URLs validated against supplied data and exact host/path rules, not independently live-verified.

The importer is intentionally tied to the dated 2026-09-08 source format. Do not use it for a newer source while leaving the observation date unchanged; add explicit supported-date input and tests in that update. Generated files must not be hand-edited. Validation fails on duplicates, missing joins, malformed dates/times, unsafe URLs, unknown statuses/programmes and inconsistent seat counts.

## UX and limitations
School, exact address, weekday, title/teacher/code search, source-open-only filter; counts, reset and empty state. Filters are local page state and reset on a fresh load; not represented as shareable URL filters in this slice. All slots for a matched group stay visible. Course period is not a claim of daily sessions or holiday exceptions. External link opens a new tab and is labelled as such.

Local-only delivery: no commit, push, production upload, deployment or registry publication. Full global TypeScript still fails in existing unrelated tests. This import does not claim full-site accessibility or a production data refresh.
