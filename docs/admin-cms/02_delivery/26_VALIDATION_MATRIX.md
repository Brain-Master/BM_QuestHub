# Матрица проверок

## 1. Общий минимум

Для любого edit:

```bash
git diff --check
```

Плюс package-specific type/build/test commands.

## 2. По типу задачи

| Тип | Targeted | Full | Обязательные negative paths |
|---|---|---|---|
| Pure TypeScript/domain | exact unit tests, typecheck | package test + build | invalid input, boundary values |
| API client | request-shape tests, timeout/error mapping | package test/build | 401, 403, 409, 422, 5xx, timeout |
| React component | component tests, a11y | package test/build | loading, empty, error, permission |
| Form | schema/unit + component | a11y + critical E2E | failed save, dirty leave, conflict |
| Navigation/filter | route/component tests | E2E smoke | URL restore, no result, permission |
| Auth/RBAC | unit + integration denial | security suite/E2E | expired, revoked, cross-scope, CSRF |
| PostgreSQL migration | migration integration | replay/drift/full DB suite | concurrent, rollback, checksum drift |
| Repository/query | integration | full DB suite | empty, bounds, timeout, unauthorized |
| Upload/media | unit + integration | security/a11y/E2E | oversize, fake MIME, failed processing |
| Compiler | golden/contract | full contract suite | invalid relation, missing asset, determinism |
| Release | state-machine/integration | publish/rollback E2E | partial upload, activation fail, verify fail |
| Docs/policy | link/lint/manual review | repository docs gate | ambiguity/placeholders |

## 3. UI visual states

Для каждого нового production UI screen зафиксировать:

- desktop 1440;
- tablet 1024;
- mobile 390;
- loading;
- empty;
- error;
- long Russian content;
- permission denied where relevant;
- conflict where relevant.

## 4. Accessibility

Automated:

- axe serious/critical = 0;
- semantic queries;
- no unlabeled control;
- dialog/focus tests.

Manual для critical journey:

- keyboard;
- screen reader smoke;
- 200% zoom;
- reduced motion;
- mobile.

## 5. API acceptance

Каждый endpoint test set:

- valid request;
- malformed body;
- oversized body;
- unauthenticated;
- unauthorized;
- not found/no leak;
- conflict if mutable;
- idempotency if command;
- timeout/cancel;
- audit success/failure;
- safe error response.

## 6. Database acceptance

- migration from empty;
- replay;
- checksum drift rejection;
- concurrent runner;
- transaction rollback;
- FK/invariant;
- query bounds;
- optimistic conflict;
- least-privilege runtime role;
- cleanup.

## 7. Release acceptance

```text
validate
compile
hash
upload all
verify artifacts
activate pointer
verify public consumer
record audit
```

Failure at any phase must not produce false current release.

## 8. No-false-pass checklist

- exact test exists;
- nonzero tests executed;
- command targets final frozen bytes;
- failed runs recorded;
- skip is repository-defined;
- screenshot belongs to current build;
- E2E uses controlled environment;
- public external service is not unit-test dependency.
