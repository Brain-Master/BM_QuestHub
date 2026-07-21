# Источники и адаптация

## 1. Strict engineering source

Владелец предоставил файл `STRICT_GO_SERVICE_AGENTS(1).md` с многофазной строгой политикой для Go-сервисов.

Из него сохранены ключевые механизмы:

- explicit project constants;
- authority order;
- non-negotiable Git rules;
- preflight before planning/editing;
- component classification;
- ExecPlan;
- two read-only audit passes;
- targeted/full validation;
- freeze fingerprint;
- independent `APPROVE` review;
- explicit staging;
- no amend/push/next task;
- baseline blocker policy;
- mandatory stop conditions;
- exact final report;
- standard Task Packet.

## 2. Адаптация

Go-specific sections заменены правилами для:

- TypeScript;
- React/Vite/Next;
- browser state and accessibility;
- Admin API;
- PostgreSQL and migrations;
- media uploads;
- snapshot compiler;
- immutable release publication.

Strictness сохранена на repository/security boundaries, но атомарные pure UI/domain tasks не требуют церемоний, не связанных с их риском.

## 3. Repository evidence

Пакет основан на наблюдаемом состоянии `Brain-Master/BM_QuestHub` на момент подготовки. Перед реализацией любой task требуется новый repository preflight; paths и versions могут измениться.
