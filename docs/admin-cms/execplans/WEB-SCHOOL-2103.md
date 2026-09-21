# WEB-SCHOOL-2103 — nine annual groups, two campuses, owner-confirmed price

## Metadata / objective
Status: DONE (local implementation); publication authorized by owner on 2026-09-21,
tracked separately in WEB-SCHOOL-2103-RELEASE.md. Owner request 2026-09-21: add the supplied school 2103
groups; price is 1000 RUB per academic hour / one 45-minute lesson.
Root: design-previews/schedule-audit-2026-09-09/repo, branch
fix/schedule-data-and-venues-2026-09-09, base 0dc46c5fa173e5cef228976ac61f8741d7ea3260.
This record scopes the implementation authorized by that explicit request.

## Non-goals / release boundary
No cloud synchronizer repair, teachers inferred from contact names, new UI design,
changes to other schools, secret reads, remote writes, commit, push or deployment.
Staging/commit/push: NOT AUTHORIZED. Production publication is a separate gate.

## Authorized paths and protected generation
Source: apps/web/content/annual-additions/school-2103.json (sanitized public facts),
annual-group-overrides.ts, year-integration.ts, school-profiles.ts;
scripts/import-school-2103.ts, scripts/import-year-schedule.py;
scripts/integrate-year-schedule.ts; scripts/lib/mos-annual-published.mjs;
apps/web/lib/offers/annual-schedule.ts and annual-programme-name.ts;
focused tests in apps/web/lib/offers, scripts/lib, scripts/annual-overlay-refresh.test.mjs,
scripts/school-2103-import.test.mjs, scripts/verify-school-2103-ui.mjs; this plan.
PA-GEN-001/PA-COMPAT-001..005: generator-only local output to
apps/web/content/year-schedule.generated.json, annual-mos-refresh.generated.json,
apps/web/data/offers-snapshot.json, data/v2/map-snapshot.json,
data/v2/site-manifest.json, data/v2/catalog-snapshot.json and
data/v2/detail/{shmi,it-academy,projects,olympiad-league}.json.
Only the explicit import may migrate the old source hash after checking its
preimage; normal refresh/compilation revision guards remain strict. No manual
generated-file edits. PA-BUILD-002/003: validation-only build outputs, not staged.
All workflows, cloud runtime, CMS, private fields, secrets, remote snapshots and
unrelated media are forbidden mutations. Local backups before generation.
Rollback: restore only task-owned generated files from the import backup;
no destructive git commands. Existing content preserved.

## Preflight / architecture
2026-09-21: clean worktree and git diff --check PASS. Node22.23.1/npm10.9.8 via
/home/xipsin/.nvm/versions/node/v22.23.1/bin. Root npx tried an absent package
(no install); corrected to apps/web/node_modules/@playwright/test/cli.js:1.60.0.
Baseline integrate-year-schedule.ts --check PASS (51 groups,52slots,16venues);
apps/web annual-integration.test.ts 11/11 PASS.
Source CSV -> generated source + exact mos registry -> annual compiler -> common
offers/map -> school agenda/global finder. Source hashes and identities are gated.
Public prices can be editorially corrected; raw mos price must survive restoration.
Components: product_domain; no new reusable abstraction or framework dependency.

## Audit A / B
Two read-only agents review source/refresh flow and data/UX regression risks.
Main checks their evidence; final independent frozen review remains required.
Identified: four representative links contain nine group-specific card IDs;
SHO-3 is a campus, not study year; current year parser misses underscore suffixes.
Never copy the same representative URL to sibling groups. Existing 51 preserved.

## UX / security
Same parent flow and QR scope /sites/school-2103/agenda/, two campus choices,
SHMI years1/2/3, day groups, visible booking and price. All9 slots45min.
Map uses verified building coordinates, not an inferred entrance. No new photo
is fabricated. Contact name is not confirmed as actual teacher by owner.
Only bounded public GETs to9 verified mos card IDs; no enrollment submissions.
Sanitize API responses to supported public fields; no contact phones/emails.

## Implementation / negative paths
1. Verify9 group IDs, codes, addresses, slots against owner text + live cards.
2. Store sanitized supplemental source, map second campus; deterministic import
   extends source/registry, preserves old facts and migrates hash explicitly.
3. Pin reviewed price to these exact groups, retain source price and provenance;
   refresh must not overwrite correction or restore editorial price as raw.
4. Generate and validate; test rejection of duplicate IDs/revision conflicts,
   stale overwrite, wrong campus/identity; preserve8 prior unresolved groups.
5. Desktop/mobile local browser acceptance; freeze and review; no auto-release.

## Test plan / acceptance
Commands use Node22 PATH, repo root unless noted:
- node apps/web/node_modules/tsx/dist/cli.mjs --tsconfig apps/web/tsconfig.json scripts/import-school-2103.ts --check
- same tsx command scripts/integrate-year-schedule.ts --check
- node --test scripts/school-2103-import.test.mjs scripts/annual-overlay-refresh.test.mjs scripts/lib/mos-annual-cards.test.mjs
- apps/web: node --import tsx --test lib/offers/*.test.ts
- apps/web: node node_modules/typescript/bin/tsc --noEmit --incremental false
- npm --prefix apps/web run check (network/build limitations reported, not hidden)
- PREVIEW_URL=<local> node scripts/verify-school-2103-ui.mjs
Acceptance pending:9 exact groups;2 campuses;price1000;raw888;old51 unchanged
except source revision;strong refresh guards;clean browser console/mobile reflow.

## Validation / failure history
2026-09-21 PRE-FREEZE: public web fetch of mos pages unavailable; existing public
API GET adapter succeeds. No API error bypass. Node24 default replaced with22.
Root npx --no-install playwright --version failed (wrong package context),
package-local Playwright version check subsequently passed. No dependencies installed.

## Scope changes / freeze / review / final state
Supporting exact source-composition paths: scripts/compose-school-2103.mjs,
scripts/lib/school-2103-source.mjs; existing browser regression counts updated in
scripts/verify-course-finder-ui.mjs. Same nine-group scope, no production changes.

## Validation results — 2026-09-21, Europe/Moscow
All commands below ran with Node22.23.1, target PRE-FREEZE unless noted.
- Baseline source import backup: /tmp/questhub-school2103-backup-pyPikf.
- Compiled snapshot backup: /tmp/questhub-year-data-backup-ptzOJd.
- Nine direct API GETs: exact codes/listings/addresses, slots45min, all PASS.
- tsx scripts/import-school-2103.ts --write: exit0, source60/locations10;
  source/registry/oldoffers exact bytes checked before changing revision.
- tsx scripts/import-school-2103.ts --check and integrate-year-schedule.ts
  --write / --check: exit0. Idempotent, unchanged original51 verified by semantic
  SHA256 538c6f668471025fe9cd4a4bb29d84257c9926228af23012564084eb809dcd9c
  after excluding only migrated annual.sourceSha256.
- python3 scripts/import-year-schedule.py
  /mnt/d/WORK/00_Inbox/vkcom-brainmaster/brainmaster_mosru_dataset_enriched_2026-09-08_csv.zip
  --check: exit0; original CSV + shared supplement reproduces60groups/61slots/10addresses.
- python3 -m unittest discover -s scripts -p test_import_year_schedule.py:
  exit0,16/16 PASS.
- node --test scripts/school-2103-import.test.mjs scripts/annual-overlay-refresh.test.mjs
  scripts/lib/mos-annual-cards.test.mjs: final exit0,19/19 PASS.
- apps/web: node --import tsx --test lib/offers/*.test.ts: exit0,80/80 PASS.
- apps/web: node node_modules/typescript/bin/tsc --noEmit --incremental false:
  exit0. node scripts/validate-public-snapshot.mjs: exit0.
- SITE_SNAPSHOT_SOURCE=local OFFERS_SNAPSHOT_SOURCE=local
  NEXT_PUBLIC_OFFERS_SNAPSHOT_URL=/data/offers-snapshot.json npm --prefix apps/web run check:
  exit0. Lint0errors/4pre-existing warnings; snapshots and hardcoded-data audit PASS;
  host-scope tests PASS; production static build112pages PASS. This is local
  snapshot mode, not verification of current production S3 or cloud updater.
- PREVIEW_URL=http://127.0.0.1:3197 node scripts/verify-school-2103-ui.mjs:
  exit0; /tmp/questhub-school2103-qa/report.json. Global60,school9,campuses2/7,
  SHMI2=3/SHMI3=2; compact price/booking, reload, both campus routes, mobile QR
  wizard/focus, no overflow, annual-table1000. Zero pageerrors or remote writes.
  Desktop/mobile screenshots captured; mobile visually inspected.

Failure history retained: initial offer suite78/80 (two old totals), initial
pipeline16/18 (historical fixture dates were no longer newer than the new source).
Corrected expected deltas4/3/2 and deliberately newer fixture dates, without
removing assertions; final runs above PASS. Initial newbrowser run timed out
because test used nonexistent button text; matched actual 'Посмотреть время →',
then entire run PASS. An apply_patch attempt used a nonmatching test line and
made no change; exact current line inspected before patching.

## Accepted audit findings / acceptance
Both initial auditors found raw price restoration, underscore year names,
revision consistency and old51 preservation risks; all addressed and tested.
New readers accept old snapshots; optional raw-price provenance fields are paired.
Old compiled strict annual-metadata readers do NOT accept these new fields:
publication therefore requires an explicitly coordinated code/data rollout,
not a standalone hot S3 upload. Build compatible code/routes from the reviewed
local bundle, deploy that artifact, then CAS-publish the corresponding map/manifest
and hot snapshot under an approved release plan; verify both browser/runtime versions.
Cached old clients require reload; retain complete previous code/data for rollback.
No such release executed here. Raw888 never becomes owner1000 during restoration. Existing8
unresolved card identities and incomplete cloudsync status are NOT marked fixed.
Supplement imports9 verified cards but does not claim a whole-registry successful
refresh: original attempt counters and errors remain unchanged, expected60.
Teacher remains the name explicitly supplied in mos source; owner clarification
requested asynchronously, not described as owner-confirmed.
Acceptance for local implementation: PASS. Production publication: NOT RUN.

## Freeze
HEAD: 0dc46c5fa173e5cef228976ac61f8741d7ea3260.
git diff --check PASS. All33 changed/untracked primary files frozen, plan excluded.
Algorithm SHA256(sorted relative path + NUL + bytes + NUL).
Fingerprint: abce8c64d432493610cc45768289ac2fefa6a2e7c23263f37a412915d89c124d.
First freeze invalidated by test-only corrections: full browser regression reached
site cards and failed old expected4inactive versus actual3. School2103 is now
active as requested. Updated that assertion and added explicit2103active check;
updated matching components/live-sites.test.tsx and lib/sites/map-colors.test.ts
counts and added explicit9groups/twoactivecampuses. Product/source files unchanged.
node --import tsx --test components/live-sites.test.tsx
components/schedule-board-card-compact.test.ts lib/sites/*.test.ts: exit0,13/13 PASS;
tsc --noEmit --incremental false: exit0. Broad browser rerun exit0:
26scenarios PASS, /tmp/questhub-school2103-regression-r2. It verifies gray inactive
sites, active2103, all campus routes, sharable state, mobile320/390, keyboard and
automated axe scans separately from manual visual inspection.
No edits after second freeze. Fresh independent reviewer Hume
(01a0c3e7-b99c-75a3-a24e-f17dd8ca319e) returned APPROVE, no confirmed blockers,
verified33-file fingerprint and focused +26scenario browser evidence.
Staging/commit/push NOT AUTHORIZED and not performed. Production unchanged;
next task not started. Local preview: http://127.0.0.1:3197/sites/school-2103/agenda/?view=catalogue .
Remaining gate: explicit coordinated production release; optional owner teacher
confirmation requested, current supplied portal teacher not represented as owner-confirmed.
