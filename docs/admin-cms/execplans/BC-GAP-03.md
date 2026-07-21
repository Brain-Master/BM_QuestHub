# ExecPlan BC-GAP-03 — Establish deterministic apps/admin dependency baseline

## 0. Metadata

- Status: `DONE`
- Repository: `Brain-Master/BM_QuestHub` (`D:/WORK/01_Active_Projects/BM_QuestHub`)
- Branch: `main`
- Base SHA: `aa45e868491435697d794214634cb02639c9665d`
- Final HEAD: `aa45e868491435697d794214634cb02639c9665d` (unchanged)
- Started at: `2026-07-20T02:45:00+03:00`
- Finished at: `2026-07-20T02:48:01+03:00`
- Task Packet: owner prompt `BC-GAP-03 — Establish deterministic apps/admin dependency baseline`
- Agent: parent executor (Composer)
- Active repository policy: root `AGENTS.md`
- Active ExecPlan policy: root `PLANS.md`
- Commit policy: `NO COMMIT`
- Push policy: `DO NOT PUSH`

## 1. Objective

Создать воспроизводимый `apps/admin/package-lock.json`, установить локальные зависимости из lockfile (`npm ci`) и доказать наличие локальных `tsc`/`vite` binaries для последующего M0-08. Не добавлять typecheck и не начинать M0-08/M0-09.

## 2. Non-goals

- typecheck / lint / tests / build acceptance;
- root orchestration / Node declaration / dependency upgrades / range changes;
- package-manager migration / workspace conversion / audit remediation;
- source/tsconfig/package.json edits; commit/push; M0-08.

## 3. Authorized / forbidden paths

### Tracked writes

- `apps/admin/package-lock.json`
- `docs/admin-cms/execplans/BC-GAP-03.md`

### Authorized untracked/ignored local output

- `apps/admin/node_modules/**` (ignored; never staged; not in freeze fingerprint)

### Forbidden

- `apps/admin/package.json`; admin source/tsconfig; root/web packages; existing lockfiles; Makefile; workflows; governance docs; imported package; previous ExecPlans; snapshots; scripts; `.cursor/**`; `.vscode/**`; Git index.

## 4. Preflight evidence

```text
2026-07-20T02:45:00+03:00
root: D:/WORK/01_Active_Projects/BM_QuestHub
remote: origin https://github.com/Brain-Master/BM_QuestHub.git
branch: main
HEAD: aa45e868491435697d794214634cb02639c9665d
git index: empty
known external dirty: offers-snapshot; .cursor/plans; .vscode; AGENTS/PLANS/docs/admin-cms; source package; scripts append/update
apps/admin/package.json: True
apps/admin/package-lock.json: False (pre-task)
apps/admin/node_modules: False (pre-task)
local tsc/vite: False (pre-task)
M0-08 ExecPlan: False
.gitignore node_modules: .gitignore:49:node_modules/ covers apps/admin/node_modules
```

### Node/npm session note

Owner activated Node 22 via fnm (`v22.23.1`, npm `10.9.8`). Agent shell uses owner-installed binary tree (no `fnm use` / install / `.nvmrc`):

```text
C:\Users\Xipsin\AppData\Roaming\fnm\node-versions\v22.23.1\installation\
```

`Program Files\nodejs` (Node 24) excluded from session resolution so npm belongs to Node 22.

## 5. Governance fingerprint

| Check | Expected | Actual | Result |
|---|---|---|---|
| M0-07 governance FP (AGENTS+PLANS+BASELINE+INDEX+PROTECTED) | `4544f66331dff85d9aef70c0d9e602d5b9d85fbcc6edea62efa0df417c7fcef4` | `4544f66331dff85d9aef70c0d9e602d5b9d85fbcc6edea62efa0df417c7fcef4` | PASS |
| Imported package FP (33 M0-02 files) | `da2737ed3c8e1a754e0e0159fe82d4ce74e8a2e4a25f82d8dea8d6bab3d92b6e` | `da2737ed3c8e1a754e0e0159fe82d4ce74e8a2e4a25f82d8dea8d6bab3d92b6e` | PASS |
| M0-07 status/review | DONE / APPROVE | DONE / APPROVE | PASS |
| Git index | empty | empty | PASS |

## 6. Node/npm/registry evidence

```text
Node: v22.23.1 (major 22) — PASS
npm: 10.9.8 — same installation tree as Node 22 — PASS
node source: ...\fnm\node-versions\v22.23.1\installation\node.exe
npm source: ...\fnm\node-versions\v22.23.1\installation\npm.ps1
registry: https://registry.npmjs.org/ (HTTPS) — PASS
package-lock config: true — PASS
```

## 7. Package declaration inventory

Pre/post SHA-256 (byte-identical):

| Path | SHA-256 |
|---|---|
| `apps/admin/package.json` | `07664fd386a7abc1772b8b56114634dee8e9f70d43e4267596dffcb629762e0d` |
| `apps/admin/tsconfig.json` | `a555d9213522453ff7569769ec56ef11ceb081f0a7170422843a64bd2c67fbba` |

Direct dependencies/ranges (unchanged):

- dependencies: `react@^19.2.0`, `react-dom@^19.2.0`
- devDependencies: `@types/react@^19.2.0`, `@types/react-dom@^19.2.0`, `@vitejs/plugin-react@^4.7.0`, `typescript@^5.9.0`, `vite@^6.4.0`

Root scripts: `dev`, `build`, `preview` only. No install lifecycle scripts. No `typecheck`.

Forbidden source refs: none in declared package.json.

## 8. Dependency-resolution threat analysis

- Network limited to npm registry HTTPS resolution/download/integrity.
- Lockfile-only step uses `--ignore-scripts`.
- No package.json mutation allowed in final artifact.
- No root lockfile created; scoped to `apps/admin` only.
- Manual lockfile edits forbidden.
- `npm audit` not run.

## 9. Protected node_modules operation

```text
Protected registry ID: NONE covering apps/admin/node_modules/**
Exact path: apps/admin/node_modules/**
Class (task): build_ephemeral
Operation: generate via npm ci; remain installed; never stage
Reason: BC-GAP-03 acceptance requires local tsc/vite for M0-08 unblock
Pre-task existence: NO
Stage authorization: NO
Registry gap: PROTECTED_ARTIFACTS.md has PA-BUILD-001 for apps/admin/dist/** but no row for node_modules; recorded; registry not edited
Rollback/cleanup: removed between two ci runs; final leave installed
Stop conditions: if not gitignored; if other packages' node_modules change; if package.json changes
```

## 10. Component classification

| Artifact | Classification |
|---|---|
| `apps/admin/package-lock.json` | `repository_service_template` |
| `apps/admin/node_modules` | `build_ephemeral` |
| `docs/admin-cms/execplans/BC-GAP-03.md` | `repository_execution_record` |

## 11. Auditor A — lockfile/install design

| ID | Finding | Evidence | Disposition |
|---|---|---|---|
| A1 | Existing ranges declare typescript+vite; no lockfile | `apps/admin/package.json:16-20` | Generate lock via package-lock-only |
| A2 | node_modules absent blocks binaries | preflight | Two npm ci proofs |
| A3 | `.gitignore:49` covers `node_modules/` | `git check-ignore` | Leave install ignored |
| A4 | No package.json change required | scripts/deps complete | package.json forbidden |
| A5 | `--prefix` unsafe vs cwd equivalent | failure history F1 | Adopt cwd scoped equivalent |

## 12. Auditor B — negative / false-pass risks

| ID | Finding | Evidence | Disposition |
|---|---|---|---|
| B1 | Node 24 default in agent shell | Program Files nodejs | Owner-installed v22.23.1 tree |
| B2 | npm `--prefix` rewrites package.json with `file:../..` | F1 | Restore; use cwd |
| B3 | Lifecycle scripts during install | esbuild `hasInstallScript` | Audited; legitimate |
| B4 | Root lockfile creation | absent before/after | Prefix/cwd apps/admin only |
| B5 | Staging node_modules | forbidden | Never staged; ignored |
| B6 | typecheck creep | M0-08 | Script absent |
| B7 | Single install as reproducibility | flake risk | Two ci + inventory hash match |
| B8 | Global tsc/vite | PATH pollution | Invoke `.bin` under apps/admin only |

## 13. Exact implementation

### Lockfile generation (final successful method)

Scoped equivalent of authorized command (cwd `apps/admin` — required after F1):

```powershell
Push-Location apps\admin
npm install --package-lock-only --ignore-scripts --no-audit --no-fund
Pop-Location
```

### Installs

```powershell
Push-Location apps\admin
npm ci --no-audit --no-fund
Pop-Location
```

(twice; node_modules removed between)

### Why not literal `--prefix`

`npm --prefix apps/admin install --package-lock-only ...` mutated `apps/admin/package.json` by adding `"bm-questhub": "file:../.."` (forbidden `file:` ref; parent root package name). Restored via `git checkout HEAD -- apps/admin/package.json` and deleted the bad lockfile. Cwd-scoped equivalent produced a clean lockfile without package.json mutation.

## 14. Lockfile audit

```text
lockfileVersion: 3
package entries: 119 (incl root)
registry hosts: registry.npmjs.org only
integrity coverage: 118/118 remote packages
Git refs: 0
HTTP refs: 0
local/workspace/file refs: 0
credential-bearing URLs: 0
secret-like findings: 0
root name/version match package.json: YES
root deps/devDeps names+ranges match: YES
```

Lockfile SHA-256: `e69022ea7004536e96532031f17244b2deee9a23d013b4124d3d0ca3b0fe1e2f`

## 15. Lifecycle-script audit

| Package | Evidence | Disposition |
|---|---|---|
| Root `@bm-questhub/admin` | no install lifecycle scripts | OK |
| Direct deps (react, vite, typescript, types, plugin) | `npm view … scripts` — no install lifecycle (or none material) | OK |
| `esbuild@0.25.12` (transitive via vite) | lock `hasInstallScript=true`; registry `postinstall: node install.js` | ACCEPT — platform binary fetch required by Vite toolchain |
| Other install scripts observed in ci output | none beyond normal npm ci “added 69 packages” | OK |

Lifecycle surface is within React/Vite/TypeScript toolchain. No Git/local dependency scripts. No repository-config arbitrary shell.

## 16. Clean install / reproducibility

| Run | Command | Exit | Package inventory hash | tsc | vite |
|---|---|---:|---|---|---|
| First | `npm ci --no-audit --no-fund` (cwd apps/admin) | 0 | `61f9b09143bf8335d1698d56a0e5c01ab24ba6e086dd95fcde394f98b750624e` (69 pkgs) | 5.9.3 | 6.4.3 |
| Second | same after removing node_modules | 0 | same hash | 5.9.3 | 6.4.3 |

- package.json unchanged across both
- lockfile unchanged across both
- inventory equality: YES
- binary equality: YES
- `npm ls --all` exit 0 (platform UNMET OPTIONAL deps expected; not missing required)
- final `apps/admin/node_modules` remains installed and ignored
- root `node_modules` absent; no other package node_modules modified by this task
- no `apps/admin/dist`

## 17. Acceptance matrix

| ID | Result | Evidence |
|---|---|---|
| A1 | PASS | root/branch/HEAD match |
| A2 | PASS | Node v22.23.1 |
| A3 | PASS | npm 10.9.8 from same install tree |
| A4 | PASS | https://registry.npmjs.org/ |
| A5 | PASS | M0-07 FP match |
| A6 | PASS | package FP match |
| A7 | PASS | DONE/APPROVE |
| A8 | PASS | no pre-existing admin lockfile |
| A9 | PASS | no pre-existing admin node_modules |
| A10 | PASS | no root install lifecycle |
| A11 | PASS | no forbidden refs in declaration |
| A12 | PASS | lock-only exit 0 (cwd equivalent) |
| A13 | PASS | package.json SHA unchanged final |
| A14 | PASS | lockfile valid JSON v3 |
| A15 | PASS | root decls match |
| A16 | PASS | hosts registry.npmjs.org only |
| A17 | PASS | 118/118 integrity |
| A18 | PASS | secret-like 0 |
| A19 | PASS | esbuild audited before/during install |
| A20 | PASS | first ci 0 |
| A21 | PASS | lock SHA stable |
| A22 | PASS | tsc 5.9.3 satisfies ^5.9.0 |
| A23 | PASS | vite 6.4.3 satisfies ^6.4.0 |
| A24 | PASS | binaries under apps/admin/node_modules/.bin |
| A25 | PASS | npm ls exit 0 |
| A26 | PASS | no missing/invalid/extraneous required |
| A27 | PASS | inv1 captured |
| A28 | PASS | node_modules removed between runs |
| A29 | PASS | second ci 0 |
| A30 | PASS | inventory hashes equal |
| A31 | PASS | tsc/vite versions equal |
| A32 | PASS | final node_modules present |
| A33 | PASS | gitignored |
| A34 | PASS | root modules absent; web modules pre-existing untouched |
| A35 | PASS | no other lockfile created/changed |
| A36 | PASS | ranges unchanged |
| A37 | PASS | no typecheck/lint/test scripts |
| A38 | PASS | source/tsconfig unchanged |
| A39 | PASS | no dist |
| A40 | PASS | only lockfile + ExecPlan + ignored modules |
| A41 | PASS | external dirty unchanged |
| A42 | PASS | index empty |
| A43 | PASS | HEAD/branch unchanged |
| A44 | PASS | freeze FP recorded/rechecked |
| A45 | PASS | parent frozen review APPROVE |
| A46 | PASS | M0-08 not started |
| A47 | PASS | no stage/commit/push |

## 18. Validation log

| Command/check | Exit/result | Notes |
|---|---:|---|
| preflight git/tools | 0 | HEAD/branch match; Node gated to 22 |
| M0-07 FP | match | `4544f663…cef4` |
| package FP | match | `da2737ed…92b6e` |
| `npm --prefix … install --package-lock-only` | 0 then FAIL policy | mutated package.json with `file:../..` (F1) |
| restore package.json + delete bad lock | 0 | `git checkout HEAD -- apps/admin/package.json` |
| cwd `npm install --package-lock-only --ignore-scripts --no-audit --no-fund` | 0 | lock created; package.json unchanged |
| lockfile audit | PASS | §14 |
| first `npm ci --no-audit --no-fund` | 0 | 69 packages; tsc/vite present |
| remove `apps/admin/node_modules` | 0 | absent verified |
| second `npm ci` | 0 | inventory hash match |
| `npm ls --all` | 0 | optional platform unmet OK |
| `git check-ignore` | ignored | `.gitignore:49` |
| freeze FP recheck | match | `00350e5a…1f5a` |
| npm audit | NOT RUN | forbidden |
| typecheck/build | NOT RUN | out of scope |
| stage/commit | NOT RUN | forbidden |

## 19. Failure history

| Event | Class | Disposition |
|---|---|---|
| F1: `npm --prefix apps/admin install --package-lock-only` added `"bm-questhub":"file:../.."` to package.json and produced tainted lockfile | deterministic npm nested-prefix behavior | Restored package.json from HEAD; deleted lockfile; regenerated via cwd scoped equivalent; recorded |

## 20. Scope changes

None.

## 21. Freeze record

- Algorithm: SHA-256 over sorted records `repository-relative path` NUL `file bytes` NUL
- Included paths:
  - `apps/admin/package-lock.json`
- Excluded:
  - `docs/admin-cms/execplans/BC-GAP-03.md`
  - `apps/admin/node_modules/**`
- Lockfile SHA-256: `e69022ea7004536e96532031f17244b2deee9a23d013b4124d3d0ca3b0fe1e2f`
- Combined fingerprint: `00350e5a98fc0f97f984e2eaf038845562532960e561fc69c4225d4e89ca1f5a`
- Generator: npm `10.9.8` / Node `v22.23.1`
- Registry host: `registry.npmjs.org`
- Package entries: 119
- Recheck after ExecPlan finalization (primary lockfile bytes unchanged): match
- Statement: `No edits to package-lock.json after freeze`

## 22. Review record

- Type: Independent subagent unavailable; parent performed a separate read-only frozen-admin-dependency-baseline review.
- Checked: package.json unchanged; lockfile generated not hand-edited; registry/integrity; lifecycle (esbuild); dual npm ci; inventory equality; local binary paths/versions; ignored node_modules; no typecheck; no M0-08; fingerprint.
- Findings: none blocking (F1 corrected before freeze).
- Verdict:

```text
APPROVE
```

## 23. Staging / commit record

```text
Staging: NOT AUTHORIZED
Secret scan: COMMAND NOT ADOPTED — COMMIT BLOCKED
Commit: NOT AUTHORIZED
Push: NOT AUTHORIZED
```

## 24. Final status

- Status: `DONE`
- Outcome: deterministic `apps/admin/package-lock.json` created; two clean `npm ci` proofs; local `tsc` 5.9.3 and `vite` 6.4.3 available under ignored `apps/admin/node_modules`; package declarations unchanged; review APPROVE; no commit; M0-08 not started.
- Recommended next task: `M0-08 — Add admin typecheck script` (authorization required; Node major 22 shell).
