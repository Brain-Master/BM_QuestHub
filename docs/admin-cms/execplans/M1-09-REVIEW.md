# ExecPlan M1-09-REVIEW — Review and merge snapshot contract PR #5

## 0. Metadata

- Status: `APPROVE` (repository review record; merge actions follow this freeze)
- Classification: `repository_execution_record` / integration merge review
- Repository: `Brain-Master/BM_QuestHub` (`D:/WORK/01_Active_Projects/BM_QuestHub`)
- Branch: `cms/m1-09-snapshot-contract-tests`
- Base SHA (`origin/main`): `d55b04c21fbc565a236582307c36c2820329b909`
- Pre-review feature HEAD: `7b0c952e1131468c597a2474c5afd55ea2102017`
- Initial Admin CMS CI: run `29953023521` / `pull_request` / `success`
- Started at: `2026-07-23T00:52:00+03:00`
- Task Packet: owner prompt `BM QuestHub CMS — Review and Merge Task Prompt M1-09-REVIEW`
- Agent: parent release integrator / senior reviewer (Composer)
- Active repository policy: root `AGENTS.md`
- Active ExecPlan policy: root `PLANS.md`
- Canonical template: `docs/admin-cms/02_delivery/25_EXECPLAN_TEMPLATE.md`
- Commit policy: exactly one commit `docs: record M1-09 merge review`
- Push policy: non-force push; wait for final `pull_request` Admin CMS CI success before ready/merge
- Roadmap counter: increments only after verified merge (21/174; M1 9/12)
- Review-record commit SHA and merge SHA are authoritative in Git/PR and the
  final task report; they are intentionally not self-embedded in this commit.

## 1. Objective and non-goals

### Objective

Conduct frozen-diff review of one-commit draft PR #5, confirm compatibility
matrix `catalog/map/site/manifest v2` and `offers v1`, verify required
top-level fields / nullable-additive semantics / bounded redacted diagnostics,
confirm false-pass resistance of contract tests and recorded R1–R5, confirm
absence of deep entity validation and production snapshot edits, record
APPROVE in this ExecPlan, obtain final Admin CMS CI, mark ready, merge with
merge commit + exact-head protection, verify post-merge `main`/CI, and delete
the remote feature branch while preserving the local branch and external dirty
state.

### Non-goals

- Fix findings inside this review (BLOCKER/MAJOR → separate corrective task);
- Edit any existing repository file (only create this ExecPlan);
- Add this ExecPlan to `docs/admin-cms/MANIFEST.sha256`;
- Start M1-10 / M1-11 / M1-12 / M2;
- Squash/rebase/auto merge, admin bypass, amend, force push, tag, release, deploy;
- Switch or delete the local feature branch;
- Stage or mutate external dirty paths;
- Fabricate an independent GitHub PR approval from another account;
- Rerun destructive R1–R5 probes after freeze (evidence already recorded).

## 2. PR identity and commit history

```text
PR: #5
URL: https://github.com/Brain-Master/BM_QuestHub/pull/5
Title: M1-09: freeze current snapshot contract
State (pre-review): OPEN / DRAFT / MERGEABLE
Base/head: main ← cms/m1-09-snapshot-contract-tests
Initial reviewed head: 7b0c952e1131468c597a2474c5afd55ea2102017
Initial commits/files: 1 / 6
Initial Admin CMS CI: 29953023521 SUCCESS (pull_request, exact head)
Submitted GitHub reviews: 0
Inline review threads: 0 unresolved (GraphQL nodes empty)
Compare: ahead 1 / behind 0
```

Exact order vs `origin/main`:

| # | SHA | Subject |
|---|-----|---------|
| 1 | `7b0c952e1131468c597a2474c5afd55ea2102017` | test(admin): freeze current snapshot contract |

After review-record commit: expected **2 commits / 7 files**.

Live reverify before write matched Task Packet baseline. `origin/main` unchanged
at `d55b04c21fbc565a236582307c36c2820329b909`.

## 3. Frozen scope

Six changed files classified; none unclassified; no scope leakage.

| Class | Count | Paths |
|---|---:|---|
| domain_boundary | 1 | `apps/admin/src/snapshot-boundary.ts` |
| tests | 3 | `apps/admin/src/snapshot-boundary.test.ts`, `apps/admin/src/snapshot-contract.test.ts`, `apps/admin/src/snapshot-fixtures.test.ts` |
| fixture | 1 | `apps/admin/src/test-fixtures/snapshot-bundle.fixtures.ts` |
| execution_record | 1 | `docs/admin-cms/execplans/M1-09.md` |
| **total** | **6** | |

Rejected classes absent: `api.ts` / request-contract / auth-failure / legacy-token /
App / selectors / package / lock / config / workflow / public snapshots /
backend / generated data / external dirty paths / secret material.

Frozen backup (outside repo):
`D:/WORK/01_Active_Projects/BM_QuestHub_M1-09-REVIEW_backup_20260723_005703`
(includes `pr-5.patch`, PR JSON, reviews/threads, external fingerprint).

External dirty fingerprint (Node Buffer.compare ordinal sort, 39 paths):
`41563d81ded1fdf2068b04095c5e2ff7afa36b25e50daba6ca280c1b9407a82c` — exact match;
not staged.

## 4. Hash / fingerprint verification

Working-tree SHA-256 recomputed with sorted `path NUL bytes NUL`.

| Path | SHA-256 (WT) | Prefix/suffix check |
|---|---|---|
| `apps/admin/src/snapshot-boundary.ts` | `360278b9316deb7e074296f6320b1a11824aa6d893bb881c8c472da7fb4d2505` | `360278b9…2505` MATCH |
| `apps/admin/src/snapshot-boundary.test.ts` | `0566dedaca72e4597a88dcf1183318938e8d322237c8f3a19a4b56a92ea0b188` | `0566deda…b188` MATCH |
| `apps/admin/src/snapshot-contract.test.ts` | `45c00ef4b925e6a287c9f8930214e74d9decf450c211e0fc0ff420b789311d64` | `45c00ef4…1d64` MATCH |
| `apps/admin/src/test-fixtures/snapshot-bundle.fixtures.ts` | `a9214964f4ae0ef695997db69df9a056408dd7dfe4e678e55ee9c5af003831c8` | `a9214964…31c8` MATCH |
| `apps/admin/src/snapshot-fixtures.test.ts` | `3086af4fee5b0ece34ff840a388ce2b4a9b5bf4a431d4550adec94ec831c49b1` | `3086af4f…49b1` MATCH |
| `docs/admin-cms/execplans/M1-09.md` | `e73ad2e547e8fc7af7c91f78660108e18945b57f17c063f64d6447bda99d4fd5` | `e73ad2e5…4fd5` MATCH |

Combined six-path fingerprint:
`e25581598cebd395c2e593614f49c5bd633eecaa90d063a49cd787da4c405ba0` — MATCH.

Forbidden paths have no PR diff vs base (base blob == head blob for public
snapshots and API/auth/App/selectors).

## 5. Public contract evidence

Read-only from committed head blob `7b0c952e…` (local dirty
`offers-snapshot.json` ignored; committed blob authoritative):

| Path | version | Required keys | baseEqHead |
|---|---:|---|---|
| `apps/web/data/v2/catalog-snapshot.json` | 2 | version, generatedAt, source, integrity, worlds, courses | true |
| `apps/web/data/v2/map-snapshot.json` | 2 | version, generatedAt, source, integrity, venues | true |
| `apps/web/data/v2/site-config.json` | 2 | version, generatedAt, source, brand, navigation, cities | true |
| `apps/web/data/v2/site-manifest.json` | 2 | version, generatedAt, source, snapshots | true |
| `apps/web/data/offers-snapshot.json` | 1 | version, generatedAt, source, offersByQuest | true |

Public snapshots unchanged by PR. APPROVE.

## 6. Reviewer A — architecture and compatibility

Independent read-only pass over exact PR head `7b0c952e…`.

| Check | Evidence | Result |
|---|---|---|
| One authoritative parser | `parseSnapshotsBundle` only entry; nested via private helpers | PASS |
| Outer flat checks before nested | root `$`/`ok`/OBJECT_ROOTS/NULLABLE_ROOTS; throw if issues; then `validateSnapshotDocuments` | PASS |
| Invalid/missing roots → no nested issues | early throw at `issues.length > 0` before nested | PASS |
| Frozen version map `2/2/2/2/1` | `CURRENT_SNAPSHOT_VERSIONS` Object.freeze; C4 keys/order | PASS |
| Exact required fields + deterministic order | CATALOG/MAP/SITE/MANIFEST/OFFERS_FIELDS; C5/C7/C9/C11/C13 | PASS |
| Manifest/offers null accepted | nullable roots; C2; nested only when non-null | PASS |
| Fail-closed version comparison | exact `value !== version`; no ranges/coercion | PASS |
| Plain-record semantics reused | existing `isPlainRecord` (Object.prototype \| null) | PASS |
| Arrays via `Array.isArray` | field kind `array` | PASS |
| Success returns original identity | `return input as SnapshotsBundle`; C1/C3 | PASS |
| Additive fields preserved by identity | C3 markers; no clone/strip/normalize | PASS |
| No filesystem/network/global mutation | pure functions; no I/O | PASS |
| No deep entity validation | top-level kinds only | PASS |
| No M1-10/M1-11 behavior | no UI formatter / observability | PASS |

## 7. Reviewer B — diagnostics and false-pass resistance

Independent second read-only pass.

| Check | Evidence | Result |
|---|---|---|
| `MAX_ISSUES === 5` | const + C16 + boundary diagnostics test | PASS |
| Issue shape only path/code/expected | type + C15 key-set equality | PASS |
| missing → REQUIRED | field contracts + helpers | PASS |
| wrong version → INVALID_VALUE | version branch | PASS |
| wrong kind → INVALID_TYPE | string/array/object branches | PASS |
| Raw received values never in errors | C15 marker absent from message/String/JSON/issues | PASS |
| Document/field order deterministic | catalog→map→site→manifest→offers; field arrays | PASS |
| C5 detects removed catalog field requirements | expectRequiredField for courses | PASS |
| C6/C8/C10/C12/C14 reject incompatible versions | incompatible value loops + deleted version | PASS |
| C7/C9/C11/C13 cover every required field | full field lists | PASS |
| C15 detects raw leaks / extra issue fields | exact equality + key set | PASS |
| C16 proves cap/order | first five catalog REQUIRED issues | PASS |
| C17 distinguishes null vs `{}` | null pass; empty object first `$.manifest.version` | PASS |
| C18 null-prototype object fields | integrity/brand/snapshots/offersByQuest | PASS |
| Required-field helper not false-positive | `expect.unreachable` then `toBeInstanceOf` — acceptance would fail assertion, not pass as validation error | PASS |
| Version helper not false-positive | same pattern + deleted-version REQUIRED | PASS |
| Fixture corpus synthetic/closed/bounded | vocabulary + ≤4096 bytes | PASS |
| Invalid fixtures six IDs + stable first issue | fixtures test | PASS |
| Public snapshots unchanged | baseEqHead | PASS |
| R1–R5 evidence credible | M1-09.md §18 fail-then-exact-restore; not re-run | PASS |

## 8. Findings table

| ID | Severity | Location | Finding | Disposition |
|---|---|---|---|---|
| — | BLOCKER | — | none | — |
| — | MAJOR | — | none | — |
| F1 | NOTE | Windows autocrlf preflight | Requires temporary LF-manifest wrap; restored; external fp unchanged | Accept (known env) |
| F2 | NOTE | R1–R5 | Controlled regressions recorded in M1-09; not re-probed after freeze per Task Packet | Accept |

**Merge gate:** `BLOCKER = 0`, `MAJOR = 0`.

## 9. Version map / required fields

```text
CURRENT_SNAPSHOT_VERSIONS = freeze({ catalog:2, map:2, site:2, manifest:2, offers:1 })
```

| Root | Fields (order) |
|---|---|
| catalog | version, generatedAt, source, integrity, worlds, courses |
| map | version, generatedAt, source, integrity, venues |
| site | version, generatedAt, source, brand, navigation, cities |
| manifest (object) | version, generatedAt, source, snapshots |
| offers (object) | version, generatedAt, source, offersByQuest |

Unknown / string / fractional / boolean / null / older / future versions rejected.
No coercion or version ranges. APPROVE.

## 10. Nullable / additive assessment

- Manifest/offers may be `null`; missing own property → REQUIRED `object|null`.
- Nested field checks run only for non-null objects.
- Additive unknown fields preserved by object identity on success.
- Empty object `{}` for manifest is incompatible (C17), not treated as unavailable.
APPROVE.

## 11. Diagnostics / order assessment

- Cap 5; shape `{path,code,expected}` only.
- Outer root diagnostics precede nested; invalid roots never emit nested issues.
- Nested document order catalog → map → site → manifest → offers.
- Codes: REQUIRED / INVALID_VALUE / INVALID_TYPE as specified.
- Generic message `"Snapshot bundle failed validation"`; no raw values.
APPROVE.

## 12. Fixture assessment

Valid synthetic documents carry required fields and `fixtureKind` with closed
vocabulary (`synthetic-generated-at` / `synthetic-source` / `synthetic-content-hash`).
Fresh nested graphs across factory calls. Exactly six invalid fixture IDs.
Serialized corpus ≤ 4096 bytes. No real dates/URLs/emails/phones/UUIDs/secrets.
APPROVE.

## 13. False-pass test assessment

Exactly one describe `current snapshot document compatibility` with 18 tests
(C1–C18 titles). Helpers fail closed on wrong acceptance. C15/C16/C17/C18
assert exact issue equality and key sets. Boundary 13 + fixtures 5 preserved.
APPROVE.

## 14. Controlled-regression assessment

Recorded probes in `M1-09.md` §18:

| ID | Probe | Result |
|---|---|---|
| R1 | remove catalog courses requirement | C5 fails; restored |
| R2 | accept catalog version 3 | C6 fails; restored |
| R3 | offers current version → 2 | C14 fails; restored |
| R4 | skip manifest version field | C17 fails; restored |
| R5 | leak raw value | C15 fails; restored |

Evidence credible; not re-run after freeze. Post-restore suites 18/13/5.
APPROVE.

## 15. M1-09 lifecycle assessment

`M1-09.md` status: `IMPLEMENTATION FROZEN / APPROVE FOR DRAFT PR`.

Accepted lifecycle wording present (commit SHA/PR/CI intentionally not
self-embedded). Factual base/branch/implementation record. No `PENDING CI`,
`filled later`, `recorded after`, `TBD`, `TODO`. No false merge claim.
APPROVE verdict for draft PR only; does not authorize later tasks. APPROVE.

## 16. M1-10 / M1-11 boundary

No UI error formatter, no observability, no deep entity schemas, no new
snapshot versions, no App/public snapshot/package/workflow edits.
M1-10/M1-11/M1-12/M2 unauthorized until this merge is verified.
**Boundary PASS.**

## 17. Local / remote validation

Node `v22.23.1` / npm `10.9.8` (fnm node-versions path on PATH).

| Command | Outcome |
|---|---|
| `npm --prefix apps/admin run test -- src/snapshot-contract.test.ts` | 18/18 PASS |
| `npm --prefix apps/admin run test -- src/snapshot-boundary.test.ts` | 13/13 PASS |
| `npm --prefix apps/admin run test -- src/snapshot-fixtures.test.ts` | 5/5 PASS |
| `npm --prefix apps/admin run test -- src/api.request-contract.test.ts` | 16/16 PASS |
| `npm --prefix apps/admin run test` | 8 files / 91 PASS; 0 fail/skip/todo |
| `npm --prefix apps/admin run lint` | PASS |
| `npm --prefix apps/admin run typecheck` | PASS |
| `npm --prefix apps/admin ls --all` | PASS |
| `npm --prefix apps/admin run build` | PASS; `apps/admin/dist` removed afterward |
| `node --test scripts/admin-cms-ci-guard.test.mjs` | 16/16 PASS |
| `node scripts/admin-cms-ci-guard.mjs preflight --base d55b04c…` | PASS with LF-manifest wrap (Windows autocrlf); WT restored; external fp unchanged; `changed=6` |
| `make secret-scan` | PASS (1194 files) |

Remote initial CI:

```text
Workflow: Admin CMS CI
Run: 29953023521
Event: pull_request
Head: 7b0c952e1131468c597a2474c5afd55ea2102017
Conclusion: success
```

Final CI on review-record head is recorded in the task report after push
(not self-embedded here).

## 18. Merge strategy / exact-head protection

- Method: **merge commit only** (`gh pr merge 5 --merge`).
- Exact-head: `--match-head-commit <final-review-head>`.
- Forbidden: `--squash`, `--rebase`, `--auto`, `--admin`.
- If GitHub requires an independent approval absent here: STOP (no self-bypass).
- This file is a repository review record, not a claim of third-party GitHub
  approval.

Merge only when:

1. `origin/main` still `d55b04c21fbc565a236582307c36c2820329b909`;
2. PR head equals reviewed final review-record SHA;
3. PR OPEN, MERGEABLE, required checks green;
4. No CHANGES_REQUESTED / unresolved threads.

## 19. Branch cleanup / rollback

After verified merge + successful push-to-main Admin CMS CI:

- `git push origin --delete cms/m1-09-snapshot-contract-tests` (no force);
- Local branch preserved;
- External dirty state untouched.

On any stop condition: keep PR draft (or ready-but-unmerged), do not add further
commits, do not merge, do not reset/revert/force-push without a separate
authorized incident task.

## 20. Acceptance / freeze

V1–V83 from Task Packet must all PASS after merge verification. No PARTIAL.

Freeze path for this review record:

```text
docs/admin-cms/execplans/M1-09-REVIEW.md
```

Algorithm: SHA-256 over relative path NUL file bytes NUL (single-file record).
Digest and review-record commit SHA are authoritative in the final task report.

## 21. Git/GitHub actions

1. Stage only `docs/admin-cms/execplans/M1-09-REVIEW.md`.
2. Commit: `docs: record M1-09 merge review` (no amend).
3. Push branch without force.
4. Wait for Admin CMS CI `pull_request` success on exact new head.
5. Update PR body with APPROVE / review-record / final CI / 2×7 / merge method.
6. `gh pr ready 5`.
7. `gh pr merge 5 --merge --match-head-commit <exact-final-head>`.
8. Fetch; verify parents/tree; wait push-to-main CI; delete remote branch.

## 22. Final status

**Verdict: APPROVE**

Owned by final task report after merge:

- review-record commit SHA;
- final PR CI run ID / success;
- merge SHA / two parents / tree equality;
- post-merge main CI;
- remote branch absent;
- formal progress 21/174; M1 9/12;
- M1-10 not started.
