# ExecPlan M1-07-REVIEW — Review and merge legacy token adapter PR #3

## 0. Metadata

- Status: `APPROVE` (repository review record; merge actions follow this freeze)
- Classification: `repository_execution_record` / integration merge review
- Repository: `Brain-Master/BM_QuestHub` (`D:/WORK/01_Active_Projects/BM_QuestHub`)
- Branch: `cms/m1-07-legacy-token-adapter`
- Base SHA (`origin/main`): `6e508a108cb0e6222985134a3108708fd8d50e1d`
- Pre-review feature HEAD: `7a50da3223c966bf3b33fd99ddbbadc0ef6ee490`
- Initial Admin CMS CI: run `29878823188` / `pull_request` / `success`
- Started at: `2026-07-22T03:09:00+03:00`
- Task Packet: owner prompt `BM QuestHub CMS — Review and Merge Task Prompt M1-07-REVIEW`
- Agent: parent release integrator / senior reviewer (Composer)
- Active repository policy: root `AGENTS.md`
- Active ExecPlan policy: root `PLANS.md`
- Canonical template: `docs/admin-cms/02_delivery/25_EXECPLAN_TEMPLATE.md`
- Commit policy: exactly one commit `docs: record M1-07 merge review`
- Push policy: non-force push; wait for final `pull_request` Admin CMS CI success before ready/merge
- Roadmap counter: increments only after verified merge (19/174; M1 7/12)
- Review-record commit SHA and merge SHA are authoritative in Git/PR and the final
  task report; they are intentionally not self-embedded in this commit.

## 1. Objective and non-goals

### Objective

Conduct frozen-diff review of two-commit draft PR #3, confirm production adapter
preserves legacy behavior without M1-08, verify corrected T3/T5/T6 evidence,
record APPROVE in this ExecPlan, obtain final Admin CMS CI, mark ready, merge
with merge commit + exact-head protection, verify post-merge `main`/CI, and
delete the remote feature branch while preserving the local branch and external
dirty state.

### Non-goals

- Fix findings inside this review (BLOCKER/MAJOR → separate corrective task);
- Edit any existing repository file (only create this ExecPlan);
- Add this ExecPlan to `docs/admin-cms/MANIFEST.sha256`;
- Start M1-08 / M1-09 / M2;
- Squash/rebase/auto merge, admin bypass, amend, force push, tag, release, deploy;
- Switch or delete the local feature branch;
- Stage or mutate external dirty paths;
- Fabricate an independent GitHub PR approval from another account.

## 2. PR identity

```text
PR: #3
URL: https://github.com/Brain-Master/BM_QuestHub/pull/3
Title: M1-07: isolate legacy token adapter
State (pre-review): OPEN / DRAFT / MERGEABLE
Base/head: main ← cms/m1-07-legacy-token-adapter
Initial head: 7a50da3223c966bf3b33fd99ddbbadc0ef6ee490
Initial commits/files: 2 / 7
Initial Admin CMS CI: 29878823188 SUCCESS (pull_request, exact head)
Submitted GitHub reviews: 0
Inline review threads: 0 unresolved (GraphQL nodes empty)
```

Live reverify before write matched Task Packet baseline. `origin/main` unchanged
at `6e508a108cb0e6222985134a3108708fd8d50e1d`. Ahead 2 / behind 0.

## 3. Commit history

Exact order vs `origin/main`:

| # | SHA | Subject |
|---|-----|---------|
| 1 | `ae08f01af80b61ee48fd2733aee4f1312f22d337` | security(admin): isolate legacy token adapter |
| 2 | `7a50da3223c966bf3b33fd99ddbbadc0ef6ee490` | test(admin): close legacy token evidence gaps |

After review-record commit: expected **3 commits / 8 files**.

## 4. Frozen scope

Seven changed files classified; none unclassified; no scope leakage.

| Class | Count | Paths |
|---|---:|---|
| production_adapter | 1 | `apps/admin/src/legacy-token-adapter.ts` |
| production_integrations | 2 | `apps/admin/src/App.tsx`, `apps/admin/src/api.ts` |
| tests | 2 | `apps/admin/src/legacy-token-adapter.test.ts`, `apps/admin/src/api.request-contract.test.ts` |
| execution_records | 2 | `docs/admin-cms/execplans/M1-07.md`, `docs/admin-cms/execplans/M1-07-R1.md` |
| **total** | **7** | |

Rejected classes absent: workflows, package/lock, backend, generated output,
snapshots, external dirty paths, secret material.

Frozen backup (outside repo):
`D:/WORK/01_Active_Projects/BM_QuestHub_M1-07-REVIEW_backup_20260722_031009`
(includes `pr-3.patch`, PR JSON, reviews/threads, external fingerprint).

External dirty fingerprint (M1-07 algorithm, 39 paths):
`41563d81ded1fdf2068b04095c5e2ff7afa36b25e50daba6ca280c1b9407a82c` — exact match
to M1-07-R1 final state; not staged.

## 5. Production hash verification

Working-tree bytes on Windows (`core.autocrlf=true`) match R1 frozen invariants
(same algorithm as M1-07/R1). Git blob OIDs equal `git hash-object` of WT after
CRLF→LF normalization; content identity preserved.

| Path | SHA-256 (WT / R1 invariant) | Result |
|---|---|---|
| `apps/admin/src/legacy-token-adapter.ts` | `9eb1a685644d502b867811d9769f22548dcc160d120d0261946142e826d644a4` | MATCH |
| `apps/admin/src/App.tsx` | `d27ffd2529c7399278bc8a722cb84e740d357ecc10fb850c5436969dbfe1516e` | MATCH |
| `apps/admin/src/api.ts` | `86f06a8ba527b56e3c51f79b51190c8ac6f8b7004c6c276a49a295c8901bb811` | MATCH |
| `apps/admin/src/api.request-contract.test.ts` | `22f216b2497f259abfb04e82dfe0a29adbf8f5310db3eee3f816556aedb60a16` | MATCH |
| `apps/admin/src/legacy-token-adapter.test.ts` | `de78233b9922171b242a4af4f9a37db8276072fe0afdaaf4b0d434bf6d3b6de0` | MATCH |
| `docs/admin-cms/execplans/M1-07.md` | `9e7e22d60f67f7b04c282b7a4fde82dfea3c4a4418633dcb2779cf881be066c7` | MATCH |
| `docs/admin-cms/execplans/M1-07-R1.md` | `9bc6691c8c98dded5b52e2de7517e2bd5a73b2e39d57496d20657ea5ae2f0f7c` | MATCH |

Combined R1 fingerprint (three R1 freeze paths, sorted relpath NUL bytes NUL):
`c6b7da5a2303d203b367bd2d2f64b526545665351d432a94297b17c01240c86b` — MATCH.

## 6. Reviewer A — architecture and behavior

Independent read-only pass over exact PR head `7a50da3…`.

| Check | Evidence | Result |
|---|---|---|
| Adapter interface + instance `@deprecated` | JSDoc on interface and `legacyTokenAdapter` | PASS |
| Replacement owner M3 | “server-side session flow owned by M3” | PASS |
| Private key not exported | `LEGACY_TOKEN_STORAGE_KEY` module-private | PASS |
| Read exact stored or `""` | `getItem ?? ""`; no trim | PASS |
| Write trims boundaries only | `value.trim()` on setItem | PASS |
| Blank write → empty-string write | T4; key remains present with `""` | PASS |
| No `clear`/`remove` API | Interface is `read`/`write` only | PASS |
| Module import has no storage access | T5: import with global absent | PASS |
| App initial read + save via adapter | `useState(() => read())`; `applyToken` → `write` | PASS |
| Status copy no storage leak | `Токен сохранён` | PASS |
| API header `x-content-token` | `headers()` uses `legacyTokenAdapter.read()` | PASS |
| GET/PUT/POST/timeout/error/boundary unchanged | `api.ts` request shape; 16 request contracts | PASS |
| Request tests retain 16 contracts | vitest 16/16 | PASS |
| No M1-08 clearing / auth state machine | No clear/remove on 401 in App/API/adapter | PASS |

## 7. Reviewer B — security and false-pass resistance

Independent second read-only pass.

| Check | Evidence | Result |
|---|---|---|
| Product `sessionStorage` only in adapter | T8 scan of product `.ts`/`.tsx` | PASS |
| Product storage key only in adapter | T8 `contentAdminToken` only in adapter | PASS |
| No token value/metadata logging | T7 spies all console methods | PASS |
| No localStorage/cookie/query/env/memory fallback | Adapter uses sessionStorage only; errors propagate | PASS |
| Original storage errors propagate | T6 `caught === boom` for read and write | PASS |
| T3 rejects extra key writes | Exact `[...store.entries()]` single pair | PASS |
| T5 imports with global storage absent | `"sessionStorage" in globalThis === false` then import | PASS |
| T5 rejects module-scope access | Absent global would throw on eager access; import OK | PASS |
| T6 original error identity | `toBe(boom)` identity for read/write | PASS |
| T7 all console methods | info/log/debug/warn/error | PASS |
| T8 excludes only tests/fixtures | Walk skips `*.test.*` and `test-fixtures` | PASS |
| N1/N2/N3 credible | Recorded in M1-07-R1 (fail-and-restore; product SHA unchanged) | PASS |
| Product hashes unchanged in R1 | Adapter/App/API/request-contract invariants identical | PASS |
| ExecPlans no DONE/placeholder contradiction | M1-07 factual pending-merge status; placeholders removed | PASS |

## 8. Findings table

| ID | Severity | Location | Finding | Disposition |
|---|---|---|---|---|
| — | BLOCKER | — | none | — |
| — | MAJOR | — | none | — |
| F1 | NOTE | `App.tsx` label “Bearer token” | Pre-existing UI label vs `x-content-token` header; not introduced by M1-07 storage-isolation work | Accept; out of scope |
| F2 | NOTE | Shared token mechanism | Known intentional limitation; centralization only | Accept; M3 owns replacement |
| F3 | NOTE | `M1-07-R1.md` status wording | Corrective record uses in-progress lifecycle language; not unfinished placeholders | Accept |

**Merge gate:** `BLOCKER = 0`, `MAJOR = 0`.

## 9. Adapter assessment

Production adapter is a minimal deprecated bridge:

```ts
read() { return sessionStorage.getItem(LEGACY_TOKEN_STORAGE_KEY) ?? ""; }
write(value: string) { sessionStorage.setItem(LEGACY_TOKEN_STORAGE_KEY, value.trim()); }
```

Legacy semantics preserved. No expansion of auth surface. APPROVE for merge.

## 10. App/API contract assessment

- App: adapter for initial token state and save; status copy cleaned.
- API: header still `x-content-token`; timeout/abort/error mapping unchanged;
  401 still maps to `AUTHENTICATION_REQUIRED` without clearing storage (M1-08).
- Request-contract tests seed via `legacyTokenAdapter.write`; 16 contracts retained.

## 11. Test evidence assessment

| ID | Proof | Result |
|---|---|---|
| T3 | Exact single storage entry after write | PASS |
| T5 | Absent-global import then later read/write | PASS |
| T6 | Original error identity read+write | PASS |
| T7 | No console logging of secrets | PASS |
| T8 | Centralization scan (product only) | PASS |
| N1–N3 | Documented fail-and-restore in R1 | PASS (record) |

Adapter suite 8/8; full admin vitest 6 files / 61; 0 fail / 0 skip / 0 todo.

## 12. M1-08 boundary assessment

No token clear on 401, no auth-failure state machine, no login/logout redesign,
no shared-token replacement. M1-08 remains unauthorized until this merge is
verified. **Boundary PASS.**

## 13. Local validation

Node `v22.23.1` / npm `10.9.8` (fnm installation on PATH).

| Command | Outcome |
|---|---|
| `npm --prefix apps/admin run test -- src/legacy-token-adapter.test.ts` | 8/8 PASS |
| `npm --prefix apps/admin run test -- src/api.request-contract.test.ts` | 16/16 PASS |
| `npm --prefix apps/admin run test` | 6 files / 61 PASS; 0 fail/skip/todo |
| `npm --prefix apps/admin run lint` | PASS |
| `npm --prefix apps/admin run typecheck` | PASS |
| `npm --prefix apps/admin ls --all` | PASS |
| `npm --prefix apps/admin run build` | PASS; `apps/admin/dist` removed afterward |
| `node --test scripts/admin-cms-ci-guard.test.mjs` | 16/16 PASS |
| `node scripts/admin-cms-ci-guard.mjs preflight --base 6e508a1…` | PASS with LF-manifest wrap (Windows autocrlf); WT restored; external fp unchanged |
| `make secret-scan` | PASS (1186 files) |

## 14. Remote CI validation

Initial (pre-review-record):

```text
Workflow: Admin CMS CI
Run: 29878823188
Event: pull_request
Head: 7a50da3223c966bf3b33fd99ddbbadc0ef6ee490
Conclusion: success
```

Final CI on review-record head is recorded in the task report after push
(not self-embedded here).

## 15. Merge strategy

- Method: **merge commit only** (`gh pr merge 3 --merge`).
- Exact-head: `--match-head-commit <final-review-head>`.
- Forbidden: `--squash`, `--rebase`, `--auto`, `--admin`.
- If GitHub requires an independent approval absent here: STOP (no self-bypass).
- This file is a repository review record, not a claim of third-party GitHub
  approval.

## 16. Exact-head protection

Merge only when:

1. `origin/main` still `6e508a108cb0e6222985134a3108708fd8d50e1d`;
2. PR head equals reviewed final review-record SHA;
3. PR OPEN, MERGEABLE, required checks green;
4. No CHANGES_REQUESTED / unresolved threads.

## 17. Branch cleanup

After verified merge + successful push-to-main Admin CMS CI:

- `git push origin --delete cms/m1-07-legacy-token-adapter` (no force);
- Local branch preserved;
- External dirty state untouched.

## 18. Rollback

On any stop condition: keep PR draft (or ready-but-unmerged), do not add further
commits, do not merge, do not reset/revert/force-push without a separate
authorized incident task.

## 19. Acceptance

V1–V67 from Task Packet must all PASS after merge verification. No PARTIAL.

## 20. Freeze

Freeze path for this review record:

```text
docs/admin-cms/execplans/M1-07-REVIEW.md
```

Algorithm: SHA-256 over relative path NUL file bytes NUL (single-file record).
Digest and review-record commit SHA are authoritative in the final task report.

## 21. Git/GitHub actions

1. Stage only `docs/admin-cms/execplans/M1-07-REVIEW.md`.
2. Commit: `docs: record M1-07 merge review` (no amend).
3. Push branch without force.
4. Wait for Admin CMS CI `pull_request` success on exact new head.
5. Update PR body with APPROVE / review-record / final CI / 3×8 / merge method.
6. `gh pr ready 3`.
7. `gh pr merge 3 --merge --match-head-commit <exact-final-head>`.
8. Fetch; verify parents/tree; wait push-to-main CI; delete remote branch.

## 22. Final status

**Verdict: APPROVE**

Owned by final task report after merge:

- review-record commit SHA;
- final PR CI run ID / success;
- merge SHA / two parents / tree equality;
- post-merge main CI;
- remote branch absent;
- formal progress 19/174; M1 7/12;
- M1-08 not started.
