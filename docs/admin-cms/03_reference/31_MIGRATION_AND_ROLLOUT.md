# Миграция и rollout без остановки сайта

## 1. Принцип

Ни один этап не должен требовать одновременной замены source of truth, admin UI, public consumer и media pipeline.

Используется стратегия strangler + compatibility compiler.

## 2. Стадии

### Stage A. Contract freeze

- golden fixtures current snapshots;
- contract tests;
- generated paths protected;
- current source remains Sheets.

Rollback: none required, no runtime change.

### Stage B. Read-only CMS

- new shell and entity read models;
- data still read through legacy/current adapters;
- no mutation.

Rollback: disable route/deploy old admin.

### Stage C. Individual auth and BFF

- sessions/RBAC;
- legacy shared token remains isolated for bridge;
- read-only data.

Rollback: feature flag to old protected admin for admin-only emergency, time-limited.

### Stage D. PostgreSQL import and parity

- DB schema;
- dry-run import;
- import batch;
- dual-read comparison;
- no public activation.

Rollback: discard test DB/import batch; production unchanged.

### Stage E. Draft writes in CMS

- DB owns new drafts/revisions;
- Sheets still public source;
- shadow compiler.

Rollback: disable writes; preserve audit/revisions; public unchanged.

### Stage F. Hot cutover

- CMS release engine publishes schedule;
- Sheets read-only fallback/export;
- monitoring and pointer rollback tested.

Rollback: point current release to previous; temporarily restore legacy hot workflow only through documented emergency procedure.

### Stage G. Cold/media cutover

- catalog, venues and media publish from CMS;
- static deploy adapter verified;
- public snapshots compatible.

Rollback: previous immutable release pointer.

### Stage H. Legacy retirement

- raw JSON UI disabled;
- shared token endpoint removed/isolated;
- GitHub workflow no longer editorial runtime;
- Sheets read-only import/export.

Rollback: restoration requires explicit security review, not silent flag forever.

## 3. Dual-read rules

Dual-read is diagnostic, not permanent business logic.

- each response indicates source;
- comparison occurs server-side or test tooling;
- no random per-request source;
- semantic diff normalizes known harmless metadata only;
- unknown differences block cutover;
- dual-read has removal task and deadline.

## 4. Dual-write policy

Avoid dual-write when possible. Preferred:

- one source owns writes;
- importer/exporter bridges other system.

If temporary dual-write approved:

- primary write commits first;
- secondary failure visible;
- idempotency keys;
- reconciliation queue;
- no false full success;
- explicit removal date.

## 5. Import process

```text
read source
→ normalize boundary values
→ map identities
→ validate
→ classify new/update/conflict
→ dry-run report
→ owner review
→ transactional batch
→ reconciliation
→ audit
```

Import never auto-publishes.

## 6. Identity migration

For Shift:

- generate immutable new ID;
- preserve old `shift_group_id` as `externalKey`;
- create mapping table/report;
- media paths map to asset relations;
- public snapshot may continue emitting compatible external IDs until consumer migration.

## 7. Content reconciliation

Counts alone insufficient.

Compare:

- entity identity;
- relations;
- text normalization;
- dates/times/timezone;
- prices;
- capacity/enrolled;
- registration links/codes;
- media usages;
- generated snapshot semantics;
- public URLs.

## 8. Cutover readiness

### Data

- no unknown rows;
- all conflicts resolved/approved;
- snapshot parity;
- media availability;
- identity map backed up.

### Product

- critical UX scenarios pass;
- users trained;
- support channel;
- owner approval.

### Security

- individual auth;
- RBAC denial tests;
- secret scan;
- audit;
- shared token retirement plan.

### Operations

- backups;
- pointer rollback;
- public verification;
- monitoring;
- runbook;
- on-call owner.

## 9. Rollback classes

### Release rollback

Pointer to previous immutable release. Preferred and fastest.

### Feature rollback

Disable new UI/write path. Data remains.

### Data rollback

Reverse import batch only before dependent edits; otherwise compensating revisions.

### Infrastructure rollback

Restore previous deployed code/config through normal deployment tooling.

Нельзя rollback через ручное редактирование public JSON.

## 10. Rollout cohorts

1. Technical admin read-only.
2. Owner/Publisher read-only.
3. One schedule editor limited scope.
4. Two editors with conflict test.
5. Full internal team.
6. Limited hot publication.
7. Full hot.
8. Cold/media.

## 11. Success monitoring

- save failure rate;
- conflict rate;
- validation blockers;
- publication phase durations;
- verification failures;
- rollback count;
- support requests;
- tasks completed outside CMS;
- stale Sheets writes after freeze.
