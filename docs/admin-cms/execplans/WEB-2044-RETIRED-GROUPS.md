# WEB-2044-RETIRED-GROUPS — owner-confirmed removal

## Authority / preflight
Repository Brain-Master/BM_QuestHub; root `/home/xipsin/projects/BM_QuestHub/design-previews/schedule-audit-2026-09-09/repo`; branch `fix/schedule-data-and-venues-2026-09-09`; expected HEAD `b789b70d00747cd1078cb72dd295652fad53ac83`. Full preflight succeeded 2026-09-23, Node22.23.1/npm10.9.8, index empty, existing dirty work preserved. Root AGENTS/PLANS and protected registry apply; Next static-export guide read. NO COMMIT.

## Objective / non-goals
Owner confirms MOS listings2548561,2549843,2549844,2549845 at school2044 removed. Persist this fact in a single public-safe domain rule, exclude their requests from both refresh pipelines, mark their generated offers archived so ordinary schedules/facets omit them without deleting history. Keep school875 unchanged, including its last-good timetable. No changes to eight unresolved aliases, teachers, capacities, private workbook, credentials, cloud/timers, main, deployment or other projects. Earlier five-minute operational task remains separate and incomplete.

## Paths / protected operations
Parent writes only this plan; new `apps/web/content/annual-retirements.mjs`; `scripts/lib/mos-group-lifecycle.mjs`; `scripts/integrate-year-schedule.ts`; `apps/web/lib/offers/schedule-board.ts`; `apps/web/lib/year-schedule.ts`; `apps/web/lib/offers/mos-availability.ts`; focused tests `scripts/lib/annual-retirements.test.mjs`, `apps/web/lib/offers/annual-retirements.test.ts`, `apps/web/lib/offers/course-finder.test.ts`, `apps/web/lib/offers/annual-integration.test.ts`, `apps/web/lib/offers/school-2103.test.ts`. Existing unrelated edits remain intact.
PA-GEN-001 / PA-COMPAT-003: generate ONLY `apps/web/data/offers-snapshot.json` via `node --import tsx ../../scripts/integrate-year-schedule.ts --write --tier=hot` from apps/web. Preserve every offer except four exact `scheduleCard.isArchived=true` additions; raw source/registry/cold/map/catalog/manifest stay byte-identical. PA-BUILD-002/003: local check/build only, never stage. PA-COMPAT-007: existing archival presentation; no new design. Stale incoming hot snapshots must not resurrect the four; status and annual projection apply same rule. Use exact listing IDs, not name or group-code guessing. No direct public S3 mutation.

## Architecture / UX / safety
Classification product_domain. Public immutable owner decision in content, consumed by generator, pure schedule status, annual table, availability merge and shared MOS lifecycle. No Node-only dependencies in browser module. Raw historical facts remain recoverable. Closed admission/zero seats are NOT removal. Failed HTTP alone never retires a group. Parent verifies auditor findings. Snapshot dates do not claim a fresh MOS read. No secret or personal fields copied. No new network requests needed for owner-confirmed removals.

## Execution / validation
1. Two independent readonly audits (architecture and failure/test risks) in parallel while parent captures preservation baseline.
2. Implement single retirement rule and consumers; generator hot-only; exact preservation assertion and generator drift check.
3. Node22 tests: `node --experimental-test-module-mocks --test scripts/lib/annual-retirements.test.mjs scripts/lib/mos-live-capacity*.test.mjs scripts/lib/mos-annual-cards.test.mjs scripts/lib/mos-group-lifecycle.test.mjs`; apps/web `node --import tsx --test lib/offers/*.test.ts lib/sites/*.test.ts`.
4. `SITE_SNAPSHOT_SOURCE=local OFFERS_SNAPSHOT_SOURCE=local NEXT_PUBLIC_OFFERS_SNAPSHOT_URL=/data/offers-snapshot.json NEXT_PUBLIC_SITE_URL=https://b-master.pro npm --prefix apps/web run check`; local browser smoke school2044/catalogue: Friday169B removed, existing Wednesday groups remain, school875 remains. No enrollment/write requests.
5. `git diff --check`, `make secret-scan`; freeze changed task paths using sorted relative path+NUL+bytes+NUL SHA256 (exclude self-referential plan); fresh readonly reviewer APPROVE; no staging/push. Report local versus production honestly.

## Acceptance / negative paths / rollback
Pending: four archived in generated output; not selectable in ordinary filters or annual table; old snapshot still archived and cannot book; no MOS fetch for any four; unknown capacity/full other groups not retired; school875 and all unrelated offers byte-equal; generator cannot reactivate them. Keep direct-link historical state explanatory/disabled. Rollback only this task's exact hunks and regenerate hot from restored rule, never reset dirty files. Stop on changed HEAD/branch, unexplained concurrent edits, baseline failure, review finding, scope expansion or secret exposure.

## Audit / validation / failures / freeze / final
Status IMPLEMENTING. Read-only exploratory lookups `active-shifts.ts`, `booking-mode.ts`, `merge-offers.test.ts` were absent; actual boundaries found with rg. Baselines: web119 tests and runtime24 passed. Preservation baseline `/tmp/questhub-2044-retirement-fmw49f/offers.json`.

Audit A Godel 01a0ceec-a8b0-77d3-9855-ae822c893987 and B Popper 01a0ceec-afdb-7b62-b6a3-d1b6201cfb16 completed read-only. Accepted: stale snapshots need independent retirement guard; cancelled display/booking precede closed/review; annual projection filters before facets; both refreshes skip before fetch; availability retains original retired row; exact baseline comparison mandatory.

Scope correction before implementation: leave `scripts/lib/mos-group-lifecycle.mjs` unchanged because it is copied flat into old runtime packages. Instead authorize exact `scripts/lib/mos-annual-refresh.mjs` and `scripts/lib/mos-live-capacity.ts` for the retirement guard in the two annual pipelines. No legacy cloud deployment or copier changes. All other scope unchanged. Source/registry/cold hashes captured in tool output; full byte equality checked after generation. Staging NOT AUTHORIZED. NO COMMIT.

## Validation and freeze — 2026-09-23T15:47:20Z
All commands in repository root unless noted; Node22 PATH as preflight. Target PRE-FREEZE, unchanged bytes subsequently frozen below.
- Hot generator --write then --check from apps/web: exit0,69 retained annual records. Exact baseline comparison against `/tmp/questhub-2044-retirement-fmw49f/offers.json`: ONLY four `scheduleCard.isArchived=true` additions; every other field/record and generatedAt unchanged. Generator recovery backup `/tmp/questhub-year-data-backup-gTDkEk`.
- Source SHA256101f89158a7310f4adc798a287b6f2711fa073c042da77490cce8c66e170bc68; raw registry2e38a2a0bbc8431cc7364db62d9b8145b621f6e6df2a4397b87ca634e4a50c65; catalogue6b5d626f8f4d7d460b7e630b6a34933f62ad37f8e1a45c511062bcec680ada7a; map e74228cb176e87218e0f35470dd78710406f6c9c01d352abc276a674562393b3; manifest565a9da33368f259dca2426cf72e1debc4656e83510ceb051b29e9cbcc0eeabf. All match preflight.
- `node --experimental-test-module-mocks --test --test-reporter=spec scripts/lib/annual-retirements.test.mjs scripts/lib/mos-live-capacity*.test.mjs scripts/lib/mos-annual-cards.test.mjs scripts/lib/mos-group-lifecycle.test.mjs`: exit0,27 tests.
- apps/web `node --import tsx --test --test-reporter=dot lib/offers/*.test.ts lib/sites/*.test.ts`: exit0,121 tests.
- `node --test --test-reporter=dot scripts/annual-overlay-refresh.test.mjs scripts/refresh-annual-selection.test.mjs`: exit0,18 tests.
- Full web check from plan: exit0,120 static routes;4 existing lint warnings and NFT tracing warning; S3 probe SKIPPED(local), not production verification.
- Package-only `node scripts/deploy-mos-live-capacity.mjs --package`: exit0, `/tmp/questhub-mos-capacity-package-wYxW9y`, no cloud operation.
- `make secret-scan`: exit0,PASS1436 files. `git diff --check`: exit0. Index empty.
- Browser smoke inline Node/Playwright at127.0.0.1:3199:10checks at1440/390px; old pre-retirement snapshot deliberately served via intercepted HTTP; total65, school2044=19,169B=2, school875=1. All four absent in ordinary schedules; explicit historical selection visible as cancelled, no book button. No JS errors, writes or horizontal overflow. No new a11y/design claim (existing layout unchanged). Initial curl exit7: local3199 was not running; started owned `python3 -m http.server 3199 --bind 127.0.0.1 --directory .../apps/web/out` (session39960), then browser checks passed. Preview intentionally left available; new build removed earlier ephemeral availability file, so this preview does not claim live seat updates.

FROZEN13 task files, SHA256 `cd306ef2eababc080571b95bcb93b45ecc03b418c3a112b41a9e721293d44d07`, algorithm sorted relative path+NUL+bytes+NUL. No edits after freeze; self-referential plan and unrelated work excluded.
1. apps/web/content/annual-retirements.mjs
2. apps/web/data/offers-snapshot.json
3. apps/web/lib/offers/annual-integration.test.ts
4. apps/web/lib/offers/annual-retirements.test.ts
5. apps/web/lib/offers/course-finder.test.ts
6. apps/web/lib/offers/mos-availability.ts
7. apps/web/lib/offers/schedule-board.ts
8. apps/web/lib/offers/school-2103.test.ts
9. apps/web/lib/year-schedule.ts
10. scripts/integrate-year-schedule.ts
11. scripts/lib/annual-retirements.test.mjs
12. scripts/lib/mos-annual-refresh.mjs
13. scripts/lib/mos-live-capacity.ts

Status IN_REVIEW. Production/cloud unchanged, automatic synchronization still not activated. NO COMMIT/no push. No private data or unrelated cleanup. Only this bounded owner-confirmed correction pursued.

2026-09-23T15:48:20Z–15:48:37Z, frozen code: readonly `node scripts/sync-mos-live-capacity.mjs` exit2 (honest partial result), published-old-source56current/29archived,46verified. Four retired groups excluded despite old published flags. Remaining10errors: eight known unresolved search identities, school875 schedule mismatch (owner says retain current local data), one MOS_TIMEOUT for school2103 К3016-26. No retry to manufacture a pass, no data/cloud writes. This live partial result does not fail the bounded retirement acceptance; it does mean global synchronization remains incomplete.

## Independent final review / final status
Boyle `01a0cef3-e4cd-7322-bbfb-4d52d802ee19`: **APPROVE**, no blocking findings. Independently verified all13 frozen paths/hash, exact four archive-flag changes against baseline, school875/every other field preservation,27runtime and30focused domain/integration tests. Verified old-hot guards, no retired MOS requests/booking and distinction from closed admission. No edits/network/secret reads/Git writes by reviewer.

DONE for this bounded local retirement correction only. All retirement acceptance checks PASS; global five-minute synchronization remains incomplete and inactive. Worktree intentionally dirty, index empty; no commit/push/cloud/production release. Parent preview3199 available. Prior concurrent work and private dataset untouched. No next task started.

Do not push.
Do not start the next task.
