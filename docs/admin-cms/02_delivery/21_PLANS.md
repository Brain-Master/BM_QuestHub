# ExecPlan Policy

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

## 2. Размещение

После принятия пакета в репозиторий:

```text
docs/admin-cms/execplans/<TASK_ID>.md
```

Task Packet может задать другой exact path.

## 3. Правила

- Один ExecPlan на одну атомарную task.
- Не использовать один план для milestone целиком.
- План создаётся после успешного preflight.
- Изменения scope записываются с author/time/reason.
- Failed commands не удаляются.
- Завершённый plan становится evidence record.
- План не заменяет tests и code review.

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

Переходы только вперёд, кроме возврата из review после correction в `IMPLEMENTING` с новой записью.

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

## 6. Validation log format

```text
2026-07-19T12:00:00+03:00
Command: npm --prefix apps/admin run build
Target fingerprint: <sha256 or PRE-FREEZE>
Exit: 0
Result: PASS
Notes: ...
```

Для failure:

```text
Exit: 1
Result: BLOCKING FAILURE
Classification: deterministic baseline defect
Evidence: ...
Action: stopped; no retry before analysis
```

## 7. Acceptance matrix

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| A1 | GET request has no body | test name/path | PASS |
| A2 | PUT still sends JSON | test name/path | PASS |
| A3 | Build passes | command | PASS |

`PARTIAL` не является PASS.

## 8. Freeze record

Содержит:

- HEAD;
- sorted changed paths;
- fingerprint algorithm;
- fingerprint;
- `git diff --check` result;
- timestamp;
- statement `No edits after freeze`.

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

Вердикт `APPROVE` записывается дословно.

## 10. Завершение

ExecPlan = DONE только когда выполнен Task Packet Definition of Done. Нельзя закрывать план, обещая доделать tests или docs в следующей задаче.
