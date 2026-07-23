# BM QuestHub CMS — M1 Contract Baseline Report

Status: **M1-12 DRAFT EVIDENCE REPORT / PENDING REVIEW AND MERGE**

Этот документ — evidence snapshot по завершённым M0 и M1-01..11.
Он не является authority для runtime-изменений и не авторизует M2 implementation.

---

## Метаданные

| Поле | Значение |
|---|---|
| Report ID | M1-12 |
| Repository | Brain-Master/BM_QuestHub |
| Baseline `main` | `1f66e4776d38fcf041dbcae0450a858a3d1daf63` |
| Coverage | M0 + M1-01..11 |
| Generated at | `2026-07-23T06:25:00+03:00` |
| Environment | Node `v22.23.1` / npm `10.9.8` / fnm `1.39.0` |
| Current admin baseline | 10 files / 132 tests |
| Formal progress before M1-12 merge | 23 / 174 = 13.2% |
| M1 completion before M1-12 merge | 11 / 12 = 91.7% |

Счётчики roadmap меняются только после подтверждённого merge M1-12.
После будущего merge ожидается: Accepted on main 24 / 174 = 13.8%; M0+M1 24 / 24 = 100%; M1 12 / 12 = 100%.
Следующая canonical задача после merge: **M2-01 — Create app shell structure**.
M1-12 не увеличивает progress внутри implementation task и не стартует M2.

---

## Executive verdict

M0 зафиксировал governance/reproducibility foundation (policy, baseline commands, secret scan, Admin CMS CI).

M1 стабилизировал current legacy admin API boundary на клиенте:
GET-body defect устранён; timeout/cancellation и typed HTTP errors установлены;
snapshot input валидируется на top-level compatibility boundary;
read-model selectors готовы для read-only UX;
legacy token access и 401 transition изолированы и покрыты тестами;
UI error presentation bounded/redacted;
минимальный request lifecycle observability contract существует.

Current editor, shared-token auth и publication **не** стали production-safe.

**M1 exit gate is satisfied for entering read-only UX work, with the explicit constraint that existing write/publish flows remain legacy-only.**

CMS не объявляется production-ready. Security risks не объявляются закрытыми.

---

## Milestone chronology

| Phase | Tasks | PR | Merge SHA | Result |
|---|---|---|---|---|
| M0 + M1-01..06 | Foundation: governance, API/snapshot harden, selectors, CI | [#2](https://github.com/Brain-Master/BM_QuestHub/pull/2) | `6e508a108cb0e6222985134a3108708fd8d50e1d` | MERGED; 6 commits / 85 files |
| M1-07 | Legacy token adapter | [#3](https://github.com/Brain-Master/BM_QuestHub/pull/3) | `3e772371adb9f72c7843e315378f7eae8bc3d528` | MERGED; 3 commits / 8 files; R1 evidence gaps |
| M1-08 | Auth-failure state | [#4](https://github.com/Brain-Master/BM_QuestHub/pull/4) | `d55b04c21fbc565a236582307c36c2820329b909` | MERGED; 3 commits / 8 files; R1 ExecPlan completion |
| M1-09 | Snapshot contract freeze | [#5](https://github.com/Brain-Master/BM_QuestHub/pull/5) | `3f0e99278f996cb8281956e83105a2e9aa736a0c` | MERGED; 2 commits / 7 files |
| M1-10 | Safe UI error formatter | [#6](https://github.com/Brain-Master/BM_QuestHub/pull/6) | `63e28cdb785fa2a7fc10ae645b9d6f431a97204e` | MERGED; 2 commits / 7 files |
| M1-11 + R1 | API observability + clock isolation | [#7](https://github.com/Brain-Master/BM_QuestHub/pull/7) | `1f66e4776d38fcf041dbcae0450a858a3d1daf63` | MERGED; 3 commits / 7 files |

### Corrective / review history (кратко)

| Task | Corrective | Review record |
|---|---|---|
| M0 + M1-01..06 | Stack через INT-03 / PR #2; отдельный `M0-01.md` ExecPlan отсутствует | [INT-03](../execplans/INT-03.md) |
| M1-07 | [M1-07-R1](../execplans/M1-07-R1.md) — evidence gaps без product change | [M1-07-REVIEW](../execplans/M1-07-REVIEW.md) |
| M1-08 | [M1-08-R1](../execplans/M1-08-R1.md) — completion ExecPlan placeholders | [M1-08-REVIEW](../execplans/M1-08-REVIEW.md) |
| M1-09 | Нет R1 | [M1-09-REVIEW](../execplans/M1-09-REVIEW.md) |
| M1-10 | Нет R1 | [M1-10-REVIEW](../execplans/M1-10-REVIEW.md) |
| M1-11 | [M1-11-R1](../execplans/M1-11-R1.md) — isolate observability clock failures | [M1-11-REVIEW](../execplans/M1-11-REVIEW.md) |

### CI evidence (verified via authenticated `gh`)

| PR | Reviewed head (final PR commit) | Final `pull_request` CI | Post-merge `push` CI |
|---|---|---|---|
| #2 | `48ebfd4f69a1b8c22a866d28ab923e0fff896d41` | [29815435529](https://github.com/Brain-Master/BM_QuestHub/actions/runs/29815435529) success | [29815517010](https://github.com/Brain-Master/BM_QuestHub/actions/runs/29815517010) success |
| #3 | `0f72af3d55a0ecf5bc0a5ff2d396810773ca93be` | [29879657547](https://github.com/Brain-Master/BM_QuestHub/actions/runs/29879657547) success | [29879730885](https://github.com/Brain-Master/BM_QuestHub/actions/runs/29879730885) success |
| #4 | `f200957ed9cc521b6854ee09a2f404586d340979` | [29927952984](https://github.com/Brain-Master/BM_QuestHub/actions/runs/29927952984) success | [29928114718](https://github.com/Brain-Master/BM_QuestHub/actions/runs/29928114718) success |
| #5 | `0b18b0d264c8e42ce294beb76bb6dfac8c4f6fc8` | [29961634465](https://github.com/Brain-Master/BM_QuestHub/actions/runs/29961634465) success | [29961713928](https://github.com/Brain-Master/BM_QuestHub/actions/runs/29961713928) success |
| #6 | `5edde24c76ed7badba00c5af7ad1639548c311bf` | [29967921017](https://github.com/Brain-Master/BM_QuestHub/actions/runs/29967921017) success | [29968009195](https://github.com/Brain-Master/BM_QuestHub/actions/runs/29968009195) success |
| #7 | `14b064ec05182383725f34ff42d053d604d13c0b` | [29973104672](https://github.com/Brain-Master/BM_QuestHub/actions/runs/29973104672) success | [29973199756](https://github.com/Brain-Master/BM_QuestHub/actions/runs/29973199756) success / head `1f66e477…` |

Authority при расхождении chat vs GitHub: **current GitHub state** и **current source/tests**.

---

## Current contract baseline

| Boundary | Current guarantee | Evidence | Explicit non-guarantee | Owner of next change |
|---|---|---|---|---|
| Request transport | GET `/snapshots` через query, без body; PUT/POST envelopes со `path`; timeout 15s; manual cancel ≠ timeout; один outbound `x-request-id` на observed operation | [`api.ts`](../../../apps/admin/src/api.ts) (`REQUEST_TIMEOUT_MS`, `requestUrl`, body gate); [`api.request-contract.test.ts`](../../../apps/admin/src/api.request-contract.test.ts); PR [#2](https://github.com/Brain-Master/BM_QuestHub/pull/2), [#7](https://github.com/Brain-Master/BM_QuestHub/pull/7) | Нет retry/offline; нет BFF security boundary | M3+ secure transport / BFF |
| HTTP errors | Стабильные коды 401/403/409/422/5xx/generic; non-2xx body unread; optional safe inbound correlation; raw backend payload не показывается UI | [`api.ts`](../../../apps/admin/src/api.ts) `apiClientErrorCode` / `ApiClientError`; [`ui-error-formatter.ts`](../../../apps/admin/src/ui-error-formatter.ts) | Server semantics не зафиксированы; typed 409 ≠ optimistic locking | M3/M4/M5+ |
| Snapshot boundary | catalog/map/site **v2**; manifest **null \| v2**; offers **null \| v1**; required top-level fields; bounded diagnostics (max 5); fail-closed unknown versions | [`snapshot-boundary.ts`](../../../apps/admin/src/snapshot-boundary.ts) `CURRENT_SNAPSHOT_VERSIONS`; [`snapshot-contract.test.ts`](../../../apps/admin/src/snapshot-contract.test.ts); [M1-09](../execplans/M1-09.md) | Нет deep entity validation; нет semantic relation validation; нет migration/coercion | M4+ / M9 |
| Read models | Pure selectors; tested counts/status/entity summaries; UI не обязана парсить raw objects inline | [`snapshot-selectors.ts`](../../../apps/admin/src/snapshot-selectors.ts); [`snapshot-selectors.test.ts`](../../../apps/admin/src/snapshot-selectors.test.ts); PR [#2](https://github.com/Brain-Master/BM_QuestHub/pull/2) | Нет finished screens/routes/search/filter UX | M2 |
| Legacy token / auth failure | `sessionStorage` access centralized; `clear` = `removeItem`; 401 clears runtime token/input; non-secret buffers preserved; no reload loop; explicit re-auth Save → один refresh | [`legacy-token-adapter.ts`](../../../apps/admin/src/legacy-token-adapter.ts); [`auth-failure-state.ts`](../../../apps/admin/src/auth-failure-state.ts); PR [#3](https://github.com/Brain-Master/BM_QuestHub/pull/3), [#4](https://github.com/Brain-Master/BM_QuestHub/pull/4) | Shared token остаётся; нет identity/RBAC; `sessionStorage` ≠ production auth | M3 |
| UI errors | Known/unknown → bounded Russian copy; raw message/stack/cause/payload/issues excluded; safe correlation ID может отображаться | [`ui-error-formatter.ts`](../../../apps/admin/src/ui-error-formatter.ts); PR [#6](https://github.com/Brain-Master/BM_QuestHub/pull/6) | Нет global notification system; нет broader server error schema | M2+ UX |
| Observability | 8 stable operations; 6 stable outcomes; frozen five-field event; один outbound request ID; одно terminal event; clock/factory/observer failures isolated; нет body/token/header/URL/raw-error fields | [`api-observability.ts`](../../../apps/admin/src/api-observability.ts); [M1-11](../execplans/M1-11.md), [M1-11-R1](../execplans/M1-11-R1.md) | Нет production sink; нет metrics backend; нет tracing/persistence/sampling | Future observability adoption (task ID не назначен) |

### Request transport (детали)

Гарантии подтверждены current source:

- `REQUEST_TIMEOUT_MS = 15_000` в `apps/admin/src/api.ts`.
- GET/HEAD URL через `path` query; body JSON только если method не GET/HEAD.
- `loadSnapshots` вызывает `request("GET", "/snapshots", undefined, …)`.
- Manual abort → `AbortError`; timeout → `TimeoutError`.

Non-guarantees: нет client retry; нет offline queue; browser по-прежнему шлёт shared `x-content-token`.

### Snapshot boundary (детали)

`CURRENT_SNAPSHOT_VERSIONS`: catalog/map/site/manifest = 2; offers = 1.
`manifest` и `offers` допускают `null`.
Required top-level fields проверяются на compatibility boundary; diagnostics ограничены.
Deep entity / relation validation — **OPEN / ACCEPTED FOR READ-ONLY ENTRY**.

### Read models (детали)

Экспортируемые selectors включают summaries (world/course/venue/offer), entity counts, collection/status counts и `selectSnapshotReadModel`.
Они pure и покрыты тестами; экраны M2 ещё не реализованы.

---

## Validation baseline

Измерено на `main` / branch base `1f66e4776d38fcf041dbcae0450a858a3d1daf63` (Node `v22.23.1`):

| Gate | Result |
|---|---|
| Admin suites | **10 files / 132 tests** / failed 0 / skipped 0 / todo 0 |
| Guard `scripts/admin-cms-ci-guard.test.mjs` | **16 / 16** |
| Lint | PASS |
| Typecheck | PASS |
| `npm ls --all` | PASS |
| Build | PASS |
| `apps/admin/dist` cleanup | PASS (absent after delete) |
| `make secret-scan` | PASS |
| Admin CMS CI | `pull_request` + `push` evidence в таблице chronology |

### Focused test counts (current)

| Suite | Count |
|---|---:|
| `api.request-contract.test.ts` | 29 |
| `api-observability.test.ts` | 12 |
| `ui-error-formatter.test.ts` | 16 |
| `auth-failure-state.test.ts` | 10 |
| `snapshot-contract.test.ts` | 18 |
| `snapshot-boundary.test.ts` | 13 |
| `snapshot-fixtures.test.ts` | 5 |
| `snapshot-selectors.test.ts` | 18 |
| `legacy-token-adapter.test.ts` | 10 |
| `api.smoke.test.ts` | 1 |
| **Sum** | **132** |

Source-inspection / contract-sentinel tests являются полезными guards контракта, но implementation-coupled и brittle: изменение формулировок/структуры без смены semantics может ломать тесты. Это accepted M1 trade-off, не доказательство production completeness.

---

## Risk register

| ID | Risk | Current state | Why M1 did not close it | Owner / milestone |
|---|---|---|---|---|
| RISK-01 | Shared legacy token | **OPEN** | M1 изолирует access/failure state, но не создаёт identity/RBAC | M3 |
| RISK-02 | Raw JSON editor / write path | **OPEN / LEGACY-ONLY** | Existing `App.tsx` и `saveSnapshot` остаются; новый default UX не должен от них зависеть | M2-13 hide from default navigation; M3+ secure write; M5+ domain forms |
| RISK-03 | Publication safety | **OPEN** | Transport/`publishContent` tested, но atomic publication / preview / rollback / cutover не решены | M9 / M10 |
| RISK-04 | Optimistic locking / concurrency | **OPEN** | Conflict mapping (409) существует; revision enforcement не доказан | M3 / M4 / M5+ |
| RISK-05 | Top-level-only validation | **OPEN / ACCEPTED FOR READ-ONLY ENTRY** | Deep schemas вне M1; достаточно для безопасного read load | M4+ and M9 |
| RISK-06 | Storage / source architecture | **OPEN** | Google Sheets / S3 / static chain остаётся; PostgreSQL/import не реализованы | M4 |
| RISK-07 | No production observability sink | **OPEN / INTENTIONAL** | Event contract есть; sink/SDK/persistence нет. Несуществующий task ID не назначается | Future adoption |
| RISK-08 | Backend / security findings | **OPEN** / частично **REQUIRES RE-AUDIT** | M1 — client boundary only | M3 and security review |
| RISK-09 | Read-only UX absent | **OPEN / NEXT MILESTONE** | M1 готовит contracts, не screens | M2 |
| RISK-10 | External dirty state | **PROCESS RISK / OUTSIDE CMS COMMITS** | 39 paths; fingerprint `41563d81ded1fdf2068b04095c5e2ff7afa36b25e50daba6ca280c1b9407a82c` (Node `Buffer.compare` sort, path NUL bytes NUL); content dump не приводится | Process hygiene |

### RISK-08 — поддерживаемые findings

Подтверждаются current source + [30_CURRENT_STATE_FINDINGS](./30_CURRENT_STATE_FINDINGS.md) (документ self-labeled starting snapshot → часть claims **REQUIRES RE-AUDIT**):

| Finding | State |
|---|---|
| No Admin BFF | **OPEN** — browser всё ещё вызывает content-admin напрямую |
| No server-side RBAC / individual identity | **OPEN** — shared token model |
| Direct / raw publication and storage paths | **OPEN** — `saveSnapshot` / `publishContent` / S3-oriented UI controls still present |
| CORS / platform security boundary concerns | **REQUIRES RE-AUDIT** — не зафиксированы как measured current finding в этом baseline; ADR backlog mentions CORS evidence list, но это не runtime proof |
| GET body P0 в findings | **STALE** — устранён в M1-01 / PR #2; не считать open defect |

---

## Raw save and publication decision

**DECISION:**
The existing raw JSON editor, `saveSnapshot` calls and direct publish controls
remain legacy-only compatibility mechanisms. They are not the foundation for
new default CMS UX and are not evidence of production-safe editing.

### Implications

1. M2 default navigation — read-only.
2. New M2 screens consume validated snapshots / selectors.
3. New M2 screens do not call `saveSnapshot` / `publishContent`.
4. Existing raw functionality is not deleted by M1-12.
5. M2-13 hides editor behind explicit technical flag/route.
6. Shared token presence does not authorize writes as a product capability.
7. Write expansion requires separately authorized secure backend, identity/RBAC and domain workflow work.
8. This is a documentation boundary, not runtime enforcement.

### Rationale

- Preserve compatibility for current operators.
- Do not present technical controls as product UX.
- Avoid deepening unsafe write dependency while building read-only surfaces.
- Allow read-only progress under M1 exit gate.

### Rejected alternatives

| Option | Verdict |
|---|---|
| A: Treat raw editor as first production CMS editor | **Rejected** |
| B: Delete raw save/publish now | **Rejected** — behavior change is out of M1-12 scope |
| C: Keep compatibility, classify legacy-only, hide in M2, replace later | **Accepted** |

Evidence that raw path still exists: `apps/admin/src/App.tsx` imports and calls `saveSnapshot` / `publishContent`; UI includes save/publish controls. Evidence that transport is tested does **not** equal production-safe editing.

---

## M1 exit-gate assessment

Canonical gate ([23_ATOMIC_ROADMAP](../02_delivery/23_ATOMIC_ROADMAP.md)):

> Legacy admin API client детерминированно протестирован; GET bug устранён; raw snapshots валидируются на boundary.

| Exit criterion | Verdict | Evidence | Caveat |
|---|---|---|---|
| Legacy admin API client deterministically tested | **PASS** | 10/132 admin tests; request 29; guard 16/16; PR CI history | Tests are contract sentinels; brittle by design |
| GET body defect removed | **PASS** | Current `api.ts` GET/HEAD no body; PR #2 | Findings doc still mentions historical P0 — stale text |
| Raw snapshots validated at boundary | **PASS** | `parseSnapshotsBundle` + contract/boundary tests | Top-level only |
| Safe entry into read-only UX | **PASS WITH CONSTRAINTS** | Selectors + load contract + error/auth states | No screens yet; write paths remain legacy |
| Production-safe editing / auth / publication | **NOT CLAIMED** | — | Explicitly outside M1 |

**M1 exit gate: PASS for M2 read-only UX foundation.**
**Write, auth and publication readiness: NOT PASSED and not required by M1.**

---

## M2 entry boundary

Recommended next task after M1-12 merge review: **M2-01 — Create app shell structure**.

### Entry assumptions (available now)

- Current API load contract (`loadSnapshots`).
- Snapshot boundary validation.
- Read-model selectors.
- Auth-failure and UI error presentation states.
- Environment / loading / error / authorized state hooks for shell.
- No data API change required for shell.
- No new write paths required for shell.

### Not blockers for M2-01

- No production auth.
- No PostgreSQL.
- No editing forms.
- No publish redesign.

Они являются blockers для write-enabled rollout, не для read-only shell.

**M2-01 не начат этой задачей. M1-12 не авторизует M2 implementation.**

---

## Evidence index

| Evidence ID | Artifact | What it supports |
|---|---|---|
| E-01 | [30_CURRENT_STATE_FINDINGS](./30_CURRENT_STATE_FINDINGS.md); [M0-12](../execplans/M0-12.md) (M0-01 ExecPlan absent) | Starting findings; M0 inventory gap honesty |
| E-02 | [PR #2](https://github.com/Brain-Master/BM_QuestHub/pull/2); [INT-03](../execplans/INT-03.md); merge `6e508a10…` | M0 + M1-01..06 foundation |
| E-03 | [PR #3](https://github.com/Brain-Master/BM_QuestHub/pull/3); [M1-07-REVIEW](../execplans/M1-07-REVIEW.md) | Legacy token isolation |
| E-04 | [PR #4](https://github.com/Brain-Master/BM_QuestHub/pull/4); [M1-08-REVIEW](../execplans/M1-08-REVIEW.md) | Auth-failure transition |
| E-05 | [PR #5](https://github.com/Brain-Master/BM_QuestHub/pull/5); [M1-09-REVIEW](../execplans/M1-09-REVIEW.md) | Snapshot contract freeze |
| E-06 | [PR #6](https://github.com/Brain-Master/BM_QuestHub/pull/6); [M1-10-REVIEW](../execplans/M1-10-REVIEW.md) | UI error formatter |
| E-07 | [PR #7](https://github.com/Brain-Master/BM_QuestHub/pull/7); [M1-11-REVIEW](../execplans/M1-11-REVIEW.md); [M1-11-R1](../execplans/M1-11-R1.md) | Observability + clock isolation |
| E-08 | [`api.ts`](../../../apps/admin/src/api.ts); [`api.request-contract.test.ts`](../../../apps/admin/src/api.request-contract.test.ts) | Transport / errors / GET fix |
| E-09 | [`snapshot-boundary.ts`](../../../apps/admin/src/snapshot-boundary.ts); [`snapshot-contract.test.ts`](../../../apps/admin/src/snapshot-contract.test.ts); [`snapshot-selectors.ts`](../../../apps/admin/src/snapshot-selectors.ts) | Boundary + selectors |
| E-10 | [`legacy-token-adapter.ts`](../../../apps/admin/src/legacy-token-adapter.ts); [`auth-failure-state.ts`](../../../apps/admin/src/auth-failure-state.ts) | Token/auth failure |
| E-11 | [`ui-error-formatter.ts`](../../../apps/admin/src/ui-error-formatter.ts) | Bounded UI errors |
| E-12 | [`api-observability.ts`](../../../apps/admin/src/api-observability.ts) | Observation contract |
| E-13 | [BASELINE_COMMANDS](../BASELINE_COMMANDS.md); Admin CMS CI runs linked above; local 10/132 measurement | Validation / CI baseline |

Evidence precedence: current source/test → current Git/GitHub → frozen REVIEW ExecPlan → implementation ExecPlan → original audit/reference.
При расхождении разница описана явно (пример: GET P0 в findings = STALE; INT-03 merge fields incomplete vs git merge SHA).

---

## What this report does not claim

- CMS **not** production-ready.
- Authentication **not** production-ready.
- Server-side RBAC **absent**.
- Raw save is **not** safe product editing.
- Publication **not** atomic / rollback-ready.
- Deep schemas **incomplete**.
- PostgreSQL / import **not** implemented.
- Read-only screens **not** implemented.
- Production observability **not** deployed.
- External dirty state **not** resolved by M1-12.
- M2 **not** started.
- Roadmap counters **not** updated by this commit.
- INDEX / MANIFEST **not** updated (package-maintenance scope separate).

---

## Formal progress note

| Moment | Accepted on main | M0 | M1 |
|---|---|---|---|
| Before M1-12 merge | 23 / 174 = 13.2% | 12 / 12 = 100% | 11 / 12 = 91.7% |
| After future confirmed M1-12 merge | 24 / 174 = 13.8% | 12 / 12 | 12 / 12 = 100% |

Next after M1-12 merge review: M2-01 — Create app shell structure.
Authorization for M2-01: **NO** until M1-12 PR is reviewed and merged.
