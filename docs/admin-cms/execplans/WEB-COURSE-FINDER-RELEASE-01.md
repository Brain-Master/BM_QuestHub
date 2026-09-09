# WEB-COURSE-FINDER-RELEASE-01 — publish approved schedule to b-master.pro

## 0. Task Packet / authority
Status: PREPARING. Repository Brain-Master/BM_QuestHub.
Owner current instruction: "надо на b-master.pro выложить".
Expected source HEAD: 4a338b2faf5a8f0c477c66061ad5a1a121362c18, source branch cms/m2-01-app-shell.
Verified remote main / rollback code: ba8a1139bd55cf70589076b7c25db11ea12d3ab3.
Release branch: release/course-finder-2026-09-09 in an isolated temporary clone; original checkout/index remain untouched.
Commit: feat(web): publish annual course finder and campus schedules.
Owner-authorized production release includes scoped commit/push/main merge and Timeweb activation for b-master.pro; it supersedes prior task's local-only boundary only for this release. No force push, unrelated CMS merge, branch switch in original checkout, or next task.

## 1. Objective / non-goals
Deliver the approved wizard, full schedule, annual pages and school/campus QR routes with real reviewed annual records on the production site.
Do not merge CMS draft PR9, change auth/lead endpoints, submit real bookings, mutate Google Sheets, deploy cloud functions, replace legacy data/media, or publish synthetic prototypes.

## 2. Preflight / baseline
Node22.23.1/npm10.9.8, Playwright1.60.0. Source status 927 entries including140 untracked; no cached diff. Large CRLF-only baseline preserved, previous accepted noise is not release scope. Initial git diff --check exceeded stdout buffer; rerun with bounded summary required.
Remote main verified through GitHub connector and git ls-remote.
Timeweb195536 confirmed readonly via owner's updated Windows timeweb.env: active, Brain-Master/BM_QuestHub/main, auto-deploy enabled, domains include b-master.pro and quest.b-master.pro. Local stale profile401 retained as failed evidence; no secrets copied/output.
Public S3 current catalog3worlds5courses, map10venues, no annualgroups. Thus production data join is required before S3-backed static export can generate new school routes.

## 3. Exact release source paths
Copy approved current bytes into isolated main-based candidate only for:
- `apps/web/app/agenda/page.tsx`
- `apps/web/app/data/offers-snapshot.json/route.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/sites/[school]/agenda/page.tsx`
- `apps/web/app/sites/[school]/campuses/[campus]/agenda/page.tsx`
- `apps/web/app/sites/[school]/page.tsx`
- `apps/web/app/year-courses/[slug]/page.tsx`
- `apps/web/app/year-courses/page.tsx`
- `apps/web/app/year-courses/schedule/page.tsx`
- `apps/web/app/year-courses/year-courses.css`
- `apps/web/components/annual-programme-groups.tsx`
- `apps/web/components/course-finder-results.tsx`
- `apps/web/components/course-finder.module.css`
- `apps/web/components/course-finder.tsx`
- `apps/web/components/live-agenda.tsx`
- `apps/web/components/live-quest-schedule.tsx`
- `apps/web/components/portal-hero.tsx`
- `apps/web/components/schedule-board-card-compact.test.ts`
- `apps/web/components/schedule-board.tsx`
- `apps/web/components/site-footer.tsx`
- `apps/web/components/site-header.tsx`
- `apps/web/components/year-course-contact.tsx`
- `apps/web/components/year-course-media.tsx`
- `apps/web/components/year-programs-section.tsx`
- `apps/web/components/year-schedule-link.tsx`
- `apps/web/components/year-schedule.tsx`
- `apps/web/content/year-integration.ts`
- `apps/web/content/year-programs.ts`
- `apps/web/content/year-schedule.generated.json`
- `apps/web/data/offers-snapshot.json`
- `apps/web/data/v2/catalog-snapshot.json`
- `apps/web/data/v2/detail/it-academy.json`
- `apps/web/data/v2/detail/olympiad-league.json`
- `apps/web/data/v2/detail/projects.json`
- `apps/web/data/v2/detail/shmi.json`
- `apps/web/data/v2/map-snapshot.json`
- `apps/web/data/v2/site-manifest.json`
- `apps/web/e2e/city-cards-data.spec.ts`
- `apps/web/e2e/map-projection-data.spec.ts`
- `apps/web/e2e/schedule-board-data.spec.ts`
- `apps/web/e2e/schedule-board.visual.spec.ts`
- `apps/web/e2e/site-config-v2.spec.ts`
- `apps/web/lib/data/public-snapshot-url.test.ts`
- `apps/web/lib/data/v2/entities.ts`
- `apps/web/lib/data/v2/shared.ts`
- `apps/web/lib/data/v2/v1-to-v2.ts`
- `apps/web/lib/data/v2/v2-to-v1.ts`
- `apps/web/lib/media/ingest-media-inbox.test.ts`
- `apps/web/lib/media/schedule-media-coalesce.ts`
- `apps/web/lib/offers/annual-integration.test.ts`
- `apps/web/lib/offers/annual-programme-groups.test.ts`
- `apps/web/lib/offers/annual-programme-groups.ts`
- `apps/web/lib/offers/annual-programme-name.test.ts`
- `apps/web/lib/offers/annual-programme-name.ts`
- `apps/web/lib/offers/annual-schedule.ts`
- `apps/web/lib/offers/course-finder.test.ts`
- `apps/web/lib/offers/course-finder.ts`
- `apps/web/lib/offers/map-rows-to-offers.test.ts`
- `apps/web/lib/offers/schedule-board.ts`
- `apps/web/lib/offers/schedule-location.test.ts`
- `apps/web/lib/offers/snapshot-client.ts`
- `apps/web/lib/offers/snapshot-parse.test.ts`
- `apps/web/lib/offers/snapshot-parse.ts`
- `apps/web/lib/schemas.ts`
- `apps/web/lib/year-schedule.ts`
- `apps/web/public/editorial/year-courses/academy-1280.webp`
- `apps/web/public/editorial/year-courses/academy-640.webp`
- `apps/web/public/editorial/year-courses/electronics-1280.webp`
- `apps/web/public/editorial/year-courses/electronics-640.webp`
- `apps/web/public/editorial/year-courses/olympiad-1280.webp`
- `apps/web/public/editorial/year-courses/olympiad-640.webp`
- `apps/web/public/editorial/year-courses/project-1280.webp`
- `apps/web/public/editorial/year-courses/project-640.webp`
- `apps/web/public/editorial/year-courses/provenance.json`
- `apps/web/public/editorial/year-courses/shmi-robot-1280.webp`
- `apps/web/public/editorial/year-courses/shmi-robot-640.webp`
- `apps/web/public/editorial/year-courses/shmi-robot.provenance.json`
- `apps/web/public/editorial/year-courses/video-poster.webp`
- `apps/web/public/editorial/year-courses/workshop-1280.webp`
- `apps/web/public/editorial/year-courses/workshop-640.webp`
- `apps/web/public/editorial/year-courses/workshop-excerpt.mp4`
- `scripts/import-year-schedule.py`
- `scripts/integrate-year-schedule.ts`
- `scripts/prepare-shmi-media.mjs`
- `scripts/prepare-year-course-media.mjs`
- `scripts/test_import_year_schedule.py`
- `scripts/verify-course-finder-ui.mjs`
- `scripts/verify-year-course-ui.mjs`
- `scripts/verify-year-grouping-ui.mjs`
- `scripts/verify-year-integration-ui.mjs`
- `scripts/verify-year-schedule-ui.mjs`

Additional scoped implementation paths required by release checks: scripts/run-sheet-sync.mjs (PA-OPS-002), scripts/annual-publish-tier.mjs, scripts/annual-publish-tier.test.mjs, scripts/annual-overlay-refresh.test.mjs and apps/producer/publish.mjs (legacy operational publisher; compatible local generation hook before upload) for preventing subsequent tier refresh from dropping annual additions; this plan. Owner's production release requires preserving annual additions through both documented publishers. No workflow, credentials, cloud function or remote configuration changes. Audit A identified the legacy bypass; included as a bounded release correction, not a new feature.
Temporary release packaging, manifest, backup and verification helpers live outside git in an owned temporary directory; no credentials are copied.

## 4. Protected operations / rollback
PA-GEN-001 and PA-COMPAT-001/002/003/004/005/007: stage the eight generator-owned annual snapshots listed above; rebuild using scripts/integrate-year-schedule.ts only, never manual JSON edits. Input is a freshly read live bundle; preserve all non-owned worlds/courses/venues/offers by deep equality. Other public JSON retained from live when building, not overwritten.
PA-GEN-003/004: upload exactly data/offers-snapshot.json, data/v2/catalog-snapshot.json, data/v2/map-snapshot.json, data/v2/site-manifest.json, data/v2/detail/shmi.json, data/v2/detail/it-academy.json, data/v2/detail/projects.json, data/v2/detail/olympiad-league.json. No bucket-wide sync or deletes. Capture original bytes/ETags, verify no concurrent changes before conditional writes, verify readback hashes; manifest last. Preserve ACL/content type/cache headers. No writes before candidate validation and independent review.
PA-OPS-010: if auto-deploy needs explicit retry, POST deploy only to verified app195536 with full exact release SHA. Poll exact deploy ID and SHA, not arbitrary latest. No app env/domain changes.
PA-SECRET-001/002: use only already owner-provided credentials in process memory for their intended GitHub/Timeweb/Yandex API; never display values, stage, copy or log credentials. No unrestricted env dump.
Rollback: redeploy prior full main SHA via verified app; restore only modified S3 keys from pre-release backup if still matching this release hashes (never clobber intervening publication). Newly added detail objects are harmless if left unreferenced; do not delete arbitrary objects.

## 5. Architecture / classification / UX / security
Product-domain UI: existing validated S3 hot/cold contracts feed site, wizard and grouped timetable; annual overlay from reviewed dated CSV adds4programmes,51groups,52slots,6newvenues and retains2existingvenues. Shared QR is school scope, all campuses first.
Operational release boundary: Timeweb GitHub/main code deploy and separate exact-key public S3 upload. Canonical site env currently quest.b-master.pro; preserve aliases.
Approved UX/focus/reflow tests from WEB-COURSE-FINDER-01 retained. No personal data, no secret-bearing public outputs. Pure public data fetches only for production browser checks, telemetry/booking requests blocked in test client.

## 6. Audit A / B
Readonly Banach and Franklin reused for release dependency/safety review. Pending findings and final frozen review.

## 7. Plan / negative paths
1. Verify current app/main/credentials and capture live public bundle.
2. Assemble only91 reviewed source paths on main; validate dependencies and regenerate annual snapshots against live records, without publishing.
3. Ensure subsequent hot/cold publication preserves annual overlay with tier isolation; fixture-test without contacting Sheets.
4. Freeze code/data candidate, secret scan, unit/type/build/browser evidence and independent review.
5. Push isolated release branch; verify live state unchanged, publish bounded data with backup, merge exact reviewed SHA to main to trigger existing Timeweb.
6. Poll matching deployment, then verify HTTPS wizard, school/campus, course, map, photos and video; no actual bookings.
Stops: mismatched target, unresolved review, auth failure on required operation, new concurrent main/data changes, secret finding, invalid or orphan data, build/runtime failure.

## 8. Exact validation commands
Node22 with installed local Linux native binaries; fresh clean dependencies if required.
- node --import tsx --test lib/offers/*.test.ts (apps/web)
- node node_modules/typescript/bin/tsc --noEmit --incremental false
- node scripts/validate-public-snapshot.mjs
- node apps/web/node_modules/tsx/dist/cli.mjs scripts/integrate-year-schedule.ts --check
- node --test scripts/annual-publish-tier.test.mjs (if new helper adopted)
- npm run build with strict S3 contract and a local HTTP mirror of candidate public objects before publish; repeat verify:s3 against public after publish
- Existing scripts/verify-course-finder-ui.mjs, verify-year-grouping-ui.mjs, verify-year-schedule-ui.mjs, verify-year-integration-ui.mjs, verify-year-course-ui.mjs against isolated release build
- make secret-scan; git diff --check; git diff --cached --check; explicit path and generated drift checks.
Production checks: direct HTTP and real browser GETs, assets load, no404/JSerrors, mobile and desktop, school2044→campus→programme→weekday→share; no production write test.

## 9. Acceptance / evidence / failures / scope changes
Local frozen finder17 hash472cad64d2d1f5441413b871e16996c85d126413ec94d84b52bda5b0a76b0617 was approved previously; full release hash pending.
A1 clean scoped candidate: pending.
A2 retained existing live records and all annual links: pending.
A3 build/tests/review/secret gate: pending.
A4 exact release active in Timeweb/main: pending.
A5 b-master.pro real browser verified: pending.
Failure: stale local Timeweb401; resolved by updated owner profile200. No credential changes.
No production writes so far.

## 10. Freeze / staging / final
FROZEN: 96 source/test/data paths, SHA256 6bc62c8aa0b313fdfce04a8bfd67042dc40c677126951f5fa7ba651b176ca1b1. Sorted relative path + NUL + bytes + NUL. Exclude this evolving plan from hash. Exact list recorded in release artifact freeze.json; source91 plus five declared publisher/correction files. No source edits after this freeze.
No staging until review/secret pass. Never git add . or -A. Source checkout untouched. Record commit/main/deploy IDs and exact S3 backup in final evidence.
Do not start the next task.

## 11. Release validation evidence (2026-09-09)
Isolated candidate /tmp/questhub-prod-release-FiIlX3/repo; untouched owner checkout/index remain at4a338b2. Two approved route files normalized CRLF→LF only in release candidate. Site config copied from live for verification was restored to main bytes in candidate; live site config is retained by S3 mirror and will not be uploaded. All25 live intensives /5courses /3worlds /10venues preserved by deep equality; five existing detail snapshots byte-identical.

Pinned fresh Linux npm ci: web707packages, scripts79, secret scanner94. No dependency or lockfile change. Node22.23.1. Initial compiler invocation lacked --tsconfig and failed before writes; rerun with --tsconfig apps/web/tsconfig.json passed. The unit attempt before successful generation failed11 annual cases; corrected generation followed by67 tests /19suites PASS. Initial borrowed dependency symlinks rejected by secret-scan; replaced only owned temporary links with clean pinned dependency installations; scanner PASS1230files. Browser integration initially lacked CHROMIUM_PATH after fresh install; rerun using installed Chromium1228 passed. No gate was weakened.

Final web checks:67offer tests PASS; tsc --noEmit --incremental false PASS; ESLint54changed webTS/TSX files0warnings/errors; importer16tests PASS; public15JSON validator/media guard PASS; compiler --check PASS. Full npm run build with exact production S3-source/strict flags against local HTTP mirror of candidate public objects:111static pages PASS. Existing Turbopack trace warning recorded, not hidden. Actual production S3-backed build and live domain check remain deployment gates.

Browser acceptance on isolated release3196: finder15 scenario groups; grouping5; site/campus integration4; annual editorial/photos/video21; retained schedule7. Seven scoped axe scans show0violations (not a complete accessibility audit). No real bookings sent; local booking outcomes mocked and non-read external requests blocked.

Publisher corrections from independent review: both Sheets wrapper and legacy producer reapply annual source to their own tier before upload; timestamp max prevents regressions; only exact51ownedIDs may be replaced; unknown compatible annual IDs preserved; newer/conflicting source revisions fail before any writes. Actual legacy table projection validates the final bundle, rejecting mixed sources before publication. Eight helper/compiler tests verify updated/deleted legacy rows, unknown IDs, timestamp preservation, hot/cold write isolation, idempotence and failure-before-output. Final compiler check leaves frozen public bytes unchanged.

Data release fingerprint a12525e2e6458b0f8e5510aa0af113033bd846cb8e568805ff2383fb32ab27f8 (ordered exact8key/hash mapping). Original public bytes/ETags/ACLs captured in /tmp/questhub-prod-release-FiIlX3/public-before and public-before.json. Conditional PutObject uses If-Match or If-None-Match plus MD5 and authenticated/public hash readback; see https://yandex.cloud/en/docs/storage/s3/api-ref/object/upload . No broad sync or delete. Before publication, recheck no old-revision pending/queued/in-progress Sheet Sync and unchanged main/data. Initial queued/in_progress/waiting/pending workflow counts all0.

Rollback command for code is separate from normal deploy: node /tmp/questhub-prod-release-FiIlX3/release-ops.mjs rollback-code ba8a1139bd55cf70589076b7c25db11ea12d3ab3. It verifies app195536/main/repository/domain but allows only the captured previous SHA. Data rollback: same helper rollback-data a12525e2e6458b0f8e5510aa0af113033bd846cb8e568805ff2383fb32ab27f8, guarded against intervening changes. Newly added detail files remain unreferenced, not deleted. Both are recovery operations, not executed preemptively.

## 12. Frozen independent review / release gate
Auditor A (Banach) APPROVE exact96-file fingerprint6bc62c8aa0b313fdfce04a8bfd67042dc40c677126951f5fa7ba651b176ca1b1: declared delta verified, incompatible mixed sources reject before writes, conditional eight-key operations and allowlisted code rollback verified.
Auditor B (Franklin) APPROVE same exact fingerprint: independently ran8tests and compiler check, post-test hash unchanged, no remaining bounded findings. Neither approval is a production-completion claim.
Persistent rollback evidence copied before any production mutation to /home/xipsin/projects/BM_QuestHub/design-previews/course-finder-release-2026-09-09 (public-before/, public-before.json, freeze.json). Credential files are not copied.
Commit/push authorized by current production-release instruction; exact staging list is frozen96paths plus this plan. Main will advance only after remoteCI and final concurrency checks; Timeweb exact deploy and public browser verification must complete afterward. Production status remains pending at commit time; final release evidence is recorded outside the immutable commit.
