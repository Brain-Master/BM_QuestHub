# Готовые стартовые промпты

## A. Bootstrap prompt: первый безопасный запуск

Используйте этот промпт, если пакет ещё не принят в репозиторий.

```text
You are the implementation agent for Brain-Master/BM_QuestHub.

Your only task in this run is M0-01: read-only inventory and baseline evidence.
Do not edit any file. Do not install dependencies. Do not stage, commit, push, create branches, or start M0-02.

Repository:
Brain-Master/BM_QuestHub

Branch policy:
The expected branch is main. Resolve the current HEAD during preflight and freeze it as the base SHA for this read-only task. Stop if the branch is not main or the worktree contains unexplained changes.

Read first:
- the document package README.md
- 02_delivery/20_AGENTS.md
- 02_delivery/21_PLANS.md
- 02_delivery/23_ATOMIC_ROADMAP.md, only the M0 section
- 03_reference/30_CURRENT_STATE_FINDINGS.md

Execute:
1. Run the exact preflight from AGENTS.md.
2. Inspect repository manifests and relevant existing paths without editing:
   - package.json
   - apps/admin/package.json
   - apps/admin/src/api.ts
   - apps/admin/src/App.tsx
   - apps/yandex-content-admin/index.js
   - apps/web/package.json
   - Makefile
   - .github/workflows/sheet-sync.yml
3. Verify whether root AGENTS.md and PLANS.md already exist.
4. Identify exact existing validation commands. Do not invent missing commands.
5. Produce an inventory report containing path:line evidence for:
   - current admin architecture;
   - current auth/token behavior;
   - snapshot read/write behavior;
   - current scripts and build gates;
   - protected/generated paths;
   - baseline failures.
6. Classify every observed failure. Preserve all failed command evidence.
7. Return the standard final report from AGENTS.md.

Acceptance:
- no file changed;
- exact branch and SHA recorded;
- exact worktree status recorded;
- current commands are verified, not guessed;
- findings include path:line evidence;
- next task was not started.
```

## B. Первый кодовый prompt: M1-01

Используйте после завершения M0-01, M0-03 и M0-10, когда root policy и test runner реально существуют.

```text
Follow root AGENTS.md and PLANS.md exactly.
Execute only roadmap task M1-01: fix the GET body bug in the admin content client.

Repository:
Brain-Master/BM_QuestHub

Authorized branch:
main, unless the maintainer provides another exact branch.

Expected base SHA:
Use the exact SHA supplied by the maintainer. If none is supplied, stop before editing and report the current SHA.

Objective:
Make GET /snapshots send no request body while preserving the existing JSON body shape for PUT and POST requests. Add deterministic request-contract tests.

User value:
The existing admin can load snapshots in standards-compliant browsers without changing backend behavior.

Read:
- AGENTS.md
- PLANS.md
- docs/admin-cms/02_delivery/29_INITIAL_TASK_PACKETS.md, packet M1-01
- docs/admin-cms/01_ux/16_INTERACTION_AND_SYSTEM_STATES.md
- apps/admin/src/api.ts
- apps/admin/package.json
- existing admin test configuration and only directly relevant tests

Authorized write paths:
- apps/admin/src/api.ts
- one focused test file under apps/admin/src or the existing admin test directory
- apps/admin/package.json only if the already-approved M0 test runner requires an existing script reference
- package lock only if the task packet explicitly authorizes it
- the ExecPlan for M1-01

Forbidden:
- apps/admin/src/App.tsx
- apps/yandex-content-admin/**
- apps/web/**
- snapshots/data/content
- workflows/deployment
- dependencies and lockfiles unless explicitly authorized
- UI redesign
- auth changes
- next task

Required behavior:
1. GET and HEAD requests have no body.
2. PUT/POST keep the current body envelope including path.
3. Headers remain correct.
4. Non-2xx error mapping remains unchanged.
5. Tests prove request method, URL, headers, and body presence/absence.
6. Zero matched tests is not a pass.

Validation:
- exact focused tests
- admin typecheck
- admin test suite
- admin build
- git diff --check
- any root checks explicitly required by the Task Packet

Review:
Freeze the final bytes, compute the fingerprint, obtain a fresh read-only APPROVE verdict.

Commit:
NO COMMIT unless the maintainer explicitly authorizes one.

Do not push.
Do not start M1-02.
```
