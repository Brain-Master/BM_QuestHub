# ExecPlan / Task Packet WEB-MOS-FIVE-MINUTE-CAPACITY

## 0. Metadata and authority
- Status: IMPLEMENTING (owner authorized activation on 2026-09-23; prior local candidate APPROVED); started 2026-09-23 Europe/Moscow.
- Repository: Brain-Master/BM_QuestHub, `/home/xipsin/projects/BM_QuestHub/design-previews/schedule-audit-2026-09-09/repo`.
- Authorized branch: `fix/schedule-data-and-venues-2026-09-09`.
- Expected HEAD: `b789b70d00747cd1078cb72dd295652fad53ac83`.
- Owner request: restore script-based MOS synchronization every five minutes, run manually, show free/occupied seats and an enrollment bar.
- This document is the narrow Task Packet and execution record. NO COMMIT.

## 1. Objective
Restore observable server-side refresh of current MOS groups every five minutes and expose truthful capacity in existing schedule cards.

## 2. Non-goals
No new venues/groups/937 migration, photo work, dependency upgrades, branding overhaul, personal data, registrations, cold publication, UI deployment, main/push, or changes to concurrent publications service.

## 3. Authorized paths and operations
- Read: applicable policies, MOS scripts/cloud apps, public data/contracts, schedule UI/tests, existing cloud resource metadata. Use existing authenticated YC session internally; never print credentials/environment values. Owner previously provided QuestHub credentials for operational work; specific operational use only, not disclosure.
- Write (parent only): this plan; `docs/mos-sync-capacity-2026-09-23/**`; `scripts/lib/mos-live-capacity*.mjs`; `scripts/sync-mos-live-capacity.mjs`; `scripts/deploy-mos-live-capacity.mjs`; `scripts/verify-mos-live-capacity*.mjs`; existing `apps/web/components/schedule-capacity-indicator.tsx`; new adjacent CSS module; `apps/web/components/course-finder-results.tsx`; `apps/web/lib/offers/schedule-board.ts` and its tests; focused new UI/component tests.
- Protected exceptions: PA-COMPAT-003/007 nonbreaking capacity display; existing hot payload stays unchanged. PA-GEN-003 READ ONLY (initial hot-patch design superseded by sidecar). Never substitute local 69-group revision for production's 60-group revision. PA-BUILD-002/003 tooling-generated only, including a manual-read availability artifact in the ignored local `out/ops/public/` preview directory. No cold/map/catalog/source registry mutations in this task.
- Operational-critical extension: new deploy/runtime scripts above; exact existing cloud resources initially inspect-only: `bm-mos-sync-controller` d4e6lha8cnbtj0f5oaka and timer a1s5lv4i1tvb46egcg1g. Before activation record exact version, dependency closure, old settings, rollback, and independent review. No extra timer/function/paid server; preserve credentials internally; no broad deploy scripts. A new `ops/mos-live-capacity-state.json` key may hold bounded lease/status evidence, no private fields. Any additional resource needs packet update and owner authority if materially different.
- Forbidden: services/publications, its plan; secret content in logs/artifacts; source CSV/registry/other generated snapshots; Google Sheets writes; S3 cold/media; CI workflows; UI deployment; git mutations.

## 4. Preflight
Full required preflight exit 0 before this plan. Node 22.23.1/npm10.9.8, existing locks/dependencies. Existing dirty 83-file candidate plus separate publications work preserved; index empty. Last local frozen1517 candidate is independently approved, not deployed.
Live readonly: controller timer ACTIVE every2min, adaptive lastIntervalSec5910, nextDueAt2026-09-22T23:45:46.136Z. Public offers lastModified2026-09-21T13:00:25Z,60 annual groups, source23b9dbb84ccb2e2eb577efaf94ecdca1c952603ab5ea6ebb9cb5b68d6c594c97. Most per-group timestamps9Sep. Timer alone is not success.

## 5. Architecture and classification
Product_domain: bounded public MOS adapter → validated identity/capacity → independent availability sidecar; intended cloud timer calls script; browser reads existing hot plus matching availability. UI consumes domain capacity selector, never invents seats or accesses credentials. Existing adaptive legacy/YMQ pipeline needs current coverage audit before replacement. Operational mutations remain blocked pending rotation and review.

## 6. Audit A
Wegener,01a0cb3e-f9c9-7ae2-abbc-0f206cf99ba0, readonly. Accepted: independent sidecar avoids shared hot writers; exact new runtime keys protected against broad SDK/CLI upload/delete; per-card freshness outranks global timestamps; pure merge; preserve dated error values; separate safe CAS/lease implementation instead of old helpers which replay stale body with new ETag. Production activation requires rotated credentials, legacy coverage/no active YMQ run and actual subsequent automatic tick. No remote mutation by auditor.

## 7. Audit B
Turing,01a0cb3f-04fc-75f0-a9a9-93a6b48905cf, readonly. Accepted/fixed: monotonic per-binding availability and full refresh; retained last success through error-only response; failed request keeps SWR cached data; current lifecycle checked by consumer; retries enabled because SWR interval pauses with cached error; unsafe identity failure blocks booking. Added domain/client regressions and browser scenarios.

## 8. UX contract
Existing public schedule/catalogue/wizard cards. Compact visible occupied/free/total counts plus bar; readable without color, visible on mobile, no added interaction/focus stop. Unknown is unknown, zero is real zero, archived hidden, admission closed distinct from seats full. Source date must not advance for failed fields. No automatic claim of completed registration. Reference admin UX accessibility/reflow and copy rules proportionally; creating-brand-design-systems evolution/product-surface only, existing tokens retained.

## 9. Security and failure model
MOS public read-only numeric direct IDs, HTTPS exact host, no redirects/cookies, bounded timeout/body/concurrency. Validate card/listing/group/location before changing counts. Preserve owner teacher/age/price/year and identity. Skip archive by Moscow calendar. Sidecar conditional ETag writes and owner-token lease; failed groups retain dated previous values. Status distinguishes attempts/success/partial/errors/unresolved. No raw payload/secrets in reports. Rollback disables the new timer/consumer; hot/cold remain untouched. Restoring old controller CODE requires rotated credentials, never its compromised old environment.

## 10. Steps
1. Readonly coverage and config audit; manually dry-run bounded direct-card capacity refresh.
2. Implement tested isolated availability updater and cloud adapter; evaluate three compact UI presentations.
3. Add capacity UI and regression tests; local static build/browser/a11y at desktop/mobile320.
4. Freeze + fresh independent review. Only then activate exact existing timer/runtime for five-minute refresh; manual invocation and next automatic tick readback.
5. Report actual coverage/failures and local vs deployed UI separately.

## 11. Negative paths
Unknown capacity, zero seats, inconsistent counts, admission closed with free seats, timeout, identity/location drift, response/body bounds, archive, no direct card, concurrent source edit, lock overlap/expiry, all fetches fail, partial success, publish failure. No false success from lastSyncAt or refreshed global timestamp.

## 12. Validation commands
Node22 PATH `/home/xipsin/.nvm/versions/node/v22.23.1/bin`.
- `node --experimental-test-module-mocks --test scripts/lib/mos-live-capacity*.test.mjs` (module mocks required for publisher protection regression).
- `cd apps/web && node --import tsx --test lib/offers/*.test.ts lib/sites/*.test.ts`.
- `SITE_SNAPSHOT_SOURCE=local OFFERS_SNAPSHOT_SOURCE=local NEXT_PUBLIC_OFFERS_SNAPSHOT_URL=/data/offers-snapshot.json NEXT_PUBLIC_SITE_URL=https://b-master.pro npm --prefix apps/web run check`.
- New scoped Playwright verifier once created, no real enrollment/notifications.
- `git diff --check`; `make secret-scan`; safe cloud/public GET and explicit manual runtime invoke after review.

## 13. Acceptance matrix
| ID | Criterion | Status |
|---|---|---|
| A1 | Direct current-group manual run with actual per-field freshness evidence | PASS dry-run; PARTIAL coverage47/60,13 source errors |
| A2 | Five-minute server trigger + subsequent automatic run independently verified | BLOCKED — rotation, operational checkpoint and release required |
| A3 | Compact counts/bar accurate for known/unknown/closed/full | PASS local browser synthetic HTTP; no production claim |
| A4 | Tests/build/mobile/a11y, preservation and independent review | PASS local candidate; fresh independent APPROVE, no production approval |

## 14. Validation log
PRE-FREEZE: readonly YC list and public S3 GET succeed. Metadata lookup missing secret/.env in this checkout is expected, not a failed baseline; existing Windows YC session available. No production writes yet.

2026-09-23 MSK, exact working directory above, target PRE-FREEZE unless stated:
- `node scripts/sync-mos-live-capacity.mjs --output=/tmp/questhub-mos-availability-manual-20260923.json`: exit2,47/60 current published annual groups read,25 archives skipped;13 retained source failures. No writes except report.
- `node --experimental-test-module-mocks --test --test-reporter=dot scripts/lib/mos-live-capacity*.test.mjs scripts/lib/mos-annual-cards.test.mjs scripts/annual-publish-tier.test.mjs`: exit0,24 tests, including12 new after cron-jitter regression.
- `cd apps/web && node --import tsx --test --test-reporter=dot lib/offers/*.test.ts lib/sites/*.test.ts`: exit0,99 tests; repeated on frozen bytes, exit0.
- Full web check from §12 after16px inset: exit0,120 routes,4 existing warnings; S3 probe intentionally SKIPPED in local mode.
- `QA_OUTPUT="$PWD/docs/mos-sync-capacity-2026-09-23/qa" MOS_MANUAL_REPORT=/tmp/questhub-mos-availability-manual-20260923.json node scripts/verify-mos-live-capacity-ui.mjs`: exit0,8 checks,3 axe scans at1440/390/320,zero violations/incomplete/JSerrors/writes/overflow.
- `node scripts/verify-venue-availability-ui.mjs`: exit0,9 prior1517 journeys,64 unrelated annual offers/56 registry cards preserved,3 axe scans clean.
- `node scripts/deploy-mos-live-capacity.mjs --package`: exit0,package-only `/tmp/questhub-mos-capacity-package-9nweGQ`, no cloud calls.
- `make secret-scan`: exit0,PASS1432files; `git diff --check`: exit0; index empty.
- Local preview only: `node scripts/sync-mos-live-capacity.mjs --input="$PWD/apps/web/data/offers-snapshot.json" --output="$PWD/apps/web/out/ops/public/mos-availability.json"`: exit2,55/69verified,25archives,14issues including oneadditionalMOS_TIMEOUT. NOT a replacement for production47/60report. Headless GET readback of real local output: «Свободно4из15,занято11,23.09 01:57МСК», no writes/overflow. Ignored output not frozen or committed; no new automatic local timer.
- Protected source/registry/hot/catalog/map/manifest/hostaliases SHA256 exactly equal pre-turn values listed in preceding1517plan; no generated data changed this turn.

## 15. Failure history
- Wrong readonly YC command `version get --function-name` exited1; metadata list thereafter exposed secret environment. Owner notified, cloud work halted, rotation required. No production writes.
- Manual script initial module import failed because TS aliases lacked app tsconfig. Explicit TSX_TSCONFIG_PATH before dynamic loader fixed it. Subsequent real run exit2 intentionally records47/60 success and13 source problems; not retried to manufacture green.
- Initial new UI-domain test compared returned reference to pre-schema offer rather than actual cloned quest input; corrected exact test reference, same strict-reference preservation assertion retained.99/99 offers/sites tests then passed.
- Initial web lint failed Date.now in render. Component now uses a subscribed external minute clock, stable SSR snapshot and cleanup. Full check then passed (4 pre-existing warnings).
- Initial generated mobile screenshot revealed missing inset in new row;16px wrapper added. Rebuild/recheck required before freeze.
- Missing-path exploratory reads were diagnostic command errors, not missing mandatory baseline checks. No absence claimed as a test pass.

## 16. Scope changes
2026-09-23: capacity-only refresh uses separate public `data/mos-availability.json`, NOT `data/offers-snapshot.json`. This avoids hot/cold writer races and old strict deployed schema rejection. Existing snapshots/registry stay byte-identical. Additional exact write paths: `apps/web/lib/offers/mos-availability.ts`, its tests; `apps/web/lib/offers/annual-schedule.ts` (optional in-memory availability metadata); `apps/web/lib/offers/use-live-schedule.ts`; existing board-card venue/quest components only to pass source freshness; `scripts/lib/mos-live-capacity*.ts` for shared runtime schema imports. Runtime can read frozen raw registry only as reviewed identity binding, never publish it or source personal data. New sidecar strict schema is consumer-owned, source/card/venue/date/slot-bound. No compiler/fullpublisher changes needed.

Operational activation BLOCKED: a raw YC version-list diagnostic unexpectedly printed secret environment values into tool output. Owner informed immediately; no credentials copied to project or used for writes. Stop cloud mutations pending rotation of affected S3 key/controller secret. Diagnostic incident cannot be called harmless or cleared by tests. Continue only public API reads/local implementation. Future deployment requires sanitized metadata helpers, frozen review and explicit post-rotation operational checkpoint. Do not invoke old deploy scripts.

Auditor A found broad `data/` pruning. Final sidecar key is `ops/public/mos-availability.json`, not `data/`; all future broad root/static publishers must exclude `ops/` (activation prerequisite, not implicitly modified here). Additional consumer write paths: `apps/web/lib/offers/mos-availability-client.ts`; `apps/web/lib/year-schedule.ts`; `apps/web/components/year-schedule.tsx`; `apps/web/components/schedule-board-card-{compact,detailed,quest}.tsx`. User refined copy to shorter count; selected `Свободно 2 из 15` + secondary `занято 13`. No UI/cloud release in this turn.

Narrow publication compatibility exception adopted within requested synchronization: PA-OPS-006/007 `scripts/sync-s3-sdk.mjs`, `scripts/sync-s3-public.mjs` exclude ONLY the two new availability/lease keys from broad uploads/deletes. No execution against production. Rollback removes the two exact exclusions only after disabling new job. Test both SDK mocked operations and CLI arguments. Additional baseline-regression assertion text update allowed in `scripts/verify-venue-availability-ui.mjs` (new copy, same counts/preservation assertions).

## 17. Freeze
FROZEN 2026-09-22T22:58:27.461Z. 126 files, SHA256 `97fb6436a66c490ab73370514304c214c23ac09ad93363a411f311ed14b1cd16`. Algorithm: sorted relative path + NUL + file bytes + NUL. Exclude all self-referential ExecPlans and unrelated services. HEAD unchanged; diff-check PASS; index empty. No edits after freeze. Prior83-file candidate preserved except explicit current UI consumer changes; new package included. Exact paths:

- `apps/web/app/sites/[school]/page.tsx`
- `apps/web/components/course-finder-results.tsx`
- `apps/web/components/schedule-board-card-compact.tsx`
- `apps/web/components/schedule-board-card-detailed.tsx`
- `apps/web/components/schedule-board-card-quest.tsx`
- `apps/web/components/schedule-capacity-indicator.module.css`
- `apps/web/components/schedule-capacity-indicator.tsx`
- `apps/web/components/site-selection-grid.tsx`
- `apps/web/components/year-schedule.tsx`
- `apps/web/content/annual-additions/school-37.json`
- `apps/web/content/annual-additions/school-937.json`
- `apps/web/content/annual-group-overrides.ts`
- `apps/web/content/annual-mos-refresh.generated.json`
- `apps/web/content/school-profiles.ts`
- `apps/web/content/year-integration.ts`
- `apps/web/content/year-schedule.generated.json`
- `apps/web/data/offers-snapshot.json`
- `apps/web/data/v2/catalog-snapshot.json`
- `apps/web/data/v2/detail/it-academy.json`
- `apps/web/data/v2/detail/olympiad-league.json`
- `apps/web/data/v2/detail/projects.json`
- `apps/web/data/v2/detail/shmi.json`
- `apps/web/data/v2/map-snapshot.json`
- `apps/web/data/v2/site-manifest.json`
- `apps/web/lib/offers/annual-integration.test.ts`
- `apps/web/lib/offers/annual-programme-groups.test.ts`
- `apps/web/lib/offers/annual-schedule.ts`
- `apps/web/lib/offers/course-finder.test.ts`
- `apps/web/lib/offers/mos-availability-client.ts`
- `apps/web/lib/offers/mos-availability.test.ts`
- `apps/web/lib/offers/mos-availability.ts`
- `apps/web/lib/offers/schedule-board.ts`
- `apps/web/lib/offers/school-2103.test.ts`
- `apps/web/lib/offers/school-37.test.ts`
- `apps/web/lib/offers/use-live-schedule.ts`
- `apps/web/lib/sites/map-colors.test.ts`
- `apps/web/lib/sites/site-stats.test.ts`
- `apps/web/lib/sites/venue-profile-audit.test.ts`
- `apps/web/lib/year-schedule.ts`
- `apps/web/public/sites/school-37/michurinsky-28-original.jpg`
- `apps/web/public/sites/school-37/venue-avatar-original.jpg`
- `apps/web/public/sites/school-937/zakharova-25-original.jpg`
- `docs/mos-sync-capacity-2026-09-23/README.md`
- `docs/mos-sync-capacity-2026-09-23/audit.md`
- `docs/mos-sync-capacity-2026-09-23/brandbook.md`
- `docs/mos-sync-capacity-2026-09-23/brief.md`
- `docs/mos-sync-capacity-2026-09-23/decision-log.md`
- `docs/mos-sync-capacity-2026-09-23/handoff/designer.md`
- `docs/mos-sync-capacity-2026-09-23/handoff/developer.md`
- `docs/mos-sync-capacity-2026-09-23/input-evidence.md`
- `docs/mos-sync-capacity-2026-09-23/manifest.json`
- `docs/mos-sync-capacity-2026-09-23/manual-public-read.json`
- `docs/mos-sync-capacity-2026-09-23/qa/capacity-1440.png`
- `docs/mos-sync-capacity-2026-09-23/qa/capacity-320.png`
- `docs/mos-sync-capacity-2026-09-23/qa/capacity-390.png`
- `docs/mos-sync-capacity-2026-09-23/qa/card-1440.png`
- `docs/mos-sync-capacity-2026-09-23/qa/card-320.png`
- `docs/mos-sync-capacity-2026-09-23/qa/card-390.png`
- `docs/mos-sync-capacity-2026-09-23/qa/report.json`
- `docs/mos-sync-capacity-2026-09-23/qa/validation-report.md`
- `docs/mos-sync-capacity-2026-09-23/tokens.json`
- `docs/venue-audit-2026-09-22/README.md`
- `docs/venue-audit-2026-09-22/audit.md`
- `docs/venue-audit-2026-09-22/brandbook.md`
- `docs/venue-audit-2026-09-22/brief.md`
- `docs/venue-audit-2026-09-22/decision-log.md`
- `docs/venue-audit-2026-09-22/handoff/designer.md`
- `docs/venue-audit-2026-09-22/handoff/developer.md`
- `docs/venue-audit-2026-09-22/input-evidence.md`
- `docs/venue-audit-2026-09-22/manifest.json`
- `docs/venue-audit-2026-09-22/qa/after/school-37-1440.png`
- `docs/venue-audit-2026-09-22/qa/after/school-37-390.png`
- `docs/venue-audit-2026-09-22/qa/after/school-937-1440.png`
- `docs/venue-audit-2026-09-22/qa/after/school-937-390.png`
- `docs/venue-audit-2026-09-22/qa/before/school-37-1440.png`
- `docs/venue-audit-2026-09-22/qa/before/school-37-390.png`
- `docs/venue-audit-2026-09-22/qa/before/school-937-1440.png`
- `docs/venue-audit-2026-09-22/qa/before/school-937-390.png`
- `docs/venue-audit-2026-09-22/qa/data.json`
- `docs/venue-audit-2026-09-22/qa/journey.json`
- `docs/venue-audit-2026-09-22/qa/pages-after.json`
- `docs/venue-audit-2026-09-22/qa/pages-before.json`
- `docs/venue-audit-2026-09-22/qa/validation-report.md`
- `docs/venue-audit-2026-09-22/scores.json`
- `docs/venue-audit-2026-09-22/tokens.json`
- `docs/venue-corrections-2026-09-23/README.md`
- `docs/venue-corrections-2026-09-23/qa/report.json`
- `docs/venue-corrections-2026-09-23/qa/school-1517-1440.png`
- `docs/venue-corrections-2026-09-23/qa/school-1517-320.png`
- `docs/venue-corrections-2026-09-23/qa/school-1517-390.png`
- `docs/venue-corrections-2026-09-23/school-1517-refresh.json`
- `scripts/annual-overlay-refresh.test.mjs`
- `scripts/audit-venue-data.ts`
- `scripts/audit-venue-pages.mjs`
- `scripts/compose-annual-additions.mjs`
- `scripts/deploy-mos-live-capacity.mjs`
- `scripts/finalize-venue-audit.mjs`
- `scripts/fixtures/annual-69-before-1517/README.md`
- `scripts/fixtures/annual-69-before-1517/offers.json`
- `scripts/fixtures/annual-69-before-1517/registry.json`
- `scripts/import-school-37.ts`
- `scripts/import-year-schedule.py`
- `scripts/integrate-year-schedule.ts`
- `scripts/lib/mos-live-capacity-handler.ts`
- `scripts/lib/mos-live-capacity-publish.test.mjs`
- `scripts/lib/mos-live-capacity-store.mjs`
- `scripts/lib/mos-live-capacity-store.test.mjs`
- `scripts/lib/mos-live-capacity.test.mjs`
- `scripts/lib/mos-live-capacity.ts`
- `scripts/lib/school-37-source.mjs`
- `scripts/refresh-annual-from-published.ts`
- `scripts/refresh-annual-selection.mjs`
- `scripts/refresh-annual-selection.test.mjs`
- `scripts/school-2103-import.test.mjs`
- `scripts/school-37-import.test.mjs`
- `scripts/school-937-intake.test.mjs`
- `scripts/school-media-sources.json`
- `scripts/sync-mos-live-capacity.mjs`
- `scripts/sync-s3-public.mjs`
- `scripts/sync-s3-sdk.mjs`
- `scripts/verify-course-finder-ui.mjs`
- `scripts/verify-mos-live-capacity-ui.mjs`
- `scripts/verify-school-2103-ui.mjs`
- `scripts/verify-school-37-ui.mjs`
- `scripts/verify-venue-availability-ui.mjs`
- `scripts/verify-venue-profiles-ui.mjs`

## 18. Independent final review
Sartre `01a0cb57-8c65-7ed2-bd5c-eec6f2c40ef1`: **APPROVE — local frozen candidate only**. No blocking findings. Independently matched126-file fingerprint before/after review, HEAD/branch/index/diff; independently passed24runtime/legacy and99offers/sites tests and bundling with write:false. Reviewed320px screenshot and saved8browserchecks/3axe scans; did not claim independent browser/build rerun. Verified saved47/60partial report. No secret reads or external writes. Production activation/UI release NOT APPROVED; rotation and live verification remain mandatory. Review harness initially required Node22 PATH/script-relative dependency resolution; subsequently passed.

## 19. Git and final status
Staging/commit NOT AUTHORIZED; NO COMMIT; no push; no next task. Local implementation validated and approved, overall objective NOT COMPLETE because five-minute production execution is not activated/verified. No cloud or b-master.pro changes. Exact preservation hashes match previous1517checkpoint. Local preview3199 serves manually generated dated availability (55/69), not automatic syncing. Report/QA at `docs/mos-sync-capacity-2026-09-23/`; code remains dirty alongside untouched prior/concurrent work. Await owner direction for rotating the exposed S3 key/controller secret; no values should be posted in chat. Future activation must use rotated credentials and observe an automatic run, not infer success from timer status.

## 20. Owner continuation, 2026-09-23

Explicit current owner instruction: check the eight unresolved links and other errors; enable automatic synchronization; do not require secret rotation at this stage. This supersedes the earlier rotation prerequisite, not confidentiality controls. Risk acknowledged; no credentials may appear in commands, logs, artifacts, or replies. Earlier incident and validations remain historical evidence, not current blockers.

Preflight repeated successfully: same root/branch/HEAD, Node22.23.1/npm10.9.8, empty index, no unexplained changes. Before implementation audit A/B independently. Parent investigates public MOS identity and safe cloud preconditions; auditors inspect dependency/rollback and data-validation risks without cloud writes or secrets. Prior freeze expires for any revised artifact.

Authorized operational extension: update/package the exact `scripts/deploy-mos-live-capacity.mjs` helper, add `scripts/lib/mos-live-capacity-deploy*.mjs` and `scripts/audit-mos-capacity-links.mjs` if required, and append evidence under existing report directory. Only the existing controller d4e6lha8cnbtj0f5oaka and timer a1s5lv4i1tvb46egcg1g may be mutated, including a new version/tag, IAM invocation restriction if its dependency audit permits, and five-minute trigger settings. Existing credentials may be captured/reused internally from that controller's environment, never disclosed or written into repository files. No new paid resources. Save sanitized old configuration/version IDs and rollback instructions before mutation; test prepared deployment code and independently review frozen bytes first. Rollback restores old timer/version settings with existing credentials (rotation waived), retaining new version for diagnosis. No deleting functions, triggers, queues, object history, or unrelated work.

Public read-only identity audit: eight unresolved school2044 groups plus two schedule mismatches and MOS HTTP500 failures. Exact card/listing/group/address/slot evidence required; similarity never authorizes aliasing or deletion. Preserve current source, raw registry and all generated snapshots unless a separately recorded, narrowly owner-authorized data correction is justified by evidence. No UI release, Git operations, Sheets writes or broad hot/cold publication in this continuation. Existing source revisions remain separate.

Acceptance extension: record outcomes for all eight links and other errors individually; perform manual production invocation and verify public sidecar content/ETag; observe next timer-generated attempt and refreshed per-group timestamps; report partial coverage honestly. Automated source failures must retain dated good data. No claim that b-master.pro consumes the sidecar until its frontend actually does. Commands: scoped public audit CLI; safe YC metadata/invoke/deployment helper; existing runtime/domain test commands; `git diff --check`; `make secret-scan`; deterministic freeze and fresh independent review. Stop on changed cloud preconditions, unsafe/unexplained identity or concurrent source edit, missing authority, unknown active legacy run, or review failure.

Do not push.
Do not start the next task.
