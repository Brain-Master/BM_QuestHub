# ExecPlan M1-08-REVIEW — Review and merge auth-failure state PR #4

## 0. Metadata

- Status: `APPROVE` (repository review record; merge actions follow this freeze)
- Classification: `repository_execution_record` / integration merge review
- Repository: `Brain-Master/BM_QuestHub` (`D:/WORK/01_Active_Projects/BM_QuestHub`)
- Branch: `cms/m1-08-auth-failure-state`
- Base SHA (`origin/main`): `3e772371adb9f72c7843e315378f7eae8bc3d528`
- Pre-review feature HEAD: `bb773c707bb8535802ab16595cd5684a8fc8c13b`
- Initial corrective Admin CMS CI: run `29923502389` / `pull_request` / `success`
- Started at: `2026-07-22T17:11:00+03:00`
- Task Packet: owner prompt `BM QuestHub CMS — Review and Merge Task Prompt M1-08-REVIEW`
- Agent: parent release integrator / senior reviewer (Composer)
- Active repository policy: root `AGENTS.md`
- Active ExecPlan policy: root `PLANS.md`
- Canonical template: `docs/admin-cms/02_delivery/25_EXECPLAN_TEMPLATE.md`
- Commit policy: exactly one commit `docs: record M1-08 merge review`
- Push policy: non-force push; wait for final `pull_request` Admin CMS CI success before ready/merge
- Roadmap counter: increments only after verified merge (20/174; M1 8/12)
- Review-record commit SHA and merge SHA are authoritative in Git/PR and the
  final task report; they are intentionally not self-embedded in this commit.

## 1. Objective and non-goals

### Objective

Conduct frozen-diff review of two-commit draft PR #4, confirm HTTP 401
auth-failure transition without M1-09/M1-10/M3 scope creep, verify buffer
preservation / no-reload-loop / exact re-auth Save behavior, confirm
docs-only character of M1-08-R1, record APPROVE in this ExecPlan, obtain
final Admin CMS CI, mark ready, merge with merge commit + exact-head
protection, verify post-merge `main`/CI, and delete the remote feature
branch while preserving the local branch and external dirty state.

### Non-goals

- Fix findings inside this review (BLOCKER/MAJOR → separate corrective task);
- Edit any existing repository file (only create this ExecPlan);
- Add this ExecPlan to `docs/admin-cms/MANIFEST.sha256`;
- Start M1-09 / M1-10 / M2;
- Squash/rebase/auto merge, admin bypass, amend, force push, tag, release, deploy;
- Switch or delete the local feature branch;
- Stage or mutate external dirty paths;
- Fabricate an independent GitHub PR approval from another account.

## 2. PR identity

```text
PR: #4
URL: https://github.com/Brain-Master/BM_QuestHub/pull/4
Title: M1-08: add auth-failure state contract
State (pre-review): OPEN / DRAFT / MERGEABLE
Base/head: main ← cms/m1-08-auth-failure-state
Initial reviewed head: bb773c707bb8535802ab16595cd5684a8fc8c13b
Initial commits/files: 2 / 7
Corrective Admin CMS CI: 29923502389 SUCCESS (pull_request, exact head)
Submitted GitHub reviews: 0
Inline review threads: 0 unresolved (GraphQL nodes empty)
```

Live reverify before write matched Task Packet baseline. `origin/main` unchanged
at `3e772371adb9f72c7843e315378f7eae8bc3d528`. Ahead 2 / behind 0.

## 3. Commit history

Exact order vs `origin/main`:

| # | SHA | Subject |
|---|-----|---------|
| 1 | `78c659afc4efa01aceac9116385ba8f16a1a53e2` | state(admin): add auth-failure transition |
| 2 | `bb773c707bb8535802ab16595cd5684a8fc8c13b` | docs: complete M1-08 execution evidence |

After review-record commit: expected **3 commits / 8 files**.

## 4. Frozen seven-file scope

Seven changed files classified; none unclassified; no scope leakage.

| Class | Count | Paths |
|---|---:|---|
| state_contract | 1 | `apps/admin/src/auth-failure-state.ts` |
| runtime_integration | 2 | `apps/admin/src/App.tsx`, `apps/admin/src/legacy-token-adapter.ts` |
| tests | 2 | `apps/admin/src/auth-failure-state.test.ts`, `apps/admin/src/legacy-token-adapter.test.ts` |
| execution_records | 2 | `docs/admin-cms/execplans/M1-08.md`, `docs/admin-cms/execplans/M1-08-R1.md` |
| **total** | **7** | |

Rejected classes absent: `api.ts` / request-contract changes, snapshot changes,
package/lock/config, workflows, backend/web/generated data, external dirty
paths, secret material.

Frozen backup (outside repo):
`D:/WORK/01_Active_Projects/BM_QuestHub_M1-08-REVIEW_backup_20260722_171311`
(includes `pr-4.patch`, PR JSON, reviews/threads, external fingerprint).

External dirty fingerprint (M1-08/M1-08-R1 algorithm, 39 paths):
`41563d81ded1fdf2068b04095c5e2ff7afa36b25e50daba6ca280c1b9407a82c` — exact match;
not staged.

## 5. Product/test hash verification

Working-tree bytes on Windows (`core.autocrlf=true`) match frozen invariants.
Implementation freeze fingerprint recomputed with original `M1-08.md` WT bytes
from `78c659af…` (CRLF form used at freeze; git blob is LF).

| Path | SHA-256 (WT) | Result |
|---|---|---|
| `apps/admin/src/App.tsx` | `a3c4bf5602f2c779dc4956ef1b864d295bd5f4b65275723511630a5f23ec6746` | MATCH |
| `apps/admin/src/auth-failure-state.test.ts` | `1b7de59cbc8eacc736bb6bd4e879414596ae6432fca4a7fb4ccf41187502cb80` | MATCH |
| `apps/admin/src/auth-failure-state.ts` | `3ea124a24090ec182a8e5325a6d054b4a2259f60507b1e880da0e17521a97c69` | MATCH |
| `apps/admin/src/legacy-token-adapter.test.ts` | `00e15f879014680ea0747eabebb2da439da1e32dce6cdf70dbf6c0d9f0cc1190` | MATCH |
| `apps/admin/src/legacy-token-adapter.ts` | `2fbe578bb41855932821bb38dae0dfef80c0aa4e11875e3f31f823f6283033b2` | MATCH |

Implementation freeze fingerprint (six-path sorted `path NUL bytes NUL`):
`52e7665f2661fb9e53023c33e4db8c54b6dc36cdc42a3dcb9b4e61a0dc699c4c` — MATCH.

Corrective documentation freeze (current WT, full digests):

| Path | SHA-256 |
|---|---|
| `docs/admin-cms/execplans/M1-08.md` | `9794c9c261b3cb75bac4f771783df783ff8405fec8e6984bc31175b114f80d27` |
| `docs/admin-cms/execplans/M1-08-R1.md` | `059b5d5e96e565416c5a1500b7b314ad2ac648e3d817f7bddd4b03de6d0e0c84` |
| combined (2-path) | `8c89965af29c9497055eac531cace219b5c361227b7372836c151366e15873ef` |

Unchanged product/test files (`api.ts`, request-contract, snapshot-*) have
`baseEqHead=true` (no PR diff). WT vs git-blob may differ by CRLF only.

## 6. Reviewer A — state architecture and runtime behavior

Independent read-only pass over exact PR head `bb773c70…`.

| Check | Evidence | Result |
|---|---|---|
| `AdminAuthState` literals / discriminant | `ready` \| `authentication-required` + `reason: "http-401"` | PASS |
| Exact `AuthFailureTransition` fields/literals | six keys; `nextTokenInput: ""`; `retry: "manual"`; fixed RU message | PASS |
| `READY_AUTH_STATE` frozen | `Object.freeze({ status: "ready" })` | PASS |
| Transition only for exact `ApiClientError` 401 | `instanceof` + `AUTHENTICATION_REQUIRED` + `status === 401` | PASS |
| 403/5xx/generic/structural lookalike rejected | tests + pure predicate returns `null` | PASS |
| Outer and nested transition frozen | `Object.freeze` on transition and `nextAuthState` | PASS |
| No secret/raw payload/callback in transition | fixed literals only; S4/S7 assertions | PASS |
| Adapter `clear()` uses `removeItem` | `sessionStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY)` | PASS |
| App one central `handleRequestError` | single `useCallback`; S10 asserts one match | PASS |
| refresh/save/publish catches route through it | three catch blocks call `handleRequestError` | PASS |
| 401 clears stored token and token input | `legacyTokenAdapter.clear()` + `setTokenInput("")` | PASS |
| 401 sets auth-required state/message | `setAuthState` + `setStatus("Требуется повторная авторизация")` | PASS |
| Edit buffers and selected tab untouched | handler has no `setCatalog/Map/Site/OffersJson` / `setTab` | PASS |
| No retry/reload/navigation/timer | no `refresh(`/`location.reload`/`setTimeout`/`setInterval` in handler | PASS |
| Effect no longer depends on `tokenInput` | `useEffect(..., [refresh])` only | PASS |
| Typing replacement token triggers zero requests | effect excludes `tokenInput`; Save is explicit | PASS |
| Save restores ready and exactly one refresh | `write` → `READY_AUTH_STATE` → status → `void refresh()` once | PASS |
| Non-401 keeps prior fallback | `setStatus(Error.message \|\| String)` only; no auth mutation | PASS |
| No M1-09/M1-10/M3 behavior | no snapshot contracts, no general error formatter, shared token kept | PASS |

## 7. Reviewer B — security and false-pass resistance

Independent second read-only pass.

| Check | Evidence | Result |
|---|---|---|
| Product storage/key centralized | adapter module only; T8 scan | PASS |
| No token value/length/prefix/header logging | T7 spies; clear included | PASS |
| No fallback storage | sessionStorage only; errors propagate | PASS |
| Clear error identity propagates | T10 `caught === boom` | PASS |
| T9 rejects empty-string clear | `removeItem` only; `setItem` not called | PASS |
| T10 rejects fallback/logging | no getItem/setItem; console spies | PASS |
| S3 rejects structural lookalike | plain object with 401 fields → `null` | PASS |
| S4 rejects secret material | allowed keys + secret needle | PASS |
| S7 forbids retry callback/reload semantics | `retry: "manual"`; no function values | PASS |
| S9 deeply frozen proof | outer + nested `Object.isFrozen` | PASS |
| S10 source integration not trivially bypassable | handler/effect/Save wiring asserts on App.tsx source | PASS |
| Controlled regressions R1–R5 credible | recorded in M1-08; fail-and-restore; product hashes unchanged | PASS |
| `api.ts` and request contracts unchanged | baseEqHead; 16/16 still pass | PASS |
| M1-08-R1 docs-only | product/test hashes identical; only two ExecPlans added/edited | PASS |
| No stale placeholders / false merge claims | M1-08 pending merge review; R1 pending M1-08-REVIEW | PASS |

## 8. Findings table

| ID | Severity | Location | Finding | Disposition |
|---|---|---|---|---|
| — | BLOCKER | — | none | — |
| — | MAJOR | — | none | — |
| F1 | NOTE | `auth-failure-state.test.ts` S10 | Source-string wiring test (not runtime DOM); accepted as M1-08 contract proof | Accept |
| F2 | NOTE | Shared token mechanism | Intentional; not replaced by M1-08 | Accept; M3 owns replacement |
| F3 | NOTE | Windows autocrlf preflight | Requires temporary LF-manifest wrap; restored; external fp unchanged | Accept (known env) |

**Merge gate:** `BLOCKER = 0`, `MAJOR = 0`.

## 9. State-contract assessment

Pure `authFailureTransition` accepts only `ApiClientError` with
`AUTHENTICATION_REQUIRED` + HTTP 401. Transition object is deeply frozen,
contains no secrets or callbacks, and encodes buffer preservation + manual
retry. APPROVE.

## 10. Adapter-clear assessment

`clear()` calls `sessionStorage.removeItem` on the private legacy key.
Failures propagate with original identity; no logging; no empty-string
`setItem` fallback. APPROVE.

## 11. App transition assessment

One `handleRequestError` centralizes 401 handling for refresh/save/publish.
401 path: `clear()` → empty input → `authentication-required` → bounded
Russian status. Non-401: prior `Error.message`/`String` fallback only.
APPROVE.

## 12. Buffer-preservation assessment

401 handler does not call `setCatalogJson` / `setMapJson` / `setSiteJson` /
`setOffersJson` / `setTab`. Contract field `preserveEditBuffer: true`.
APPROVE.

## 13. Reload-loop assessment

Mount effect depends only on `[refresh]`. Typing into token input cannot
trigger requests. Handler contains no `refresh(`, `location.reload`,
`navigate`, `setTimeout`, or `setInterval`. APPROVE.

## 14. Re-auth Save assessment

`applyToken`: `legacyTokenAdapter.write(tokenInput)` → `READY_AUTH_STATE` →
`"Токен сохранён"` → exactly one `void refresh()`. APPROVE.

## 15. Non-401 assessment

Non-matching errors skip clear/auth/input mutation and only update status via
existing Error/String fallback. APPROVE.

## 16. Test false-pass assessment

| Suite | Count | Key proofs |
|---|---:|---|
| auth-failure-state | 10/10 | S3/S4/S7/S9/S10 |
| legacy-token-adapter | 10/10 | T5/T7/T8/T9/T10 |
| request-contract | 16/16 | unchanged |
| full admin | 7 / 73 | 0 fail/skip/todo |

R1–R5 controlled regressions recorded as credible fail-and-restore with exact
bytes restored. APPROVE.

## 17. Execution-evidence assessment

### M1-08.md

- Status: `IMPLEMENTED / INITIAL PR CI PASS / EVIDENCE COMPLETED BY M1-08-R1 / PENDING MERGE REVIEW`
- Implementation commit: `78c659af…`
- Initial PR: `#4` OPEN/DRAFT
- Initial CI: `29883544320` success
- No stale placeholders; no merge claim — PASS

### M1-08-R1.md

- Status: `DONE / APPROVE / PENDING M1-08-REVIEW`
- Trigger describes stale evidence; product/test unchanged; fingerprint match
- Corrective CI ownership; no future-SHA placeholder; no merge claim — PASS

### Current PR body (pre-review-record)

Records 2 commits / 7 files, M1-08-R1, initial + corrective CI, CI checkbox
checked, M1-09/M1-10 not started — PASS

## 18. M1-09/M1-10 boundary

No snapshot contract expansion, no safe general error formatter, no shared-token
replacement, no login/session/BFF/RBAC. M1-09/M1-10/M2 unauthorized until this
merge is verified. **Boundary PASS.**

## 19. Local validation

Node `v22.23.1` / npm `10.9.8` (fnm node-versions path on PATH).

| Command | Outcome |
|---|---|
| `npm --prefix apps/admin run test -- src/auth-failure-state.test.ts` | 10/10 PASS |
| `npm --prefix apps/admin run test -- src/legacy-token-adapter.test.ts` | 10/10 PASS |
| `npm --prefix apps/admin run test -- src/api.request-contract.test.ts` | 16/16 PASS |
| `npm --prefix apps/admin run test` | 7 files / 73 PASS; 0 fail/skip/todo |
| `npm --prefix apps/admin run lint` | PASS |
| `npm --prefix apps/admin run typecheck` | PASS |
| `npm --prefix apps/admin ls --all` | PASS |
| `npm --prefix apps/admin run build` | PASS; `apps/admin/dist` removed afterward |
| `node --test scripts/admin-cms-ci-guard.test.mjs` | 16/16 PASS |
| `node scripts/admin-cms-ci-guard.mjs preflight --base 3e772371…` | PASS with LF-manifest wrap (Windows autocrlf); WT restored; external fp unchanged |
| `make secret-scan` | PASS (1191 files) |

## 20. Remote CI validation

Initial corrective (pre-review-record):

```text
Workflow: Admin CMS CI
Run: 29923502389
Event: pull_request
Head: bb773c707bb8535802ab16595cd5684a8fc8c13b
Conclusion: success
```

Final CI on review-record head is recorded in the task report after push
(not self-embedded here).

## 21. Merge strategy

- Method: **merge commit only** (`gh pr merge 4 --merge`).
- Exact-head: `--match-head-commit <final-review-head>`.
- Forbidden: `--squash`, `--rebase`, `--auto`, `--admin`.
- If GitHub requires an independent approval absent here: STOP (no self-bypass).
- This file is a repository review record, not a claim of third-party GitHub
  approval.

## 22. Exact-head protection

Merge only when:

1. `origin/main` still `3e772371adb9f72c7843e315378f7eae8bc3d528`;
2. PR head equals reviewed final review-record SHA;
3. PR OPEN, MERGEABLE, required checks green;
4. No CHANGES_REQUESTED / unresolved threads.

## 23. Branch cleanup

After verified merge + successful push-to-main Admin CMS CI:

- `git push origin --delete cms/m1-08-auth-failure-state` (no force);
- Local branch preserved;
- External dirty state untouched.

## 24. Rollback

On any stop condition: keep PR draft (or ready-but-unmerged), do not add further
commits, do not merge, do not reset/revert/force-push without a separate
authorized incident task.

## 25. Acceptance

V1–V86 from Task Packet must all PASS after merge verification. No PARTIAL.

## 26. Freeze

Freeze path for this review record:

```text
docs/admin-cms/execplans/M1-08-REVIEW.md
```

Algorithm: SHA-256 over relative path NUL file bytes NUL (single-file record).
Digest and review-record commit SHA are authoritative in the final task report.

## 27. Git/GitHub actions

1. Stage only `docs/admin-cms/execplans/M1-08-REVIEW.md`.
2. Commit: `docs: record M1-08 merge review` (no amend).
3. Push branch without force.
4. Wait for Admin CMS CI `pull_request` success on exact new head.
5. Update PR body with APPROVE / review-record / final CI / 3×8 / merge method.
6. `gh pr ready 4`.
7. `gh pr merge 4 --merge --match-head-commit <exact-final-head>`.
8. Fetch; verify parents/tree; wait push-to-main CI; delete remote branch.

## 28. Final status

**Verdict: APPROVE**

Owned by final task report after merge:

- review-record commit SHA;
- final PR CI run ID / success;
- merge SHA / two parents / tree equality;
- post-merge main CI;
- remote branch absent;
- formal progress 20/174; M1 8/12;
- M1-09 not started.
