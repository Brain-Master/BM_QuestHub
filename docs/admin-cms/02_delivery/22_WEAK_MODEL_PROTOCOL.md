# Протокол исполнения для слабых ИИ-моделей

## 1. Основная идея

Слабая модель должна решать не «сделать CMS», а один проверяемый переход состояния репозитория.

Плохая задача:

> Сделай новую админку.

Хорошая задача:

> Исправь API client так, чтобы GET `/snapshots` отправлялся без body; добавь contract tests; не меняй UI и backend.

## 2. Ограничение контекста

Для одной задачи модель загружает не более:

1. `AGENTS.md`;
2. Task Packet;
3. ExecPlan текущей задачи;
4. 1–3 релевантных UX/architecture docs;
5. только релевантные source/test files.

Не загружать весь roadmap и весь репозиторий после начала реализации.

## 3. Размер атомарной задачи

Задача должна:

- иметь один primary outcome;
- затрагивать предпочтительно 1–5 source files;
- иметь 1–4 focused tests;
- не требовать архитектурного решения;
- не менять более одного boundary одновременно;
- завершаться за один рабочий context window.

Если нужны DB + API + UI + migration + deployment, это минимум четыре задачи.

## 4. Execution loop

```text
READ
→ RESTATE
→ PREFLIGHT
→ AUDIT A
→ AUDIT B
→ PLAN
→ EDIT SMALL
→ TEST FOCUSED
→ INSPECT DIFF
→ TEST FULL
→ FREEZE
→ REVIEW
→ REPORT
→ STOP
```

## 5. Обязательный restatement

Перед edit модель пишет в ExecPlan:

- одно предложение objective;
- список non-goals;
- exact paths;
- acceptance criteria;
- stop conditions.

Если restatement не совпадает с Task Packet, остановиться.

## 6. Правило одного неизвестного

Атомарная задача может содержать не более одного существенного неизвестного:

- unfamiliar API;
- new library;
- unknown data contract;
- migration behavior;
- browser accessibility pattern.

Два неизвестных требуют split или research-only task.

## 7. Read-only research task

Когда решение неизвестно, создаётся отдельная задача с output:

- findings;
- options;
- recommendation;
- risks;
- ADR proposal;
- no code changes.

Слабая модель не должна одновременно исследовать технологию и внедрять её.

## 8. Запрет скрытого продолжения

После выполнения task модель не:

- берёт следующий ID;
- «заодно» чинит warning;
- создаёт новую abstraction;
- обновляет dependencies;
- переименовывает соседние modules;
- переписывает CSS;
- запускает deployment.

Она пишет final report и останавливается.

## 9. Малые изменения

Предпочитать:

- adapter вместо rewrite;
- pure function;
- explicit state;
- existing component;
- focused test fixture;
- additive migration;
- feature flag;
- read-only screen before mutation.

## 10. Проверка понимания UX

Перед UI edit модель отвечает в ExecPlan:

1. Какова цель пользователя?
2. Что пользователь должен чувствовать?
3. Как виден status?
4. Что происходит при error?
5. Что происходит с keyboard/mobile?
6. Это save или publish?

Если ответа нет, UI edit запрещён.

## 11. Проверка API

Перед endpoint edit:

1. Auth?
2. Permission?
3. Input bound?
4. Validation?
5. Idempotency?
6. Revision conflict?
7. Audit?
8. Error code?
9. Timeout?
10. Data exposure?

## 12. Проверка form

- default values;
- dirty detection;
- validation;
- save state;
- failed save;
- conflict;
- leave guard;
- keyboard;
- responsive;
- a11y.

## 13. Evidence over confidence

Фразы `должно работать`, `вероятно`, `кажется`, `скорее всего` не являются acceptance evidence.

Evidence:

- path:line;
- test output;
- command exit;
- screenshot;
- accessibility report;
- API fixture;
- deterministic diff.

## 14. Когда остановиться

- нет exact path;
- task требует protected file;
- baseline fails;
- existing changes непонятны;
- missing dependency decision;
- contract ambiguous;
- test unavailable;
- security/permission unclear;
- scope > atomic;
- reviewer requests fixes.

## 15. Формат output слабой модели

Во время работы:

```text
Task ID:
Current phase:
Observed evidence:
Next allowed action:
Blockers:
```

Final:

```text
Outcome:
Changed paths:
Tests:
Review:
Fingerprint:
Git status:
Commit/push:
Excluded:
Risks:
Stopped before next task: YES
```

## 16. Anti-hallucination rules

- Не придумывать существование file/script/test.
- Проверять path перед ссылкой.
- Не утверждать API behavior без чтения code/test.
- Не утверждать package version по памяти.
- Не создавать import path по предположению.
- Не подменять runtime validation TypeScript type.
- Не считать hidden button authorization.
- Не считать build test coverage.
- Не считать successful upload successful release.

## 17. Recommended task granularity examples

Хорошо:

- добавить status chip component и stories/tests;
- добавить read-only list route;
- добавить parser normalization test;
- добавить 409 conflict mapping;
- добавить one table filter in URL;
- добавить one DB migration + repository test;
- добавить one permission denial path.

Плохо:

- добавить auth, RBAC и users UI;
- перенести всё в PostgreSQL;
- сделать media library;
- переписать admin на Next;
- создать design system;
- реализовать publication engine.
