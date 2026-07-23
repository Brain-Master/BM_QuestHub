# ExecPlan M1-11-REVIEW — Review and merge corrected API observability hooks PR #7

## 0. Metadata

- Status: `APPROVE` (repository review record; merge actions follow this freeze)
- Classification: `repository_execution_record` / integration merge review
- Repository: `Brain-Master/BM_QuestHub` (`D:/WORK/01_Active_Projects/BM_QuestHub`)
- Branch: `cms/m1-11-api-observability`
- Base SHA (`origin/main`): `63e28cdb785fa2a7fc10ae645b9d6f431a97204e`
- Pre-review corrected feature HEAD: `a8a90696ed7060710f78e0a7892036adaad1d7eb`
- Initial corrected Admin CMS CI: run `29971879214` / `pull_request` / `success`
- Started at: `2026-07-23T04:48:00+03:00`
- Task Packet: owner prompt `BM QuestHub CMS — Review and Merge Task Prompt M1-11-REVIEW`
- Agent: parent release integrator / senior reviewer (Composer)
- Active repository policy: root `AGENTS.md`
- Active ExecPlan policy: root `PLANS.md`
- Canonical template: `docs/admin-cms/02_delivery/25_EXECPLAN_TEMPLATE.md`
- Commit policy: exactly one commit `docs: record M1-11 merge review`
- Push policy: non-force push; wait for final `pull_request` Admin CMS CI success before ready/merge
- Roadmap counter: increments only after verified merge (23/174; M1 11/12)
- Review-record commit SHA and merge SHA are authoritative in Git/PR and the
  final task report; they are intentionally not self-embedded in this commit.

## 1. Objective and non-goals

### Objective

Conduct frozen-diff review of two-commit draft PR #7, confirm the minimal safe
API observability contract, re-verify M1-11-R1 clock-isolation correction and
Q29 false-pass closure, confirm one outbound request ID and one terminal
observation with original result/error identity, cleanup ordering and redaction,
confirm absence of logging/global sink/SDK and scope creep, record APPROVE in
this ExecPlan, obtain final Admin CMS CI, mark ready, merge with merge commit +
exact-head protection, verify post-merge `main`/CI, and delete the remote
feature branch while preserving the local branch and external dirty state.

### Non-goals

- Fix findings inside this review (BLOCKER/MAJOR → separate corrective task);
- Edit any existing repository file (only create this ExecPlan);
- Add this ExecPlan to `docs/admin-cms/MANIFEST.sha256`;
- Start M1-12 / M2;
- Squash/rebase/auto merge, admin bypass, amend, force push, tag, release, deploy;
- Switch or delete the local feature branch;
- Stage or mutate external dirty paths;
- Fabricate an independent GitHub PR approval from another account;
- Rerun destructive R1–R8 / N1 probes after freeze (evidence already recorded).

## 2. PR identity

```text
PR: #7
URL: https://github.com/Brain-Master/BM_QuestHub/pull/7
Title: M1-11: add API client observability hooks
State (pre-review): OPEN / DRAFT / MERGEABLE
Base/head: main ← cms/m1-11-api-observability
Initial corrected reviewed head: a8a90696ed7060710f78e0a7892036adaad1d7eb
Initial commits/files: 2 / 6
Initial Admin CMS CI: 29971879214 SUCCESS (pull_request, exact head)
Submitted GitHub reviews: 0
Inline review threads: 0 unresolved (GraphQL nodes empty)
Compare: ahead 2 / behind 0
```

## 3. Commit history

Exact order vs `origin/main`:

| # | SHA | Subject |
|---|-----|---------|
| 1 | `7c7f5849cb5f8db46debfebf51bb9940e7192e55` | obs(admin): add API request lifecycle hooks |
| 2 | `a8a90696ed7060710f78e0a7892036adaad1d7eb` | fix(admin): isolate observability clock failures |

After review-record commit: expected **3 commits / 7 files**.

Live reverify before write matched Task Packet baseline. `origin/main` unchanged
at `63e28cdb785fa2a7fc10ae645b9d6f431a97204e`.

## 4. Frozen six-file scope

Six changed files classified; none unclassified; no scope leakage.

| Class | Count | Paths |
|---|---:|---|
| observability_boundary | 1 | `apps/admin/src/api-observability.ts` |
| tests | 2 | `apps/admin/src/api-observability.test.ts`, `apps/admin/src/api.request-contract.test.ts` |
| api_client | 1 | `apps/admin/src/api.ts` |
| execution_records | 2 | `docs/admin-cms/execplans/M1-11.md`, `docs/admin-cms/execplans/M1-11-R1.md` |
| **total** | **6** | |

Numstat vs base:

| Path | + / − |
|---|---|
| `apps/admin/src/api-observability.test.ts` | 321 / 0 |
| `apps/admin/src/api-observability.ts` | 119 / 0 |
| `apps/admin/src/api.request-contract.test.ts` | 553 / 4 |
| `apps/admin/src/api.ts` | 202 / 17 |
| `docs/admin-cms/execplans/M1-11-R1.md` | 299 / 0 |
| `docs/admin-cms/execplans/M1-11.md` | 312 / 0 |

Rejected classes absent: App/formatter/auth changes; snapshot/selectors/fixture
changes; package/lock/config; workflow/tooling; web/backend/public data;
generated output; external dirty paths; secret material.

No PR diff in required unchanged paths (`App.tsx`, formatter, auth,
legacy-token, snapshot-boundary/contract/selectors, package.json/lock,
`.github/workflows/admin-cms-ci.yml`, `test-fixtures/**`).

Frozen backup (outside repo):
`D:/WORK/01_Active_Projects/BM_QuestHub_M1-11-REVIEW_backup_20260723_045133`
(includes `pr-7.patch`, PR JSON, reviews/threads, external fingerprint, SHA-256
sums for each artifact).

External dirty fingerprint (sorted path NUL bytes NUL, 39 paths):
`41563d81ded1fdf2068b04095c5e2ff7afa36b25e50daba6ca280c1b9407a82c` — exact match;
not staged.

## 5. Original M1-11 fingerprint

Reported original five-path combined fingerprint (M1-11 freeze, WT algorithm):
`b5c63d4f1cb49c59405a5b54ef975627278539697c349236fe5bf4ac6fbe28f5`.

Unchanged module/test WT hashes at corrected head equal original M1-11 freeze
prefixes:

| Path | WT SHA-256 | Prefix |
|---|---|---|
| `apps/admin/src/api-observability.ts` | `75f3e60e84161a1748764f196af2e1e0f10712358f2262e82fa373a4d7496f6f` | `75f3e60e…` |
| `apps/admin/src/api-observability.test.ts` | `97fcf2308fc31be026ca47cf9350f686b7ad16604037e792422e256befd11503` | `97fcf230…` |

## 6. Corrective M1-11-R1 fingerprint

Four-path corrective combined fingerprint (exact):
`61ae4d7cc879208287a2fcc74cd8d87871b6981856692ea9b99fc473fa65b0d1`.

| Path | WT SHA-256 | Prefix |
|---|---|---|
| `apps/admin/src/api.ts` | `2b7ae46dd2a56d151f70ecc30aabb843dc444256329a1b6e7590febe29754b84` | `2b7ae46d…` |
| `apps/admin/src/api.request-contract.test.ts` | `c61952ca539c8b4ec6b8d9300299993ee49027ad1ef2fd3268544655b9010f1f` | `c61952ca…` |
| `docs/admin-cms/execplans/M1-11.md` | `a127b83f5c9ddd7f4171e276d4fd83fdb7f77f368c7c73205e88eb6b4ccfa8c5` | `a127b83f…` |
| `docs/admin-cms/execplans/M1-11-R1.md` | `6931b90e2d88328c44e3f4c5fe4050d35deeeeb1a18100f096ac0ae66b90ef3c` | `6931b90e…` |

Windows `core.autocrlf` note: working-tree bytes are CRLF while committed blobs
are LF; after CRLF→LF normalization, WT content equals blob bytes for all six
PR paths. Freeze/review hashes use WT bytes matching recorded prefixes.
No unexpected line-ending content drift beyond known Windows autocrlf.

## 7. Reviewer A — lifecycle architecture

Independent read-only pass over exact PR-head bytes at `a8a90696…`.

| Check | Evidence | Result |
|---|---|---|
| Operation map exact/frozen | `API_OPERATIONS` Object.freeze; 8 values | PASS |
| No dynamic/raw path operation names | `saveSnapshotOperation` / `publishContentOperation` switches; Q21/Q22 | PASS |
| Request ID once per public operation | `resolveRequestId` once in `withApiObservation` | PASS |
| Same ID header and event | `headers(requestId)` + observation; Q20/Q29 | PASS |
| Existing content-type/token headers preserved | `headers()` keeps both + `x-request-id` | PASS |
| No outbound `x-correlation-id` | Q20 asserts undefined | PASS |
| Load observation includes JSON + snapshot boundary | `loadSnapshots` executes parse inside `withApiObservation`; Q26 | PASS |
| Save/publish maps total | 5 save + 2 publish + load = 8 | PASS |
| One `withApiObservation` terminal path | single `finally` emission | PASS |
| One event on success / each error class | Q20–Q28 | PASS |
| Original success result unchanged | Q20/Q29 return values | PASS |
| Original thrown object identity preserved | catch rethrows same `error`; Q23/Q27/Q28/Q29 | PASS |
| Cleanup before outer observation | `request` finally cleanup; observation in outer finally after await settle; Q24/Q25 timers 0 | PASS |
| Invalid snapshots → `invalid_response` | Q26 | PASS |
| Successful-response SyntaxError → `invalid_response` | Q27 | PASS |
| HTTP errors retain status | Q23/Q29 | PASS |
| Structural lookalikes → `transport_error` | Q28 network Error | PASS |
| No retry/sampling/batching/persistence | module + api source inspection | PASS |
| No M1-12 behavior | docs-only next task; no contract changes beyond observability | PASS |

Verdict: `APPROVE`

## 8. Reviewer B — redaction and failure isolation

Independent second read-only pass over the same frozen bytes.

| Check | Evidence | Result |
|---|---|---|
| Event exact five keys / frozen | `createApiRequestObservation` Object.freeze; tests | PASS |
| Request ID sanitizer exact | bounded pattern; no trim/coercion | PASS |
| Secret-like IDs rejected | token/secret/password/authorization/bearer/api-key/sk-/gh* | PASS |
| No Math.random | default `crypto.randomUUID()` only | PASS |
| Unsafe custom factory falls back safely | `resolveRequestId` try/catch → UUID | PASS |
| Default generator failure bounded | throws `Unable to create API request ID` before fetch | PASS |
| Duration non-negative integer | `normalizeApiDurationMs` | PASS |
| Custom/default clock throw/non-finite → 0 | corrected `readNow`; Q29 | PASS |
| Failed custom never invokes default | Q29 stub call count 0 | PASS |
| Observer exception cannot replace result/error | nested try in `emitObservationSafely`; Q29 | PASS |
| Observation-construction failure isolated | outer try in `emitObservationSafely` | PASS |
| Non-2xx body unread | Q23/Q29 `json` not called | PASS |
| No body/token/header/URL/path/error fields | redaction tests + Q23 | PASS |
| No console/global sink/SDK/storage | module source markers + no imports | PASS |
| M1-10 inbound correlation unchanged | same sanitize/header priority; no PR diff to formatter | PASS |
| M1-11-R1 closes original false-pass | strengthened Q29 + N1 evidence | PASS |

Verdict: `APPROVE`

## 9. Findings table

| ID | Severity | Disposition | Notes |
|---|---|---|---|
| F-clock-isolation | MAJOR (prior) | RESOLVED by `a8a90696…` | Original unguarded custom→default fallback; fixed `readNow` + Q29 |
| — | BLOCKER | none | 0 new |
| — | MAJOR | none | 0 new |
| N1 | NOTE | accepted | Duplicate M1-10/M1-11 sanitizers remain separate boundaries |
| N2 | NOTE | accepted | Source-inspection tests intentionally brittle |
| N3 | NOTE | accepted | Observability has no production sink by design |
| N4 | NOTE | accepted | Windows LF-manifest wrap / autocrlf WT≠blob raw; content-normalized equal |
| N5 | NOTE | accepted | Controlled R1–R8 / N1 not re-probed during frozen review |

## 10. Prior MAJOR disposition

Original clock-isolation MAJOR discovered in draft review of M1-11:

- custom throw/non-finite fell through to unguarded `performance.now()`;
- default clock outside try/catch could replace success/error or skip observation;
- original Q29 false-passed (proved fallback-to-default while real default stayed healthy).

Corrective commit `a8a90696ed7060710f78e0a7892036adaad1d7eb` isolates clocks in one
try/catch, returns `0` on failure, never falls back from failed custom to
default, and strengthens Q29. **RESOLVED.**

## 11. Operation taxonomy assessment

Exact frozen vocabulary of eight operations confirmed:
`load_snapshots`, `save_catalog`, `save_map`, `save_site`, `save_manifest`,
`save_offers`, `publish_hot`, `publish_cold`. No raw path/URL operation names.

## 12. Outcome taxonomy assessment

Exact six outcomes confirmed:
`success`, `http_error`, `timeout`, `cancelled`, `invalid_response`,
`transport_error`. Classification covers ApiClientError, TimeoutError,
AbortError, SnapshotBundleValidationError, SyntaxError, else transport.

## 13. Event schema / redaction assessment

Exact five keys in order: `requestId`, `operation`, `durationMs`, `outcome`,
`httpStatus`. Observation frozen. `httpStatus` retained only for `http_error`
with integer 100..599. Forbidden content (body/payload/data/token/authorization/
headers/URL/path/query/message/stack/cause/response/issues/snapshot/user identity/
timestamps) absent from event schema and covered by redaction tests.

## 14. Request-ID assessment

Outbound header `x-request-id`; default `crypto.randomUUID()`; same exact ID in
header and event; sanitizer rejects secret-like/malformed IDs without trim;
unsafe custom factory falls back; no outbound `x-correlation-id`; existing
content-type and token headers preserved.

## 15. Duration / clock assessment

Corrected private `readNow` selects custom or default first, then calls inside
one try/catch. Finite values returned exactly; throw/non-finite → `0`; failed
custom does not call default. Duration normalization yields non-negative integer.
Clock errors never escape, never prevent fetch, never replace success or
original request error; terminal event still emitted once with `durationMs` 0.

## 16. Observer / factory isolation assessment

Observer and observation-construction failures swallowed inside
`emitObservationSafely`. Factory throw/unsafe ID falls back to sanitized UUID
before fetch. Q29 proves success and HTTP-error paths preserve original
result/error identity under clock/observer/factory failures.

## 17. Single-event / cleanup assessment

Exactly one terminal emission in `withApiObservation.finally` after execute
settlement. `request` cleanup (`clearTimeout` / abort listener removal) completes
inside nested finally before outer observation. Q24/Q25 prove one timeout/
cancel event with timers cleaned.

## 18. Original-result / error identity assessment

Success value preserved. Exact object identity preserved for ApiClientError,
TimeoutError, AbortError, SnapshotBundleValidationError, SyntaxError, network
Error, and arbitrary thrown values (rethrow same reference). Clock/observer
errors never substituted.

## 19. Snapshot-boundary scope assessment

`loadSnapshots` includes `parseSnapshotsBundle` inside observed execute scope;
malformed snapshots classify as `invalid_response` (not success). Q26 proves
boundary inclusion.

## 20. Test false-pass assessment

Observability suite: describe `admin API observability contract`, **12** tests.
Request suite: **19** pre-M1-11 preserved + **10** new (Q20–Q29) = **29** total.
Q20–Q29 cover same-ID, operation maps, HTTP redaction, cleanup/event count,
boundary, JSON classification, network identity, and clock/factory isolation.

## 21. R1–R8 assessment

Recorded M1-11 controlled regressions (remove request-id; add body/token fields;
raw path operation; negative duration; observer breaks operation; observe before
boundary; duplicate event; parse non-2xx body) each failed intended assertions,
then exact source restore. Credible; not re-probed in this frozen review.

## 22. N1 assessment

M1-11-R1 negative probe temporarily restored unguarded default-clock fallback;
Q29 failed with `default clock boom`; exact corrected `api.ts` restored to hash
`2b7ae46d…`; request **29/29**. Closes the original false-pass rather than an
unrelated assertion. Credible; not re-probed here.

## 23. Execution-record assessment

`M1-11.md` status:
`IMPLEMENTATION FROZEN / CLOCK ISOLATION CORRECTED BY M1-11-R1 / APPROVE FOR DRAFT PR REVIEW`.
Original history preserved; corrective note factual; original Q29 limitation
stated; points to M1-11-R1; no false merge claim; no M1-12 authorization; no
stale placeholder.

`M1-11-R1.md` status: `CORRECTION FROZEN / APPROVE FOR DRAFT PR UPDATE`.
Defect/reproduction, corrected `readNow`, strengthened Q29, N1, unchanged
contracts, validation factual; no future-SHA placeholder; no merge claim.
Git/CI lifecycle statements correctly defer authoritative SHA/CI outside the
creating commit.

## 24. M1-12 boundary

M1-12 (Assemble baseline report) is documentation-only and **not started**.
No behavior changes authorized by this review. Progress counters must not
increment before verified merge.

## 25. Local validation

Node `v22.23.1` / npm `10.9.8` / fnm `1.39.0`.

| Command | Outcome |
|---|---|
| observability focused | 12/12 PASS |
| request focused | 29/29 PASS |
| formatter focused | 16/16 PASS |
| auth focused | 10/10 PASS |
| snapshot focused | 18/18 PASS |
| full admin test | 10 files / 132 tests; 0 fail/skip/todo |
| lint / typecheck / npm ls / build | PASS; `apps/admin/dist` removed |
| guard unit | 16/16 PASS |
| guard preflight (LF-manifest wrap; Windows autocrlf) | PASS (`changed=6`) |
| `make secret-scan` | PASS |

## 26. Remote CI validation

Corrective Admin CMS CI run `29971879214`: `pull_request` / head
`a8a90696ed7060710f78e0a7892036adaad1d7eb` / `success` — re-verified before
review-record write.

Final review-record `pull_request` CI and post-merge `push` CI are authoritative
in GitHub Actions / final task report after push and merge.

## 27. Merge strategy

- Method: **merge commit only** (`gh pr merge --merge`)
- Exact-head protection: `--match-head-commit <final-review-head>`
- Forbidden: squash, rebase, auto-merge, admin bypass

## 28. Exact-head protection

Merge must target the exact final review-record HEAD after successful final CI.
If `origin/main` moves or head changes, stop without merge.

## 29. Branch cleanup

After verified merge and successful post-merge Admin CMS CI on merge SHA:
delete remote `cms/m1-11-api-observability` only. Keep local branch. Do not
touch external dirty state.

## 30. Rollback

If post-merge CI fails: report incident; do not reset/revert/force-push without
separate authorization. If review finds BLOCKER/MAJOR before merge: keep draft,
do not push further commits in this task.

## 31. Acceptance

Acceptance matrix V1–V133 from the Task Packet: all required pre-merge criteria
PASS for this freeze; remaining Git/CI/merge rows are authoritative after
subsequent authorized actions recorded in the final task report.

## 32. Freeze

Only authorized new file:
`docs/admin-cms/execplans/M1-11-REVIEW.md`

Algorithm for this review-record path: SHA-256 of exact working-tree bytes,
recorded in the final task report immediately before staging.

No edits after freeze of this file except the single authorized commit of these
bytes.

## 33. Git / GitHub actions

Authorized sequence after APPROVE freeze:

1. stage exact review ExecPlan only;
2. one review-record commit;
3. push without force;
4. wait final `pull_request` Admin CMS CI success on exact head;
5. update PR body;
6. `gh pr ready 7`;
7. merge with `--merge --match-head-commit`;
8. fetch / verify parents/tree;
9. wait post-merge `push` CI success;
10. delete remote feature branch.

## 34. Final status

```text
APPROVE
```

Repository review verdict is APPROVE with **0 BLOCKER** and **0 new MAJOR**.
Prior clock-isolation MAJOR is RESOLVED by M1-11-R1. Merge/ready/CI actions
follow this freeze under the Task Packet; they are not claimed inside this
commit.
