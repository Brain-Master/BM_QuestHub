# WEB-POLISH-RELEASE-2026-09-25

## Task Packet / authority / objective

Status: PLANNING. Owner: «Давай обновим сайт» after the reviewed local polish delivery and explicit release question. Publish that exact candidate on b-master.pro via normal feature push, PR, green checks, main merge and existing Timeweb auto-deploy; verify actual public output. This owner instruction supersedes the preceding NO COMMIT/no-push boundary for this release only.

Repository Brain-Master/BM_QuestHub; authorized branch `fix/schedule-data-and-venues-2026-09-09`; base HEAD `bbc7b274aa371b2d5dd0a9df2fe4b8e24d063290`. Live main verified `26be9a0b6892082265a633037616a2380f9d467f`. Commit: `fix(web): publish audited schedule and registration polish`. No force push, reset, branch-protection bypass or unrelated PR merge.

## Scope / non-goals / protected overrides

Stage exactly42 product files from `/home/xipsin/projects/BM_QuestHub/reports/site-polish-2026-09-24/candidate-manifest.json`, plus the previous `WEB-AUDIT-POLISH-2026-09-24.md` execution record and this release plan. Product fingerprint must remain `42debaed827f86defb8fe6eb2553a8b83445e8423edc293af716b5669170ce65`. No product edits without returning to implementation/validation/review. Preserve65 earlier untracked files, especially `services/` and operational capacity-handler/helpers.

PA-GEN-001 / PA-COMPAT-003: stage reviewed generator-produced `apps/web/data/offers-snapshot.json`, no manual edit; generator `--check --tier=hot` and schema validation mandatory. PA-GEN-003: back up and conditionally PUT **only** external `data/offers-snapshot.json` in the existing public bm-questhub bucket after exact live baseline/ETag validation. Preserve ACL/cache/type/metadata, no deletes or other prefixes. Other seven cold snapshot objects are read-only checks for non-interference, not publication targets. No actual raw MOS schedule/teacher changes (875 still unconfirmed).

PA-COMPAT-007: publish previously approved compatible UI/aliases/SEO. PA-BUILD-002/003: build outputs validation-only, never stage. PA-OPS-001 operational pause/resume existing Sheet sync279541681 and Mos enrolled282599547 only if needed for a safe hot cutover; restore each original state, do not enable an originally disabled workflow. PA-OPS-010: inspect app195536/main and observe existing deployment; trigger an exact-SHA redeploy only if auto-deploy does not start, after checking no active deployment. Do not change Timeweb env/build modes/domain/config in this release without separately recording necessary exact operation. No workflow/source/deploy-script edits and no broad S3 publisher.

PA-SECRET-001/002: owner-provided credentials may be consumed in isolated process memory for this authorized GitHub/Timeweb/S3 release. Existing gh auth first; fallback exact previously supplied `/mnt/d/WORK/01_Active_Projects/BM_QuestHub/secret/github.token`. Existing `/mnt/d/WORK/01_Active_Projects/BM_QuestHub/scripts/timeweb.env` and `/home/xipsin/projects/BM_QuestHub/BM_QuestHub/scripts/s3.env` metadata checked. Never output contents/values/headers/full API config, change credentials, copy secrets into candidate, or commit them. Read-only availability diagnosis does not imply deployment of the unreviewed cloud handler or switching controller/YMQ responsibilities. Production 404 routing and durable backend journal remain separately bounded work; report them honestly.

## Preflight / architecture / UX / security

2026-09-25 Europe/Moscow: pwd/root/branch/HEAD/log10/status/diff-check inspected, unchanged reviewed42 candidate + two plans, index empty, earlier untracked work preserved. Node22.23.1/npm10.9.8 explicitly selected. Root AGENTS/PLANS/protected registry/secret-scan/template read. Remote main matches previous release; public availability404 and missing-route200 reconfirmed before release. Inspection of older helper paths found an expired temp directory; current previous release helper discovered, not executed for writes.

Product_domain release: source→validated hot offers→S3/static Next→browser selectors. New code can consume the existing hot shape; no cold data change. Deduplication is exact reviewed alias map, not capacity/time-based guessing. One atomic hot-object PUT, not a whole-bucket transaction. UI remains read-only except real user form submissions; live QA blocks all POST/departures and never sends test enrolments. Least-scope credentials and sanitized operational outputs. CAS/expected-main/config guards detect concurrent edits. Do not overwrite updated live source facts with an older local snapshot.

## Steps and exact validation

1. Read-only A/B release audits, fresh42hash equality, remote main/branch/tree and Timeweb target/deploy proof, public hot/cold baseline comparison.
2. `make secret-scan`; in apps/web Node22 `node --import tsx --test lib/offers/*.test.ts lib/lead-delivery.test.ts`; `node --import tsx ../../scripts/integrate-year-schedule.ts --check --tier=hot`; `npm run check` with explicit local sources/public site URL. Previous browser evidence33scans/11areas and independent A+B APPROVE remain bound to42hash; refresh staged gates.
3. Operational helper in a new task-owned0700 temp directory: read-only status/backup first; exact one-key conditional publish, original workflow states, no config edits. Independent review before any external mutations.
4. Explicit44-path staging only after secret-scan/review. Cached diff-check and blob/hash parity; staged tests. One Conventional Commit, normal push existing branch, PR create/attach, inspect required checks and merge only exacthead. No autodelete branch.
5. Observe exact merged-SHA Timeweb success. Publish one hot object under backup/CAS/paused-drained publishers if baseline still matches. Verify public hashes and unchanged cold objects. If HTML source needs a refresh after hot update, request/observe exact-SHA deployment; never duplicate an active auto-deploy.
6. Live browser GET-only smoke: global62/2044=11/1212=7/937=4/37=9, aliases, capacity staleness, card/directlinks, mobile/desktop, no real posts, robots/sitemap. Restore workflow original states after deployment/data/main agree. Record release receipt.

## Rollback / failure / stop conditions

Stop on unknown main/worktree drift, wrong target, secret finding, failed tests/CI/review, mismatched public data, or required cloud/config scope expansion. Keep failure history. Preserve object backup/ETag/ACL/metadata and journal intent before PUT. Uncertain mutation must be reconciled read-only, never blindly retried. Roll back only our one written hot key conditional on exact target/ETag; never overwrite foreign later writes. Code rollback via scoped revert PR or recorded previous deployment, not history rewrite. Resume paused publishers to their original states when safe; never leave a temporary pause unreported.

## Acceptance / review / freeze / commit record

Product freeze42hash above, prior A+B APPROVE; fresh integrity/operational review pending. Plans excluded from self-reference hash but separately reviewed. Acceptance: exact main SHA successfully deployed, hot targethash public, cold hashes unchanged, live62/11 counts/aliases and no unexpected writes, original workflow states preserved. Not yet PASS. No mutations, stage, commit or push at plan creation. Deployment is not proof of restored automatic MOS sync.

## Fresh pre-release evidence

Fresh Node22 gates: 107 focused tests PASS; hot generator check PASS (74 historical annual groups / 75 raw slots); full web check/build PASS. Secret scanner PASS1458. Actual public current counts are tested separately after release. Main and feature remote unchanged; no existing open PR for this branch. Eight live objects match baseline and were backed up read-only in task-owned0700 `/tmp/questhub-polish-release-e92vFgG0`; state/blobs0600. Both publishers originally active. Timeweb app195536 exact baseline deployment `f9c11cc8-0425-4691-bfb1-81f3767e90cb` success; s3/s3 modes unchanged.

Audits found operational recovery and post-PUT metadata verification gaps before any mutation. Corrected helper SHA256 `0abdd8eccf618e5aad1fccb9fdfee6edb5a1083050e15be3ea6b3ab44e8025f5`; ten mock tests PASS including failed second disable, failed PUT, failed second enable, metadata/type/cache/ACL drift, unknown content, originally disabled publisher. `pause` and `resume` reconcile partial completion through intent journal; `abort` first reads known baseline or verifies exact target, rejects unknown content, then restores only journal-owned changes. No automated rollback or broad writes. Common verification checks preserved metadata/type/cache/ACL before verified success/resume. Fresh auditor re-review required before staging and operations.

Live browser harness blocks all non-read requests and mos.ru departures, checks counts/alias/mobile overflow/axe/SEO and records known host fallback honestly. No real leads are submitted.

Independent final review: Auditor A APPROVE and Auditor B APPROVE the exact helper SHA above and unchanged frozen42. Additional independent lost-response reconciliation checks passed. Stage/release gates now authorized by the current owner instruction; external completion remains pending actual release receipt. This plan records pre-release evidence, not a deployment claim.

Do not push outside this owner-authorized release.
Do not start the next task.
