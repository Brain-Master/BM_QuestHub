# ExecPlan Policy

## 0. Authority and non-expansion

- Root `AGENTS.md` имеет более высокий authority, чем этот root `PLANS.md`.
- Task Packet определяет scope конкретной задачи (objective, non-goals, authorized paths, commit policy).
- ExecPlan является execution record одной material task.
- ExecPlan **не может** расширять scope, менять non-goals, authorized paths, commit policy или начинать следующую задачу.
- При конфликте между Task Packet / `AGENTS.md` / этим `PLANS.md` / ExecPlan — **stop**; требуется обновлённый Task Packet или явная инструкция владельца.

## 1. Назначение

ExecPlan — живой журнал исполнения одной material task. Он должен позволить другому инженеру восстановить:

- что агент собирался сделать;
- на каком основании;
- что увидел в коде;
- какие риски учёл;
- что изменил;
- какие проверки реально запускал;
- какие сбои происходили;
- почему задача считается завершённой.

План не заменяет tests и code review.

## 2. Размещение

Единственный default directory:

```text
docs/admin-cms/execplans/
```

Формат имени файла:

```text
TASK-ID.md
```

Примеры:

```text
M0-04.md
M1-01.md
```

Task Packet может задать другой exact path только явно. Нельзя создавать milestone-wide plan. Нельзя оставлять unresolved placeholders в имени файла.

## 3. Правила

- Один ExecPlan на одну атомарную task.
- Не использовать один план для milestone целиком.
- План создаётся **только после успешного preflight**.
- План создаётся **до implementation edits**.
- Preflight failure **не** разрешает создать план «задним числом».
- Read-only stop report допускается без нового ExecPlan только если Task Packet прямо это разрешает.
- Для material task наличие accepted ExecPlan обязательно до edits.
- Изменения scope записываются с author/time/reason и требуют обновлённого Task Packet; ExecPlan сам scope не расширяет.
- Failed commands не удаляются.
- Retry не стирает failure evidence.
- Завершённый plan становится evidence record.

## 4. Статусы

```text
PLANNING
BLOCKED
IMPLEMENTING
VALIDATING
FROZEN
IN_REVIEW
APPROVED
STAGED
COMMITTED
DONE
```

Правила переходов:

- Нельзя перепрыгивать обязательные стадии.
- Переходы только вперёд, кроме возврата из review после correction в `IMPLEMENTING` с новой записью.
- `BLOCKED` записывает blocker и **не** является completion.
- Correction после review возвращает status в `IMPLEMENTING`.
- Edit после freeze отменяет freeze и review; требуется full revalidation, new fingerprint и fresh review.
- `STAGED` и `COMMITTED` допустимы только при authorization Task Packet.
- При `NO COMMIT` lifecycle после `APPROVED` может завершиться `DONE` с explicit `Staging: NOT AUTHORIZED`.
- `DONE` требует выполнения Task Packet Definition of Done. Нельзя ставить `DONE` при missing gates или обещая доделать work в следующей задаче.

## 5. Обязательные разделы

1. Metadata.
2. Objective.
3. Non-goals.
4. Authorized/forbidden paths.
5. Preflight evidence.
6. Current architecture.
7. Component classification.
8. UX references.
9. Security/privacy analysis.
10. Implementation steps.
11. Negative paths.
12. Test plan.
13. Acceptance matrix.
14. Validation log.
15. Failure history.
16. Scope changes.
17. Freeze record.
18. Reviewer findings.
19. Staging/commit record.
20. Final status.

Дополнительно:

- `Not applicable` разрешён только с reason.
- Пустой section без explanation запрещён.
- Отсутствующее evidence нельзя заменять обещанием.
- UX section обязателен для UI task.
- Security section обязателен для любой task, но может быть `No security boundary change` с evidence.

## 6. Validation log format

Каждая запись validation log должна содержать:

- exact command;
- working directory when relevant;
- timestamp with timezone;
- exit code;
- actual result;
- target/fingerprint;
- bounded evidence.

Нормативное поле fingerprint:

```text
Target fingerprint: actual SHA-256 or literal PRE-FREEZE
```

Пример формата (**Example only** — не обязательная команда для каждой docs/policy task):

```text
2026-07-19T12:00:00+03:00
Command: npm --prefix apps/admin run build
Working directory: repository root
Target fingerprint: PRE-FREEZE
Exit: 0
Result: PASS
Notes: Example only; use only when Task Packet authorizes this command.
```

Для failure:

```text
Exit: 1
Result: BLOCKING FAILURE
Classification: deterministic baseline defect
Evidence: ...
Action: stopped; no retry before analysis
```

Правила:

- Skipped command не является PASS.
- Missing command записывается как blocker / not available.
- Failed run сохраняется даже после последующего pass.
- Нельзя заявлять PASS для незапущенной команды.

## 7. Acceptance matrix

Schema/example rows (не acceptance текущей задачи):

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| A1 | Authorized artifact created | path + existence check | PASS |
| A2 | No forbidden path changed | integrity hashes / git status | PASS |
| A3 | Required validation passed | exact command + exit code | PASS |

`PARTIAL` не является PASS.

## 8. Freeze record

Содержит:

- HEAD;
- sorted changed paths (included / excluded);
- fingerprint algorithm;
- fingerprint;
- `git diff --check` result;
- timestamp;
- statement `No edits after freeze`.

Детерминированный algorithm:

```text
SHA-256 over sorted records:
repository-relative path, затем NUL, затем file bytes, затем NUL
```

Правила:

- Используются repository-relative paths.
- Timestamps, absolute paths, metadata и Git index state **не** участвуют в fingerprint bytes.
- Primary artifacts должны быть frozen.
- ExecPlan может быть исключён из self-referential fingerprint только явно.
- Любая правка frozen artifact требует full revalidation, new fingerprint и fresh review.

## 9. Review record

Каждый finding:

```text
Severity:
Path:line:
Scenario:
Invariant:
Correction:
Regression test:
Disposition:
```

Правила:

- Reviewer читает actual frozen bytes.
- Вердикт `APPROVE` записывается дословно.
- `APPROVE_WITH_FIXES` является blocking.
- Parent review нельзя называть independent subagent review.
- Correction invalidates prior verdict.
- Passing tests alone не гарантирует approval.

## 10. Staging and commit record

Обязательные поля:

- authorization status;
- exact staged paths;
- secret scan command/result;
- staged validation commands/results;
- commit subject/SHA only if actually performed;
- push status.

Правила:

- При отсутствии adopted secret-scan command staging и commit **blocked**.
- `NOT AUTHORIZED` записывается буквально.
- Нельзя ставить `COMMITTED` без commit SHA.
- Нельзя ставить `DONE` с выдуманным staged evidence.
- Fabricated staged/committed state запрещён.

## 11. Template relationship

Canonical template:

```text
docs/admin-cms/02_delivery/25_EXECPLAN_TEMPLATE.md
```

- Template является starting structure.
- Этот root `PLANS.md` является lifecycle policy.
- Template placeholders должны быть заполнены concrete values.
- Template нельзя копировать как пустой sample в `docs/admin-cms/execplans/`.
- Task Packet может потребовать дополнительные sections.
- Запрещено удалять mandatory policy sections из-за краткости template.

## 12. No sample empty plan

Запрещено создавать в active execplans directory:

- `example.md`;
- `sample.md`;
- `TEMPLATE.md`;
- пустые milestone plans;
- копии template как active plans.

В каталоге `docs/admin-cms/execplans/` допускаются только concrete task plans (`TASK-ID.md`).

## 13. Завершение

ExecPlan = DONE только когда выполнен Task Packet Definition of Done. Нельзя закрывать план, обещая доделать tests или docs в следующей задаче.
