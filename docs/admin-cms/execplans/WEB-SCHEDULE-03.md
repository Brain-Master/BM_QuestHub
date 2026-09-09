# WEB-SCHEDULE-03 — Relevant choices, active refresh and complete venue context

## Metadata / owner Task Packet

Status: LOCAL IMPLEMENTATION APPROVED / OWNER FACTS PENDING. Date2026-09-09, Europe/Moscow. Repository Brain-Master/BM_QuestHub.
Incremental review addendum: components/sites-map-schematic.tsx may preserve the
filterSlot and recovery controls in its empty result state; no map-provider change.
Pipeline review exact-path addendum: scripts/refresh-annual-mos.mjs validates the
source schema/hash; scripts/publish-sheet-hot.mjs reports annual coverage after
safe last-known publication (PA-OPS-002). No external invocation in this pass.
Branch fix/schedule-data-and-venues-2026-09-09; HEAD/base a99ea122d421cfd2beadb07b48c466f89a7ea97f.
Owner latest seven-point request explicitly expands the local schedule candidate:
nonempty dependent choices across public filters, no archived-card refresh,
teacher confirmation, consistent embedded schedule, school enrichment, shorter links.
Parent only writes. Previous WEB-SCHEDULE-02 changes are owned baseline and preserved.
Commit: NO COMMIT in this pass; prior main authority remains recorded in02 but its
source-fact and operational gates are still open. Do not publish incomplete data as complete.

## Objective / non-goals

Parents see only choices with matching groups, keep recoverable URL state, compare
days/campuses on school pages, and find verified location information. Refresh reads
only current/future groups, never archived ones. No new scheduler, service, dependency,
brand redesign, auto-assignment of teachers, alias deletion, CMS/PR9 edits or secret exposure.

## Authorized paths and protected overrides

Read scoped web/components/lib/content/data, scripts mos and sheets pipelines, existing
research/downloads, public school websites/maps. No credential reads needed initially.
Write apps/web/lib/offers/course-finder.ts and tests; components/course-finder.tsx,
course-finder-results.tsx, course-finder.module.css, live-agenda.tsx, schedule-board.tsx,
year-schedule.tsx, catalog-page-client.tsx, live-catalog.tsx, live-sites.tsx;
capability-specific filtering helpers/tests in apps/web/lib/offers/ and lib/sites/;
apps/web/content/school-profiles.ts and annual-group-overrides.ts (teacher mappings
only after explicit owner confirmation); app/sites/[school]/page.tsx; public/sites/
original public media + provenance, no invented building images.
scripts/lib/mos-annual-refresh.mjs, mos-enrolled-plan.mjs, mos-enrolled-sync.mjs,
mos-enrolled-finalize.mjs, new scoped lifecycle helper and tests;
scripts/refresh-annual-from-published.ts, audit-annual-mos.mjs, integrate-year-schedule.ts;
scripts/verify-course-finder-ui.mjs and new focused QA/research scripts;
docs/data/annual-schedule-audit-2026-09-09.md and scoped source/research report, this plan.

PA-GEN-001 / PA-COMPAT-001..005: generator-only write same eight local outputs as02:
offers-snapshot, v2/catalog-snapshot, map-snapshot, site-manifest and four annual details.
Source profile overlay may now enrich existing map venues as requested; preserve exact
IDs, unrelated fields and old QR routes. Source-owned profile assertions replace only
explicitly reviewed fields; updated nonowned-preservation tests must enforce that.
PA-COMPAT-007: compatible URL parser accepting old verbose URLs and new minimal URLs,
preserve explicit filters, scope, Back/Forward, view and selected offer. Zero-result
selected values retained as disabled explanatory options, never silently change scope.
PA-BUILD-002/003: normal local build/export/QA outputs only, never stage.
PA-OPS-002: run-sheet-sync.mjs only if lifecycle context needs wiring, no external runs.
Packaged YCF copies require exact-path addendum before regeneration. No deployment in
this pass. Rollback is scoped reverse patch from recorded baseline, not git restore.
Any newly needed exact source path is recorded before its edit.

Audit A/B addendum (before edits): apps/web/lib/catalog-filters.ts and tests;
apps/web/lib/sites/scope-card.ts and tests; components/catalog-toolbar.tsx,
program-filter-select.tsx, schedule-board-toolbar.tsx, site-selection-grid.tsx,
sites-page-toolbar.tsx, site-header.tsx; scripts/lib/mos-group-lifecycle.mjs and
mos-group-lifecycle.test.mjs, mos-enrolled-batch.mjs, mos-sync-state.mjs and tests;
apps/web/lib/offers/annual-schedule.ts coverage additive lifecycle fields.
YCF runtime copies: apps/yandex-mos-sync-planner/{mos-enrolled-plan,mos-group-lifecycle}.mjs,
apps/yandex-mos-sync-worker/{mos-enrolled-batch,mos-group-lifecycle}.mjs,
apps/yandex-mos-sync-finalizer/mos-enrolled-finalize.mjs,
apps/yandex-mos-sync-controller/mos-sync-state.mjs (only if exact directory exists).
No runtime/cloud deployment; source/runtime equality checks required.
Exact media tools: scripts/school-media-sources.json and scripts/fetch-school-media.mjs;
bounded downloads of original JPEGs under public/sites, no overwrite of existing files.
Header filter shortcut wiring: apps/web/app/layout.tsx passes only SHMI baseline and
school/campus identity map; live snapshot cache remains the existing shared SWR source.
Runtime exact-directory correction after inventory: yandex-mos-url-worker (not
yandex-mos-sync-worker). Copy only these changed source basenames into each existing
apps/{yandex-mos-sync-controller,yandex-mos-sync-planner,yandex-mos-url-worker,
yandex-mos-sync-finalizer}: mos-enrolled-plan.mjs, mos-enrolled-batch.mjs,
mos-enrolled-sync.mjs, mos-enrolled-finalize.mjs, mos-sync-state.mjs,
mos-group-lifecycle.mjs. Legacy apps/yandex-mos-enrolled-sync and its existing
bundled/bm-mos-enrolled-sync get the same six basenames where the implementation
exists; all new helper imports must resolve. No stageMosLibs deletion or cloud calls.
New real worker test: scripts/lib/mos-enrolled-batch.test.mjs.
Manual/legacy entrypoint parity: scripts/sync-mos-enrolled.mjs and
apps/yandex-mos-enrolled-sync/index.js may dispatch the already configured annual
hot workflow after a completed zero-legacy-row run; keep legacy failures distinct.
Bounded mechanical runtime generator: scripts/copy-mos-lifecycle-runtime.mjs,
only the26 exact previously listed module targets. It copies source bytes and
verifies equality; never removes files or invokes deployment/install commands.

## Preflight / baseline

All required git/preflight commands exit0; branch/HEAD unchanged, no staged files.
48 previous changed/new files excluding02 plan have SHA256
97069dbd7b555817fa336ea4043f57af2e782c22dd9ba4c94722200dba840d7f.
Node22.23.1/npm10.9.8 via /home/xipsin/.nvm/versions/node/v22.23.1/bin.
One later inventory shell omitted PATH and `node` was unavailable; explicit PATH
restored, same inventory/read-only fingerprint succeeded, no runtime upgrade.
Previous02 gate: full web check,22unit,15pipeline,1finalizer,16importer,19browser/8axe.
These are prior-run evidence, not claimed final03 checks.
Memory registry search returned no relevant QuestHub notes. AGENTS/PLANS/protected
registry/template and required UX/installed Next navigation guide read by parent.

## Architecture and classification

All revised code product_domain. Public snapshot -> pure choice/matching selectors ->
React filters/wizard/results. URL is view state; disjunctive facets exclude their own
field but honor other conditions (changing school also clears dependent campus).
Static venue identity is not evidence of active groups. Date-based archive and admission
closed are distinct: future groups with temporarily closed admission are not archived.
Compiler owns reviewed facts; mos API staff fields never establish teacher assignment.

## Audit A/B

Two independent read-only auditors inspect filter/URL/dataflow and lifecycle/security/
UI regression risks. Media research may be delegated read-only, but parent checks
source evidence and writes. Verdicts pending, no approval claim.

## UX/security/negative paths

References: 18_ACCESSIBILITY_AND_RESPONSIVE,32_UI_COPY_CATALOG. Same day-grouped cards,
visible booking/price, responsive/keyboard/focus. Embedded page has H2 (not secondH1).
Unknown URL selection or vanished group stays explicit with reset, not silently all.
Unavailable source differs from confirmed zero. No hide-empty claim until loaded.
Short URLs omit `all`, default modes/steps and scope already encoded in path; retain
any nondefault needed to restore exact screen. No link-shortener service or tracking.
Known past dates skip network; malformed/unknown lifecycle fails closed with actionable
reason, never classified successful or silently archived. Current Moscow date injectable.
Media: public addresses only, original image MIME/size/hash/provenance, no signed links
in source, no generated fake photos, no claims of licensing when unverified.

## Checkpoints / acceptance

1 Inventory every public filter and venue, derive teacher questions.
2 Pure nonempty faceted selectors and minimal URL round-trip tests; wire public UIs.
3 Shared embedded schedule and route/link recovery tests.
4 Active-only mos planner/annual refresh with zero-batch finalization and no-network
tests for archives; preserve reports and last-good state.
5 Verify/enrich all identifiable school profiles/campus photos; report unresolved facts.
6 Types/units/compiler/full build, browser/a11y and read-only review; record limits.
Implementation checkpoints 1–5 completed for verified inputs. Wizard/result facets,
catalogue, legacy board, site directory/map and annual-table choices share nonzero
eligibility semantics. Embedded schedule reuses CourseFinder. Compact URL parser
preserves both standalone/embedded defaults and old URLs. Nine profiles /15 campuses
have actual source-bound photos/logos; BM base address remains owner-dependent.
Teacher assignment blocked on owner reply; previous eight aliases and seven years
are not implicitly confirmed by this new request. Publication remains a separate gate.

## Exact validation

Node22: npm exec --prefix apps/web -- tsc --noEmit -p apps/web/tsconfig.json;
node --import tsx --test lib/offers/*test.ts (cwd apps/web, focused filenames preferred);
node --test scripts/lib/mos-annual-cards.test.mjs scripts/annual-overlay-refresh.test.mjs
scripts/annual-publish-tier.test.mjs and new lifecycle tests;
node --experimental-test-module-mocks --test scripts/lib/mos-annual-finalize.test.mjs;
node apps/web/node_modules/tsx/dist/cli.mjs --tsconfig apps/web/tsconfig.json
scripts/integrate-year-schedule.ts --write / --check;
NEXT_PUBLIC_OFFERS_SNAPSHOT_URL=/data/offers-snapshot.json npm --prefix apps/web run check;
PREVIEW_URL=http://127.0.0.1:3195 node scripts/verify-course-finder-ui.mjs;
make secret-scan; git diff --check. Record actual attempts, no zero-test PASS.

## Validation / failure log

Completed local checks before freeze:
- full web check PASS: lint0errors/4pre-existing unused warnings;14snapshots;
  hardcoded-data audit;7host-scope tests; TypeScript/build111static pages.
- All offers/sites domain tests79/79 (includes24focused annual/finder/profile tests).
- Pipeline/card/lifecycle/finalizer/worker/publisher/standalone tests19/19;
  state/controller tests16/16; actual overlay/tier tests10/10.
- Compiler --write and --check PASS:16venues/51annual groups/52weekday rows.
  Unrelated records preserved; backups printed by compiler under /tmp.
- Bounded runtime copies26/26 byte-equal, no deployment.
- Browser14 PASS25scenario groups/8scopedaxe scans0violations. Includes all nine
  reviewed profiles, empty-map recovery, catalogue reset/Back, embedded wizard.
  Final browser12 also passed legacy school=all sentinel regression.
- Secret scan PASS1284 files on the final candidate; git diff --check PASS.

Failure/correction trail (no evidence hidden):
- Browser05 old scenario chose a now-ineligible campus; corrected test selects an
  eligible campus and asserts every offered campus matches age/day.
- Browser06 native disabled option assertion used toBeDisabled incorrectly; assert
  DOM disabled property instead; product still exposes unavailable saved choice.
- New archived finder regression initially lacked itemSchool import; corrected,
  then23focused and78domain tests PASS.
- Standalone tsImport schema loading failed alias then extension resolution from
  repo root. Scoped tsx/cjs/api require +relative runtime imports fixes both;
  real CLI all-archived/hash-mismatch smoke PASS without network.
- Browser08 exact button name omitted arrow. Expanded harness fixed name, narrowed
  two status nodes, and opens the map filter disclosure before inspecting textbox.
- Browser09 found actual same-path router.push reset did not change static-export
  URL. Sites/catalogue now use native history API with useSearchParams consumers,
  same as existing finder, preserving Back/Forward. Browser10 covers reset/recovery.
- Browser10 synchronous Radix option count ran before dropdown render; changed
  to auto-retrying Playwright assertion, same required2options. Browser11 PASS25.
  Final inspection found catalog school=all adding a duplicate unavailable item;
  explicit all-sentinel exclusion added and browser12 checks single all option.
- Media1212 orig exceeded5MB; rejected without writing. Bounded XXXL source used.
  Sports-field and dated2016 candidates not used; alternate facade frames selected.
- One focused test invoked from repo root missed its apps/web path; reran correct
  cwd. One make secret-scan call omitted NodePATH, exit127; reran explicit22PATH,
  PASS. No dependency/runtime upgrade or gate weakening.

Audit A Goodall: six incremental findings fixed (map recovery, school=all,
embedded serializer default, invisible saved-year condition, invalid catalogue
selection broadening, archived finder availability). Focused re-review confirmed six.
Audit B Bernoulli: five findings fixed (zero-run state failure, midnight lifecycle,
standalone source coverage, archived-listing error retention, CLI partial exit).
Real standalone smoke added after reviewer caught tsImport failure. Final frozen
  review is still required. Parent only wrote; delegated research/audits read-only.

## Freeze/review/commit/final

FROZEN; reviewer PENDING. Algorithm sorted relative path NUL bytes NUL SHA256;
exclude02/03 ExecPlans explicitly from self-referential freeze. Staging NOT AUTHORIZED
until scope and original publication gates resolved. No commit/push/S3/YCF writes.
Final outcome INCOMPLETE; next roadmap task not started.
Do not push.
Do not start the next task.

## Frozen candidate manifest

Final reviewer Socrates found P2 undefined optional profile fields erasing existing
metro/district. Freeze lifted. Exact existing paths school-profiles.ts and compiler/
overlay tests authorized for correction. PA-GEN-001: restore only absent metro/district
of matching reviewed campus IDs via --restore-missing-venue-context=<validated local
backup>, cold tier only. Input /tmp/questhub-year-data-backup-dBWLLr/data/v2/map-snapshot.json;
expected7fields across1383/1517/937/MDUC2addresses, independently compared with HEAD.
Never overwrite present values, unrelated fields or hot schedule; no manual JSON edits.
Correction result: exact7fields restored, old context loss against HEAD now0.
Optional undefined profile keys are omitted; generic same-ID existing context is
preserved. Recoveryflag requires absolute local path+coldtier, validates source,
copies only absentmetro/district of matching reviewed identities. Real compiler
test checks preservation and repair while refusing hottier;10overlay testsPASS.
Actualdata regression checks7fields;79domain testsPASS;fullwebcheckPASS111routes.
Pipeline19/state16/copy26 recheckedPASS. Browser14 final repeatPASS25;
8scopedaxe scans0violations,0pageerrors,0unexpected writes. Known booking/failure
reports fully mocked. Final freeze is125paths SHA256
14509dca999267ab012af6ac702429e97eb85e6f2142762c9fcf5dc6196473fc.
Reviewer independently verified this hash, closed P2, no further findings;
Final reviewer Socrates verdict APPROVE on these125frozenbytes after independently
verifying browser14. P2closed;0remainingmaterialfindings. Approval is implementation
only, not publication. Staging empty, no commit/push/S3/YCF/deploy. Prior owner main
authority retained, but source-data/media release gates remain explicit.
Live local preview http://127.0.0.1:3195/ (server confirmed listening); user-facing
reports: docs/data/school-profiles-2026-09-09.md and annual-schedule-audit-2026-09-09.md.
Owner responses still required: teacher assignments, BM base address,8possible
group replacements and7study years. Media reuse rights not established. No fabricated
data, no production acceptance claim. Next action is resolve these facts then release
the validated candidate through the original main/release workflow.

Superseded by a single QA-only correction: browser12 recorded three blocked POSTs
from existing lead.client_submit_failed telemetry for deliberate400/503/network
booking failures. No request left the harness. Browser13 explicitly mocks and verifies
these three known reports and asserts zero unexpected writes (previously collected
but not asserted). Product bytes unchanged, prior fingerprint no longer current.

Superseded QA-only freeze before profile P2:125same paths below, SHA256
f8a7849c8d41e5a4ddd82b858d25c57c39943fd84e652e4f81aea64fffba11e8.
Browser13 PASS25;8scopedaxe scans0violations;0pageerrors;0unexpected writes;
4mock bookings plus3explicitly mocked failure reports(400/503/network). No request
reached production. Secret-scan PASS1284 on these bytes; source/copy parity unchanged.
Independent reviewer Socrates notified for final verdict. No product edit since full
build and domain/pipeline checks; only stronger QA assertions replaced prior harness.

HEAD a99ea122d421cfd2beadb07b48c466f89a7ea97f. Changed/new feature files 125.
SHA256 e720fc8ee37e7f078c3feb7d390ca33d828992ee2a2d5dd58d4da454a3af1a31.
Excludes only WEB-SCHEDULE-02.md and WEB-SCHEDULE-03.md to allow administrative
evidence/review entries; no product or other documentation files excluded.
Final source builds, compiler/copy checks, domain/pipeline/overlay/state tests and
browser12 were run on these feature bytes. Final ESM one-line URL demo probe used
the wrong named-export mode for CJS-transpiled TS; corrected CJS probe, no source edit.
No index changes, commits, pushes, production reads/writes or credentials in03.

```text
.github/workflows/mos-enrolled-sync.yml
.github/workflows/sheet-sync.yml
apps/web/app/layout.tsx
apps/web/app/sites/[school]/page.tsx
apps/web/components/annual-programme-groups.tsx
apps/web/components/catalog-toolbar.tsx
apps/web/components/course-finder-results.tsx
apps/web/components/course-finder.module.css
apps/web/components/course-finder.tsx
apps/web/components/live-agenda.tsx
apps/web/components/live-catalog.tsx
apps/web/components/live-sites.tsx
apps/web/components/preferred-school-banner.tsx
apps/web/components/program-filter-select.tsx
apps/web/components/schedule-board-toolbar.tsx
apps/web/components/schedule-board.tsx
apps/web/components/site-header.tsx
apps/web/components/site-selection-grid.tsx
apps/web/components/sites-map-schematic.tsx
apps/web/components/sites-page-toolbar.tsx
apps/web/components/year-schedule.tsx
apps/web/content/annual-group-overrides.ts
apps/web/content/annual-mos-refresh.generated.json
apps/web/content/school-profiles.ts
apps/web/data/offers-snapshot.json
apps/web/data/v2/catalog-snapshot.json
apps/web/data/v2/detail/it-academy.json
apps/web/data/v2/detail/olympiad-league.json
apps/web/data/v2/detail/projects.json
apps/web/data/v2/detail/shmi.json
apps/web/data/v2/map-snapshot.json
apps/web/data/v2/site-manifest.json
apps/web/lib/catalog-filters.ts
apps/web/lib/offers/annual-integration.test.ts
apps/web/lib/offers/annual-programme-name.ts
apps/web/lib/offers/annual-schedule.ts
apps/web/lib/offers/course-finder.test.ts
apps/web/lib/offers/course-finder.ts
apps/web/lib/offers/schedule-board.ts
apps/web/lib/sites/scope-card.ts
apps/web/lib/year-schedule.ts
apps/web/public/sites/mduc-ekt/logo-original.jpg
apps/web/public/sites/mduc-ekt/mosfilmovskaya-55k1-original.jpg
apps/web/public/sites/mduc-ekt/odesskaya-12a-original.jpg
apps/web/public/sites/school-1212/golubinskaya-21k3-facade-original.jpg
apps/web/public/sites/school-1212/golubinskaya-21k3-original.jpg
apps/web/public/sites/school-1212/logo-original.jpg
apps/web/public/sites/school-1212/novoyasenevsky-24k3-original.jpg
apps/web/public/sites/school-1212/vilnyusskaya-14-original.jpg
apps/web/public/sites/school-1383/dubninskaya-7-original.jpg
apps/web/public/sites/school-1383/logo-original.jpg
apps/web/public/sites/school-1517/logo-original.jpg
apps/web/public/sites/school-1517/tukhachevskogo-58k2-original.jpg
apps/web/public/sites/school-17/logo-original.jpg
apps/web/public/sites/school-17/vvedenskogo-27a-facade-original.jpg
apps/web/public/sites/school-17/vvedenskogo-27a-original.jpg
apps/web/public/sites/school-17/vvedenskogo-28s1-original.jpg
apps/web/public/sites/school-2044/README.md
apps/web/public/sites/school-2044/dmitrovskoe-165e-k8-original.jpg
apps/web/public/sites/school-2044/dmitrovskoe-169b-original.jpg
apps/web/public/sites/school-2044/logo-original.jpg
apps/web/public/sites/school-2103/golubinskaya-13k2-original.jpg
apps/web/public/sites/school-2103/logo-original.jpg
apps/web/public/sites/school-875/logo-original.jpg
apps/web/public/sites/school-875/vernadskogo-101k6-original.jpg
apps/web/public/sites/school-875/vernadskogo-99k2-original.jpg
apps/web/public/sites/school-937/logo-original.jpg
apps/web/public/sites/school-937/zakharova-25k2-original.jpg
apps/yandex-mos-enrolled-sync/bundled/bm-mos-enrolled-sync/mos-sync-state.mjs
apps/yandex-mos-enrolled-sync/index.js
apps/yandex-mos-enrolled-sync/mos-sync-state.mjs
apps/yandex-mos-sync-controller/mos-enrolled-batch.mjs
apps/yandex-mos-sync-controller/mos-enrolled-finalize.mjs
apps/yandex-mos-sync-controller/mos-enrolled-plan.mjs
apps/yandex-mos-sync-controller/mos-enrolled-sync.mjs
apps/yandex-mos-sync-controller/mos-group-lifecycle.mjs
apps/yandex-mos-sync-controller/mos-sync-state.mjs
apps/yandex-mos-sync-finalizer/mos-enrolled-batch.mjs
apps/yandex-mos-sync-finalizer/mos-enrolled-finalize.mjs
apps/yandex-mos-sync-finalizer/mos-enrolled-plan.mjs
apps/yandex-mos-sync-finalizer/mos-enrolled-sync.mjs
apps/yandex-mos-sync-finalizer/mos-group-lifecycle.mjs
apps/yandex-mos-sync-finalizer/mos-sync-state.mjs
apps/yandex-mos-sync-planner/mos-enrolled-batch.mjs
apps/yandex-mos-sync-planner/mos-enrolled-finalize.mjs
apps/yandex-mos-sync-planner/mos-enrolled-plan.mjs
apps/yandex-mos-sync-planner/mos-enrolled-sync.mjs
apps/yandex-mos-sync-planner/mos-group-lifecycle.mjs
apps/yandex-mos-sync-planner/mos-sync-state.mjs
apps/yandex-mos-url-worker/mos-enrolled-batch.mjs
apps/yandex-mos-url-worker/mos-enrolled-finalize.mjs
apps/yandex-mos-url-worker/mos-enrolled-plan.mjs
apps/yandex-mos-url-worker/mos-enrolled-sync.mjs
apps/yandex-mos-url-worker/mos-group-lifecycle.mjs
apps/yandex-mos-url-worker/mos-sync-state.mjs
docs/data/annual-schedule-audit-2026-09-09.md
docs/data/mos-enrolled-sync.md
docs/data/school-profiles-2026-09-09.md
scripts/annual-overlay-refresh.test.mjs
scripts/annual-standalone-refresh.test.mjs
scripts/audit-annual-mos.mjs
scripts/copy-mos-lifecycle-runtime.mjs
scripts/fetch-school-media.mjs
scripts/integrate-year-schedule.ts
scripts/lib/mos-annual-cards.mjs
scripts/lib/mos-annual-cards.test.mjs
scripts/lib/mos-annual-finalize.test.mjs
scripts/lib/mos-annual-publish.test.mjs
scripts/lib/mos-annual-published.mjs
scripts/lib/mos-annual-refresh.mjs
scripts/lib/mos-enrolled-batch.mjs
scripts/lib/mos-enrolled-batch.test.mjs
scripts/lib/mos-enrolled-finalize.mjs
scripts/lib/mos-enrolled-plan.mjs
scripts/lib/mos-enrolled-sync.mjs
scripts/lib/mos-group-lifecycle.mjs
scripts/lib/mos-group-lifecycle.test.mjs
scripts/lib/mos-sync-state.mjs
scripts/publish-sheet-hot.mjs
scripts/refresh-annual-from-published.ts
scripts/refresh-annual-mos.mjs
scripts/run-sheet-sync.mjs
scripts/school-media-sources.json
scripts/sync-mos-enrolled.mjs
scripts/verify-course-finder-ui.mjs
```
