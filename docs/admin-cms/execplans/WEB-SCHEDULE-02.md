# WEB-SCHEDULE-02 — Audited annual schedule and school profiles

## Metadata and Task Packet

Status: AWAITING_SOURCE_FACTS (validated local partial implementation, not released).
Repository: Brain-Master/BM_QuestHub.
Branch: fix/schedule-data-and-venues-2026-09-09.
Expected/base HEAD: a99ea122d421cfd2beadb07b48c466f89a7ea97f.
Started: 2026-09-09 (Europe/Moscow). Agent: Codex parent; only parent writes.
Authority: owner's latest ten-point request explicitly approves publication in main,
duplicate/completeness audit, visible booking/price, menu changes, unfiltered agenda,
and working mos.ru refresh. It also confirms the preceding school-2044 enrichment.
The owner confirms all school-2044 groups are SHMI first year.
This concrete vertical task supersedes default no-push/no-merge restrictions ONLY
for its reviewed changes. Existing dirty CMS checkout and PR9 are excluded.
Commit: fix(web): audit annual schedule data and improve parent navigation.

## Objective

Publish an evidence-backed, correctly grouped annual schedule with accessible direct
booking, clear prices/levels, enriched school2044, and truthful mos.ru refresh coverage.

## Non-goals

No CMS work, auth changes, booking submissions, new infrastructure, secret rotation,
CAPTCHA bypass, invented missing facts, destructive deduplication, dependency upgrades,
or changes to unrelated programmes/groups. No next roadmap task.

## Authorized paths and protected operations

Read relevant repository source, supplied CSV archive, existing school2044 research,
public official websites and scoped current S3/YCF/GitHub/Timeweb metadata.
Existing owner-provided GitHub/S3/Timeweb credentials may be loaded in process memory
for scoped operations; never printed, copied into the repo, or committed.

Source edits: apps/web/components/{course-finder,course-finder-results,site-header,
annual-programme-groups,live-agenda}.tsx; course-finder.module.css;
apps/web/lib/offers/{course-finder,annual-programme-name,annual-programme-groups,
annual-schedule}.ts and their tests; apps/web/lib/year-schedule.ts;
apps/web/lib/sites/scope-card.ts; apps/web/app/sites/[school]/page.tsx;
apps/web/content/{year-integration,school-profiles,annual-group-overrides}.ts;
scripts/integrate-year-schedule.ts; scripts/import-year-schedule.py and tests;
scripts/lib/mos-enrolled-{parse,fetch,sync,plan,batch,finalize}.mjs and focused tests;
scripts/lib/mos-sync-state.mjs; scripts/annual-overlay-refresh.test.mjs;
scripts/verify-course-finder-ui.mjs; new scoped audit/refresh/regression scripts;
docs/data/mos-enrolled-sync.md and this plan. Concrete additional paths required
within the same owner-approved behaviour will be recorded before their edits.

Protected overrides:

- PA-GEN-001, PA-COMPAT-001/002/003/004/005: regenerate and commit ONLY
  apps/web/data/offers-snapshot.json, apps/web/data/v2/catalog-snapshot.json,
  apps/web/data/v2/map-snapshot.json, apps/web/data/v2/site-manifest.json,
  apps/web/data/v2/detail/{shmi,it-academy,projects,olympiad-league}.json through
  scripts/integrate-year-schedule.ts. No manual generated edits. Preserve stable IDs
  and non-owned records. Validate schemas, ownership/tier isolation and --check.
- PA-GEN-003/004: conditional publication of the same eight public S3 keys only,
  with prepublication bytes/ETag/ACL backup, validation and readback. Never delete.
- PA-COMPAT-007: compatible UI changes requested above; preserve QR routes and
  explicit query/back/forward state. Unknown scope must not broaden silently.
- PA-OPS-001: .github/workflows/mos-enrolled-sync.yml duplicate env correction only;
  no additional scheduler. Static validation and revert-to-base rollback.
- PA-BUILD-002/003: local Next build/export outputs via existing scripts, never stage.
- Downloaded original school photos/logo may be copied into
  apps/web/public/sites/school-2044/ with recorded provenance, MIME and checksum.
  No invented building photos, child portraits or claim of verified licence.

Operational extensions (function packaging/deploy or other source plumbing) require
an exact-path, rollback and failure-analysis addendum before mutation. Publication
uses existing GitHub main -> Timeweb app195536, no host/provider/env reconfiguration.
Rollback: revert new commit via reviewed GitHub change, conditional restore only
this task's changed S3 objects from backup; preserve old release checkout and backup.

Forbidden: original dirty checkout writes; old frozen release source writes; secret
files in output/staging; all unlisted operational mutations; broad sync/delete;
manual generated files; released migration changes; force-push; PR9 merge.

## Preflight evidence

Clean clone from verified public main; original dirty checkout preserved.
pwd/rev-parse/branch/HEAD/status/log -10/diff --check all exit0.
Branch and HEAD above; zero tracked/untracked changes before this plan.
Node /home/xipsin/.nvm/versions/node/v22.23.1/bin/node v22.23.1; npm10.9.8.
Lockfiles present. AGENTS SHA256 0ae4ae0c74715bfc12ceb7e5408981e7e47adb03453885bcdaf0d55be0952fc8;
PLANS 28c9b37cdfd2d693ac74dc4cd8dc4633b005b1f45af02939e4522c42541481b8.
Web lock e8ae3d91fd6738d3db319d207235dc9c6e9ef4fd45cd1dce7291b5cfab56661a;
scripts lock 4255fd1336eaf2c4ea09c4a5a7a57b109eec7092182d009c452768714a4cf108.
Baseline tests pending dependency availability, not claimed PASS.

## Architecture and classification

All changes are product_domain. CSV import -> reviewed annual model -> tier-aware
compiler -> catalog/map/offers S3 -> public Next frontend. Existing YCF/YMQ updater
reads Hot Sheet Formats and currently refreshes enrollment only for direct card URLs.
UI does not own source facts or write S3. 51 annual groups currently not included
in the 23-URL legacy run. Parent investigates this critical path locally; two read-only
sidecar auditors inspect data duplication and UX risks independently.

## Audit A / Audit B

Auditor A (Ampere): 51 unique groups/52 slots, eight alias candidates on LOC008;
10 school1383 explicit years lost from group_name_raw; six missing metro fields.
Accepted: preserve original CSV, resolve exact card per group, owner2044 year,
restore explicit year from live group title and metro in compiler. Eight potential
aliases and seven unknown years were sent to owner; no destructive action taken.
Auditor B (Carver): header uses remembered school, CTA/price inside details,
flat menu and hidden-but-focusable mobile links, invalid-scope legacy leakage.
Accepted: explicit-context header, native disclosures and existing dialog primitive,
compact CTA/price, invalid scope fails closed. Existing shared contact/booking flow
is preserved; user requested CTA visibility, not removing its form. Host-alias network
failure is an additional audited pre-existing risk, not silently claimed repaired.

## UX references

docs/admin-cms/01_ux/18_ACCESSIBILITY_AND_RESPONSIVE.md and
docs/admin-cms/03_reference/32_UI_COPY_CATALOG.md apply to public UI patterns/copy.
Parent sees all locations by default, can switch campus, programme/year and weekdays.
Booking and lesson price are visible without expansion, including at320px/zoom.
Nested navigation uses accessible expanded state, focus and keyboard interactions.
Loading/error/empty distinct; no invented success or missing-value suppression.
No change to save/publish UI, permissions or booking form contract.

## Security and negative paths

Bounded public GETs only for mos diagnostics; allowlisted origins, validated response
identity and numeric fields, bounded time/response size, no cookies/headers logged.
No counting sibling groups as this group's enrollment. Never guess card ID from
listing ID. Distinct source IDs remain distinct unless evidence establishes alias.
Unknown upstream values retain previous known data with source/freshness warning.
Invalid scope, stale snapshots, missing cards, duplicate weekdays and unavailable
upstream are negative tests. Do not mark last attempted run as successful refresh.

## Implementation checkpoints

1. Inventory actual groups/cards/locations/fields and direct-card evidence; reproduce UX defects.
2. Source-owned corrections, dedup only proven identities, school2044 profile enrichment.
3. Visible price/booking, nested menu, all-school default regression fixes.
4. Implement and test bounded refresh coverage with honest status and preservation.
5. Regenerate, validate, browser desktop/mobile/keyboard/a11y; independent frozen review.
6. Explicit staging, commit/push, PR checks/merge, conditional data publication,
   Timeweb release readback and public browser verification.

## Tests / acceptance

All ten owner items plus school2044 enrichment are required. Current status NOT RUN.
Candidate commands: npm ci --prefix apps/web; npm ci --prefix scripts (unchanged locks);
npm --prefix apps/web exec tsc -- --noEmit; node --import tsx --test lib/offers/*.test.ts
(cwd apps/web); node --test scripts/annual-overlay-refresh.test.mjs
scripts/annual-publish-tier.test.mjs; python3 -m unittest scripts/test_import_year_schedule.py;
node --import ./apps/web/node_modules/tsx/dist/loader.mjs scripts/integrate-year-schedule.ts --write
and --check; npm --prefix apps/web run check; node scripts/verify-course-finder-ui.mjs;
make secret-scan; git diff --check. Verify exact scripts/options before execution;
record actual command/output. New focused tests are authorized. No zero-test PASS.

## Validation log and failure history

2026-09-09: preflight above exit0; Target fingerprint PRE-FREEZE.
Earlier live evidence (not success): last legacy run23/23 errors, annual51 excluded.
Earlier production HTTPS/TLS intermittent failure remains a separate verification risk.
No implementation tests run yet. Preserve failures in subsequent entries.

2026-09-09 PRE-FREEZE: npm ci web/scripts exit0 unchanged locks; TypeScript exit0;
annual/finder unit tests20/20, overlay tests8/8, importer16/16. npm run check (web)
exit0: lint0errors/4pre-existing warnings,14snapshot files, hardcoded-data guard,
host tests7/7,111-page local build. S3 build gate explicitly skipped by local source
configuration; this is NOT a production/S3 browser pass.
Discovery01 exit2:28/51 exact matches, search collapses siblings; Discovery02 exit2:
41/51 after expansion, eight unavailable old identities and two missing CSV codes.
Two missing codes subsequently verified independently via923308/1000004. No missing
result called successful. Header apply_patch first attempt rejected duplicate target
operations, no bytes changed; corrected single update succeeded.
YC CLI config metadata exit0, iam create-token timed out15s with no token obtained.

### Operational design and exact-path addendum

Use existing scheduler, not a new cron. Refresh annual cards in the existing hot
publication workflow, after resolving direct-card registry. The YCF finalizer must
dispatch this hot publication on completed runs even if historic legacy links fail;
failed legacy results remain visible, never converted into success. Planner may skip
only proven expired legacy offers from the published snapshot; unknown legacy URLs
remain errors, not silently removed. Each annual fetch validates exact card/group,
and source overlay preserves last-known data on failure. No form/photo/address moves
from an unvalidated API response.
Authorized exact additions: scripts/lib/mos-annual-refresh.mjs,
scripts/refresh-annual-mos.mjs and their tests; scripts/run-sheet-sync.mjs (PA-OPS-002),
.github/workflows/sheet-sync.yml (PA-OPS-001: pass existing S3 read credentials to
sync step, serialize hot writers and archive refresh report); scripts/lib/
mos-enrolled-plan.mjs, mos-enrolled-finalize.mjs and focused tests. Generated packaged
copies of changed modules under apps/yandex-mos-sync-planner/ and
apps/yandex-mos-sync-finalizer/ may be updated through scoped copy/packaging only;
exact copy list is recorded before generation. Deploy new versions of those TWO
existing functions only, preserve all env/service-account/resource settings and
capture prior version IDs for rollback. No trigger/queue creation or new scheduler.
Current YC auth may be used in memory through configured local profile
/mnt/c/Users/Xipsin/.config/yandex-cloud/config.yaml for these scoped API operations;
never print/save its token or environment responses. If unavailable, stop that
operational gate explicitly, not work around authentication.

## Scope changes

Owner's latest ten-point approval establishes this scope, including main publication.
No unrelated work authorized. Exact-path supplements pending actual audit evidence.

### Source-resolution checkpoint, 2026-09-09

Confirmed public mos frontend asset index.2e6e6be4.js uses POST /groups/search
(read-only search, NOT subscribe/application) and GET /groups/{id}; search2535009
returned exact group К4953-26, card1014149. GET968382 returns groupК2373-26 while
several imported groups incorrectly link to it. Old843883 returnsHTTP500.
Scoped read-only POST /pgu2/activity/api/groups/search is allowed for discovery.
Add source scripts/lib/mos-annual-cards.mjs and scripts/audit-annual-mos.mjs plus tests;
generated source apps/web/content/annual-mos-refresh.generated.json is produced ONLY
by that audited fetch/validation command, not hand edits. It stores an allowlisted
public projection, identity, provenance and refresh status, no contacts/session data.
Additive annual fields studyYear and refreshedAt may be introduced at the validated
schema boundary (PA-COMPAT-003) and retained by V1/V2 consumers. Original CSV/source
hash and titles stay unchanged; live freshness is separate from archival asOf.

### Narrowed operational design

No planner/expiry changes: archived legacy groups remain reported separately and
their failures are not converted into success. Only the existing finalizer dispatch
condition changes: with its existing auto-publish flag enabled, every completed run
can refresh annual cards independently of legacy success. No new scheduler or env
setting. This avoids the existing zero-batch controller trap. Deploy ONLY finalizer.
Before Sheets overwrite, a new scripts/refresh-annual-from-published.ts reads the
current exact public S3 offers key with existing credentials, validates it, restores
newer same-identity annual values, then refreshes direct cards and writes the generated
registry. A failed baseline read stops publication; a failed individual card preserves
its last known facts/time and publishes an explicit error flag. No new private S3 key.
Add scripts/lib/mos-annual-published.mjs and focused tests; generated finalizer copy
apps/yandex-mos-sync-finalizer/mos-enrolled-finalize.mjs only (verify package layout).
Refresh reports are archived by the existing workflow, with a final failing check for
partial coverage AFTER safely publishing validated last-known plus refreshed data.

Additional UI copy path: apps/web/components/preferred-school-banner.tsx. Remove
the unconditional claim that all schools are shown: it is false with URL filters.
Keep the saved-school quick link without applying any filter automatically.
Additional safety path: apps/web/lib/offers/schedule-board.ts, compatible booking
mode guard only. An unresolved annual group identity must not offer booking to a
shared/wrong card. Keep the visible row, price and disabled explanation; ordinary
transient refresh errors with a verified direct identity remain bookable.
Test in annual-integration.test.ts. No contact form contract changes.

Additional audited compatibility path: apps/web/components/year-schedule.tsx,
carry refresh status through existing year-schedule projection and block the same
eight unverified booking identities in this older view. Add landscape dropdown
scrolling and browser regressions. These are corrections within owner scope.

## Freeze and review

NOT FROZEN. Fingerprint algorithm SHA256(sorted relative path + NUL + bytes + NUL).
ExecPlan explicitly excluded from its self-referential fingerprint. Actual path list,
hash, validation and independent APPROVE required before staging. Any source edit
invalidates prior freeze/review. Current verdict PENDING.

Local continuation checkpoint (NOT a staging/release freeze): 48 changed/new files,
excluding this ExecPlan, SHA256 97069dbd7b555817fa336ea4043f57af2e782c22dd9ba4c94722200dba840d7f.
Enumerated git diff --name-only plus git ls-files --others --exclude-standard,
sorted UTF-8 paths, hashing path NUL file bytes NUL. No changes staged.

### Latest validation / review evidence

- web annual/finder tests22/22; pipeline/cards/overlay/tier tests15/15;
  real finalizer with mocked external modules1/1 using --experimental-test-module-mocks;
  Python importer16/16. Generator --check exit0, 51groups/52slots, nonowned preserved.
- Full web check exit0 after latest UI/data safety changes: lint0errors and four
  pre-existing warnings,14public snapshots, hardcoded guard, host tests7/7, TypeScript
  and111-page build. Preview uses NEXT_PUBLIC_OFFERS_SNAPSHOT_URL=/data/offers-snapshot.json.
  S3 build verification explicitly SKIP in local-source configuration, not prod proof.
- Browser04:19 scenario groups PASS,8 scoped axe scans with zero violations,
  desktop/mobile320/390/768/1440 and landscape844x390; exact scopes, URL history/share,
  compact booking/price, mocked booking responses, old schedule guard, all three real
  school2044 images and no page overflow. No live booking submissions.
  Evidence sibling folder ../browser-04/results.json and screenshots.
- Independent UI recheck APPROVE limited to both corrected P2s: landscape menu
  last link via mouse and Tab/Enter, old annual guard. Not a frozen release review.
- Refresh reviewer found five initial and four residual preservation/identity risks.
  Corrected with all-row revision/venue guards, missing registry-entry failure,
  direct compiler restoration, explicit changed-year review gate, individual card
  validation, no null-to-CSV fallback, no false freshness, shared fail-closed booking
  error policy. Final narrow review found one further published-null resurrection;
  fixed exact null restoration, with real compiler regression. Latest15tests+1finalizer
  and compilercheck all pass. No frozen release APPROVE claimed.
- make secret-scan PASS1247files (diagnostic candidate, not staging authority).
  Both workflow YAMLs parse with uniqueKeys; packaged finalizer byte-equal to source;
  git diff --check exit0. Existing secret-scan locked deps report2high advisories;
  no dependency/lockfile upgrade attempted in this scoped task.

Failure history retained: direct node --import generator from repo root failed
tsconfig alias resolution; corrected existing tsx CLI --tsconfig command passed.
One Google Fonts fetch build failed; retry passed without source/dependency changes.
Browser01 blocked the default external S3 URL and correctly showed unavailable/0;
rebuilt with local snapshot URL. Browser03 checked lazy image before load; independent
probe verified320/1024/1024 naturalWidth, test now waits for actual image decode.
One expected-year assertion was outdated after owner/source corrections: changed
6/5/0/40 to evidence-backed33/9/2/7 and added exact school/year ID assertions.
Several apply_patch context attempts rejected before writing; corrected patches used.
Live baseline+card refresh:42/51 current successes,8 unresolved identities,1timeout;
previous good43rd card retained. No null numeric fields among43 resolved cards.
YCF list read repeatedly timed out, including direct IPv4 TLS probe; IAM credentials
were not logged and no function invocation/deployment was attempted.

## Staging/commit and final status

Authorized only after gates. Nothing staged/committed/pushed/published by this task.
Secret scan diagnostic PASS; release freeze/review still pending. Final status
incomplete; no claim of live mos success. Do not publish a partial result as the
requested complete audit/remediation. Owner main authorization is already recorded.
Next required input: confirm eight2044 replacement pairs in
docs/data/annual-schedule-audit-2026-09-09.md and years for seven875/1212 groups.
Keep all51IDs until confirmed; afterwards implement explicit aliases, regenerate
expected counts and repeat checks. API reachability is a separate operational gate.
Do not start the next task.
