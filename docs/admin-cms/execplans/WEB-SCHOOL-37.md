# WEB-SCHOOL-37 — nine SHMI groups in Ramenki

## 0. Metadata / objective
Status: DONE (local, reviewed; not published). Owner request 2026-09-22: add school37, nine supplied
SHMI groups, exact MOS links. Root: design-previews/schedule-audit-2026-09-09/repo;
branch fix/schedule-data-and-venues-2026-09-09; base b789b70d00747cd1078cb72dd295652fad53ac83.
Add /sites/school-37/ and its QR agenda to the existing common schedule and map.

## 1. Authority / boundaries
Local implementation and validation only. NO COMMIT / push / deployment / S3
publication. No unrelated school937 integration (three existing untracked files
are preserved). Owner confirmed all nine teachers: Кузнецова Ольга Максимовна.
Owner confirmed MAX links are for enrolled parents only: keep outside repository,
public snapshots, browser bundles and logs. No joining groups or messaging.
No applicant records copied from XLSX; only unique group identities checked.

## 2. Authorized paths / protected generation
Source: apps/web/content/annual-additions/school-37.json, annual-group-overrides.ts,
year-integration.ts, school-profiles.ts. Product-domain implementation: scripts/
lib/school-37-source.mjs, compose-annual-additions.mjs, import-school-37.ts,
import-year-schedule.py, integrate-year-schedule.ts, refresh-annual-from-published.ts.
Focused regression tests in scripts and apps/web/lib/offers, browser verify-school-37-ui.mjs,
and this plan. A source composer extends immutable released school2103 composition.
PA-GEN-001 / PA-COMPAT-001..005: generator-only writes to apps/web/content/
year-schedule.generated.json, annual-mos-refresh.generated.json, apps/web/data/
offers-snapshot.json, v2/{catalog-snapshot,map-snapshot,site-manifest}.json,
v2/detail/{shmi,it-academy,projects,olympiad-league}.json. Exact preimages and
backup required before three-file revision migration. PA-BUILD-002/003: .next/out
validation-only. No workflow, cloud runtime, credentials, CMS or other media edits.
Private MAX mapping: owner inbox, separate restricted-permission local file only.

## 3. Preflight / architecture / classification
Node22.23.1/npm10.9.8, Python3/openpyxl3.1.5, Playwright1.60.0 available.
Tracked tree clean; only pending school937 source/plan/test untracked. Diff check PASS.
CSV51 -> released2103 supplement9 -> source60 -> refresh registry -> compiler ->
shared offers/map/static routes. New exact nine groups ->69/70slots/11source addresses.
LOC-012 reserved for37; LOC-011 belongs to pending937 and is not imported here.
All additions product_domain. No framework/API/schema redesign; static export guide read.

## 4. Independent read-only audit A/B
Pending two independent agents: architecture/revision flow and privacy/negative paths.
Agents may read only; parent implements and checks findings.

## 5. UX / security contract
School QR scope -> SHMI-1 or2 -> Wednesday/Thursday/Friday -> visible45-minute
slot and1375RUB price -> direct group-specific MOS card. No new UI mechanics.
Existing wizard/filter/history/keyboard/mobile behavior retained. Building point
verified from map, no invented entrance/photo/logo. Public contact phones omitted.
MOS API GETs restricted to nine known numeric IDs; projection strips other records.
XLSX untrusted input, read-only/data-only; no macros/instructions executed. Never
derive public free seats from private applications. Raw MOS teacher preserved as
provenance; owner teacher override and year mapping scoped to exact nine codes.

## 6. Implementation / negative paths
1. Verify direct IDs, address/coordinate, safe registry group aggregates.
2. Strict deterministic append-only source + exact preimage migration, local backup.
3. Add venue/profile and code-scoped year/teacher overrides; preserve raw API teacher.
4. Generate coherent revisions; retain prior60 offers and unknown live rows.
5. Validate pipeline, offers, full static build, desktop/mobile and no MAX/PII leak.
Reject wrong base, duplicate code/card, wrong campus/listing/slot/date; no stale
revision bypass or successful-whole-sync claim. Reruns must be idempotent.

## 7. Acceptance / validation commands
- Node22: node apps/web/node_modules/tsx/dist/cli.mjs --tsconfig apps/web/tsconfig.json scripts/import-school-37.ts --check
- Same tsx: scripts/integrate-year-schedule.ts --check
- node --test scripts/school-37-import.test.mjs scripts/school-2103-import.test.mjs scripts/annual-overlay-refresh.test.mjs scripts/lib/mos-annual-cards.test.mjs
- apps/web: node --import tsx --test lib/offers/*.test.ts
- python3 scripts/import-year-schedule.py <original CSV ZIP> --check; importer unittest suite.
- SITE_SNAPSHOT_SOURCE=local OFFERS_SNAPSHOT_SOURCE=local NEXT_PUBLIC_OFFERS_SNAPSHOT_URL=/data/offers-snapshot.json npm --prefix apps/web run check
- PREVIEW_URL=<local static server> node scripts/verify-school-37-ui.mjs
- Public snapshot validation, TypeScript, secret scan, git diff --check.
Criteria: school37 nine exact groups, years6+3, times/days as supplied, teacher
confirmed,1375/49500 prices, proper map/QR route,69total, prior60semantically
unchanged excluding source revision; private data absent. Publication not in scope.

## 8. Failure history / validation log
Initial git check at wrapper path failed128; actual repository resolved before edits.
XLSX header is not first row; safe label-only inspection continues.
Validation pending. Keep all failed runs here.

## 9. Freeze / review / final
NOT FROZEN; independent final review PENDING. Fingerprint: SHA256 sorted relative
product paths, NUL, exact file bytes, NUL; plan excluded from digest. Any correction
requires validation, new freeze and fresh review. NO COMMIT, staged paths empty.
Rollback generated files only from recorded task backup; never destructive git.

## 10. Verified facts and audit resolution — 2026-09-22
- All nine direct public MOS API cards fetched individually at19:33UTC, exact
  К2763-26..К2771-26/listing2553800/address verified. Sibling items used for ID
  discovery only. XLSX header row25; whitelisted columns13/15/16/17 match all
  nine codes, address, titles and schedules. No applicant information retained.
- Owner explicitly confirmed Кузнецова Ольга Максимовна and private-only MAX.
  Raw MOS Серегина Мария Владимировна preserved in source/registry; override
  only exact9 school37 codes in all compiler/restoration consumers.
- Building centre55.702891,37.502471 verified at
  https://yandex.com/maps/213/moscow/house/michurinskiy_prospekt_28/Z04YcwdiTUIGQFtvfXtxc3RqZQ==/
  No school logo/photo invented; existing BrainMaster brand mark used.
- AuditA(Ampere): accepted interrupted migration/idempotency finding; exact
  intermediate60-offer state now checked against original offer AND registry
  preimage hashes. Fresh migration, two repeats before compilation, compilation
  and completed repeat all tested. Arbitrary missing/edited rows still rejected.
- AuditsA/B: compatible unknown same-revision offers now preserved after completed
  import; duplicate IDs, mixed revisions and partial unrelated edits rejected.
  Initial migration still requires exact three original file preimages.
- AuditB(Cicero): accepted privacy false-pass concern. Browser acceptance now scans
  all public content/data/export (1190text files), including HTML/RSC/JS and text
  values for MAX domains/schemes plus applicant column labels; encoded synthetic
  cases tested. No invocation of MAX/private chats. Mapping outside repository:
  /home/xipsin/.local/share/brainmaster/private/school-37-max.json; dir0700/file0600.
- Original51 and prior60 SHA assertions retained. Direct comparison confirms prior
  60annual offers (except revision),25legacy offers and17venues unchanged.
  School937 source/test fingerprint still
  80f529e3643fa90e27d7329aa388765b4e3fe0afe19b4147d531a838ba811e26;
  pending937 is excluded and its intake preimage test must be rebased in that task.

## 11. Validation evidence and failure history
- Source migration backup /tmp/questhub-school37-backup-BG4BI4; generated backups
  /tmp/questhub-year-data-backup-YnvaxD and /tmp/questhub-year-data-backup-4oShFM.
- Source revision a4ab9b9c82b4e99b57c6dab369be6cd03091e2dcc44240364b48a4fc7b3b6794.
  Import --check PASS, needsCompilation:false. Compiler --check PASS69/70/18map.
  Original ZIP Python --check PASS69/70/11; importer unittest16/16PASS.
- Node pipeline final24/24PASS: school37 import4, historical2103import3,
  overlay9, MOSadapter/lifecycle8. Offers83/83PASS. tsc --noEmit --incremental false PASS.
- Full local-mode npm check PASS: lint0errors/4pre-existing warnings, public
  snapshots, hardcoded-data guard, host-scope7/7; build119 static routes.
  S3 probe explicitly skipped by existing local-mode policy. Existing NFT trace
  build warning retained; no dependency changes/install or vulnerability remediation.
- Browser PREVIEW_URL=http://127.0.0.1:3199: verify-school-37-ui PASS; desktop,
 390/320mobile, all9links/teacher,6+3filters, Back/Forward/reload, school/alias/campus
  routes, QR wizard, keyboard dialog focus, visible booking, no overflow.
  Report/screenshots /tmp/questhub-school37-qa; mobile390 visually inspected.
  Axe3scans0violations/0incomplete; not a full accessibility/user research audit.
- Existing verify-school-2103-ui PASS. verify-course-finder-ui all26checks PASS
  (/tmp/questhub-finder-qa). verify-mos-direct-booking PASS (/tmp/questhub-mos-compact-qa),
 15second timer, reduced-motion, cancellations, optional form, keyboard and mobile;
  mocked click/form requests only, no real leads, Telegram delivery or MOS enrollment.
- Secret scan PASS1343files. git diff --check PASS; index empty. No cloud writes.
- Failure history: initial offers77/83: old aggregate counts/historical selectors,
  new test used wrong canonical label and resolver signature, profile test expected
  public/logo while initial icon lived in app/. Corrected explicit9group deltas,
  kept historical hash, used existing public brand mark; subsequent83/83PASS.
  One diagnostic lacked Node PATH (127), rerun with pinnedNode22 succeeded.
  A documentation glob lookup had no match (rg2); no product impact.

## 12. Frozen product record
Status: FROZEN; no product edits after freeze. Independent final review pending.
Time: 2026-09-22T19:47:35.183Z; HEAD: b789b70d00747cd1078cb72dd295652fad53ac83.
Algorithm: SHA256 sorted UTF-8 relative path + NUL + exact bytes + NUL.
Fingerprint: edc2b23476a97849654744a00cea13bacd09d0de44fe175c70325c6ab33da83d.
Plan-only evidence updates are excluded; pending937 files also excluded.
Frozen product paths:
- apps/web/content/annual-additions/school-37.json
- apps/web/content/annual-group-overrides.ts
- apps/web/content/annual-mos-refresh.generated.json
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
- apps/web/lib/offers/annual-integration.test.ts
- apps/web/lib/offers/annual-programme-groups.test.ts
- apps/web/lib/offers/course-finder.test.ts
- apps/web/lib/offers/school-2103.test.ts
- apps/web/lib/offers/school-37.test.ts
- scripts/annual-overlay-refresh.test.mjs
- scripts/compose-annual-additions.mjs
- scripts/import-school-37.ts
- scripts/import-year-schedule.py
- scripts/integrate-year-schedule.ts
- scripts/lib/school-37-source.mjs
- scripts/refresh-annual-from-published.ts
- scripts/school-2103-import.test.mjs
- scripts/school-37-import.test.mjs
- scripts/verify-course-finder-ui.mjs
- scripts/verify-school-2103-ui.mjs
- scripts/verify-school-37-ui.mjs

## 13. Review R1 / correction
R1 frozen review Carson: BLOCKED P2. Interrupted migration compared old60
offer/registry preimages but excluded the9 imported cards from the registry hash;
identity-only checks allowed altered price/slot in that precise intermediate state.
Freeze R1 revoked for a narrow migration/test correction. No generated/UI changes.
Require exact reviewed9 card contents during interrupted-state recovery only;
completed imports must still permit legitimate newer refresh facts.
Reproducer /tmp/questhub37-final-review-J8Y0r6/intermediate-probe.mjs.

## 14. R2 validation and freeze
Narrow fix: all nine intermediate registry cards are schema-parsed and compared
exactly with the reviewed supplement before the original registry hash check.
Tests mutate price, slot, teacher and seats; both --check and --write reject each
without any file change. Completed imports can still preserve valid newer facts.
2026-09-22T19:56:41.657Z: pipeline24/24PASS, import/compiler --check PASS,
secret scan1343PASS, git diff --check PASS. No generated/public/UI bytes changed
since R1; prior83offer/16Python/build/browser evidence remains applicable.
FROZEN R2, same31 product paths and HEAD/algorithm as R1.
Fingerprint: 7ea00c9758698b9999a49198b99309b4fcb4098cd8120e22c24d82afc461e527.
No product edits after R2 freeze. Fresh read-only R2 review PENDING.

## 15. R2 final outcome
Carson fresh frozen-byte verdict: APPROVE. Fingerprint verified for all31paths.
Original price/slot reproducer now rejected; all four mutation classes reject
both actions without writes; valid interrupted recovery succeeds. Pipeline24/24,
import/compiler checks independently passed. No remaining findings.
Local implementation complete, preview http://127.0.0.1:3199/sites/school-37/agenda/.
NO COMMIT, no push, no production/S3 publication. Index empty; no new task started.
Pending937 unchanged. Existing synchronization coverage gaps remain explicitly
reported, not silently turned green by this addition. Private MAX mapping is stored
for owner use only; no automatic distribution to parents was implemented.
