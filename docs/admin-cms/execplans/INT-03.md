# ExecPlan INT-03 — Review and merge CMS foundation PR #2

## 0. Metadata

- Status: `IN_PROGRESS`
- Classification: `repository_execution_record` / integration merge review
- Repository: `Brain-Master/BM_QuestHub` (`D:/WORK/01_Active_Projects/BM_QuestHub`)
- Branch: `cms-foundation/m0-m1-06`
- Base SHA (`origin/main`): `aa45e868491435697d794214634cb02639c9665d`
- Pre-review feature HEAD: `92349c842e8da21eb43fa8b6fe294aae64967823`
- Final feature HEAD: _(filled after review-record commit)_
- Merge commit SHA: _(filled after merge)_
- Started at: `2026-07-21T11:37:00+03:00`
- Finished at: _(filled after merge verification)_
- Task Packet: owner prompt `BM QuestHub CMS — Integration Task Prompt INT-03`
- Agent: parent release integrator / senior reviewer (Composer)
- Active repository policy: root `AGENTS.md`
- Active ExecPlan policy: root `PLANS.md`
- Canonical template: `docs/admin-cms/02_delivery/25_EXECPLAN_TEMPLATE.md`
- Commit policy: exactly one commit `docs: record CMS foundation merge review`
- Push policy: non-force push of existing branch; wait for final `pull_request` Admin CMS CI success before ready/merge
- Roadmap counter: **does not** increment `174`

## 1. Objective

Conduct frozen-diff review of PR #2 at head `92349c842e8da21eb43fa8b6fe294aae64967823`, record APPROVE evidence in this ExecPlan, obtain final successful Admin CMS CI on the review-record commit, mark PR ready, merge into `main` with merge commit and exact-head protection, and delete the remote feature branch after verified merge.

## 2. Non-goals

- Fix defects found during review (separate corrective tasks);
- M1-07 / M1-09 / M2 or any product feature work;
- Edit any existing repository file other than creating this ExecPlan;
- Add INT-03 to `docs/admin-cms/MANIFEST.sha256`;
- Squash/rebase merge, admin bypass, auto-merge, tag, release, deploy;
- Switch/delete local branch or touch external dirty paths;
- Fabricate independent GitHub PR approval from another account.

## 3. Current PR identity

```text
PR: #2
URL: https://github.com/Brain-Master/BM_QuestHub/pull/2
Title: CMS foundation: governance, admin API hardening, and read models
State: OPEN / DRAFT / MERGEABLE
Base/head: main / cms-foundation/m0-m1-06
Initial head SHA: 92349c842e8da21eb43fa8b6fe294aae64967823
Initial commits/files: 5 / 84
Initial Admin CMS CI: run 29810269371 SUCCESS (pull_request)
Submitted GitHub reviews: 0
Inline review threads: 0 unresolved
```

## 4. Accepted integration history

Expected commits (order preserved):

| # | SHA | Subject | Paths |
|---|-----|---------|------:|
| 1 | `abbbfdc021472a9abf79587941cf6a85a2619d48` | docs: establish CMS governance and execution record | 61 |
| 2 | `ec1d20ea4f75e7ad8c80011749dd2b24735faa22` | chore(admin): add reproducible quality baseline | 11 |
| 3 | `358a5de89f315338a864d6a8683c160609534730` | feat(admin): harden API and snapshot boundary | 6 |
| 4 | `35c01736200acc4bcde7b831a13fdb4ee160801e` | feat(admin): add snapshot read models | 2 |
| 5 | `92349c842e8da21eb43fa8b6fe294aae64967823` | ci(admin): automate CMS quality gates | 4 |

After review-record commit: expected 6 commits / 85 files.

## 5. Protected merge authorization

| Field | Value |
|---|---|
| PR mutations authorized | update body, mark ready, merge commit with `--match-head-commit` |
| Main mutation | merge exact reviewed feature head into `main` |
| Merge method | `merge` (preserve five-layer commit history) |
| Branch cleanup | delete remote `cms-foundation/m0-m1-06` after verified merge |
| Local branch | preserved (external dirty worktree) |
| Rollback | STOP only; no reset/revert without separate incident task |

## 6. Frozen PR scope

Total changed files vs `origin/main`: **84** (verified via `git diff --name-only` and `gh pr view 2`).

Classification by integration commit groups:

| Group | Count | Scope |
|---|---:|---|
| `governance_and_execplans` | 61 | Commit 1: `AGENTS.md`, `PLANS.md`, `docs/admin-cms/**` except INT-02 added later |
| `quality_baseline` | 11 | Commit 2: admin lint/typecheck/test tooling, secret-scan, Makefile |
| `api_boundary_and_fixtures` | 6 | Commit 3: API hardening, boundary parser, synthetic fixtures |
| `read_models` | 2 | Commit 4: snapshot selectors + tests |
| `ci_automation` | 4 | Commit 5: workflow, guard, guard tests, INT-02 execplan |

External dirty paths **absent** from PR diff (verified empty grep on diff names).

Excluded from PR (worktree-only):

```text
apps/web/data/offers-snapshot.json
.cursor/**
.vscode/**
BM_QuestHub_CMS_Document_Package/**
scripts/append-school-1212-hydraulic-shift.mjs
scripts/update-school-1212-hot-shifts.mjs
```

Backup: `D:/WORK/01_Active_Projects/BM_QuestHub_INT-03_backup_20260721_113703/`

Scope classification artifact: `review-scope-classification.txt` (commit-aligned 61/11/6/2/4).

## 7. Reviewer A — architecture and correctness

Read-only pass over frozen bytes at head `92349c842e8da21eb43fa8b6fe294aae64967823`.

### Positive evidence

| Area | Evidence |
|---|---|
| Governance authority | `AGENTS.md` establishes Task Packet > policy > ExecPlan order; `PLANS.md` lifecycle; `PROTECTED_ARTIFACTS.md` registry; `BASELINE_COMMANDS.md` command ownership |
| Tooling reproducibility | Admin scripts: test/lint/typecheck/build; `make secret-scan`; pinned Node `22.23.1` in guard + workflow |
| GET no-body contract | `api.ts:48-54,114-120` — GET/HEAD use query `path`; no JSON body |
| Timeout/manual abort | `api.ts:65-95,128-134` — first-cause `timeout` vs `manual`; distinct DOMException types |
| Safe HTTP errors | `api.ts:16-33,56-63,123-125` — stable `ApiClientErrorCode`; no raw payload in errors |
| Flat snapshot boundary | `snapshot-boundary.ts:74-137` — flat `{ok,catalog,map,site,manifest,offers}`; max 5 issues |
| Nullable vs missing | `snapshot-boundary.ts:116-129` — manifest/offers required keys; `null` allowed; missing key = REQUIRED |
| Synthetic fixtures | `snapshot-bundle.fixtures.ts` — `fixtureKind: synthetic-*`; no production snapshot bytes |
| Selector purity | `snapshot-selectors.ts` — pure functions; malformed rows skipped; bounded strings |
| Relationship counting | `snapshot-selectors.ts:240-242,269-271,295-297` — single-pass `countByKey` O(n) |
| CI policy | `admin-cms-ci.yml` — PR/push/dispatch; `contents: read`; no secrets; test floor enforced |

### Findings

| ID | Location | Finding | Severity | Disposition |
|---|---|---|---|---|
| A1 | `snapshot-selectors.ts:455-501` | Public selectors rebuild offers/courses independently (duplicate O(n) work) | MINOR | Accept for M1-06; optimize in future UI task if needed |
| A2 | `api.ts:37-39` | Legacy `sessionStorage` shared token unchanged | NOTE | Known limitation; M1-07 scope; documented in PR body |
| A3 | `AGENTS.md` / local env | System Node 24 vs pinned 22.23.1 | NOTE | CI/guard enforce exact pin; local integrator used portable Node 22.23.1 |

**Reviewer A verdict:** `APPROVE` (BLOCKER=0, MAJOR=0)

## 8. Reviewer B — security and false-pass risks

Read-only pass over frozen bytes and PR diff isolation.

### Positive evidence

| Area | Evidence |
|---|---|
| Secret exposure | No secrets in 84-file diff; `make secret-scan` PASS (1181 files) |
| Shared token | Not worsened; same pre-existing sessionStorage pattern |
| Raw payload boundary | `loadSnapshots` parses through `parseSnapshotsBundle`; typed bundle only |
| Bounded diagnostics | Validation max 5 issues; API errors generic message + stable code |
| Protected paths excluded | Guard `forbiddenChangedPathReason`; preflight PASS; no generated/dist in diff |
| Secret scan safety | `secret-scan.mjs` — no `--output`; Node 22 major gate; batched paths |
| CI read-only | `permissions: contents: read`; `persist-credentials: false`; no `pull_request_target` |
| Test floor | Guard `MIN_ADMIN_TEST_FILES=5`, `MIN_ADMIN_TESTS=53`; Vitest summary parser rejects skip/fail |
| Manifest integrity | `verifyDocumentationManifest` hash mismatch throws; 32/32 required |
| Build ephemeral | Preflight rejects tracked `apps/admin/dist`; CI build+cleanup steps |

### Findings

| ID | Location | Finding | Severity | Disposition |
|---|---|---|---|---|
| B1 | Worktree external paths | Historical external FP `3281a56…` ≠ recomputed session FP `41563d81…` (pre-existing untracked package growth) | NOTE | External paths absent from PR; unchanged during INT-03 session |
| B2 | `api.ts:44` | Token sent via `x-content-token` header | NOTE | Pre-existing shared-token model; M1-07 tracks replacement |

**Reviewer B verdict:** `APPROVE` (BLOCKER=0, MAJOR=0)

## 9. Findings table (combined)

| Severity | Count | Disposition |
|---|---:|---|
| BLOCKER | 0 | — |
| MAJOR | 0 | — |
| MINOR | 1 | A1 accepted |
| NOTE | 3 | A2, A3, B1, B2 documented |

## 10. Security assessment

PR scope introduces governance, read-only CI, secret-scan gate, and admin read-path hardening without expanding write credentials, deploy hooks, or secret material. Workflow is contents-read-only with credential persistence disabled. No SSRF/deploy/secret references in CI YAML. Residual risk: legacy browser token until M1-07 (documented, not worsened).

## 11. Contract assessment

- GET `/snapshots` uses query-parameter routing without request body.
- Flat envelope validated at boundary; nullable manifest/offers distinguished from missing keys.
- HTTP status mapped to stable client error codes without backend payload leakage.
- Abort semantics preserve timeout vs manual cancel as first cause.

## 12. CI assessment

Initial run `29810269371`: `pull_request`, head `92349c842e8da21eb43fa8b6fe294aae64967823`, conclusion **success**.

Workflow policy verified statically (guard) and by live run. Final run recorded in §18 after review-record push.

## 13. Local validation

Executed with portable Node **v22.23.1** (system Node v24.13.1 fails guard preflight by design).

| Gate | Command / evidence | Result |
|---|---|---|
| Guard tests | `node --test scripts/admin-cms-ci-guard.test.mjs` | 16/16 PASS |
| Guard preflight | `node scripts/admin-cms-ci-guard.mjs preflight --base aa45e868…` | PASS (84 changed, manifest 32/32) |
| Admin tests | `npm --prefix apps/admin run test` | 5 files / 53 PASS |
| Lint | `npm --prefix apps/admin run lint` | PASS |
| Typecheck | `npm --prefix apps/admin run typecheck` | PASS |
| Build + cleanup | `npm --prefix apps/admin run build`; remove `apps/admin/dist` | PASS |
| npm ls | `npm --prefix apps/admin ls --all` | PASS |
| Secret scan | `make secret-scan` | PASS (1181 files) |
| MANIFEST | guard `verifyDocumentationManifest` | 32/32 PASS |
| Broken links | docs/admin-cms internal link scan | 0 broken / 164 checked |
| INDEX | manual spot-check authority order | PASS |
| Protected refs | `PROTECTED_ARTIFACTS.md` registry present; PA-OPS-001 override documented in INT-02 | PASS |

## 14. Remote validation

| Field | Value |
|---|---|
| Workflow | Admin CMS CI |
| Run ID | 29810269371 |
| URL | https://github.com/Brain-Master/BM_QuestHub/actions/runs/29810269371 |
| Event | `pull_request` |
| Head SHA | `92349c842e8da21eb43fa8b6fe294aae64967823` |
| Conclusion | success |

## 15. Merge strategy rationale

Five commits encode deliberate layering (governance → baseline → API → read models → CI). Squash would erase reviewed integration history; rebase merge would drop merge-commit checkpoint. **Merge commit** preserves both `main` tip and feature branch topology for audit.

## 16. Exact-head protection

Merge authorized only with:

```powershell
gh pr merge 2 --merge --match-head-commit <exact-final-feature-head-sha>
```

Stale head merge forbidden.

## 17. Branch cleanup policy

After verified merge: delete remote `cms-foundation/m0-m1-06` if present. Do not switch or delete local branch (external dirty worktree).

## 18. Rollback policy

If post-merge discrepancy: STOP; no reset/force-push/revert without separate corrective/incident task.

## 19. Acceptance matrix

Recorded in final report §L (M1–M71).

## 20. Freeze (review-record commit)

- Status: `FROZEN` (pre-commit)
- HEAD (pre-commit): `92349c842e8da21eb43fa8b6fe294aae64967823`
- Authorized write path: `docs/admin-cms/execplans/INT-03.md` only
- `git diff --check`: PASS on authorized path
- Algorithm: SHA-256 over sorted records `(relpath NUL bytes NUL)`
- INT-03.md SHA-256: _(filled immediately before commit)_
- External session fingerprint (git-status scoped): `41563d81ded1fdf2068b04095c5e2ff7afa36b25e50daba6ca280c1b9407a82c`
- Statement: No edits after freeze until review APPROVE then stage/commit only.

## 21. Git/GitHub actions

Authorized sequence:

1. Stage only `docs/admin-cms/execplans/INT-03.md`
2. Commit `docs: record CMS foundation merge review`
3. Push `origin cms-foundation/m0-m1-06` (no force)
4. Wait for Admin CMS CI on new head
5. Update PR body with INT-03 evidence
6. `gh pr ready 2`
7. `gh pr merge 2 --merge --match-head-commit <sha>`
8. Verify merge parents/tree; fetch `origin/main`
9. Delete remote feature branch if still present

## 22. Final status

_(filled after merge verification)_

## Review verdict

```text
APPROVE
```

Repository review record only — not a fabricated independent GitHub account approval.
