# WEB-CONFIRMED-SCHOOLS-RELEASE

## Authority, objective and non-goals
2026-09-23 Europe/Moscow. Owner: «публикуем!» following completed local data
integration. Publish the reviewed current website/school data including1212
(seven SHMI1),937(four SHMI2), prior37/nine groups and venue/capacity corrections.
This authorizes scoped commit/push/PR/main merge and production publication;
supersedes preceding local-only boundaries for this website delivery only.
No cloud MOS timer/function activation, unrelated services/publications changes,
new feature, credential rotation, private MAX/registrant publication or enrollment.
Product_domain operational release; existing architecture/contracts unchanged.

## Preflight, scope and security
Repo: design-previews/schedule-audit-2026-09-09/repo; branch
fix/schedule-data-and-venues-2026-09-09; HEADb789b70d00747cd1078cb72dd295652fad53ac83.
Remote main07d230a9ac9243565677c88b25cc9369430d634e has identical baseline tree.
Timeweb195536 is active, auto-deploy enabled/main, successful matching SHA.
Node22.23.1/npm10.9.8; git diff --check passes, index empty. Dirty changes belong
to previous website tasks plus separate publications work. Exact path manifest
will be frozen before staging; exclude services/** and WEB-PUBLISHING-2044.md.
Eight current S3 public objects match HEAD bytes exactly (read-only GET proof).
Existing owner-provided GitHub/Timeweb/S3 credentials used in memory only;
no credential output, source copy or commit. Temporary ops files/backups beneath
/tmp/questhub-schools-release-YeYrrP (0700). Sanitized logs only.

Protected overrides: PA-GEN-001 and PA-COMPAT-001..005 stage already generated
validated snapshot files; no manual generated edits. PA-GEN-003/004 conditional
PUT exactly data/offers-snapshot.json, data/v2/catalog-snapshot.json,
data/v2/map-snapshot.json, data/v2/detail/{shmi,it-academy,projects,olympiad-league}.json,
data/v2/site-manifest.json(last). No deletes or other data keys.
PA-COMPAT-007 reviewed website changes and static school media. PA-OPS-006/007
already reviewed publisher exclusions only if coherent dependency inclusion
requires them; do not execute broad publishers. PA-OPS-010 operational app195536:
temporarily local/local build sources preserving other env/settings, then restore
s3/s3 and deploy same release SHA. PA-OPS-001 external operational pause/resume
of Sheet sync279541681 and Mos enrolled282599547 only; no YAML edits.
PA-BUILD-002/003 validation generation only, never stage outputs.

## Architecture, UX and negative paths
Source/additions/owner overrides -> compiler -> public hot/cold snapshots ->
static routes + browser GETs. Preserve seven1212 SHMI1, four937 SHMI2, teachers,
ages/directlinks,37privacy, four archived2044 groups and875. UI capacity values
remain dated source observations, not claims of successful automatic refresh.
Live browser must use real public data, block writes/departures, desktop/mobile,
check routes/counts/booking and retained groups. No prototype-only production claim.

## Steps, validation and acceptance
1. Two independent read-only audits: scope/dependencies and security/runtime.
2. Freeze exact website paths, exclude unrelated work. Re-run importer/compiler
checks, web/offers/scripts tests, full web check if frozen dependencies differ,
secret scan; independent release APPROVE before staging/mutations.
3. Read-only backup eight blobs/ETags/metadata and app config hash. Pause two
existing publishers, drain runs and recheck baseline. Inform owner to avoid
manual CMS edits during cutover. CAS detects concurrent edits.
4. Explicit staging and staged validation, single conventional commit,
push existing branch, create/attach PR, CI green. Set app local/local, merge
with exact reviewed head. Verify exact main SHA deployment and new37route.
5. Conditional eight-object publication with intent journal, manifest last;
verify hashes/publicGET. Restore s3/s3 build settings and deploy same main SHA.
6. Verify successful exact-SHA deployment + public browser counts and unchanged
external scope. Resume publishers only when main/deployment/data hashes agree.
7. Record final receipt; no next task.

Commands: Node22 PATH; TSX_TSCONFIG_PATH=apps/web/tsconfig.json node --import
./scripts/node_modules/tsx/dist/loader.mjs scripts/import-confirmed-school-groups.ts
--check; same loader/compiler scripts/integrate-year-schedule.ts --check;
node --import tsx --test lib/offers/*.test.ts lib/sites/*.test.ts (apps/web);
node --test scripts/confirmed-school-groups.test.mjs plus prior scoped tests;
npm --prefix apps/web run check with explicit local snapshot modes;
make secret-scan; git diff --check and cached checks; reviewed temporary ops helper.
Acceptance: exact reviewed main SHA successfully deployed,8/8remotehashmatch,
real production1212=7/937=4/37=9,global70,normal s3/s3 restored, publishers restored,
no unrelated files staged, no private data. Pending, not yet production success.

## Rollback / stop
Back up original blobs and metadata before mutations; journal each PUT intent
before request; reconcile uncertain response by exact bytes and ETag, no blind
retry. Restore only our written keys conditionally against our target bytes;
never clobber foreign changes. Leave publishers paused on conflicts. Before
resumption require main/deployed/publicdata agreement; if rollout fails after
merge use scoped revert PR (no rewrite), original data/build modes, deploy revert
SHA and verify all states. No delete/reset/force push. Stop on drift, failedCI,
missing credentials, unexpected target, reviewer findings, secret scan failure.

## Failure history
Initial npm invocation omitted Node PATH; importer first invocation omitted
TSX_TSCONFIG_PATH and failed resolving @/lib/schemas. Read-only checks; corrected
explicit environment and rerun, no changes hidden. Initial registry lookup used
root PROTECTED_ARTIFACTS.md; canonical docs/admin-cms path subsequently read.

## Freeze, review, staging and result
Status: VALIDATING. Exact candidate/hash and reviewer evidence pending.
Commit: feat(web): publish verified school groups and venue availability.
No stage/commit/push/production mutation performed at plan creation.

## Combined candidate freeze and current gates
Audit A Boole01a0cf95-12e0-75c2-b2be-b10cc0f677b7: coherent85-file website
candidate, all45tracked modifications plus40new files; no cloud entrypoints.
Audit B Kant01a0cf95-17cc-7902-9807-fe2326f1327a: local candidate publishable
via scoped release; never execute broad static/all publishers. Sidecar may be
unavailable; frontend retains dated values and warns, no live-sync success claim.
Existing school photograph republication rights remain unverified in historical
media evidence; owner requested these internet photos and authorized publication.

Frozen85 product paths, sorted path+NUL+bytes+NUL SHA256:
c02f2d308aa2dabf1769e7ac070b4e562c05ba78e9b6d6d01a9815adc09acbdb.
Exact paths below. All excluded dirty paths preserved unchanged. Include seven
preceding website ExecPlans and this release record separately; plans excluded
from product hash. Dormant cloud deployment/handler/CLI/handler-test excluded.
Optional historical audit reports/scripts excluded; private publications excluded.

Fresh validation: importer/compiler --check exit0;32script tests PASS;
105offers/sites tests PASS;make secret-scan PASS1445files. Full web check using
actual public Timeweb env with local build source overrides exit0,120routes,
4existing lint warnings and existing NFT trace warning, remote snapshot probe
correctly skipped. Prior completed browser evidence retained; release will use
real production responses for final browser checks. No product edits after freeze.


### Exact frozen website paths

Fresh product reviewer Nash01a0cf9b-d314-7311-a893-f7ebc6383866: APPROVE for
85 frozen files and8publicobjects; helper separate. No product edits afterfreeze.
Operational review first blocked on deployment identity/recovery/concurrency;
helper corrected before any remote mutation. Nine isolated deploy-state tests
PASS; nine scoped retirement/store/publisher tests PASS. Exact helper review pending.
Owner notified exclusive Timeweb/CMS configuration window; serialized helperlock
plus immediate pre-PATCH config recheck. No assertion that API offers config CAS.
Effective consumer boundary: first deploy complete local-source static catalog
and annual baseline. Browser runtime reads only one hot offers object (atomicPUT),
not cold snapshots. During cold-object replacement build sources remainlocal and
publishers arepaused; hot changes after allcold objects, manifest last. Restore S3
build only after8/8hash checks. Eight individual PUTs are NOT a bucket transaction.
Cached older browsers may need reload; no zero-reload/atomic-eight-object claim.
Read-only public sidecar probe404, expected fallback/warning remains honest.

Operational final reviewer Herschel01a0cf99-b14e-7212-b7fe-24ecb6e8fd93: APPROVE
for helper SHA256b87a3f1c496877f0e9212e77c431877e09e560e2578fba407ce51ff8d4d89091.
Second review found state loaded beforelock; fixed to read afterlock and added
actual entrypoint interleaving regression.10isolated tests PASS. Initial failure
and corrections retained. No product change;85-file hash still unchanged.
Explicitly staged93paths (85product +8plans), index bytes equal frozen worktree;
cached diffcheck PASS, staged secret-scan PASS1445files, importer/compilerchecks
PASS again. No production mutation yet. Release execution next; post-commit
receipt will be attached to the PR rather than claiming premature success here.
- apps/web/app/sites/[school]/page.tsx
- apps/web/components/course-finder-results.tsx
- apps/web/components/course-finder.module.css
- apps/web/components/schedule-board-card-compact.tsx
- apps/web/components/schedule-board-card-detailed.tsx
- apps/web/components/schedule-board-card-quest.tsx
- apps/web/components/schedule-capacity-indicator.module.css
- apps/web/components/schedule-capacity-indicator.tsx
- apps/web/components/site-selection-grid.tsx
- apps/web/components/year-schedule.tsx
- apps/web/content/annual-additions/school-1212.json
- apps/web/content/annual-additions/school-37.json
- apps/web/content/annual-additions/school-937.json
- apps/web/content/annual-group-overrides.ts
- apps/web/content/annual-mos-refresh.generated.json
- apps/web/content/annual-owner-ages.mjs
- apps/web/content/annual-retirements.mjs
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
- apps/web/lib/offers/annual-schedule.ts
- apps/web/lib/offers/confirmed-school-groups.test.ts
- apps/web/lib/offers/course-finder.test.ts
- apps/web/lib/offers/merge-offers.ts
- apps/web/lib/offers/mos-availability-client.ts
- apps/web/lib/offers/mos-availability.test.ts
- apps/web/lib/offers/mos-availability.ts
- apps/web/lib/offers/schedule-board.ts
- apps/web/lib/offers/school-2103.test.ts
- apps/web/lib/offers/school-37.test.ts
- apps/web/lib/offers/use-live-schedule.ts
- apps/web/lib/sites/map-colors.test.ts
- apps/web/lib/sites/site-stats.test.ts
- apps/web/lib/sites/venue-profile-audit.test.ts
- apps/web/lib/year-schedule.ts
- apps/web/public/sites/school-37/michurinsky-28-original.jpg
- apps/web/public/sites/school-37/venue-avatar-original.jpg
- apps/web/public/sites/school-937/zakharova-25-original.jpg
- scripts/annual-overlay-refresh.test.mjs
- scripts/compose-annual-additions.mjs
- scripts/confirmed-school-groups.test.mjs
- scripts/fixtures/annual-69-before-1517/README.md
- scripts/fixtures/annual-69-before-1517/offers.json
- scripts/fixtures/annual-69-before-1517/registry.json
- scripts/import-confirmed-school-groups.ts
- scripts/import-school-37.ts
- scripts/import-year-schedule.py
- scripts/integrate-year-schedule.ts
- scripts/lib/annual-retirements.test.mjs
- scripts/lib/confirmed-school-source.mjs
- scripts/lib/mos-annual-published.mjs
- scripts/lib/mos-annual-refresh.mjs
- scripts/lib/mos-live-capacity-publish.test.mjs
- scripts/lib/mos-live-capacity-store.mjs
- scripts/lib/mos-live-capacity-store.test.mjs
- scripts/lib/mos-live-capacity.ts
- scripts/lib/school-37-source.mjs
- scripts/refresh-annual-from-published.ts
- scripts/refresh-annual-selection.mjs
- scripts/refresh-annual-selection.test.mjs
- scripts/school-2103-import.test.mjs
- scripts/school-37-import.test.mjs
- scripts/school-937-intake.test.mjs
- scripts/school-media-sources.json
- scripts/sync-s3-public.mjs
- scripts/sync-s3-sdk.mjs
- scripts/verify-confirmed-school-groups-ui.mjs
- scripts/verify-course-finder-ui.mjs
- scripts/verify-mos-live-capacity-ui.mjs
- scripts/verify-school-2103-ui.mjs
- scripts/verify-school-37-ui.mjs
- scripts/verify-venue-availability-ui.mjs
- scripts/verify-venue-profiles-ui.mjs
