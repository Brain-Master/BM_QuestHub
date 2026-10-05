# WEB-AUTUMN-CAMPS-2026 — autumn camp publication

## Metadata and authority
Status: PLANNING; started 2026-10-06 Europe/Moscow.
Task Packet: user request in this conversation to update autumn camps on b-master.pro.
Repository: /home/xipsin/projects/BM_QuestHub/design-previews/schedule-audit-2026-09-09/repo
Branch: fix/schedule-data-and-venues-2026-09-09
Base SHA: 6168d71b60a4fe5c0926ab4789de1fb6cdda72e2.

## Objective / non-goals
Publish ten autumn offers across eight schools/organizations, retaining historical summer offers and all annual groups/reservations. No invented dates, prices, capacity, teacher assignments or card links. No messaging families, no dependency upgrades, no unrelated infrastructure work.

## Current authorized preparation paths
Write this ExecPlan and apps/web/content/autumn-camps-2026.json as unconsumed source facts. Pending scheduling facts must remain null and cannot be published. Subsequent compiler/publication exact paths and protected registry operations will be recorded before implementation. No staging/commit during this preparation phase. Preserve all pre-existing changes, including prior 2103 DONE receipt.

## Preflight
Verified repository root/branch/HEAD/status/log and git diff --check (exit 0). Node22.23.1/npm10.9.8 via /home/xipsin/.nvm/versions/node/v22.23.1/bin. Existing npm lockfiles; no installation. Tracked prior2103 ExecPlan receipt and unrelated untracked reports/services preserved. No product baseline tests run yet because source facts are not consumed.

## Architecture and classification
product_domain: reviewed public autumn camp facts. Google Groups+Formats -> sync-hot-core -> map-rows-to-offers -> sync-runner -> annual integration -> S3 hot; cold v2 supplies courses/venues. A raw hot edit is transient and prohibited. Need idempotent reviewed source overlay inside generation before combined validation; new autumn IDs only. Source currently unconsumed.

## Independent read-only audits
A audit_data: confirmed Sheets overwrites legacy rows; unknown price needs string label rather than zero; preserve annual identities and reservation metadata. B audit_publish: historical summer rows must not be copied with operational facts; no-MOS planning offers can use preliminary registration; omit unknown capacities; new cold entities require full joined validation. Parent independently checked mapper/schema/orchestrator and source profiles. Both flag current MOS worker rejecting live nonannual camps as MOS_LEGACY_SOURCE_UNSUPPORTED: do not claim live capacity support without a separately reviewed implementation.

## UX and privacy
Ten separate offers: three distinct school2044 buildings. 1517 price unknown, show 'Цена уточняется'. Missing MOS cannot retain old summer URLs. 1383 is only BrainMaster's two-session block within school intensive; price scope pending. No sensitive roster or phone publication. Existing annual2103 reservation51 remains untouched.

## Evidence / missing facts
User posters:1212 CyberRhythm,27-31Oct,09:00-12:30,9100,corpus1; school profiles identify corpus1 as Vilnyusskaya14 (not former summer campus). EKT public API fetchMosCard1071480 listing2586628 groupК7643-26 matched supplied dates26-30Oct,09:00-12:30,12950,free12/12,age6-13,teacherKupriyanova. Questions pending: remaining camp dates; exact1383 session times and9500 price scope;2103/1517/937 buildings. Current source stores null instead of guessing.

## Implementation and acceptance after answers
1. Resolve source facts. 2. Record exact compiler/source/UI/generated paths and protected operations. 3. Build idempotent overlay with strict source validation and no annual differences. 4. Validate schema, stale summer links absent from autumn rows, unknown price/capacity truthful, no duplicate shifts. 5. Full npm --prefix apps/web run check, focused desktop/mobile checks, git diff --check. 6. Freeze sorted relative path+NUL+bytes+NUL SHA256; independent APPROVE and make secret-scan before any exact staging. 7. Scoped publish with backups, CAS/single-writer checks, rollback, website deployment and live verification, preserving annual reserves. Commit/publication scope to be recorded concretely before execution.

## Validation / failure history / scope changes
Read-only git diff --check passed. Public MOS read succeeded. Initial rg referenced nonexistent scripts/merge-offers.ts; corrected to apps/web/lib/offers/merge-offers.ts, no edits from failed search. No product changes, no tests claimed. No scope expansion.

## Freeze / review / staging / final status
Not frozen; no implementation review, staging, commit, production writes or deployment performed. Awaiting required source facts; task incomplete.

## Owner scope update — 2026-10-06
Owner explicitly authorizes publication as-is with BrainMaster preliminary registration. Implement separate static /camps/ collection and scoped school sections; reuse BookingForm+preliminary flow. Null dates/address/price stay truthful display labels; never manufacture VenueOffer dates. No S3/annual/runtime changes needed: source is directly imported by static build, cannot be overwritten by Sheets. This replaces proposed snapshot overlay.
Exact write paths: this plan; apps/web/content/autumn-camps-2026.json; apps/web/components/autumn-camps.tsx; apps/web/app/camps/page.tsx; apps/web/app/page.tsx; apps/web/app/sites/[school]/page.tsx. Tests/reports under /home/xipsin/projects/BM_QuestHub/reports/autumn-camps-2026-10-06. PA-BUILD-002/003 outputs generated only by npm --prefix apps/web run check; never staged. No PA-GEN or S3 publication. Existing Timeweb main autodeploy via scoped commit/push/PR merge is authorized by user's request to publish. No config changes; rollback via revert deployment commit. Verification uses browser mocked submit (no messages to families or fake real leads), backend unit tests and existing integration contract. Production delivery is not claimed tested by synthetic sends.

Additional exact source path: apps/web/app/sitemap.ts to include /camps/ in discovery.

Browser first run found cookie banner z100 intercepted preliminary dialog z50 checkbox. Camp popup raised to z110 (local component only); repeat full check and browser including unresolved cookie banner. Backend receiver tests25/25 passed.

## Validation completed / frozen candidate
2026-10-06: npm --prefix apps/web run check exit0 (lint, snapshot validation, hardcoded audit, host tests, staticbuild). node --test apps/yandex-lead-receiver/index.test.js exit0 25/25. Browser helper report browser-local.json passed1440/390:10cards,3school2044,unknownprice/date,onlyEKTlink,waitlist+brainmaster+consentAt payload,secondcampidentity,emptynewform,mocked503retainsinputs,no false success,retry success,nooverflow/noJSerrors,cookiebanner retained. No real lead sent. git diff --check exit0. Screenshot visually inspected. Existing S3 and annual source files unchanged.
Freeze: seven explicit files, sorted path NUL bytes NUL SHA256; manifest stored outside repository at reports/autumn-camps-2026-10-06/freeze.json to avoid self-reference. Independent final review required before exact staging. Subject: feat(web): open autumn camp preliminary registration. Rollback: revert this scoped website commit and allow existing main autodeploy; S3/runtime untouched.
