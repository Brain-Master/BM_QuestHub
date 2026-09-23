# WEB-CONFIRMED-SCHOOL-GROUPS

## Metadata / authority
Repository Brain-Master/BM_QuestHub, branch fix/schedule-data-and-venues-2026-09-09,
HEAD b789b70d00747cd1078cb72dd295652fad53ac83. Owner: all1212 groups are SHMI1;
"Давай всё внесём" authorizes the previously audited confirmed additions/corrections.
2026-09-23. Status IMPLEMENTING. NO COMMIT; no push or production publication.

## Objective / non-goals
Integrate seven1212 groups (one new, six corrected) and four937 groups into the
existing annual source/compiler/QR schedule. Retain school37 and four retired2044
records. Do not import plans/reserves/private XLSX, alter875, solve eight unresolved
2044 identities, activate timers, touch credentials, services/publications, or deploy.

## Paths and protected overrides
Source writes: content/annual-additions/school-1212.json and school-937.json,
content/annual-group-overrides.ts, content/year-integration.ts under apps/web;
scripts/lib/confirmed-school-source.mjs, scripts/import-confirmed-school-groups.ts,
scripts/compose-annual-additions.mjs, scripts/integrate-year-schedule.ts;
focused scripts/confirmed-school-groups.test.mjs, school-937-intake.test.mjs,
school-37-import.test.mjs, school-2103-import.test.mjs, annual-overlay-refresh.test.mjs,
verify-confirmed-school-groups-ui.mjs, verify-school-37-ui.mjs;
apps/web/lib/offers/{confirmed-school-groups,annual-integration,annual-programme-groups,
annual-retirements,course-finder,school-2103,school-37}.test.ts,
apps/web/lib/sites/venue-profile-audit.test.ts; this plan.
Generated only through the importer/compiler: apps/web/content/year-schedule.generated.json,
apps/web/content/annual-mos-refresh.generated.json; PA-GEN-001 and PA-COMPAT-001..005:
apps/web/data/offers-snapshot.json, data/v2/catalog-snapshot.json, map-snapshot.json,
site-manifest.json, detail/shmi.json, it-academy.json, projects.json, olympiad-league.json.
Paths in the preceding sentence after apps/web are relative to apps/web.
PA-BUILD-002/003: local build/check only, never stage. No schema or route break.
Rollback via importer preimage backup and task-specific hunks, never reset dirty tree.

## Preflight / baseline
Root/branch/HEAD verified; git diff --check exit0; Node22.23.1 npm10.9.8.
Existing dirty/untracked work belongs to prior tasks; index untouched. Root AGENTS,
PLANS, protected registry, template, web AGENTS and Next static-export guide read.
Preimage SHA256: source101f89158a7310f4adc798a287b6f2711fa073c042da77490cce8c66e170bc68;
registry2e38a2a0bbc8431cc7364db62d9b8145b621f6e6df2a4397b87ca634e4a50c65;
offers e664798f41f15a423c82062f14c118e2d2a286648c6f0732d187e202b4a70526.
Baseline16 importer/selection tests:14pass,2fail BEFORE changes (school37 isolated
refresh coverage includes unrelated retired groups; historical migration expected
pre-retirement bytes). Correction limited to fixture isolation and explicit expected
retirement flags; preserve historical hashes, denial tests and all assertions.
New data writes paused until these scoped baseline defects are verified/repaired.

## Architecture / classification / UX
product_domain: reviewed public source -> validated source+registry -> compiler ->
shared catalogue/finder/site schedules. Preserve exact group-specific card identity,
not a shared parent card for every slot. Preserve raw API teacher/age; apply owner
facts at projection. School937 campus25 remains distinct from old25k2. Existing
loading/error/focus/mobile behavior reused; no visual redesign. Local != production.

## Security / negative paths
Public facts only; no family records or MAX invites. No network writes.
Validate preimages/revisions/identity/address/dates/capacity, duplicate rejection,
rerun idempotence and unknown-preservation. Source hashes advance together; failures
must not falsely mark whole MOS synchronization successful. Stale owner placeholders
must not override studyYear/teacher/age. No current live-fetch claim for pasted data.

## Execution / tests
1. Readonly auditors A/B; parent confirms findings and fixture repairs.
2. Deterministic append-five composer and backed-up local migration; owner rules.
3. Generator --write then --check through apps/web node --import tsx
   ../../scripts/integrate-year-schedule.ts; schema, drift and byte preservation.
4. node --test scripts/confirmed-school-groups.test.mjs scripts/school-937-intake.test.mjs
   scripts/school-37-import.test.mjs scripts/school-2103-import.test.mjs
   scripts/annual-overlay-refresh.test.mjs scripts/refresh-annual-selection.test.mjs.
   apps/web: node --import tsx --test lib/offers/*.test.ts lib/sites/*.test.ts.
5. SITE_SNAPSHOT_SOURCE=local OFFERS_SNAPSHOT_SOURCE=local
   NEXT_PUBLIC_OFFERS_SNAPSHOT_URL=/data/offers-snapshot.json
   NEXT_PUBLIC_SITE_URL=https://b-master.pro npm --prefix apps/web run check.
   Local browser: school1212=7 SHMI1,937=4 SHMI2,37=9, capacity/prices/links,
   filters/mobile/QR/keyboard/no writes. make secret-scan; git diff --check.

## Acceptance / audits / validation log
Pending:74 retained annual rows,70 active;937 four at correct campus;1212 seven
with owner teacher/year, source-end March31 preserved; no unrelated factual changes;
raw/source refresh provenance and full-registry partial state preserved; all gates.
Auditors Hubble 01a0cf32-f881-72c2-8881-a06834f8094f and Halley
01a0cf32-fff3-7260-892f-a80f07353bed read-only. Findings/results appended below.

## Failure history / scope changes
Baseline failures above retained in /tmp/questhub-confirmed-baseline.log.
Read-only guide lookup used wrong Next directory; corrected using rg --files.
No scope expansion or baseline guard bypass.

## Freeze / review / staging / final
Audits A/B accepted and independently verified. Baseline scoped repairs:16/16 PASS,
2026-09-23T17:00Z, exit0. No production logic was weakened; historical hashes intact.
Additional directly necessary paths: apps/web/content/annual-owner-ages.mjs and
school-profiles.ts (remove superseded pending statements), scripts/lib/mos-annual-published.mjs
(do not restore editorial ages as raw facts), apps/web/lib/offers/merge-offers.ts
(reject stale/incomplete annual revisions), apps/web/lib/sites/map-colors.test.ts,
scripts/verify-venue-profiles-ui.mjs (replace superseded937-empty expectation).
These implement confirmed facts durably without changing snapshot schema.
Parent found production loadQuestsShell strips offers, so a merge guard alone is
insufficient. Include apps/web/lib/content/load.ts: retain only the validated annual
build baseline; legacy courses stay thin. Test delayed historical hot responses in
the real exported browser UI. This protects the data integration, not a UI redesign.
Include scripts/refresh-annual-selection.test.mjs to isolate its historical69 source.
Not frozen, reviewer pending. Fingerprint sorted relative path+NUL+bytes+NUL,
exclude this self-referential plan and unrelated files. Stop on identity/preimage
conflict, unexplained edits, validation/review failure, forbidden scope or secrets.
Staging NOT AUTHORIZED. NO COMMIT. No next task started.
Do not push.
Do not start the next task.

## Validation / freeze, 2026-09-23T17:15Z
The first freeze below is SUPERSEDED: additional school37 wizard scan exposed
inherited dark-only capacity colors on the light wizard. Read-only diagnostic
confirmed actual contrast1.38/1.66 over white, not a transition/flaky scan. Include
apps/web/components/course-finder.module.css and schedule-capacity-indicator.module.css
for narrow theme-aware text tokens (no layout/design change), and extend the new
browser regression to light-wizard axe. This also affects the new937 QR flow, so
is part of completing this integration's existing critical path. Revalidate/refreeze.
Target PRE-FREEZE; Node22 PATH as preflight; commands from Test plan above.
- Baseline repaired:16/16. During new data validation, old counts/fixtures failed
  (node22/32, web103/105). Rebased historical69 reconstruction and expectations to
  exact new identities; corrected new facet test to select programme=shmi before
  choosing a level. Final node32/32 and web105/105, exit0. Logs
  /tmp/questhub-confirmed-node-tests-2.log and /tmp/questhub-confirmed-web-tests-2.log.
- Runtime retirement/MOS tests:27/27 exit0, /tmp/questhub-confirmed-runtime.log.
- Local import --write and compiler --write/--check, then import --check:exit0.
  Preimage backup /tmp/questhub-confirmed-schools-g6lFUX (0=source,1=registry,2=offers);
  compiler backup /tmp/questhub-year-data-backup-gitRmn. Source74,active70,slots75/71,
  locations12,existing venue records19. Exactly five new offers; only six existing1212
  offers changed aside from coherent sourceSha256.875/all other offers byte-equivalent.
- Full local npm web check twice:exit0,120 routes,4 pre-existing lint warnings and
  existing NFT tracing warning. Local S3 check SKIPPED, no production claim. Final
  /tmp/questhub-confirmed-build-2.log includes annual build baseline protection.
- Browser script verify-confirmed-school-groups-ui.mjs:exit0,1440/390px,1212seven,
  937four,37nine,total70,correct capacities/direct links/teachers, no overflow,
  delayed old69 response protection, QR wizard/keyboard/reload, no JS errors/writes.
  Axe scans:0 violations in finder; not a complete accessibility audit. Screenshots
  and report /tmp/questhub-confirmed-schools-qa/. Mobile screenshot visually inspected.
- Venue browser first failed because generic[data-campus] now also matches real
  schedule groups. Scoped selector to #venue-addresses, retaining exact two-campus
  assertion. verify-venue-profiles-ui.mjs final exit0, both map points/media and
  owner contact/37 journeys pass, no writes.
- First make secret-scan lacked Node PATH (exit2/127); rerun with declared Node22
  PATH:PASS1444 files,exit0. No findings. git diff --check exit0; index empty.
- Read-only batched file inspection exceeded output budget once; no writes from
  that attempt. Smaller explicit apply_patch changes then succeeded.

Frozen 41 task files (below), SHA256 3f937cba74f8470b4abb68930f0f5b5703e21b5cb49023d647b45398f181d0cc.
Algorithm sorted relative path + NUL + bytes + NUL; this plan excluded from hash.
No code edits after freeze. Prior unrelated dirty files excluded. Status IN_REVIEW.

- apps/web/content/annual-additions/school-1212.json
- apps/web/content/annual-additions/school-937.json
- apps/web/content/annual-group-overrides.ts
- apps/web/content/annual-mos-refresh.generated.json
- apps/web/content/annual-owner-ages.mjs
- apps/web/content/school-profiles.ts
- apps/web/content/year-integration.ts
- apps/web/content/year-schedule.generated.json
- apps/web/data/offers-snapshot.json
- apps/web/data/v2/catalog-snapshot.json
- apps/web/data/v2/detail/it-academy.json
- apps/web/data/v2/detail/olympiad-league.json
- apps/web/data/v2/detail/projects.json
- apps/web/data/v2/detail/shmi.json
- apps/web/data/v2/map-snapshot.json
- apps/web/data/v2/site-manifest.json
- apps/web/lib/content/load.ts
- apps/web/lib/offers/annual-integration.test.ts
- apps/web/lib/offers/annual-programme-groups.test.ts
- apps/web/lib/offers/annual-retirements.test.ts
- apps/web/lib/offers/confirmed-school-groups.test.ts
- apps/web/lib/offers/course-finder.test.ts
- apps/web/lib/offers/merge-offers.ts
- apps/web/lib/offers/school-2103.test.ts
- apps/web/lib/offers/school-37.test.ts
- apps/web/lib/sites/map-colors.test.ts
- apps/web/lib/sites/venue-profile-audit.test.ts
- scripts/annual-overlay-refresh.test.mjs
- scripts/compose-annual-additions.mjs
- scripts/confirmed-school-groups.test.mjs
- scripts/import-confirmed-school-groups.ts
- scripts/integrate-year-schedule.ts
- scripts/lib/confirmed-school-source.mjs
- scripts/lib/mos-annual-published.mjs
- scripts/refresh-annual-selection.test.mjs
- scripts/school-2103-import.test.mjs
- scripts/school-37-import.test.mjs
- scripts/school-937-intake.test.mjs
- scripts/verify-confirmed-school-groups-ui.mjs
- scripts/verify-school-37-ui.mjs
- scripts/verify-venue-profiles-ui.mjs

## Corrective validation and final freeze — 2026-09-23
Goodall01a0cf44-887d-7d93-9502-897f08271233 independently verified importer,
compiler,32+105 tests, exact offer preservation and raw provenance; no other
blocking code findings. Old freeze not approved due light-wizard contrast.
Correction limited to inherited capacity colors through finder theme variables.
No assertions/rules disabled; real failing light scan retained and passed.

Final results on corrected bytes (exit0): full npm web check
(/tmp/questhub-confirmed-build-3.log),32script tests,105web tests,
secret-scan1444 files,compiler --check,git diff --check. Index empty.
verify-confirmed-school-groups-ui.mjs: desktop1440/mobile390 and light wizard axe,
zero violations/errors/writes;937 four and1212 seven, delayed-old-hot protection.
verify-school-37-ui.mjs: PASS,desktop1440/light390/light320 axe all zero violations,
Back/Forward/reload/keyboard/modal/QR/campus/annual-table;privacy scan1203public
files including HTML/RSC/JS passed. Evidence /tmp/questhub-school37-qa/ and
/tmp/questhub-confirmed-schools-qa/. Automated scans are not a full a11y audit.

Final frozen43paths: previous41 listed above plus
apps/web/components/course-finder.module.css and
apps/web/components/schedule-capacity-indicator.module.css.
SHA256 3d68f08927d0882c05864f0bbe88f0c4f5a749c7de94d1fad7b19d665a710260;same sorted path+NUL+bytes+NUL algorithm.
Plan excluded. No implementation edits after this final freeze. Production
unchanged; no staging/commit/push. Planned1212/2044 groups still excluded.

## Final independent review and local completion — 2026-09-23
Turing (01a0cf48-add7-75e0-84f5-d57b910d2db9): APPROVE on the final43-file
hash above. Independently checked migration, owner overrides, original MOS facts,
data preservation and CSS correction; no blocking defects or new regressions.
Fresh four targeted tests, importer/compiler --check and git diff --check passed;
reviewed final test/build/secret-scan/browser/axe evidence. Read-only review.
Main agent rechecked the frozen hash unchanged after approval.

Status: DONE locally. School1212 has seven SHMI-1 groups; school937 has four
SHMI-2 groups. Local preview and static export verified. Publication, commits,
push and automatic synchronization activation were not performed. Eight
unresolved2044 MOS identities remain outside this completed data correction.
