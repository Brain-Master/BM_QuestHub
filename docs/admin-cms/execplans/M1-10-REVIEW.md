# ExecPlan M1-10-REVIEW — Review and merge safe UI error formatter PR #6

## 0. Metadata

- Status: `APPROVE` (repository review record; merge actions follow this freeze)
- Classification: `repository_execution_record` / integration merge review
- Repository: `Brain-Master/BM_QuestHub` (`D:/WORK/01_Active_Projects/BM_QuestHub`)
- Branch: `cms/m1-10-safe-ui-error-formatter`
- Base SHA (`origin/main`): `3f0e99278f996cb8281956e83105a2e9aa736a0c`
- Pre-review feature HEAD: `86bc21e19a46e1b177f1aef501835cf12ea5aa28`
- Initial Admin CMS CI: run `29965025539` / `pull_request` / `success`
- Started at: `2026-07-23T02:55:00+03:00`
- Task Packet: owner prompt `BM QuestHub CMS — Review and Merge Task Prompt M1-10-REVIEW`
- Agent: parent release integrator / senior reviewer (Composer)
- Active repository policy: root `AGENTS.md`
- Active ExecPlan policy: root `PLANS.md`
- Canonical template: `docs/admin-cms/02_delivery/25_EXECPLAN_TEMPLATE.md`
- Commit policy: exactly one commit `docs: record M1-10 merge review`
- Push policy: non-force push; wait for final `pull_request` Admin CMS CI success before ready/merge
- Roadmap counter: increments only after verified merge (22/174; M1 10/12)
- Review-record commit SHA and merge SHA are authoritative in Git/PR and the
  final task report; they are intentionally not self-embedded in this commit.

## 1. Objective and non-goals

### Objective

Conduct frozen-diff review of one-commit draft PR #6, confirm safe UI error
formatter for known/unknown errors, verify absence of raw
message/stack/cause/payload/issues in UI status text, verify inbound
correlation-ID pipeline and non-2xx body redaction preservation, confirm
M1-08 auth transition unchanged and M1-11 scope absent, record APPROVE in this
ExecPlan, obtain final Admin CMS CI, mark ready, merge with merge commit +
exact-head protection, verify post-merge `main`/CI, and delete the remote
feature branch while preserving the local branch and external dirty state.

### Non-goals

- Fix findings inside this review (BLOCKER/MAJOR → separate corrective task);
- Edit any existing repository file (only create this ExecPlan);
- Add this ExecPlan to `docs/admin-cms/MANIFEST.sha256`;
- Start M1-11 / M1-12 / M2;
- Squash/rebase/auto merge, admin bypass, amend, force push, tag, release, deploy;
- Switch or delete the local feature branch;
- Stage or mutate external dirty paths;
- Fabricate an independent GitHub PR approval from another account;
- Rerun destructive R1–R6 probes after freeze (evidence already recorded).

## 2. PR identity

```text
PR: #6
URL: https://github.com/Brain-Master/BM_QuestHub/pull/6
Title: M1-10: add safe UI error formatter
State (pre-review): OPEN / DRAFT / MERGEABLE
Base/head: main ← cms/m1-10-safe-ui-error-formatter
Initial reviewed head: 86bc21e19a46e1b177f1aef501835cf12ea5aa28
Initial commits/files: 1 / 6
Initial Admin CMS CI: 29965025539 SUCCESS (pull_request, exact head)
Submitted GitHub reviews: 0
Inline review threads: 0 unresolved (GraphQL nodes empty)
Compare: ahead 1 / behind 0
```

## 3. Commit history

Exact order vs `origin/main`:

| # | SHA | Subject |
|---|-----|---------|
| 1 | `86bc21e19a46e1b177f1aef501835cf12ea5aa28` | ux(admin): add safe UI error formatter |

After review-record commit: expected **2 commits / 7 files**.

Live reverify before write matched Task Packet baseline. `origin/main` unchanged
at `3f0e99278f996cb8281956e83105a2e9aa736a0c`.

## 4. Frozen six-file scope

Six changed files classified; none unclassified; no scope leakage.

| Class | Count | Paths |
|---|---:|---|
| ui_boundary | 1 | `apps/admin/src/ui-error-formatter.ts` |
| api_client | 1 | `apps/admin/src/api.ts` |
| legacy_ui_integration | 1 | `apps/admin/src/App.tsx` |
| tests | 2 | `apps/admin/src/ui-error-formatter.test.ts`, `apps/admin/src/api.request-contract.test.ts` |
| execution_record | 1 | `docs/admin-cms/execplans/M1-10.md` |
| **total** | **6** | |

Numstat vs base:

| Path | + / − |
|---|---|
| `apps/admin/src/App.tsx` | 2 / 1 |
| `apps/admin/src/api.request-contract.test.ts` | 143 / 1 |
| `apps/admin/src/api.ts` | 56 / 1 |
| `apps/admin/src/ui-error-formatter.test.ts` | 330 / 0 |
| `apps/admin/src/ui-error-formatter.ts` | 107 / 0 |
| `docs/admin-cms/execplans/M1-10.md` | 281 / 0 |

Rejected classes absent: auth-state/token-adapter changes; snapshot/selectors;
package/lock/config; workflow/tooling; backend/web/generated; external dirty
paths; secret material.

Frozen backup (outside repo):
`D:/WORK/01_Active_Projects/BM_QuestHub_M1-10-REVIEW_backup_20260723_025737`
(includes `pr-6.patch`, PR JSON, reviews/threads, external fingerprint, SHA-256
sums for each artifact).

External dirty fingerprint (Node Buffer.compare ordinal sort, 39 paths):
`41563d81ded1fdf2068b04095c5e2ff7afa36b25e50daba6ca280c1b9407a82c` — exact match;
not staged.

## 5. Hash / fingerprint verification

Working-tree SHA-256 recomputed with sorted `path NUL bytes NUL`.

| Path | SHA-256 (WT) | Prefix check |
|---|---|---|
| `apps/admin/src/App.tsx` | `1bccd90cda607f347bf6ac3045b072cfed2aedab5e900ea871e88c1353167e1f` | `1bccd90c…` MATCH |
| `apps/admin/src/api.request-contract.test.ts` | `e087253af98c7bc4c73cf3e1e5486f55836f046ef9affa83a98d4bbd386aa53d` | `e087253a…` MATCH |
| `apps/admin/src/api.ts` | `2a90f14c85e98a1e974c1e793526da4eefb10833234f7c20c4f0bf1693995a61` | `2a90f14c…` MATCH |
| `apps/admin/src/ui-error-formatter.test.ts` | `da7b10bfeafba2bbfc9ffd69f22085bd363bcab6e3b8a80c2468dcebc13173ac` | `da7b10bf…` MATCH |
| `apps/admin/src/ui-error-formatter.ts` | `61ea3a7b90142b77b12db9f264a9aba32b1998ed962cba5162135017e44bc4e4` | `61ea3a7b…` MATCH |
| `docs/admin-cms/execplans/M1-10.md` | `406e26400c4cc06c484a6a83fb40109f1fb9053ae0be6fbae3abd6626cb27bbe` | `406e2640…` MATCH |

Combined six-path fingerprint:
`abd2dc5178787bf3f26acbffbce5c4baef83646887c37c71b670579b0b24aa10` — MATCH.

Committed feature-head blobs equal working-tree bytes for all six paths
(`blob==wt: true`). No line-ending drift from freeze bytes for PR paths.

Forbidden source files have identical base/head blobs (auth-failure,
legacy-token, snapshot-boundary/contract/fixtures/selectors, api.smoke,
main, test-fixtures directory has no PR diff).

## 6. Reviewer A — taxonomy, API behavior and ownership

Independent read-only pass over exact PR head `86bc21e…`.

| Check | Evidence | Result |
|---|---|---|
| `UiErrorPresentation` two public properties | `text`, `correlationId` only | PASS |
| Presentation frozen | `Object.freeze` in `present`; F15 mutation throws | PASS |
| Formatter pure/deterministic | no I/O/logging/env; F15 first===second | PASS |
| Exact Russian mappings | `API_CLIENT_COPY` + timeout/abort/snapshot/syntax/generic | PASS |
| Matching order | ApiClient → Snapshot → Timeout → Abort → Syntax → generic | PASS |
| Structural lookalikes → generic | F11 object with `code: PERMISSION_DENIED` → GENERIC | PASS |
| Known inputs cannot expose raw messages | F7–F10/F14 markers absent | PASS |
| Base ≤80 / final ≤170 | constants + F15 asserts | PASS |
| `ApiClientError` two-arg constructor compatible | optional 3rd arg; existing call sites unchanged | PASS |
| Safe correlation optional | property omitted when unsafe/absent | PASS |
| Header priority | `x-request-id` then `x-correlation-id`; Q18 | PASS |
| First accepted header used | Q18 preferred when both present | PASS |
| No trim/coercion | length/regex only; leading space rejected | PASS |
| Unsafe values not retained | constructor + formatter re-sanitize; F13/Q19 | PASS |
| Non-2xx body unread | no `res.json`/`text` on error; 422/Q17/Q19 | PASS |
| Status mapping unchanged | 401/403/409/422/5xx/else identical | PASS |
| Timeout/cancel unchanged | DOMException TimeoutError/AbortError | PASS |
| App auth transition first | `authFailureTransition` then formatter; F16 | PASS |
| Auth branch returns before formatter | `return` inside `if (transition)` | PASS |
| Three catches routed | refresh/save/publish → `handleRequestError` | PASS |
| Success copy / edit buffers unchanged | App delta only import + non-401 fallback | PASS |
| No M1-11 outbound IDs/telemetry/logging | `headers()` still content-type + token only | PASS |

Verdict A: `APPROVE`

## 7. Reviewer B — leakage and false-pass resistance

Independent second read-only pass.

| Check | Evidence | Result |
|---|---|---|
| No `error.message` for display | formatter uses codes/instanceof only | PASS |
| No stack/cause/payload/issues reads | baseMessageFor + present; F9/F14 | PASS |
| Presentation has no raw object refs | frozen `{text, correlationId}` only | PASS |
| Generic Error/string/object/Symbol → fallback | F11 PRIVATE_MARKER absent | PASS |
| Snapshot issues do not leak | F9 path/code/issues absent | PASS |
| JSON parser fragments do not leak | F10 message / Unexpected / position | PASS |
| Malformed/unsafe correlation IDs omitted | F13/Q19 | PASS |
| Secret-like IDs rejected case-insensitively | `toLowerCase` + substring markers | PASS |
| Forged `correlationId` re-sanitized | F13 Object.defineProperty forge | PASS |
| Rejected headers absent from Error/string/JSON | Q19 | PASS |
| Q17 safe header without body parse | `json` not called; marker absent | PASS |
| Q18 fallback and priority | corr-only then preferred | PASS |
| Q19 rejection/no leak | unsafe headers undefined + no leak | PASS |
| Existing 422 redaction remains | unchanged test effect; body not read | PASS |
| F16 detects App raw-fallback regression | requires formatter import/order/return | PASS |
| R1–R6 credible | recorded fail-then-restore; fingerprint verified | PASS |
| Tests not mere constant copies | behavioral markers / source wiring / JSON asserts | PASS |

Verdict B: `APPROVE`

## 8. Findings table

| ID | Severity | Location | Finding | Disposition |
|---|---|---|---|---|
| — | BLOCKER | — | none | — |
| — | MAJOR | — | none | — |
| F1 | NOTE | Windows autocrlf preflight | Requires temporary LF-manifest wrap; restored; external fp unchanged | Accept (known env) |
| F2 | NOTE | `api.ts` / `ui-error-formatter.ts` | Duplicated private correlation sanitizers; semantic parity verified | Accept (M1-10 allowed) |
| F3 | NOTE | R1–R6 | Controlled regressions recorded in M1-10; not re-probed after freeze per Task Packet | Accept |

**Merge gate:** `BLOCKER = 0`, `MAJOR = 0`.

## 9. Formatter taxonomy assessment

Public shape exact: `formatUiError(unknown) → Readonly<{text, correlationId}>`.
Known codes map via `instanceof ApiClientError` + `error.code` table only.
Timeout/Abort via `DOMException` name. Snapshot/Syntax exact copy.
Unknown/lookalike → `Не удалось выполнить операцию`. Bounds 80/170 enforced.
APPROVE.

## 10. Raw-field redaction assessment

Formatter never interpolates `message`/`stack`/`cause`/`payload`/`issues`.
Presentation keys only `text`/`correlationId`. F7–F11/F14 prove marker absence
and key-set equality. APPROVE.

## 11. Correlation pipeline assessment

Safe regex `^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$`; length 1..64; no trim.
Secret-like rejection case-insensitive. Priority x-request-id → x-correlation-id.
Storage only sanitized. Formatter defence-in-depth re-sanitizes.
Render: `<base> Код обращения: <id>`. Outbound request headers unchanged
(no correlation outbound). Sanitizer semantic parity between modules: PASS.
APPROVE.

## 12. API body-redaction assessment

Non-2xx path throws `ApiClientError` after header read only; response body not
parsed. Existing 422 test + Q17/Q19 prove `json` not called and private marker
absent from String/JSON. Status mapping and timeout/cancel behavior unchanged.
APPROVE.

## 13. App / auth-boundary assessment

Exact App delta: import `formatUiError`; replace
`error instanceof Error ? error.message : String(error)` with
`formatUiError(error).text`. Auth path still:
`authFailureTransition` → clear token → setTokenInput/setAuthState/setStatus →
`return`. Non-auth: formatter text only. Forbidden raw/buffer/reload/timer
patterns absent in handler. All three catches call `handleRequestError`.
APPROVE.

## 14. Test false-pass assessment

Formatter describe `safe admin UI error formatter`: **16** tests.
Request suite: **16 preserved + Q17–Q19 = 19**.
F7/F8 reject raw timeout/cancel text. F9/F10 reject issues/parser fragments.
F11 maps diverse unknowns to one fallback. F13 rejects unsafe/forged IDs.
F14 raw fields + exact keys. F15 freeze/determinism/bounds. F16 App wiring +
three-catch routing. Q17–Q19 header capture/priority/rejection. Existing 422
redaction effective. Returning raw message would fail F11/F14 (and F7–F10).
APPROVE.

## 15. Controlled-regression assessment

Recorded probes in `M1-10.md` §16:

| ID | Probe | Required failure | Result |
|---|---|---|---|
| R1 | generic raw message leak | F11/F14 | FAIL then restore |
| R2 | App raw fallback | F16 | FAIL then restore |
| R3 | PERMISSION mapping removed | F2 | FAIL then restore |
| R4 | unsafe ID accepted | F13/Q19 | FAIL then restore |
| R5 | valid ID omitted | F12 | FAIL then restore |
| R6 | non-2xx body parsed | 422/Q17/Q19 | FAIL then restore |

Evidence credible; not re-run after freeze. Post-restore fingerprint matches
authorized six-file freeze. Focused suites 16/19/10/18. APPROVE.

## 16. Execution-record assessment

`docs/admin-cms/execplans/M1-10.md` status:
`IMPLEMENTATION FROZEN / APPROVE FOR DRAFT PR`.

Required lifecycle wording present (future commit SHA/PR/CI intentionally not
self-embedded). Base/branch factual. Mappings and sanitizer policy factual.
Validation counts factual. Final implementation status complete. No
`PENDING CI` / `filled later` / `recorded after` / `TBD` / `TODO`. No false
merge claim. Reviewer verdicts APPROVE. No M1-11 authorization. APPROVE.

## 17. M1-11 / M1-12 boundary

No outbound request ID generation, no operation/duration hooks, no logging,
no observability client changes beyond inbound sanitized correlation capture.
M1-11 / M1-12 / M2 unauthorized until this merge is verified.
**Boundary PASS.**

## 18. Local validation

Node `v22.23.1` / npm `10.9.8` (fnm 1.39.0; WinGet fnm path + env).

| Command | Outcome |
|---|---|
| `npm --prefix apps/admin run test -- src/ui-error-formatter.test.ts` | 16/16 PASS |
| `npm --prefix apps/admin run test -- src/api.request-contract.test.ts` | 19/19 PASS |
| `npm --prefix apps/admin run test -- src/auth-failure-state.test.ts` | 10/10 PASS |
| `npm --prefix apps/admin run test -- src/snapshot-contract.test.ts` | 18/18 PASS |
| `npm --prefix apps/admin run test` | 9 files / 110 PASS; 0 fail/skip/todo |
| `npm --prefix apps/admin run lint` | PASS |
| `npm --prefix apps/admin run typecheck` | PASS |
| `npm --prefix apps/admin ls --all` | PASS |
| `npm --prefix apps/admin run build` | PASS; `apps/admin/dist` removed afterward |
| `node --test scripts/admin-cms-ci-guard.test.mjs` | 16/16 PASS |
| `node scripts/admin-cms-ci-guard.mjs preflight --base 3f0e992…` | PASS with LF-manifest wrap (Windows autocrlf); WT restored; external fp unchanged; `changed=6` |
| `make secret-scan` | PASS (1198 files) |

Remote initial CI:

```text
Workflow: Admin CMS CI
Run: 29965025539
Event: pull_request
Head: 86bc21e19a46e1b177f1aef501835cf12ea5aa28
Conclusion: success
```

Final CI on review-record head is recorded in the task report after push
(not self-embedded here).

## 19. Remote CI validation

Initial PR CI verified live before review write. Final PR CI must succeed on
exact review-record head (`pull_request` event) before ready/merge. Push-to-main
Admin CMS CI must succeed after merge because admin/docs paths changed.

## 20. Merge strategy

- Method: **merge commit only** (`gh pr merge 6 --merge`).
- Exact-head: `--match-head-commit <final-review-head>`.
- Forbidden: `--squash`, `--rebase`, `--auto`, `--admin`.
- If GitHub requires an independent approval absent here: STOP (no self-bypass).
- This file is a repository review record, not a claim of third-party GitHub
  approval.

## 21. Exact-head protection

Merge only when:

1. `origin/main` still `3f0e99278f996cb8281956e83105a2e9aa736a0c`;
2. PR head equals reviewed final review-record SHA;
3. PR OPEN, MERGEABLE, required checks green;
4. No CHANGES_REQUESTED / unresolved threads;
5. `--match-head-commit` equals that exact SHA.

## 22. Branch cleanup

After verified merge + successful push-to-main Admin CMS CI:

- `git push origin --delete cms/m1-10-safe-ui-error-formatter` (no force);
- Local branch preserved;
- External dirty state untouched.

## 23. Rollback

On any stop condition: keep PR draft (or ready-but-unmerged), do not add further
commits, do not merge, do not reset/revert/force-push without a separate
authorized incident task.

## 24. Acceptance

V1–V102 from Task Packet must all PASS after merge verification. No PARTIAL.

## 25. Freeze

Freeze path for this review record:

```text
docs/admin-cms/execplans/M1-10-REVIEW.md
```

Algorithm: SHA-256 over relative path NUL file bytes NUL (single-file record).
Digest and review-record commit SHA are authoritative in the final task report.

## 26. Git/GitHub actions

1. Stage only `docs/admin-cms/execplans/M1-10-REVIEW.md`.
2. Commit: `docs: record M1-10 merge review` (no amend).
3. Push branch without force.
4. Wait for Admin CMS CI `pull_request` success on exact new head.
5. Update PR body with APPROVE / review-record / final CI / 2×7 / merge method.
6. `gh pr ready 6`.
7. `gh pr merge 6 --merge --match-head-commit <exact-final-head>`.
8. Fetch; verify parents/tree; wait push-to-main CI; delete remote branch.

## 27. Final status

**Verdict: APPROVE**

Owned by final task report after merge:

- review-record commit SHA;
- final PR CI run ID / success;
- merge SHA / two parents / tree equality;
- post-merge main CI;
- remote branch absent;
- formal progress 22/174; M1 10/12;
- M1-11 not started.
