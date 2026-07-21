# Шаблон атомарного Task Packet

```text
Follow root AGENTS.md and PLANS.md exactly.
Read only the files listed in Context unless repository discovery proves one additional file is essential.

Repository:
Brain-Master/BM_QuestHub

Task ID and title:
<TASK_ID> — <TITLE>

Authorized branch:
<EXACT_BRANCH>

Expected base SHA:
<EXACT_SHA>

Objective:
<ONE OBSERVABLE OUTCOME>

User value:
<ONE SENTENCE>

Current evidence:
- <PATH:LINE OR COMMAND RESULT>

Prerequisites:
- <COMPLETED TASK ID>

Non-goals:
- <NOT INCLUDED>
- no neighboring cleanup
- no dependency upgrades unless explicitly listed
- no next roadmap task

Authorized read paths:
- <PATH>

Authorized write paths:
- <PATH>

Forbidden paths:
- <PATH>
- protected/generated/secrets unless explicitly authorized

Component classification:
- <COMPONENT>: product_domain | repository_admin_template | reusable_admin_library

UX references:
- <DOC SECTION>
- <SCENARIO ID>

Architecture invariants:
- <INVARIANT>

Security/privacy requirements:
- <REQUIREMENT>

Implementation constraints:
- <CONSTRAINT>

Acceptance criteria:
A1. <BINARY CRITERION>
A2. <BINARY CRITERION>
A3. <NEGATIVE PATH>
A4. <NO-REGRESSION>

Required tests:
- <EXACT TEST NAME/BEHAVIOR>

Preflight commands:
- <COMMAND>

Targeted validation:
- <COMMAND>

Full validation:
- <COMMAND>

Freeze:
- fingerprint sorted relative paths and bytes with SHA-256
- no edits after freeze

Review:
- fresh read-only reviewer
- require exact verdict APPROVE

Commit policy:
<NO COMMIT | exact conventional commit subject>

Push policy:
DO NOT PUSH

Stop conditions:
- <TASK-SPECIFIC CONDITION>
- any AGENTS.md mandatory stop condition

Final report:
- base SHA
- changed paths
- exact tests and outcomes
- failure history
- reviewer verdict
- fingerprint
- git status
- commit/push state
- excluded work
- unresolved risks
- confirm next task was not started
```

## Правила качества Task Packet

Task Packet непригоден, если:

- objective содержит `и` между независимыми outcomes;
- write paths неизвестны;
- acceptance невозможно проверить бинарно;
- validation command не существует;
- требуется technology decision без ADR;
- указан milestone, а не один Task ID;
- отсутствует negative path;
- отсутствует stop condition;
- разрешено `любые необходимые файлы`;
- агенту разрешено «внести сопутствующие улучшения».
