# ExecPlan M1-12-REVIEW — Review and merge M1 baseline report PR #8

## 0. Metadata

- Status: `APPROVE` (repository review record; merge actions follow this freeze)
- Classification: `repository_execution_record` / integration merge review
- Repository: `Brain-Master/BM_QuestHub` (`D:/WORK/01_Active_Projects/BM_QuestHub`)
- Branch: `cms/m1-12-baseline-report`
- Base SHA (`origin/main`): `1f66e4776d38fcf041dbcae0450a858a3d1daf63`
- Pre-review implementation HEAD: `ccd49aa6984d39bbb8a9ec27175623b7749c62ee`
- Initial Admin CMS CI: run `29977282728` / `pull_request` / `success`
- Started at: `2026-07-23T14:01:00+03:00`
- Task Packet: owner prompt `BM QuestHub CMS — Review and Merge Task Prompt M1-12-REVIEW`
- Agent: parent release integrator / senior reviewer / evidence auditor (Composer)
- Active repository policy: root `AGENTS.md`
- Active ExecPlan policy: root `PLANS.md`
- Canonical template: `docs/admin-cms/02_delivery/25_EXECPLAN_TEMPLATE.md`
- Commit policy: exactly one commit `docs: record M1-12 merge review`
- Push policy: non-force push; wait for final `pull_request` Admin CMS CI success before ready/merge
- Roadmap counter: increments only after verified merge (target 24/174; M1 12/12)
- Review-record commit SHA and merge SHA are authoritative in Git/PR and the
  final task report; they are intentionally not self-embedded in this commit.

## 1. Objective and non-goals

### Objective

Conduct frozen docs review of draft PR #8, confirm technical traceability of the
M1 contract baseline report, confirm risk honesty and LEGACY-ONLY raw-save
decision, confirm absence of behavior changes, record APPROVE in this ExecPlan,
obtain final Admin CMS CI, mark ready, merge with merge commit + exact-head
protection, verify post-merge `main`/CI, and delete the remote feature branch
while preserving the local branch and external dirty state.

### Non-goals

- Fix findings inside this review (BLOCKER/MAJOR → separate corrective task);
- Edit `37_M1_BASELINE_REPORT.md` or `M1-12.md`;
- Edit any existing repository file (only create this ExecPlan);
- Add this ExecPlan to `docs/admin-cms/MANIFEST.sha256` / INDEX / roadmap;
- Start M2-01 / M2;
- Product / runtime / test / workflow changes;
- Squash/rebase/auto merge, admin bypass, amend, force push, tag, release, deploy;
- Switch or delete the local feature branch;
- Stage or mutate external dirty paths.

## 2. PR identity and scope

```text
PR: #8
URL: https://github.com/Brain-Master/BM_QuestHub/pull/8
Title: M1-12: assemble admin API baseline report
State (pre-review): OPEN / DRAFT / MERGEABLE
Base/head: main ← cms/m1-12-baseline-report
Initial reviewed head: ccd49aa6984d39bbb8a9ec27175623b7749c62ee
Initial commits/files: 1 / 2
Initial Admin CMS CI: 29977282728 SUCCESS (pull_request, exact head)
Submitted GitHub reviews: 0
Inline review threads: 0 unresolved (GraphQL nodes empty)
Compare: ahead 1 / behind 0
```

After review-record commit: expected **2 commits / 3 files**.

Live reverify before write matched Task Packet baseline. `origin/main` unchanged
at `1f66e4776d38fcf041dbcae0450a858a3d1daf63`.

## 3. Commit history

Exact order vs `origin/main` (pre-review):

| # | SHA | Subject |
|---|-----|---------|
| 1 | `ccd49aa6984d39bbb8a9ec27175623b7749c62ee` | docs: record M1 contract baseline |

## 4. Hash / fingerprint verification

Frozen backup (outside repo):
`D:/WORK/01_Active_Projects/BM_QuestHub_M1-12-REVIEW_backup_20260723_140258`
(includes `pr-8.patch`, PR JSON, reviews/threads, compare, external fingerprint,
SHA-256 sums for each artifact).

External dirty fingerprint (Node `Buffer.compare` ordinal sort, 39 paths,
path NUL bytes NUL):
`41563d81ded1fdf2068b04095c5e2ff7afa36b25e50daba6ca280c1b9407a82c` — exact match;
not staged.

| Path | Change | Lines (git) | WT SHA-256 |
|---|---|---:|---|
| `docs/admin-cms/03_reference/37_M1_BASELINE_REPORT.md` | ADDED | 322 | `15ff87640450d00fc116e4de1ba8a7e6e1cd8136975714294452f6827f707002` |
| `docs/admin-cms/execplans/M1-12.md` | ADDED | 308 | `c40e612628a559b81f93c121940640a3f3e5792075a38ff3ddc8e6bc3b994400` |

Combined two-path fingerprint (sorted path NUL bytes NUL):
`5922e5affec1383420edcaba0ea3588ea5ea726daa7e69b11f0b821c54ad1a2a` — exact match.

Windows note: WT bytes for both PR paths are CRLF; recorded freeze hashes are WT
hashes and match. No unexpected content drift. No existing file modified.

## 5. Report metrics

Recomputed on exact report WT bytes:

| Metric | Reported | Verified |
|---|---:|---:|
| Words | 2545 | 2545 |
| Lines (`split` trailing empty) | 323 | 323 |
| Newlines (`\\n` count) | — | 322 (= git additions) |
| Broken relative links (report+ExecPlan) | 0 | 0 |
| Forbidden placeholders | 0 | 0 |
| Unsupported overclaims | 0 | 0 |

Relative Markdown links resolved: 45. GitHub PR/Actions links present and
verified via authenticated `gh` for chronology table IDs.

## 6. Reviewer A — technical accuracy and traceability

Independent read-only pass over exact report/ExecPlan bytes at
`ccd49aa6984d39bbb8a9ec27175623b7749c62ee`.

| Check | Evidence | Result |
|---|---|---|
| Metadata baseline `main` | report table = `1f66e477…` = live `origin/main` | PASS |
| Coverage M0 + M1-01..11 | report metadata + chronology | PASS |
| Admin baseline 10/132 | local vitest; focused arithmetic | PASS |
| Progress before merge 23/174; M1 11/12 | report; future counters conditional | PASS |
| Chronology PR #2..#7 merge SHAs | live `gh pr view` | PASS |
| Commits/files per PR | #2 6/85; #3 3/8; #4 3/8; #5 2/7; #6 2/7; #7 3/7 | PASS |
| Final PR + push CI IDs | authenticated `gh run view` all success | PASS |
| GET/HEAD no body | `apps/admin/src/api.ts` body gate | PASS |
| PUT/POST envelopes + path | `api.ts` + request-contract tests | PASS |
| 15s timeout + manual cancel | `REQUEST_TIMEOUT_MS = 15_000`; Abort/Timeout | PASS |
| Typed HTTP error mapping | `apiClientErrorCode` / `ApiClientError` | PASS |
| Non-2xx body unread | throw before `res.json()` | PASS |
| Safe inbound correlation | sanitize + optional field | PASS |
| Snapshot versions 2/2/2/2/1 | `CURRENT_SNAPSHOT_VERSIONS` | PASS |
| Nullable manifest/offers | boundary source + contract tests | PASS |
| Top-level-only validation | report + boundary tests | PASS |
| Pure selectors | `snapshot-selectors.ts` + tests | PASS |
| Centralized legacy token | `legacy-token-adapter.ts` | PASS |
| 401 clears auth / preserves buffers | `auth-failure-state.ts` + tests | PASS |
| Bounded/redacted UI errors | `ui-error-formatter.ts` | PASS |
| 8 ops / 6 outcomes / 5-field event | `api-observability.ts` | PASS |
| One terminal event | `withApiObservation` finally | PASS |
| Clock/factory/observer isolation | M1-11-R1 + tests | PASS |
| Test arithmetic 29+12+16+10+18+13+5+18+10+1 | 132 | PASS |
| Local suite 10 files / 132 tests | vitest run | PASS |
| Relative + PR/Actions links | 0 broken; CI IDs live | PASS |
| No chat-only evidence | paths/PR/SHA/CI/commands | PASS |

Verdict: `APPROVE`

## 7. Reviewer B — risk honesty and product boundary

Independent second read-only pass over the same frozen docs bytes.

| Check | Evidence | Result |
|---|---|---|
| CMS not production-ready | explicit non-claims section | PASS |
| Auth not production-ready | non-claims + RISK-01 OPEN | PASS |
| Server-side RBAC absent | non-claims + RISK-08 | PASS |
| Raw save not safe product editing | DECISION + implications | PASS |
| Publication not atomic/rollback-ready | RISK-03 OPEN | PASS |
| Deep schemas incomplete | RISK-05 OPEN / ACCEPTED | PASS |
| PostgreSQL/import absent | RISK-06 OPEN | PASS |
| Read-only screens absent | RISK-09 OPEN / NEXT | PASS |
| No production observability sink | RISK-07 OPEN / INTENTIONAL | PASS |
| External dirty unresolved | RISK-10 PROCESS RISK | PASS |
| M2 not started | explicit boundary | PASS |
| Shared token OPEN | RISK-01 | PASS |
| Raw editor OPEN / LEGACY-ONLY | RISK-02 | PASS |
| Publication OPEN | RISK-03 | PASS |
| Optimistic locking OPEN; 409 ≠ enforcement | RISK-04 | PASS |
| Top-level validation OPEN / ACCEPTED | RISK-05 | PASS |
| Sheets/S3/storage OPEN | RISK-06 | PASS |
| CORS REQUIRES RE-AUDIT | RISK-08 table | PASS |
| Raw-save alternatives A rejected / B rejected / C accepted | decision section | PASS |
| Docs boundary ≠ runtime enforcement | implication 8 | PASS |
| M2 default UX read-only; no save/publish calls | implications 1–3 | PASS |
| Legacy path not deleted by M1-12; M2-13 owns hide | implications 4–5 | PASS |
| Exit PASS with constraints; write/auth/publish NOT PASSED | exit-gate section | PASS |
| Next = M2-01 only; not started; not authorized | M2 boundary | PASS |

Verdict: `APPROVE`

## 8. Findings

| ID | Severity | Disposition | Notes |
|---|---|---|---|
| — | BLOCKER | none | 0 |
| — | MAJOR | none | 0 |
| N1 | NOTE | accepted | INDEX/MANIFEST intentionally unchanged |
| N2 | NOTE | accepted | Report status remains pending until merge |
| N3 | NOTE | accepted | Source-inspection / contract-sentinel tests are brittle by design |
| N4 | NOTE | accepted | Historical GET P0 in findings is STALE (documented) |
| N5 | NOTE | accepted | CORS remains REQUIRES RE-AUDIT |
| N6 | NOTE | accepted | Windows LF-manifest wrap / autocrlf for local preflight; restored; external fp unchanged |

## 9. Chronology / CI

Live verified via authenticated `gh`:

| PR | Merge SHA | Commits / files | Final PR CI | Push CI |
|---|---|---:|---|---|
| #2 | `6e508a108cb0e6222985134a3108708fd8d50e1d` | 6 / 85 | 29815435529 | 29815517010 |
| #3 | `3e772371adb9f72c7843e315378f7eae8bc3d528` | 3 / 8 | 29879657547 | 29879730885 |
| #4 | `d55b04c21fbc565a236582307c36c2820329b909` | 3 / 8 | 29927952984 | 29928114718 |
| #5 | `3f0e99278f996cb8281956e83105a2e9aa736a0c` | 2 / 7 | 29961634465 | 29961713928 |
| #6 | `63e28cdb785fa2a7fc10ae645b9d6f431a97204e` | 2 / 7 | 29967921017 | 29968009195 |
| #7 | `1f66e4776d38fcf041dbcae0450a858a3d1daf63` | 3 / 7 | 29973104672 | 29973199756 |

Initial PR #8 CI `29977282728`: `pull_request` / head `ccd49aa…` / **success** —
re-verified before review-record write.

## 10. Contract claims assessment

Current `main` / branch-base source confirms reported transport, errors, snapshot
boundary, selectors, legacy token, auth-failure, UI formatter and observability
contracts. Material claims cite path and/or test and/or ExecPlan/PR/CI.
Explicit non-guarantees remain visible in the report contract table.

## 11. Test arithmetic

```text
29 + 12 + 16 + 10 + 18 + 13 + 5 + 18 + 10 + 1 = 132
```

Local `npm --prefix apps/admin run test`: **10 files / 132 tests** / 0 fail /
0 skip / 0 todo.

## 12. Risks / non-claims

Risk register states match required OPEN / LEGACY-ONLY / ACCEPTED / INTENTIONAL /
REQUIRES RE-AUDIT / PROCESS RISK labels. Non-claims section is complete.
No unsupported production-readiness affirmation outside negation context.

## 13. Raw-save decision

Exact DECISION text present. Alternatives:

| Option | Verdict |
|---|---|
| A production raw editor | Rejected |
| B immediate deletion | Rejected (behavior change out of scope) |
| C compatibility + legacy-only + hide/replace | Accepted |

`App.tsx` still imports/calls `saveSnapshot` / `publishContent` — compatibility
retained; not production-safe editing evidence.

## 14. M1 exit gate / M2 boundary

| Criterion | Verdict |
|---|---|
| Legacy client deterministically tested | PASS |
| GET body defect | PASS |
| Snapshot boundary | PASS |
| Read-only entry | PASS WITH CONSTRAINTS |
| Production-safe write/auth/publication | NOT CLAIMED / NOT PASSED |

Exact meaning: **M1 exit gate PASS for M2 read-only UX foundation.**
Write/auth/publication readiness not passed and not required by M1.

Next task only: **M2-01 — Create app shell structure**.
Explicit: M2-01 not started; M1-12 does not authorize M2; no new write paths;
no data API changes.

## 15. Links / overclaims

Broken relative links: **0**. Forbidden placeholders: **0**. Unsupported
overclaims: **0**.

## 16. ExecPlan assessment (`M1-12.md`)

Status: `REPORT FROZEN / APPROVE FOR DRAFT PR`.
Base/branch/scope factual; exactly two files authorized; evidence methodology
present; links/overclaims checks recorded; baseline 10/132 and guard 16/16;
hashes/metrics present; reviewers APPROVE; no merge claim; no M2 authorization;
no stale placeholder. Lifecycle statement that future Git/CI identities are
external authority is valid and not treated as stale evidence.

## 17. Source invariants

Final implementation commit adds exactly two files and modifies zero existing
files. Review adds only this ExecPlan. Protected/forbidden trees unchanged.

## 18. Local / remote validation

Environment for gates: Node `v22.23.1` / npm `10.9.8` (fnm install path;
`fnm` CLI currently absent from PATH — Node 22 binary used directly).

| Command | Outcome |
|---|---|
| `npm --prefix apps/admin run test` | PASS 10/132 |
| `npm --prefix apps/admin run lint` | PASS |
| `npm --prefix apps/admin run typecheck` | PASS |
| `npm --prefix apps/admin ls --all` | PASS |
| `npm --prefix apps/admin run build` | PASS; `apps/admin/dist` removed |
| `node --test scripts/admin-cms-ci-guard.test.mjs` | PASS 16/16 |
| guard preflight `--base 1f66e477…` | PASS via LF-manifest wrap; restored; `changed=2`; external fp unchanged |
| `make secret-scan` | PASS |
| Initial CI `29977282728` | SUCCESS (re-verified) |

Final review-record `pull_request` CI and post-merge `push` CI are authoritative
in GitHub Actions / final task report after push and merge.

## 19. Merge strategy

- Method: **merge commit only** (`gh pr merge --merge`)
- Exact-head protection: `--match-head-commit <final-review-head>`
- Forbidden: squash, rebase, auto-merge, admin bypass

## 20. Exact-head protection

Merge must target the exact final review-record HEAD after successful final CI.
If `origin/main` moves or head changes, stop without merge.

## 21. Cleanup / rollback

After verified merge and successful post-merge Admin CMS CI on merge SHA:
delete remote `cms/m1-12-baseline-report` only. Keep local branch. Do not
touch external dirty state.

If post-merge CI fails: report incident; do not reset/revert/force-push without
separate authorization. If BLOCKER/MAJOR before merge: keep draft, no further
commits in this task.

## 22. Acceptance / freeze / final status

Acceptance matrix V1–V61 from the Task Packet: all required pre-merge criteria
PASS for this freeze; remaining Git/CI/merge rows are authoritative after
subsequent authorized actions recorded in the final task report.

Only authorized new file:
`docs/admin-cms/execplans/M1-12-REVIEW.md`

Algorithm for this review-record path: SHA-256 of exact working-tree bytes,
recorded in the final task report immediately before staging.

No edits after freeze of this file except the single authorized commit of these
bytes.

### Authorized sequence after APPROVE freeze

1. stage exact review ExecPlan only;
2. one review-record commit;
3. push without force;
4. wait final `pull_request` Admin CMS CI success on exact head;
5. update PR body;
6. `gh pr ready 8`;
7. merge with `--merge --match-head-commit`;
8. fetch / verify parents/tree;
9. wait post-merge `push` CI success;
10. delete remote feature branch.

```text
APPROVE
```

Repository review verdict is APPROVE with **0 BLOCKER** and **0 MAJOR**.
Merge/ready/CI actions follow this freeze under the Task Packet; they are not
claimed inside this commit.
