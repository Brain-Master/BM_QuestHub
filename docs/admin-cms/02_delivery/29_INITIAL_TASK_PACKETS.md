# Первые готовые Task Packets

Перед использованием заменить `<BASE_SHA>` точным SHA. Каждый packet выполняется отдельным запуском.

---

# Packet M0-01 — Read-only inventory

```text
Follow AGENTS.md and PLANS.md exactly.

Repository: Brain-Master/BM_QuestHub
Branch: main
Expected HEAD: resolve and record; read-only exception

Objective:
Produce a path:line inventory of the current admin, content API, publication pipeline, package commands, generated paths, and baseline state without changing files.

Non-goals:
- no edits;
- no installs;
- no architecture proposal beyond observed facts;
- no next task.

Authorized reads:
- root manifests and Makefile;
- apps/admin/** relevant files;
- apps/yandex-content-admin/** relevant files;
- apps/web/package.json and content contracts;
- .github/workflows/sheet-sync.yml;
- docs relevant to content pipeline.

Writes: none.

Acceptance:
A1. Branch, HEAD, worktree and tools recorded.
A2. Exact existing commands verified.
A3. Admin GET/body and shared-token behavior cited path:line.
A4. Protected/generated paths identified.
A5. No file changed.

Commit: NO COMMIT.
Push: DO NOT PUSH.
```

---

# Packet M0-02 — Place document package

```text
Repository: Brain-Master/BM_QuestHub
Branch: main
Expected HEAD: <BASE_SHA>

Objective:
Copy the approved document package verbatim to docs/admin-cms/ and verify links/file completeness.

Authorized writes:
- docs/admin-cms/**
- ExecPlan M0-02

Forbidden:
- source code;
- package manifests;
- workflows;
- existing docs outside the new directory.

Acceptance:
A1. Every package file is present.
A2. Contents match source package checksums.
A3. Internal relative links resolve.
A4. No non-doc file changed.

Validation:
- file manifest/checksums;
- markdown link check if an existing command exists;
- git diff --check.

Commit: NO COMMIT unless authorized.
```

---

# Packet M0-03 — Adopt root AGENTS.md

```text
Objective:
Create root AGENTS.md from docs/admin-cms/02_delivery/20_AGENTS.md and replace only constants that were verified in M0-01.

Authorized writes:
- AGENTS.md
- ExecPlan M0-03

Forbidden:
- code;
- package files;
- roadmap content;
- weakening policy.

Acceptance:
A1. No unresolved placeholders.
A2. Known versions/commands match repository evidence.
A3. Unknown secret-scan command remains an explicit commit blocker, not invented.
A4. Authority and stop rules preserved.
A5. Reviewer verdict APPROVE.

Commit: NO COMMIT unless authorized.
```

---

# Packet M0-08 — Admin typecheck script

```text
Objective:
Add a deterministic admin TypeScript typecheck command using the existing TypeScript configuration and dependencies, without changing runtime behavior.

Authorized writes:
- apps/admin/package.json
- apps/admin/tsconfig*.json only if required and explicitly justified
- package lock only if no dependency change is needed and npm rewrites are avoided
- one focused tooling test/check document if repository convention requires
- ExecPlan M0-08

Forbidden:
- source behavior changes;
- dependency upgrades;
- formatting sweep;
- web/backend/workflows.

Acceptance:
A1. `npm --prefix apps/admin run typecheck` exists.
A2. It exits 0 on baseline.
A3. A controlled type error makes it exit nonzero during verification, then the temporary error is removed before freeze.
A4. Admin build remains green.

Commit: NO COMMIT unless authorized.
```

---

# Packet M0-10 — Admin test runner

```text
Objective:
Introduce a deterministic test runner for apps/admin and one real smoke test, without changing product behavior.

Prerequisite:
M0-08 DONE.

Authorized writes:
- apps/admin/package.json
- apps/admin test config
- one smoke test
- lockfile for the explicitly approved test dependency
- ExecPlan M0-10

Acceptance:
A1. `npm --prefix apps/admin run test` executes at least one named test.
A2. Zero tests or zero matched exact test fails.
A3. Test run is non-watch and deterministic.
A4. Typecheck/build remain green.
A5. Dependency addition and alternatives recorded.

Commit: NO COMMIT unless authorized.
```

---

# Packet M1-01 — Fix GET body bug

```text
Objective:
Make GET /snapshots send no body while preserving mutation request envelopes and error behavior.

Prerequisites:
M0-03, M0-08, M0-10 DONE.

Authorized writes:
- apps/admin/src/api.ts
- one focused API client test file
- ExecPlan M1-01

Forbidden:
- App.tsx and UI redesign;
- backend;
- web;
- snapshots;
- dependencies;
- next task.

UX references:
- 16_INTERACTION_AND_SYSTEM_STATES: error preservation.

Acceptance:
A1. GET request options contain no `body` property or use `undefined` in a standards-compliant way verified by test.
A2. PUT/POST send `{..., path}` JSON exactly as before.
A3. Headers and error mapping do not regress.
A4. Exact focused tests pass.
A5. Typecheck, admin tests, admin build and diff check pass.

Commit: NO COMMIT unless authorized.
Push: DO NOT PUSH.
```

---

# Packet M2-01 — App shell structure

```text
Objective:
Introduce the semantic admin shell regions and layout boundaries without adding routes or changing data behavior.

Prerequisites:
M1 contract stabilization tasks required by the final Task Packet.

Authorized writes:
- exact existing admin shell/component/style files discovered in audit
- focused component tests
- ExecPlan M2-01

UX references:
- 10_UX_NORTH_STAR sections 3–6;
- 12_INFORMATION_ARCHITECTURE section 2;
- 17_VISUAL_SYSTEM sections 2–6;
- 18_ACCESSIBILITY sections 2–6.

Acceptance:
A1. Header, sidebar region, main landmark and skip link exist.
A2. Keyboard focus and mobile layout work.
A3. Existing content area still renders.
A4. Loading/error state is not removed.
A5. No route/data/auth change.

Commit: NO COMMIT unless authorized.
```
