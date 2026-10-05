# WEB-SCHOOL-2103-TRANSFER — corrected MOS cards and conservative reservation

Status: IN PROGRESS. Owner authorization: 2026-10-05 supplied new cards and requested old occupied places counted; explicitly accepts temporary double counting to avoid exceeding 12 and later manual correction. Implement, test and publish this scoped website/data/runtime change. No contacts or student data.

## Preflight / task packet
Root /home/xipsin/projects/BM_QuestHub/design-previews/schedule-audit-2026-09-09/repo; branch fix/schedule-data-and-venues-2026-09-09; HEAD f0c555e8456e2be54861fbb10bf89c762b161a70; remote main40940f7d6f3f396995db7bdf0074e611ab920fcb, same product tree. Node22.23.1/npm10.9.8. Tracked clean, prior unrelated untracked docs/services untouched. git diff --check PASS.

Objective: 11 current groups on the corrected 1000-ruble cards; 9 previous groups retained as superseded history/aliases. Count a dated fixed reserve of51 old places plus fresh new-card occupancy, clamp free at zero. Owner explicitly permits duplicate reserve until manual reconciliation; never claim unique student counts from that sum. Two new slots have no old reserve in supplied51. No automatic release from failures, disappearing cards or possible cancellation.

Non-goals: contacts, rosters, cancellations on MOS, redesign, VPS migration, dependencies, neighbouring projects. product_domain; source -> compiler -> annual metadata -> capacity presentation. Raw MOS fields remain raw, separate dated reservation explains effective capacity.

## Allowed paths / protected scope
New apps/web/content/annual-additions/school-2103-replacement.json; scripts/lib/school-2103-replacement-source.mjs; scripts/import-school-2103-replacement.ts; scripts/compose-annual-additions.mjs; apps/web/content/annual-retirements.mjs; apps/web/lib/offers/annual-schedule.ts, schedule-board.ts, course-finder.ts; apps/web/lib/year-schedule.ts; apps/web/lib/data/v2/v1-to-v2.ts; apps/web/components/schedule-capacity-indicator.tsx, course-finder-results.tsx, year-schedule.tsx; scripts/integrate-year-schedule.ts. Focused tests under scripts/school-2103-replacement.test.mjs and apps/web/lib/offers/school-2103-transfer.test.ts; adjust existing current-source count assertions, pin historical937stage fixture. New scripts/fixtures/annual-78-before-2103/{source,registry,offers}.json. This ExecPlan.
Generated only via migration/compiler: apps/web/content/year-schedule.generated.json; apps/web/content/annual-mos-refresh.generated.json; apps/web/data/offers-snapshot.json (PA-GEN-001). Local build .next/out (PA-BUILD-002/003), no staging. Public exact hot S3 data/offers-snapshot.json (PA-GEN-003) via reviewed CAS/backups; seven cold hashes unchanged (PA-GEN-004 read-only). Website source commit/PR/push/merge authorized as necessary publication. Existing Sheet sync pause/drain/resume only; workflows source untouched. Existing Yandex function data bundle/identity registry via immutable new version, same config/SA/scaling/IAM, exact timer pause/drain/tag-switch/resume and verify. No VPS changes. Operational helpers and receipts under reports/school-2103-2026-10-05 outside repo; inspect credentials in process memory only for authorized scoped publication, never output.

## Architecture / UX / privacy
Public API old9 return500; saved successful readings 02Oct sum51. All11new directcards verified05Oct: capacity12,1000lesson,05Oct–31May; newoccupied20. Explicit owner conservative policy resolves uncertainty without individual dedup. Optional reservation metadata ties oldcard/code/date/places to exact new sourceidentity. Effective free=max(0,rawfree-fixedreserve). UI states prior reservation; no numbers >capacity. Fresh MOS merge retains metadata. Full blocked groups cannot regain CTA merely because portal reading becomes stale. Prior links canonicalize to replacements. First-graders restriction stays explicit. No private roster/contacts consumed or published.

## Steps and validation
1. Immutable source supplement, deterministic append stage, preimage-backed migration, explicit replacements.
2. Reservation metadata and single pure capacity calculation across board/details/year/v2; raw counters untouched.
3. Tests: identities/aliases, total51, clamping, repeatrefresh no cumulative deduction, cancellation/failure no release, wrongidentity no reserve, unmodified unrelatedschools, soldout/stale CTA.
4. Commands: node --test scripts/school-2103-replacement.test.mjs; node --import tsx --test lib/offers/*.test.ts (apps/web); npx tsc --noEmit; npm --prefix apps/web run check; migration --check; compiler --check --tier=hot; git diff --check; make secret-scan; local/live Playwright desktop/mobile.
5. Freeze pathNULbytesNUL SHA256, fresh independent reviewers APPROVE, explicit staging only, commit/PR/merge. S3 CAS, Timeweb correctSHA, immutable registry bundle with guardedtimer operation; public/runtime/browser verification.

## Negative paths / stop conditions / rollback
Stop on source drift, identity mismatch, invalid counts, overlap inference, secret findings, review failure, concurrentwriter, config drift. Keep backups and old immutable functionversion; rollback by matching source/S3/build and paused/drained tag restore. Never roll back other changes. No hot publication until complete candidate/review. Private lease/public sidecar contracts unchanged.

## Acceptance matrix
Pending: 11active groups,9historyaliases,51reserve,allnew1000links,3firstgrade; no old activecards; exact effectivevacancies allsurfaces;65->67currentoverall; newruntimeidentities; old937linkskeepworking; controlschools unchanged; tests/review/secret/build/live PASS.

## Audit / validation / failure / freeze / commit record
A/B read-only audits found aggregate dedup impossible and rawidentity bindings discard old occupancy on replacement. Owner chose explicit conservative reserves. Evidence reports/school-2103-2026-10-05. Initial cards.json discovery only4representatives; replaced by11 individually verified new-cards.json. No failures suppressed. Freeze/review/staging/publication pending. Intended commit: fix(web): replace school 2103 cards and reserve prior enrollment.

## Validation and freeze, 2026-10-05
All105offer tests PASS;6source-stage tests PASS;12runtime/store tests PASS. Full npm--prefix apps/web run check PASS (lint/schema/hardcoded audit/host-scope/static build114pages). Local browser1440/390 PASS11exactIDs,9reserve notes,2full groups with no MOS CTA,3firstgrader labels,controls937=8/1212=7/2044=11/37=9,oldalias correct,no JS/overflow. Migration --check and compiler --check --tier=hot PASS. Raw counters preserved in v2/student aggregates, only presentation uses effective reserve.
Additional exact allowed file apps/web/content/school-2103-transfer.mjs carries shared alias identities. v1-to-v2 intentionally unchanged (raw enrolled retained). Historical/current tests changed only explicit next-stage counts/retirement assertions; old937composition uses frozen78source.
Failure history: initial missing TSX_TSCONFIG_PATH prevented imports with no writes; corrected to apps/web/tsconfig.json. New portal rawtitles use1й parsing not supported, corrected to exact validated supplement studyYear. Historical count tests updated65->67,78->89,70->81; retirement fixture school filter corrected for newly retired2103. Browser caught stale full reserve label; now explicitly full for held groups with no free places. Helper syntax failed before any operation and corrected; independent audit required exact hotSHA and runtimepaused prePUT gate, both fixed and APPROVE.
Frozen product paths and SHA below; ExecPlan excluded from self-reference, prior unrelated untracked untouched. No product edits after freeze.
{
  "head": "f0c555e8456e2be54861fbb10bf89c762b161a70",
  "paths": [
    "apps/web/components/course-finder-results.tsx",
    "apps/web/components/schedule-capacity-indicator.tsx",
    "apps/web/components/year-schedule.tsx",
    "apps/web/content/annual-additions/school-2103-replacement.json",
    "apps/web/content/annual-mos-refresh.generated.json",
    "apps/web/content/annual-retirements.mjs",
    "apps/web/content/school-2103-transfer.mjs",
    "apps/web/content/year-schedule.generated.json",
    "apps/web/data/offers-snapshot.json",
    "apps/web/lib/offers/annual-integration.test.ts",
    "apps/web/lib/offers/annual-programme-groups.test.ts",
    "apps/web/lib/offers/annual-retirements.test.ts",
    "apps/web/lib/offers/annual-schedule.ts",
    "apps/web/lib/offers/audit-corrections.test.ts",
    "apps/web/lib/offers/confirmed-school-groups.test.ts",
    "apps/web/lib/offers/course-finder.test.ts",
    "apps/web/lib/offers/course-finder.ts",
    "apps/web/lib/offers/schedule-board.ts",
    "apps/web/lib/offers/school-2103-transfer.test.ts",
    "apps/web/lib/offers/school-2103.test.ts",
    "apps/web/lib/offers/school-37.test.ts",
    "apps/web/lib/year-schedule.ts",
    "scripts/compose-annual-additions.mjs",
    "scripts/fixtures/annual-78-before-2103/offers.json",
    "scripts/fixtures/annual-78-before-2103/registry.json",
    "scripts/fixtures/annual-78-before-2103/source.json",
    "scripts/import-school-2103-replacement.ts",
    "scripts/integrate-year-schedule.ts",
    "scripts/lib/school-2103-replacement-source.mjs",
    "scripts/school-2103-replacement.test.mjs",
    "scripts/school-937-year1.test.mjs"
  ],
  "algorithm": "sha256(sorted path NUL file bytes NUL)",
  "sha256": "e132010192ed3fbcefca8cfe48a04e1be85aee9e5aef8024ad6ac735f1495bdb"
}

Independent audit_data APPROVE exact frozen product SHA; audit_publish APPROVE helpers publish14178eb737a1cdd03d1670f20438ca7d54c28dff2459e012309ca7eb647df950/runtime72d9f8eb8da077ae0c4803f5a3a89e6109c7b99488217d243cdda4dabff60c75. Secret scan PASS1489; full CSV51->89 composition independently checks exact generatedsource. Repackaged runtime index byte-identical. Candidate hot aa872b8248007e97b67c0baf4ff297979607a4573942370d68a84abfddd5efdd; ZIP f94c815e5c71c99786d5dd5fc99c45c7d08384192696ef155c56b88c93df5616. Staging exact31frozen paths plus thisplan; publication/activation pending.
