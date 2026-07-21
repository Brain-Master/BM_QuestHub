# BM QuestHub — baseline-команды и ownership проверок

## 10.1. Normative scope

Root `AGENTS.md`, root `PLANS.md` и текущий Task Packet имеют более высокий authority, чем этот документ. Здесь зафиксированы: статусы команд, ownership, целевая композиция трёх root-слоёв, side-effect policy и реестр roadmap gaps.

Этот документ **не доказывает**, что команда существует или прошла. Существование проверяется по manifests/Makefile на каждой задаче. Planned command не является executable evidence. Команда не расширяет scope Task Packet. Команда не выполняет install/deploy/publish, если это не явная цель Task Packet. Missing required command — blocker, не skip.

## 10.2. Terminology and command status

### Seven statuses

| Status | Meaning |
|---|---|
| `existing-runnable` | Команда объявлена; локальные prerequisites для безопасного запуска проверены. Не означает PASS без фактического run. |
| `existing-environment-blocked` | Команда объявлена, но текущая среда не может безопасно её выполнить (нет deps, неверный tool major и т.п.). |
| `existing-side-effecting-not-run` | Команда объявлена, но не запускалась в задаче, потому что пишет build/generated output, ходит во внешние сервисы или выходит за scope. |
| `existing-informational` | Команда существует и сообщает информацию; не acceptance gate. |
| `planned-owned` | Команды нет; accepted roadmap task владеет реализацией. |
| `planned-unowned` | Команды нет; ни одна accepted task не владеет реализацией. |
| `not-a-gate` | Команда существует, но не должна использоваться как evidence quality/correctness/completion. |

### Non-synonyms

| Term | Meaning |
|---|---|
| `declared` | Script/target существует в manifest/Makefile. |
| `available` | Исполнима и prerequisites на месте. |
| `executed` | Фактически запущена против identified bytes. |
| `passed` | Executed, exit 0, и meaningful nonzero checks (не zero-test). |
| `required` | Task Packet или repository policy требует команду сейчас. |

Declared ≠ available ≠ executed ≠ passed. Exit 0 может быть false-pass.

## 10.3. Ownership model

### Root Makefile

Owns **orchestration only**. Must: call package-owned commands; preserve exit codes; fail on missing required primitive; not duplicate lint/test/build logic; not install/deploy/publish; not silent-skip; print bounded phase labels; run from repository root.

### Root package.json

May provide ergonomic aliases, but must not create a second orchestration graph that differs from Makefile.

**Target architecture (design, not current implementation):**

```text
Makefile is the canonical repository orchestration surface.
Root package.json may delegate to Makefile or expose clearly scoped aliases,
but must not independently compose different gates.
```

### apps/admin/package.json

Owns admin: typecheck, lint, unit/component tests, accessibility tests, E2E entrypoint, build.

### apps/web/package.json

Owns web: lint, snapshot validation entry, build, existing package `check`.

### Dedicated scripts

Own one narrow validator each (snapshot denylist; future docs/link; future registry checker; future secret scan).

### CI workflows

Own scheduling/environment; must call canonical repository commands; must not maintain a divergent validation graph.

## 10.4. Current verified inventory

Evidence date: M0-07 preflight on HEAD `aa45e868491435697d794214634cb02639c9665d`. Local Node `v24.13.1` (adopted baseline major `22`). `apps/admin/node_modules` absent; `apps/web/node_modules` present; root lockfile absent; `apps/web/package-lock.json` present.

| Command | Owner | Declared at | Status | Side effects | Ran M0-07 | Result / blocker | Roadmap |
|---|---|---|---|---|---|---|---|
| `git diff --check` | Git | Git CLI | existing-runnable | read-only | YES | exit 0 (CRLF warning on dirty snapshot) | — |
| `npm run check` | root→web | `package.json:10` | existing-side-effecting-not-run | writes build; may network via web build/`verify:s3` | NO | NOT RUN | — |
| `npm --prefix apps/web run check` | web | `apps/web/package.json:19` | existing-side-effecting-not-run | lint + validate + audit + host-scope test + build (`.next`/`out`); build may contact S3 | NO | NOT RUN | — |
| `npm --prefix apps/web run lint` | web | `apps/web/package.json:12` | existing-runnable | read-only (eslint) | NO | NOT RUN | — |
| `npm --prefix apps/web run validate:snapshots` | web→script | `apps/web/package.json:17`; `scripts/validate-public-snapshot.mjs` | existing-runnable | read-only JSON scan | YES | exit 0; denylist+media only | — |
| `npm --prefix apps/web run build` | web | `apps/web/package.json:10` | existing-side-effecting-not-run | writes `.next`/`out`; may network S3 | NO | NOT RUN | — |
| `npm --prefix apps/admin run build` | admin | `apps/admin/package.json:8` | existing-environment-blocked | would write `dist/` | NO | `apps/admin/node_modules` missing; Node major ≠ 22 | — |
| `npm --prefix apps/admin run typecheck` | admin | absent | planned-owned | n/a | NO | not declared | M0-08 |
| `npm --prefix apps/admin run lint` | admin | absent | planned-owned | n/a | NO | not declared | M0-09 |
| `npm --prefix apps/admin run test` | admin | absent | planned-owned | n/a | NO | not declared | M0-10 |
| `npm --prefix apps/admin run test:a11y` | admin | absent | planned-unowned | n/a | NO | not declared | BC-GAP-06 |
| `npm --prefix apps/admin run test:e2e` | admin | absent | planned-unowned | n/a | NO | not declared | BC-GAP-06 |
| `make help` | Makefile | `Makefile:13-14` | existing-informational | read-only print | YES | printed targets; not a gate | — |
| `make validate-snapshots` | Makefile→script | `Makefile:160-161` | existing-runnable | read-only (same validator) | YES (via node script) | exit 0 | — |
| `make check` | Makefile→web | `Makefile:150-151` | existing-side-effecting-not-run | same as web `check`; **no admin** | NO | NOT RUN; not future full coverage | BC-GAP-01 (target rewrite) |
| `make check-fast` | — | absent | planned-unowned | n/a | NO | not declared | BC-GAP-01 |
| `make check-full` | — | absent | planned-unowned | n/a | NO | not declared | BC-GAP-01 |
| `make secret-scan` | M0-11 / `tools/secret-scan` | `Makefile` → `scripts/secret-scan.mjs` | existing-runnable (after `npm ci` in `tools/secret-scan`) | read-only scan; masks secrets; no install; no history | adopted M0-11 | requires Node 22 + tool `npm ci`; missing install → `MISSING_PREREQUISITE`; scope = tracked + untracked non-ignored worktree | M0-11 |
| repository docs/link gate | — | absent | planned-unowned | n/a | NO | not declared | BC-GAP-02 |

Reverified M0-01 facts: current `make check` is web-only and not future repository coverage; admin build declared but deps missing; web `check` creates build output; snapshot validator is narrower than full schema (`validate-public-snapshot.mjs` denylist + media-url guard; can warn+skip missing files); `check-fast`/`check-full` absent. M0-11 adopts `make secret-scan` (current worktree only; no Git history; bootstrap `npm ci` in `tools/secret-scan`; policy `SECRET_SCAN.md`). Root orchestration gaps unchanged. No unexecuted row claims PASS.

## 10.5. Baseline layers

### `make check-fast`

Purpose: cheap deterministic developer feedback. No network, Docker, browser, external service, dependency install, generated snapshot/media mutation, or secret-value printing. No build output unless a primitive cannot be made output-free and that exception is separately accepted.

Target duration: `<= 90 seconds` on a warm supported local environment (design target, not measured claim).

Target composition after owned primitives exist:

1. `git diff --check`
2. admin typecheck
3. admin lint
4. admin deterministic unit/smoke tests
5. web lint
6. read-only snapshot validation
7. repository docs/policy structural validation when adopted

Exclude: production build, E2E, browser, external API, Docker, deploy, publish, migration integration, vulnerability/network scan.

### `make check`

Purpose: standard local pre-freeze repository gate.

Target duration: `<= 10 minutes` on a warm supported local environment (design target, not measured claim).

Target composition:

1. `make check-fast`
2. full admin unit/component test suite
3. admin build
4. existing web package `check` or its accepted equivalent
5. repository contract/fixture validation available without external services
6. adopted secret scan only if safe, bounded, repository-local
7. generation drift checks for generators in changed scope

Must not include: production deploy, S3 sync, Timeweb/Yandex deploy, public external service dependency, uncontrolled browser E2E, DB integration unless Task Packet makes DB relevant.

### `make check-full`

Purpose: exhaustive local/CI gate for supported full environment. No universal duration claim beyond bounded execution.

Target composition:

1. `make check`
2. accessibility suite
3. controlled E2E
4. DB integration/migration checks when DB foundation exists
5. OpenAPI generation/drift when OpenAPI exists
6. compiler/release contract tests when those components exist
7. vulnerability/dependency scan when adopted
8. broader secret scan when adopted
9. repeated lifecycle/race checks where relevant

Conditional primitives must fail with actionable `MISSING_PREREQUISITE` when mandatory for changed scope; never silently skip; use repository-defined explicit optionality; never contact production.

## 10.6. Scope-aware validation

Root layers are baseline floors, not sufficient for every task. Task Packet adds task-specific commands from `26_VALIDATION_MATRIX.md`. UI adds component/a11y/visual/E2E as applicable; API adds request/denial/timeout; DB adds migration/integration/replay; release adds publish/rollback; docs adds link checks, unresolved-token review, and manual review; protected mutation adds registry-required checks. A full root gate does not replace focused targeted validation.

## 10.7. Side-effect policy

| Command class | Filesystem writes | Network | External services | Allowed layer |
|---|---|---|---|---|
| install (`npm ci`/`npm install`) | lock/node_modules | registry | npm registry | never a check |
| dev server | none required | local listen | none | never a gate |
| deploy/publish/S3 sync | may mutate remote | yes | production-like | never a check |
| production build | `.next`/`out`/`dist` | may (e.g. S3 verify) | may | `check` / `check-full` only when owned |
| read-only lint/typecheck/unit | none | no | no | `check-fast`+ |
| snapshot denylist validate | none | no | no | `check-fast`+ |
| secret scan (`make secret-scan`) | none / temp only | no (local) | no | `check`+ when orchestration adopts it; standalone gate now |
| E2E/a11y browser | traces/artifacts bounded | local | none prod | `check-full` |

Rules: generated snapshots cannot be rewritten by validation; temp files owned/bounded/cleaned; checks do not stage/commit/mutate branch; checks do not conceal pre-existing dirty files.

## 10.8. Exit and output contract

Future canonical targets must: nonzero on failed or missing required primitive; preserve primitive exit where practical; print stable phase name and exact failed command; avoid secret values and full environment dumps; distinguish `FAIL`, `BLOCKED`, `MISSING_PREREQUISITE`, `SKIPPED_BY_POLICY`; never report PASS for zero matched tests; never aggregate PASS if a required phase was skipped; retain failure evidence in ExecPlan.

`SKIPPED_BY_POLICY` is allowed only when repository policy marks the phase optional for that invocation. It is not PASS.

## 10.9. Node and dependency baseline

Adopted Node baseline is major `22`. Local Node `24` cannot prove Node `22` compatibility. Exact patch is not adopted by M0-07. Dependency installation is a separate explicit action. Checks must not run `npm install`, `npm ci`, `npx` auto-download, or mutate lockfiles. Package-local lockfile strategy for deterministic admin install is a separate gap (BC-GAP-03). Missing `apps/admin/node_modules` means admin build is environment-blocked, not FAIL/PASS invention. Root lockfile absence is a recorded fact, not repaired here.

## 10.10. No-false-pass rules

- Verify script exists before execution.
- Verify exact named test exists; require nonzero tests.
- Build is not test coverage; lint is not typecheck; typecheck is not runtime validation.
- Snapshot denylist validation is not full schema validation.
- Success on stale generated output is not source correctness.
- Successful retry does not delete prior failure history.
- Missing dependency is blocker; wrong Node major is blocker when exact baseline required.
- Output from another HEAD/fingerprint is invalid evidence.
- CI success does not prove a local command exists if the workflow uses inline logic.
- Manual review is recorded as manual, not automated PASS.

## 10.11. Current roadmap ownership

| Missing primitive | Accepted owner | Dependency | Acceptance boundary | Does not own |
|---|---|---|---|---|
| admin typecheck | M0-08 | M0-07 | `npm --prefix apps/admin run typecheck` exists and fails on type error | lint, tests, root Make orchestration |
| admin lint | M0-09 | M0-08 | lint runs; baseline findings not hidden; no mass format | typecheck, tests, root orchestration |
| admin test runner / smoke | M0-10 | M0-08 | one smoke test runs; zero-test false pass excluded | fix GET client behavior; a11y/E2E suites; root orchestration |
| secret scan gate | M0-11 (DONE adoption) | M0-03 | `make secret-scan`; no secret printing; worktree scope; see `SECRET_SCAN.md` | authorize commit by itself; install/deploy; history audit |

## 10.12. Roadmap gaps

All gaps below are **PROPOSAL ONLY**. They are not accepted roadmap Task IDs. Do not invent Task IDs. `23_ATOMIC_ROADMAP.md` is unchanged by M0-07.

### BC-GAP-01 — Root orchestration implementation

**Status:** UNOWNED
**Evidence:** `Makefile` has `check` → web only (`Makefile:150-151`); `check-fast`/`check-full` absent; no roadmap row owns wiring three layers after M0-08..M0-11.
**Risk:** Agents may treat planned Make targets as existing or claim `make check` equals future repository gate.
**Proposed atomic outcome:** Add/wire `make check-fast`, redefine `make check`, add `make check-full` calling package primitives; fail on missing required primitives.
**Prerequisites:** M0-08..M0-11 (and any required docs validator) complete or explicitly scoped.
**Forbidden scope:** implementing typecheck/lint/test/secret scan inside the orchestration task; deploy/install.
**Acceptance:** three targets exist; composition matches this document; missing primitive → nonzero; no silent skip.
**Authorization:** PROPOSAL ONLY — create one atomic Task Packet after M0-08..M0-11 or explicitly assign ownership.

### BC-GAP-02 — Repository docs/policy validation

**Status:** UNOWNED
**Evidence:** no Makefile/npm script for link/unresolved-token/INDEX/registry structural checks; INDEX validation historically ad-hoc in ExecPlans.
**Risk:** docs drift and broken links without a repeatable gate.
**Proposed atomic outcome:** one repeatable docs/policy structural command (links, unresolved tokens, INDEX coverage rules as scoped).
**Prerequisites:** INDEX and protected registry exist (done).
**Forbidden scope:** rewriting imported package specs; implementing secret scan.
**Acceptance:** command exists; fails on broken required links or unresolved tokens; no secret printing.
**Authorization:** PROPOSAL ONLY.

### BC-GAP-03 — Deterministic admin dependency installation

**Status:** UNOWNED
**Evidence:** `apps/admin/package-lock.json` absent; `apps/admin/node_modules` absent; root lockfile absent; CI caches `apps/web/package-lock.json` only (`sheet-sync.yml`).
**Risk:** admin build/typecheck blocked or non-reproducible; false PASS/FAIL invention.
**Proposed atomic outcome:** adopt lockfile/install baseline for `apps/admin` so checks can become runnable.
**Prerequisites:** none beyond maintainer choice of lock strategy.
**Forbidden scope:** upgrading unrelated deps; implementing lint/test.
**Acceptance:** documented install path; lockfile or approved alternative; admin deps installable on Node 22.
**Authorization:** PROPOSAL ONLY.

### BC-GAP-04 — Node version pinning declaration

**Status:** UNOWNED
**Evidence:** workflow uses `node-version: "22"`; no `.nvmrc` / `.node-version` / Volta / engines policy in repo; local observed `v24.13.1`.
**Risk:** local Node 24 used to claim Node 22 compatibility.
**Proposed atomic outcome:** repository-visible Node 22 declaration (mechanism chosen by Task Packet, not by this document).
**Prerequisites:** none.
**Forbidden scope:** forcing version-manager install in unrelated tasks; changing CI without authorization.
**Acceptance:** declared major 22 visible to agents/humans; mismatch is detectable blocker when required.
**Authorization:** PROPOSAL ONLY.

### BC-GAP-05 — Root/CI convergence

**Status:** UNOWNED
**Evidence:** workflows call `node scripts/validate-public-snapshot.mjs` inline; none call `make check` / future layers; ops workflows are separate graphs.
**Risk:** CI green while local canonical gates diverge or do not exist.
**Proposed atomic outcome:** workflows invoke canonical root gates after those gates exist.
**Prerequisites:** BC-GAP-01 implemented.
**Forbidden scope:** rewriting production deploy pipelines beyond calling gates; inventing local gates in CI-only.
**Acceptance:** CI uses same Make targets as local baseline for shared phases.
**Authorization:** PROPOSAL ONLY.

### BC-GAP-06 — Admin a11y and E2E entrypoints

**Status:** UNOWNED
**Evidence:** `test:a11y` / `test:e2e` planned in AGENTS future list; M0-10 owns smoke test runner only.
**Risk:** check-full composition references missing owners.
**Proposed atomic outcome:** separate Task Packets for admin a11y suite and controlled E2E entrypoint when ready.
**Prerequisites:** M0-10 (runner) recommended.
**Forbidden scope:** expanding M0-10 silently.
**Acceptance:** scripts declared; nonzero tests; browser scoped; no prod contact.
**Authorization:** PROPOSAL ONLY.

## 10.13. Adoption sequence

1. M0-08 admin typecheck
2. M0-09 admin lint
3. M0-10 admin test runner
4. M0-11 secret scan
5. maintainer-authorized root orchestration task (BC-GAP-01)
6. maintainer-authorized docs validation task if not safely combined (BC-GAP-02)
7. CI convergence after root gates are real (BC-GAP-05)
8. only then treat all three root commands as existing gates

M0-08 may begin after M0-07 even though root orchestration remains planned. Admin install/Node pin gaps (BC-GAP-03/04) may block runnable evidence and must be inherited as blockers.

## 10.14. Task Packet requirements for tooling tasks

Every future tooling Task Packet must specify: exact command to create/change; owner package/path; allowed dependency changes; lockfile authorization; Node baseline; expected side effects; exact tests proving nonzero execution; zero-test prevention; negative path; root wrapper impact; CI impact; protected paths; freeze/review; commit policy.

## 10.15. Current completion semantics

At end of M0-07: `BASELINE_COMMANDS.md` exists; command design accepted; missing commands remain missing; root Make targets unchanged; next implementation task is M0-08; no root gate may be called existing until implemented and verified; M0 exit gate is not yet satisfied.
