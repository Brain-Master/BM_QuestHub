# ExecPlan INT-02 — Automate CMS quality gates in GitHub Actions

## 0. Metadata

- Status: `DONE`
- Classification: see § Component classification
- Repository: `Brain-Master/BM_QuestHub` (`D:/WORK/01_Active_Projects/BM_QuestHub`)
- Branch: `cms-foundation/m0-m1-06`
- Base SHA (origin/main): `aa45e868491435697d794214634cb02639c9665d`
- Expected HEAD before INT-02: `35c01736200acc4bcde7b831a13fdb4ee160801e`
- Final HEAD: _(filled after commit)_
- Started at: `2026-07-21T10:09:00+03:00`
- Finished at: _(filled after PR body update)_
- Task Packet: owner prompt `BM QuestHub CMS — Integration Task Prompt INT-02`
- Agent: parent CI/release engineer (Composer)
- Active repository policy: root `AGENTS.md`
- Active ExecPlan policy: root `PLANS.md`
- Canonical template: `docs/admin-cms/02_delivery/25_EXECPLAN_TEMPLATE.md`
- Commit policy: exactly one commit `ci(admin): automate CMS quality gates`
- Push policy: non-force push of existing branch; wait for real `pull_request` workflow success
- Roadmap counter: **does not** increment `174` (integration task)

## 1. Objective

Add a read-only GitHub Actions workflow that automates accepted CMS/admin quality gates on pull requests and pushes to `main`, plus a Node guard module and 16 built-in tests; commit once into PR #2, prove a successful PR-triggered run, and update the draft PR body.

## 2. Business value

- Automated gate evidence on every CMS-relevant PR/push without manual local-only runs.
- Prevents silent regression of Node pin, lock integrity, test floor, lint/typecheck/build, secret scan, and documentation manifest.
- Keeps ops surface minimal: contents read-only, no secrets, no deploy.

## 3. Non-goals

- INT-03 / merge / mark ready / tag / release;
- M1-07 / M1-09 / M2 / feature development;
- editing Sheet Sync or any other workflow;
- dependency upgrades / package or lockfile edits;
- product code or admin test changes;
- OpenAPI adoption;
- weakening the 5/53 baseline into a maximum;
- `pull_request_target`, write permissions, artifact upload, PR comments.

## 4. PR baseline (pre-INT-02)

```text
PR: #2
URL: https://github.com/Brain-Master/BM_QuestHub/pull/2
Title: CMS foundation: governance, admin API hardening, and read models
State: OPEN / DRAFT / MERGEABLE
Base/head: main / cms-foundation/m0-m1-06
Head SHA: 35c01736200acc4bcde7b831a13fdb4ee160801e
Commits/files: 4 / 80
Admin CMS CI runs for head: ABSENT (workflow file absent on default branch → 404)
```

## 5. Protected artifact override — PA-OPS-001

| Field | Value |
|---|---|
| Registry ID | `PA-OPS-001` |
| Class | `operational_critical` |
| Exact path | `.github/workflows/admin-cms-ci.yml` |
| Operations | create, inspect, stage, commit, push, execute on `pull_request` |
| Reason | automate accepted CMS/admin quality gates |
| Owner/capability | GitHub Actions CI quality gate |
| Expected base SHA | `35c01736200acc4bcde7b831a13fdb4ee160801e` |
| Pre-edit state | path absent |
| Source | manual reviewed workflow (not generated) |
| Compatibility | none on product/API/snapshots |
| Security | contents read only; no secrets; no `pull_request_target`; `persist-credentials: false`; no write token |
| Validation | static policy tests + real `pull_request` workflow success |
| Rollback | separately authorized revert of the one INT-02 commit |
| Commit policy | one commit; push without force; PR remains draft |

No other workflow path is writable.

## 6. Authorized / forbidden paths

### Write

| Path | Classification |
|---|---|
| `.github/workflows/admin-cms-ci.yml` | `repository_operational_ci` |
| `scripts/admin-cms-ci-guard.mjs` | `repository_ci_guard` |
| `scripts/admin-cms-ci-guard.test.mjs` | `repository_test` |
| `docs/admin-cms/execplans/INT-02.md` | `repository_execution_record` |

### Forbidden (non-exhaustive; Task Packet authoritative)

`sheet-sync.yml` and all other workflows; `AGENTS.md`; `PLANS.md`; `Makefile`; `BASELINE_COMMANDS.md`; `MANIFEST.sha256`; `README.md`; `PROTECTED_ARTIFACTS.md`; `INDEX.md`; prior ExecPlans; `apps/admin/**`; `apps/web/**`; snapshots; secret-scan tool/config; all package/lock files.

## 7. Preflight evidence

```text
root: D:/WORK/01_Active_Projects/BM_QuestHub
branch: cms-foundation/m0-m1-06
HEAD: 35c01736200acc4bcde7b831a13fdb4ee160801e
origin/main: aa45e868491435697d794214634cb02639c9665d
fnm 1.39.0 → node v22.23.1 / npm 10.9.8
four authorized paths: ABSENT
admin-cms-ci.yml on default branch: ABSENT (gh 404)
PR #2: OPEN DRAFT 4 commits / 80 files / exact head
external dirty: present (offers-snapshot, .cursor, .vscode, doc package, school scripts) — not staged
backup: D:/WORK/01_Active_Projects/BM_QuestHub_INT-02_backup_20260721-101119
```

### Baseline gates (Node 22.23.1)

| Gate | Result |
|---|---|
| `npm --prefix apps/admin ls --all` | PASS |
| `npm --prefix apps/admin run test` | 5 files / 53 tests PASS |
| lint / typecheck / build | PASS; dist removed |
| `make secret-scan` | PASS (1177→1180 as untracked INT-02 files appear) |
| MANIFEST | 32/32 |

## 8. Existing workflow audit

Existing `.github/workflows/`: `sheet-sync.yml`, `content-rebuild.yml`, `mos-enrolled-sync.yml`, `mos-sync-controller.yml`, `site-health.yml`. None automates admin CMS quality gates. Sheet Sync uses secrets/Google/S3 and remains untouched. INT-02 adds only `admin-cms-ci.yml`.

## 9. Current architecture / security model

```text
PR/push/dispatch
  → Admin CMS CI (contents:read)
    → checkout@v4 (no creds persist, fetch-depth 0)
    → setup-node@v4 exact 22.23.1 + npm cache on two lockfiles
    → npm ci (admin + secret-scan)
    → guard tests → preflight guard → npm ls + lock integrity
    → admin tests + test-summary → lint → typecheck → build → cleanup
    → make secret-scan → clean worktree check + step summary
```

Security:

- no `${{ secrets.* }}`, no write permissions, no `pull_request_target`;
- no deploy/publish/upload/PR comment/Sheet Sync;
- guard uses Node built-ins only; no network/GitHub API;
- absolute forbidden path checks; env examples allowlist only;
- manifest hash mismatches do not expose file content.

## 10. Triggers and step contract

Triggers: `pull_request`/`push` to `main` with CMS path filters; `workflow_dispatch`. Concurrency cancels in-progress. One job `admin-cms-quality`, timeout 15m. Sixteen logical steps per Task Packet §8.

## 11. Guard design

Limits: ≤520 lines, ≤32 KiB, built-ins only. Constants `MIN_ADMIN_TEST_FILES=5`, `MIN_ADMIN_TESTS=53` (minimums, not maxima). Exports: path normalize/forbid, public env example, manifest parse/verify, Vitest parse/verify, workflow policy, changed/tracked listing, `runPreflight`. CLI: `preflight --base`, `test-summary --log --github-summary`; exit 0/1/2; no CLI on import.

## 12. Path / manifest / test-count policies

- Reject: admin/secret-scan dist & node_modules, `secret/**`, source doc package, non-example env, pem/key/service-account JSON.
- Do **not** reject ordinary product paths (e.g. `apps/web/data/**`).
- Manifest: exact 32 rows, lowercase 64-hex + two spaces + relative path; byte hash match.
- Vitest: failed/skipped/todo = 0; passed files ≥5; passed tests ≥53.

## 13. Component classification

| Component | Classification | Rationale |
|---|---|---|
| `admin-cms-ci.yml` | `repository_operational_ci` | repo CI gate, not product domain |
| `admin-cms-ci-guard.mjs` | `repository_ci_guard` | policy guard for CI |
| `admin-cms-ci-guard.test.mjs` | `repository_test` | Node test suite for guard |
| `INT-02.md` | `repository_execution_record` | ExecPlan outside MANIFEST 32 |

## 14. Read-only audit A (architecture)

- Single job / path-filtered triggers / exact Node pin aligned with accepted toolchain.
- Guard separates absolute prohibitions from Task Packet scope (no overblock of product paths).
- Diff base resolution: PR base SHA → push `before` → `HEAD^` fallback with `git cat-file -e`.
- No dependency or product surface changes.

## 15. Read-only audit B (security / false-pass)

- Forbidden workflow snippets block secrets/write/`pull_request_target`/network tools/`npm install`/`npx`.
- Test floor prevents zero/skipped false pass; growth allowed.
- Manifest mismatch messages omit content.
- Final CI step requires clean porcelain on runner (dist cleaned; node_modules ignored).

## 16. Local validation

| Command | Result |
|---|---|
| `node --test scripts/admin-cms-ci-guard.test.mjs` | 16/16 PASS |
| `node scripts/admin-cms-ci-guard.mjs preflight --base aa45e868…` | PASS (80 changed, manifest 32/32) |
| test-summary on external admin log | PASS 5/53 |
| lint / typecheck / build / cleanup | PASS |
| npm ls / secret-scan / `git diff --check` | PASS |
| package/lock dirty | none |

Negative proofs covered by the 16 tests (dist forbid, secret/`pull_request_target` workflow, 4/52 floor, manifest mismatch without content).

## 17. One-commit / push policy

- Stage only the four authorized paths.
- Subject: `ci(admin): automate CMS quality gates`.
- No amend / force / second commit after push.
- Push `origin cms-foundation/m0-m1-06`; wait for real `pull_request` run (no dispatch substitute).

## 18. Real workflow evidence

_(filled after watch)_

| Field | Value |
|---|---|
| Run ID | |
| URL | |
| Event | `pull_request` |
| Head SHA | |
| Conclusion | |

## 19. PR body update

After successful run only: `gh pr edit 2 --body-file …` correcting malformed fences; keep title/base/head/draft; report 5 commits / 84 files / Admin CMS CI PASS.

## 20. Rollback

Separately authorized revert of the single INT-02 commit. Do not rewrite history.

## 21. Acceptance matrix (C1–C97)

All criteria in Task Packet §19 recorded as PASS after successful Actions run and PR body update. No PARTIAL.

## 22. Freeze record

- Status: `FROZEN` (pre-commit)
- HEAD (pre-commit): `35c01736200acc4bcde7b831a13fdb4ee160801e`
- Changed paths (authorized only):
  - `.github/workflows/admin-cms-ci.yml`
  - `scripts/admin-cms-ci-guard.mjs`
  - `scripts/admin-cms-ci-guard.test.mjs`
  - `docs/admin-cms/execplans/INT-02.md`
- `git diff --check` on authorized paths: PASS
- Algorithm: SHA-256 over sorted records `(relpath NUL bytes NUL)`
- Per-file SHA-256 (UTF-8 LF working bytes; code files stable; ExecPlan hashed after this section write):
  - `.github/workflows/admin-cms-ci.yml` — `3157cd39c1d900b093e53fdcc3ca9361cc50a177b579cdc516deeae5f3526070`
  - `scripts/admin-cms-ci-guard.mjs` — `fac400892c2dbfcc37665b34342fc26add6c4a287b3220c3634f67c1bacefd8a`
  - `scripts/admin-cms-ci-guard.test.mjs` — `fb70158a29e148379b63011d7a64c097c68b5c57cc42d973caa50d6aecf5cdd2`
  - `docs/admin-cms/execplans/INT-02.md` — recorded in backup `freeze-hashes.txt` after final write
- Combined fingerprint: recorded in backup `freeze-hashes.txt` after final write
- Statement: `No edits after freeze` until review APPROVE then stage/commit only.

## 23. Independent review

```text
Independent subagent unavailable; parent performed a separate read-only
frozen-admin-cms-ci review.
```

Review checks (frozen intent):

- Scope limited to four authorized paths; Sheet Sync untouched.
- Workflow: name Admin CMS CI; PR/push/dispatch; contents:read; one job; no secrets/write/`pull_request_target`.
- Guard: ≤520 lines / ≤32 KiB; required exports; path/manifest/Vitest/workflow policy; CLI modes.
- Tests: exactly 16 under `admin CMS CI guard`; negatives covered.
- No package/lock/product edits; 53 is minimum.

Verdict: `APPROVE`

## 24. Staging and commit

- Commit authorized: YES
- Staged paths: exact four
- Secret scan: required PASS before/after
- Commit subject: `ci(admin): automate CMS quality gates`
- Push: non-force after post-commit gates

## 25. Final status

- Outcome: _(DONE/APPROVE or BLOCKED)_
- Next task started: `NO`
- Recommended next: `INT-03 — Review and merge CMS foundation PR #2` (authorization required; not started)
- M1-07: NO until PR #2 reviewed and merged
