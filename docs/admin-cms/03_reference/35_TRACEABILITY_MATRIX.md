# Матрица трассировки требований

## 1. Product → UX → tasks → tests

| Requirement | UX contract | Roadmap | Evidence |
|---|---|---|---|
| Save ≠ publish | UX North Star UX-3; J2/J8 | M5–M9 | UX-G01, form/E2E |
| No raw snapshot editing | Product P1; architecture §6 | M2-13, M10-12 | default navigation test; security review |
| Individual identity | Architecture §8 | M3 | auth integration/E2E |
| Server-side RBAC | IA §12 | M3-06..14 | denial/cross-scope tests |
| Revisions/conflict | Domain Revision; J12 | M4-06, M5+, M7 | 409 integration + conflict component |
| Immutable releases | Architecture §10 | M9 | release integration/E2E |
| Rollback | J10 | M9-15..18 | pointer/verification tests |
| Multi-campus | Domain VenueCampus; S08 | M6 | MDUC fixture + UI tests |
| Structured lists | Form rules §8 | M5 | reorder/a11y tests |
| Explicit overrides | Domain §6; J5/J3 | M6-08, M7-11 | inheritance/reset tests |
| Media safety | Architecture §12 | M8 | upload security suite |
| Accessible critical path | Accessibility | M2+, M11-01 | axe + manual smoke |
| Atomic hot/cold cutover | Migration | M10 | parity, pointer, rollback drill |

## 2. Screen → roadmap

| Screen | Primary tasks |
|---|---|
| Login | M3-03..09 |
| Dashboard | M2-06..07 |
| Worlds list/editor | M2-08, M5-01..06 |
| Courses list/editor | M2-09, M5-07..15 |
| Venues/Campus | M2-10, M6 |
| Schedule/Shift | M2-11, M7 |
| Media | M8 |
| Publication Center | M9-07..08 |
| Publication Job | M9-12..13 |
| Release Detail/Rollback | M9-14..16 |
| Audit | M3-10, M4-07, M11-06 |
| Users/Roles | M3, M4-04 |
| Import Wizard | M4-10..14, M10 |
| Health | M9/M11 operations |

## 3. Risk → mitigation

| Risk | Mitigation tasks | Verification |
|---|---|---|
| GET body bug | M1-01 | request contract test |
| Shared token | M3-03..13 | storage/security inspection, auth E2E |
| Invalid direct snapshot write | M2-13, M9 compiler/release | default UI test, endpoint retirement |
| Mixed release artifacts | M9-09..12 | partial upload/activation tests |
| Lost updates | M4-06, entity update tasks | concurrent 409 tests |
| Composite shift ID | M4-05, M7-03, M10 identity map | migration/relation tests |
| Duplicate sheet headers | M4-10 | parser rejection test |
| Data duplication | M6/M7 overrides | inheritance/normalization tests |
| Media path fragility | M8 | asset ID/usage tests |
| False publication success | M9-11..13 | verification failure UI/E2E |

## 4. UX acceptance → automated/manual

| Scenario group | Automated | Manual |
|---|---|---|
| Orientation | component/E2E | first-click usability |
| Save/errors | component/integration | copy comprehension |
| Conflict | integration/component | merge usability |
| Schedule | E2E | real manager workflow |
| Media | upload/component | crop/alt workflow |
| Publication | release E2E | publisher confidence |
| Rights | integration denial | role walkthrough |
| Accessibility | axe/semantic | keyboard/screen reader |
| Performance | timing/budget | perceived responsiveness |

## 5. Change-control rule

Если implementation меняет product/UX requirement:

1. остановиться;
2. создать explicit decision task;
3. обновить source document;
4. обновить traceability row;
5. обновить affected tests/task dependencies;
6. получить owner approval;
7. только затем продолжить code task.
