# WEB-YEAR-RELEASE-01 — annual pages verification and checkpoint

## Authority and metadata
Owner explicitly authorized fixing the reported validation failures, committing only the annual-page slice, pushing the current branch, then proceeding to the separately requested shared-data integration. Base: `60d8614546dad83921e634670da9a3d6ea4c868e`; branch: `cms/m2-01-app-shell`; repository: Brain-Master/BM_QuestHub. Started 2026-09-08. Status: IMPLEMENTING.

## Objective and boundaries
Verify and checkpoint the existing annual-course pages and dated CSV preview, without claiming shared-map/S3 integration. Do not change application contracts to silence tests. Preserve unrelated working changes and exclude the pre-existing offers-snapshot change. No merge, deployment, S3 writes, workflow changes, or dependency upgrades. Owner authorized the existing dirty baseline and correction of failing checks; CRLF-only changes are excluded from the candidate.

## Authorized paths and operations
Annual routes under apps/web/app/year-courses, annual components/content/lib, existing entry links in app/page.tsx, app/agenda/page.tsx, components/site-header.tsx and components/portal-hero.tsx; scripts/import-year-schedule.py, test_import_year_schedule.py, prepare-year-course-media.mjs, verify-year-course-ui.mjs, verify-year-schedule-ui.mjs; docs/data/year-schedule-import.md, docs/design/year-courses-20260908, this record; existing annual editorial public assets. Correct only test fixtures reported by TypeScript in apps/web/components, e2e, lib/data, lib/media, lib/offers. Stage exact reviewed paths only. Protected public compatibility PA-COMPAT-007: preserve existing routes, add annual entry points, verify consumer smoke. Existing generated annual projection is checked using the original importer, not hand edited. No mutation/staging of apps/web/data/**, secret/**, deployment scripts or workflows. Build/cache outputs are validation-only and never staged.

## Preflight and current architecture
Node 22.23.1/npm 10.9.8. 953 modified/untracked paths; 786/790 tracked modifications have equal added/deleted counts. Ignoring EOL reveals only four entry-point changes and an unrelated offers-snapshot change. Index initially empty. Global whitespace gate fails before this task, including after CRLF allowance. Owner approved scoped checks. Global TypeScript currently fails in existing test fixtures; importer has 16 passing tests. Existing annual JSON remains a dated independent preview; common-catalog integration is subsequent work.

## Audit A — architecture (parent read-only)
Tests construct schema output types without required defaults/transformed properties. Fix test inputs by parsing production schemas, not weakening schemas or adding casts. Existing annual code is additive and must not absorb unrelated offers changes.

## Audit B — security and acceptance (parent read-only)
No external writes in browser acceptance. No source applications or credential files in candidate. Secret scan required before stage and after final candidate assembly. Token use, if required, is limited to owner-named file and GitHub authentication with no content output. No claim that dated mos.ru status is live.

## Classification and UX
product_domain: annual catalogue and schedule preview; test corrections remain tests. Preserve source-date labels, missing-data semantics, both weekly slots, keyboard controls and narrow-screen reflow. No auth/save/publication boundary change; imported URLs are allowlisted.

## Execution and validation
1. Repair fixtures and environment mocking without removing assertions.
2. Run TypeScript, affected tests, importer drift/unit checks, lint, snapshot validator and annual browser scripts.
3. Review exact candidate, run make secret-scan, stage exact paths, verify staged whitespace and content, commit and push current branch without force.
4. Record verification and remote commit evidence. Then begin separately authorized shared integration.

Commands: node apps/web/node_modules/typescript/bin/tsc --noEmit --incremental false -p apps/web/tsconfig.json; python3 -m unittest discover -s scripts -p test_import_year_schedule.py; importer --check with original archive; npm --prefix apps/web run lint; npm --prefix apps/web run validate:snapshots; node scripts/verify-year-course-ui.mjs; node scripts/verify-year-schedule-ui.mjs; make secret-scan. Tests use Node 22 and installed Linux runtime where available. No downloads of executable code without inspection.

## Acceptance and negative paths
Pending: clean TypeScript; preserved/asserted schema behavior; importer tests and drift; annual browser routes/media/filter checks; no unrelated staged paths; secret scan; remote SHA matches pushed commit. Stop for new authority needs, secrets, unexplained overlap, or failed acceptance outside authorized repairs. No empty-results or skipped-check success claims.

## Failure history / validation log
2026-09-08 PRE-FREEZE: original global TypeScript exit 2, missing fixture defaults/format, readonly NODE_ENV assignment and tuple mismatch. Baseline failure retained; fix authorized by owner. Importer unittest: exit 0, 16 tests. No implementation edits preceded this record.

## Freeze, review and release
Commit authorized: feat(web): add annual course pages and dated schedule preview. Push current branch authorized; merge/deploy forbidden. Final fingerprint and release evidence pending. No staging yet.

## Validation update — 2026-09-08, PRE-FREEZE
- TypeScript: PASS (exit 0), complete web project, incremental disabled.
- ESLint: npm wrapper failed exit 127 because the copied executable lacks Linux execute permission. Direct `node node_modules/eslint/bin/eslint.js .` runs the identical installed version: exit 0, four pre-existing unused-variable warnings, no errors.
- Native runtime: tests initially failed on Windows-only esbuild/sharp dependencies. Installed only matching optional Linux binaries into /tmp/questhub-release-runtime-dCQ2Nf, ignore-scripts enabled; no repository dependency/lock changes. ESBUILD_BINARY_PATH and NODE_PATH point to that runtime.
- Targeted Node tests (five edited test files): 19/19 PASS, exit 0.
- Playwright data tests (city cards, map projection, schedule board, site config): initially 28/32. Three failures caused by real clock usage in CTA helpers; tests now use a reset-after-each fake Date. One failure assumed an obsolete placeholder classification from mutable real media manifest. Added an explicit-manifest coalescer and optional media-resolver dependency in buildScheduleBoardItem (same default production behavior), then supplied the synthetic placeholder fixture. These two narrow runtime paths are included under owner-authorized validation repairs. Final data run: 32/32 PASS, exit 0. Assertions retained.
- CSV importer --check: PASS; 51 groups/52 slots/8 addresses, source hash unchanged. Python unittest: 16/16 PASS.
- validate-public-snapshot.mjs and audit-hardcoded-data.mjs: PASS.
- Browser scripts on development preview: annual pages 21 scenarios PASS; schedule 7 scenarios PASS. New screenshots in /tmp/questhub-year-release-pages and /tmp/questhub-year-release-schedule; mobile screenshot inspected.
- Isolated release build: git archive HEAD plus the 71 explicitly selected files, excluding unrelated worktree offers changes, in /tmp/questhub-release-build-YeStwa. Direct Next 16.2.6 webpack production export with local snapshot sources: exit 0, 83/83 static pages generated. Includes all six annual routes. No secrets/env files copied. Existing preview untouched. This checks local static export, not production services/S3 publication.
- make secret-scan: PASS, 1337 files before final documentation update; repeat at freeze.

## Parent review
Audit A: isolated build proves the candidate does not depend on unrelated modified offers data. Schema fixtures pass through existing validators; explicit shift IDs distinguish independent shifts. No skipped assertions.
Audit B: imported application data remains excluded, dated availability notice remains visible, known placeholder behavior tested with synthetic manifest, real-image path preserved by default resolver. No auth/deploy/S3 changes. The newly injected media resolver is an optional testability parameter, not a public data-contract change. Approval pending final static browser check and frozen candidate scan; this is parent review, not independent external approval.

## Final acceptance before staging
Static export served from 127.0.0.1:3190: both original browser scripts PASS (7 schedule scenarios and 21 annual-page scenarios), external requests blocked. Candidate-only CRLF normalization applied as formatting; scoped git diff --check PASS; repeated whole-project TypeScript PASS. Secret scan repeated PASS after validation update. No build output or unrelated offers changes in candidate. Parent final review: APPROVE for the annual-page checkpoint, not for shared-data integration or production release. No subagent tool available; two parent passes are explicitly not independent external review.

Freeze algorithm: SHA-256 over sorted relative path + NUL + exact file bytes + NUL for the 71 enumerated candidate paths. Exact digest and staged/remote readback are recorded in task tool evidence to avoid a self-referential hash in this file. No source edits after this record before commit; any edit requires revalidation. Commit/push execution and final SHA remain tool-evidence events after this record. Integration starts only after successful checkpoint push. Existing historical QA reports describe their own earlier runs; the current results above supersede their baseline-failure status.

Staging verification correction: first byte comparison hit Node's default 1 MB subprocess output limit on the 2.1 MB video (ENOBUFS), not corrupt media; use a bounded 16 MB buffer. Staged whitespace additionally detected extra EOF blank lines in newly added files (not visible in unstaged git diff for untracked files). Removed only extra EOF blank lines; previous freeze invalidated. Repeat scoped checks and fingerprint before commit. No assertions/content changed by this formatting correction.
