# BM QuestHub CMS — индекс документации

Текущая точка входа в документацию `docs/admin-cms/`. Индекс **маршрутизирует** к policy и спецификациям, но **не заменяет** root `AGENTS.md`, root `PLANS.md`, Task Packet и исходные UX/architecture specs. Пакет рассчитан на людей и ИИ-агентов: для одной задачи читать весь пакет не требуется.

## Authority first

Порядок обращения (INDEX не меняет authority):

1. [`AGENTS.md`](../../AGENTS.md) — active repository policy для агентов и material changes.
2. [`PLANS.md`](../../PLANS.md) — active ExecPlan lifecycle policy.
3. Конкретный Task Packet текущей задачи (файл или prompt владельца; не подставлять отсутствующий path).
4. Конкретный ExecPlan текущей задачи в [`execplans/`](execplans/).
5. [`PROTECTED_ARTIFACTS.md`](PROTECTED_ARTIFACTS.md) — path classification и override requirements (не расширяет Task Packet).
6. Релевантные architecture / UX / reference документы из карты ниже.

Явно:

- root [`AGENTS.md`](../../AGENTS.md) и [`PLANS.md`](../../PLANS.md) — **active** repository policy;
- [`02_delivery/20_AGENTS.md`](02_delivery/20_AGENTS.md) и [`02_delivery/21_PLANS.md`](02_delivery/21_PLANS.md) — **imported source/reference**, не active root authority;
- [`README.md`](README.md) — imported package overview / provenance, не current authority;
- при конфликте действуют root policies и Task Packet; INDEX не является authority document.

Нормативные Git/security/freeze/lifecycle правила — только в root policies, не копируются здесь.

## Start here by role

### Owner / product lead

- [`00_foundation/00_PRODUCT_VISION.md`](00_foundation/00_PRODUCT_VISION.md)
- [`00_foundation/01_DOMAIN_GLOSSARY.md`](00_foundation/01_DOMAIN_GLOSSARY.md)
- [`00_foundation/02_TARGET_ARCHITECTURE.md`](00_foundation/02_TARGET_ARCHITECTURE.md)
- [`ADR_BACKLOG.md`](ADR_BACKLOG.md) — planning backlog, not accepted decisions
- [`01_ux/10_UX_NORTH_STAR.md`](01_ux/10_UX_NORTH_STAR.md)
- [`01_ux/13_CORE_USER_JOURNEYS.md`](01_ux/13_CORE_USER_JOURNEYS.md)
- [`02_delivery/23_ATOMIC_ROADMAP.md`](02_delivery/23_ATOMIC_ROADMAP.md)
- [`03_reference/35_TRACEABILITY_MATRIX.md`](03_reference/35_TRACEABILITY_MATRIX.md)

### UX/UI designer

- [`01_ux/10_UX_NORTH_STAR.md`](01_ux/10_UX_NORTH_STAR.md)
- [`01_ux/11_PERSONAS_AND_JOBS.md`](01_ux/11_PERSONAS_AND_JOBS.md)
- [`01_ux/12_INFORMATION_ARCHITECTURE.md`](01_ux/12_INFORMATION_ARCHITECTURE.md)
- [`01_ux/13_CORE_USER_JOURNEYS.md`](01_ux/13_CORE_USER_JOURNEYS.md)
- [`01_ux/14_SCREEN_SPECIFICATIONS.md`](01_ux/14_SCREEN_SPECIFICATIONS.md)
- [`01_ux/15_FORM_AND_EDITING_RULES.md`](01_ux/15_FORM_AND_EDITING_RULES.md)
- [`01_ux/16_INTERACTION_AND_SYSTEM_STATES.md`](01_ux/16_INTERACTION_AND_SYSTEM_STATES.md)
- [`01_ux/17_VISUAL_SYSTEM.md`](01_ux/17_VISUAL_SYSTEM.md)
- [`01_ux/18_ACCESSIBILITY_AND_RESPONSIVE.md`](01_ux/18_ACCESSIBILITY_AND_RESPONSIVE.md)
- [`01_ux/34_TEXT_WIREFRAMES.md`](01_ux/34_TEXT_WIREFRAMES.md)
- [`03_reference/32_UI_COPY_CATALOG.md`](03_reference/32_UI_COPY_CATALOG.md)
- [`03_reference/33_COMPONENT_INVENTORY.md`](03_reference/33_COMPONENT_INVENTORY.md)

### Engineer

- [`AGENTS.md`](../../AGENTS.md), [`PLANS.md`](../../PLANS.md), [`PROTECTED_ARTIFACTS.md`](PROTECTED_ARTIFACTS.md), [`BASELINE_COMMANDS.md`](BASELINE_COMMANDS.md), [`SECRET_SCAN.md`](SECRET_SCAN.md)
- [`00_foundation/01_DOMAIN_GLOSSARY.md`](00_foundation/01_DOMAIN_GLOSSARY.md)
- [`00_foundation/02_TARGET_ARCHITECTURE.md`](00_foundation/02_TARGET_ARCHITECTURE.md)
- [`ADR_BACKLOG.md`](ADR_BACKLOG.md) — before provider/version-dependent work
- [`03_reference/30_CURRENT_STATE_FINDINGS.md`](03_reference/30_CURRENT_STATE_FINDINGS.md)
- [`02_delivery/23_ATOMIC_ROADMAP.md`](02_delivery/23_ATOMIC_ROADMAP.md)
- [`02_delivery/26_VALIDATION_MATRIX.md`](02_delivery/26_VALIDATION_MATRIX.md)
- [`03_reference/31_MIGRATION_AND_ROLLOUT.md`](03_reference/31_MIGRATION_AND_ROLLOUT.md)
- [`03_reference/35_TRACEABILITY_MATRIX.md`](03_reference/35_TRACEABILITY_MATRIX.md)
- один конкретный Task Packet текущей задачи

### AI coding agent

- [`AGENTS.md`](../../AGENTS.md)
- [`PLANS.md`](../../PLANS.md) для material task
- ровно один concrete Task Packet
- [`PROTECTED_ARTIFACTS.md`](PROTECTED_ARTIFACTS.md) при path classification / protected mutation
- [`BASELINE_COMMANDS.md`](BASELINE_COMMANDS.md) при validation/command design
- [`SECRET_SCAN.md`](SECRET_SCAN.md) при commit/freeze secret-scan gate
- [`ADR_BACKLOG.md`](ADR_BACKLOG.md) — before ADR/provider/version tasks
- [`02_delivery/22_WEAK_MODEL_PROTOCOL.md`](02_delivery/22_WEAK_MODEL_PROTOCOL.md)
- только task-relevant specifications (обычно 1–3)
- текущие source/test files по Task Packet

**Запрещено** загружать весь package «на всякий случай».

### Reviewer / security reviewer

- [`AGENTS.md`](../../AGENTS.md), [`PLANS.md`](../../PLANS.md), [`PROTECTED_ARTIFACTS.md`](PROTECTED_ARTIFACTS.md), [`BASELINE_COMMANDS.md`](BASELINE_COMMANDS.md), [`SECRET_SCAN.md`](SECRET_SCAN.md)
- [`00_foundation/02_TARGET_ARCHITECTURE.md`](00_foundation/02_TARGET_ARCHITECTURE.md)
- [`ADR_BACKLOG.md`](ADR_BACKLOG.md) — ADR ownership/status/gaps
- [`03_reference/30_CURRENT_STATE_FINDINGS.md`](03_reference/30_CURRENT_STATE_FINDINGS.md)
- [`02_delivery/26_VALIDATION_MATRIX.md`](02_delivery/26_VALIDATION_MATRIX.md)
- [`03_reference/31_MIGRATION_AND_ROLLOUT.md`](03_reference/31_MIGRATION_AND_ROLLOUT.md)
- [`03_reference/35_TRACEABILITY_MATRIX.md`](03_reference/35_TRACEABILITY_MATRIX.md)
- frozen ExecPlan / diff текущей задачи в [`execplans/`](execplans/)

### Content operator / migration owner

- [`00_foundation/01_DOMAIN_GLOSSARY.md`](00_foundation/01_DOMAIN_GLOSSARY.md)
- [`00_foundation/02_TARGET_ARCHITECTURE.md`](00_foundation/02_TARGET_ARCHITECTURE.md)
- [`03_reference/30_CURRENT_STATE_FINDINGS.md`](03_reference/30_CURRENT_STATE_FINDINGS.md)
- [`03_reference/31_MIGRATION_AND_ROLLOUT.md`](03_reference/31_MIGRATION_AND_ROLLOUT.md)
- [`PROTECTED_ARTIFACTS.md`](PROTECTED_ARTIFACTS.md) для migration/generated boundaries
- [`01_ux/13_CORE_USER_JOURNEYS.md`](01_ux/13_CORE_USER_JOURNEYS.md)
- [`01_ux/15_FORM_AND_EDITING_RULES.md`](01_ux/15_FORM_AND_EDITING_RULES.md)
- [`01_ux/16_INTERACTION_AND_SYSTEM_STATES.md`](01_ux/16_INTERACTION_AND_SYSTEM_STATES.md)
- [`03_reference/32_UI_COPY_CATALOG.md`](03_reference/32_UI_COPY_CATALOG.md)

## Choose documents by task

| Task type | Read first | Add only when needed | Do not load by default |
|---|---|---|---|
| repository governance | root [`AGENTS.md`](../../AGENTS.md), [`PLANS.md`](../../PLANS.md), [`PROTECTED_ARTIFACTS.md`](PROTECTED_ARTIFACTS.md), [`BASELINE_COMMANDS.md`](BASELINE_COMMANDS.md), Task Packet | [`23_ATOMIC_ROADMAP.md`](02_delivery/23_ATOMIC_ROADMAP.md), [`36_SOURCE_ADAPTATION_NOTES.md`](03_reference/36_SOURCE_ADAPTATION_NOTES.md), [`SECRET_SCAN.md`](SECRET_SCAN.md) | весь UX-пакет, prompts |
| frontend/UI screen | Task Packet, screen in [`14_SCREEN_SPECIFICATIONS.md`](01_ux/14_SCREEN_SPECIFICATIONS.md), [`12_INFORMATION_ARCHITECTURE.md`](01_ux/12_INFORMATION_ARCHITECTURE.md) | journey, wireframe, visual, a11y, copy | весь roadmap, package policies |
| form or editing behavior | [`15_FORM_AND_EDITING_RULES.md`](01_ux/15_FORM_AND_EDITING_RULES.md), [`16_INTERACTION_AND_SYSTEM_STATES.md`](01_ux/16_INTERACTION_AND_SYSTEM_STATES.md) | related screen, [`32_UI_COPY_CATALOG.md`](03_reference/32_UI_COPY_CATALOG.md) | media/migration docs |
| API/client contract | Task Packet, [`02_TARGET_ARCHITECTURE.md`](00_foundation/02_TARGET_ARCHITECTURE.md), [`30_CURRENT_STATE_FINDINGS.md`](03_reference/30_CURRENT_STATE_FINDINGS.md) | [`26_VALIDATION_MATRIX.md`](02_delivery/26_VALIDATION_MATRIX.md), glossary | absent OpenAPI path as if existing; full UX set |
| authentication/authorization | architecture, Task Packet, [`30_CURRENT_STATE_FINDINGS.md`](03_reference/30_CURRENT_STATE_FINDINGS.md) | IA permissions sections, journeys with rights | visual system, copy catalog |
| domain model/database | [`01_DOMAIN_GLOSSARY.md`](00_foundation/01_DOMAIN_GLOSSARY.md), architecture, [`PROTECTED_ARTIFACTS.md`](PROTECTED_ARTIFACTS.md) | current findings, migration | screen wireframes |
| media management | architecture media sections, Task Packet | journeys/screens for media, migration media stages, [`PROTECTED_ARTIFACTS.md`](PROTECTED_ARTIFACTS.md) | unrelated entity editors |
| publication/release/rollback | architecture publication, journeys, Task Packet, [`PROTECTED_ARTIFACTS.md`](PROTECTED_ARTIFACTS.md) | [`31_MIGRATION_AND_ROLLOUT.md`](03_reference/31_MIGRATION_AND_ROLLOUT.md), traceability | form rules unrelated to publish |
| generated/build/deployment | Task Packet, [`PROTECTED_ARTIFACTS.md`](PROTECTED_ARTIFACTS.md), architecture publication | Makefile/scripts named by Task Packet, current findings | inventing `scripts/**` as protected |
| Google Sheets migration/import | [`31_MIGRATION_AND_ROLLOUT.md`](03_reference/31_MIGRATION_AND_ROLLOUT.md), [`30_CURRENT_STATE_FINDINGS.md`](03_reference/30_CURRENT_STATE_FINDINGS.md) | glossary, architecture, import journeys | full visual/component inventory |
| accessibility/responsive | [`18_ACCESSIBILITY_AND_RESPONSIVE.md`](01_ux/18_ACCESSIBILITY_AND_RESPONSIVE.md) | related screen/form, acceptance scenarios | entire delivery prompts |
| UI copy | [`32_UI_COPY_CATALOG.md`](03_reference/32_UI_COPY_CATALOG.md) | form/system states, affected screen | roadmap, architecture deep-dives |
| testing/validation | [`26_VALIDATION_MATRIX.md`](02_delivery/26_VALIDATION_MATRIX.md), [`BASELINE_COMMANDS.md`](BASELINE_COMMANDS.md), Task Packet | [`19_UX_ACCEPTANCE_SCENARIOS.md`](01_ux/19_UX_ACCEPTANCE_SCENARIOS.md), traceability | unrelated product vision essays |
| security review | root policies, [`PROTECTED_ARTIFACTS.md`](PROTECTED_ARTIFACTS.md), [`SECRET_SCAN.md`](SECRET_SCAN.md), architecture, current findings | validation matrix, migration, frozen ExecPlan/diff | designer wireframe pack |
| tooling/security gate | Task Packet, [`SECRET_SCAN.md`](SECRET_SCAN.md), [`BASELINE_COMMANDS.md`](BASELINE_COMMANDS.md) | root [`AGENTS.md`](../../AGENTS.md) commit/freeze phases | inventing CI workflow |
| commit/freeze | root [`AGENTS.md`](../../AGENTS.md), [`SECRET_SCAN.md`](SECRET_SCAN.md), Task Packet | [`PROTECTED_ARTIFACTS.md`](PROTECTED_ARTIFACTS.md), frozen ExecPlan | treating scan PASS as commit authorization |
| planning/orchestration | Task Packet template, roadmap (as backlog only), [`28_ORCHESTRATOR_PROMPT.md`](02_delivery/28_ORCHESTRATOR_PROMPT.md), [`BASELINE_COMMANDS.md`](BASELINE_COMMANDS.md) | weak-model protocol, initial packet examples | treating roadmap row as authorization |
| architecture / ADR / planning | [`ADR_BACKLOG.md`](ADR_BACKLOG.md), architecture §15, Task Packet | owning ADR roadmap tasks, traceability | backlog ≠ accepted decisions |

Строка roadmap **не** является разрешением на реализацию. OpenAPI contract path в root policy — planned target; не ссылайтесь на него как на существующий файл.

## Canonical document map

### `00_foundation`

| Document | Purpose |
|---|---|
| [`00_PRODUCT_VISION.md`](00_foundation/00_PRODUCT_VISION.md) | Продуктовая концепция, границы и принципы CMS. |
| [`01_DOMAIN_GLOSSARY.md`](00_foundation/01_DOMAIN_GLOSSARY.md) | Канонический доменный словарь и сущности. |
| [`02_TARGET_ARCHITECTURE.md`](00_foundation/02_TARGET_ARCHITECTURE.md) | Целевая архитектура, границы и публикация. |

### `01_ux`

| Document | Purpose |
|---|---|
| [`10_UX_NORTH_STAR.md`](01_ux/10_UX_NORTH_STAR.md) | Целевое ощущение продукта и принципы доверия. |
| [`11_PERSONAS_AND_JOBS.md`](01_ux/11_PERSONAS_AND_JOBS.md) | Роли, контексты и Jobs To Be Done. |
| [`12_INFORMATION_ARCHITECTURE.md`](01_ux/12_INFORMATION_ARCHITECTURE.md) | Навигация, маршруты и связи экранов. |
| [`13_CORE_USER_JOURNEYS.md`](01_ux/13_CORE_USER_JOURNEYS.md) | Ключевые пошаговые пользовательские сценарии. |
| [`14_SCREEN_SPECIFICATIONS.md`](01_ux/14_SCREEN_SPECIFICATIONS.md) | Контракты экранов (purpose, layout, states). |
| [`15_FORM_AND_EDITING_RULES.md`](01_ux/15_FORM_AND_EDITING_RULES.md) | Правила форм, dirty/save и редактирования. |
| [`16_INTERACTION_AND_SYSTEM_STATES.md`](01_ux/16_INTERACTION_AND_SYSTEM_STATES.md) | Loading, empty, error, conflict и обратная связь. |
| [`17_VISUAL_SYSTEM.md`](01_ux/17_VISUAL_SYSTEM.md) | Визуальная грамматика админ-интерфейса. |
| [`18_ACCESSIBILITY_AND_RESPONSIVE.md`](01_ux/18_ACCESSIBILITY_AND_RESPONSIVE.md) | Доступность, клавиатура и адаптивность. |
| [`19_UX_ACCEPTANCE_SCENARIOS.md`](01_ux/19_UX_ACCEPTANCE_SCENARIOS.md) | UX acceptance scenarios для приёмки. |
| [`34_TEXT_WIREFRAMES.md`](01_ux/34_TEXT_WIREFRAMES.md) | Текстовые wireframes ключевых экранов. |

### `02_delivery`

| Document | Purpose |
|---|---|
| [`20_AGENTS.md`](02_delivery/20_AGENTS.md) | Imported source политики агентов (не active root). |
| [`21_PLANS.md`](02_delivery/21_PLANS.md) | Imported source ExecPlan policy (не active root). |
| [`22_WEAK_MODEL_PROTOCOL.md`](02_delivery/22_WEAK_MODEL_PROTOCOL.md) | Ограничение контекста и loop для слабых моделей. |
| [`23_ATOMIC_ROADMAP.md`](02_delivery/23_ATOMIC_ROADMAP.md) | Упорядоченный backlog атомарных задач. |
| [`24_TASK_PACKET_TEMPLATE.md`](02_delivery/24_TASK_PACKET_TEMPLATE.md) | Шаблон атомарного Task Packet. |
| [`25_EXECPLAN_TEMPLATE.md`](02_delivery/25_EXECPLAN_TEMPLATE.md) | Шаблон структуры ExecPlan. |
| [`26_VALIDATION_MATRIX.md`](02_delivery/26_VALIDATION_MATRIX.md) | Проверки по типам изменений. |
| [`27_FIRST_IMPLEMENTATION_PROMPT.md`](02_delivery/27_FIRST_IMPLEMENTATION_PROMPT.md) | Готовые стартовые промпты исполнителя. |
| [`28_ORCHESTRATOR_PROMPT.md`](02_delivery/28_ORCHESTRATOR_PROMPT.md) | Промпт для оркестратора реализации. |
| [`29_INITIAL_TASK_PACKETS.md`](02_delivery/29_INITIAL_TASK_PACKETS.md) | Первые примерные Task Packets. |

### `03_reference`

| Document | Purpose |
|---|---|
| [`30_CURRENT_STATE_FINDINGS.md`](03_reference/30_CURRENT_STATE_FINDINGS.md) | Зафиксированное на аудите текущее состояние и риски. |
| [`31_MIGRATION_AND_ROLLOUT.md`](03_reference/31_MIGRATION_AND_ROLLOUT.md) | Миграция и rollout без остановки сайта. |
| [`32_UI_COPY_CATALOG.md`](03_reference/32_UI_COPY_CATALOG.md) | Каталог канонических UI-текстов. |
| [`33_COMPONENT_INVENTORY.md`](03_reference/33_COMPONENT_INVENTORY.md) | Инвентарь целевых UI-компонентов. |
| [`35_TRACEABILITY_MATRIX.md`](03_reference/35_TRACEABILITY_MATRIX.md) | Связь требований, UX, roadmap и evidence. |
| [`36_SOURCE_ADAPTATION_NOTES.md`](03_reference/36_SOURCE_ADAPTATION_NOTES.md) | Источник строгих правил и адаптация к стеку. |

### Package root Markdown

| Document | Purpose |
|---|---|
| [`README.md`](README.md) | Overview и provenance imported document package. |

### Repository-level additions (не package manifest specs)

| Path | Role |
|---|---|
| [`AGENTS.md`](../../AGENTS.md) | Active repository agent policy. |
| [`PLANS.md`](../../PLANS.md) | Active ExecPlan policy. |
| [`PROTECTED_ARTIFACTS.md`](PROTECTED_ARTIFACTS.md) | Policy registry protected paths/classes/overrides (не imported package spec). |
| [`BASELINE_COMMANDS.md`](BASELINE_COMMANDS.md) | Repository policy design: command status, ownership, target check layers (не imported package document). |
| [`SECRET_SCAN.md`](SECRET_SCAN.md) | Repository security policy: secret-scan gate command, scope, exclusions, redaction. |
| [`ADR_BACKLOG.md`](ADR_BACKLOG.md) | Planning backlog for architecture §15; questions/ownership only. |
| [`INDEX.md`](INDEX.md) | Этот навигационный индекс. |
| [`execplans/`](execplans/) | Execution records отдельных запусков (не канонические specs). |

## Reading rules for humans

1. Начинайте с роли или типа задачи, не с полного каталога.
2. Различайте target design и current-state findings.
3. Roadmap — backlog; строка roadmap не разрешает implementation.
4. Для затронутого требования сверяйте [`35_TRACEABILITY_MATRIX.md`](03_reference/35_TRACEABILITY_MATRIX.md).
5. Implementation truth проверяйте по текущему коду, не только по docs.
6. [`README.md`](README.md) — package overview/provenance, не active policy.
7. Не додумывайте decisions, которых ещё нет в ADR/Task Packet.
8. При конфликте документов остановитесь и эскалируйте владельцу.

## Reading rules for AI agents

1. Всегда root [`AGENTS.md`](../../AGENTS.md).
2. Всегда root [`PLANS.md`](../../PLANS.md) для material task.
3. Ровно один concrete Task Packet.
4. Минимальный task-relevant context (см. weak-model protocol).
5. Сначала headings/ranges, full-document read только при необходимости.
6. Сверяйте docs с текущим кодом перед утверждениями о runtime.
7. Stop после текущей задачи; не начинайте следующий roadmap ID.
8. Не считайте INDEX или roadmap authorization на edits.
9. Не загружайте весь package «на всякий случай».
10. Package `20_AGENTS.md` / `21_PLANS.md` — reference only.

## Document status semantics

| Status | Meaning |
|---|---|
| `target` | Целевое состояние; ещё не обязательно реализовано. |
| `current-state` | Состояние на момент аудита; перепроверять по коду. |
| `policy` | Обязательные правила (active — только root policies). |
| `template` | Структура, требующая concrete values. |
| `roadmap` | Ordered backlog; не authorization. |
| `reference` | Supporting specification / inventory / copy. |
| `execution record` | Evidence конкретного запуска в `execplans/`. |

## Provenance and integrity

- Версия imported package: [`PACKAGE_INFO.json`](PACKAGE_INFO.json).
- Checksums imported files: [`MANIFEST.sha256`](MANIFEST.sha256).
- `INDEX.md`, `PROTECTED_ARTIFACTS.md`, `BASELINE_COMMANDS.md`, `SECRET_SCAN.md` и `execplans/**` — repository additions; **не** входят в original package manifest.
- [`README.md`](README.md) хранится как imported overview.
- Изменения package specs требуют отдельной docs task, не тихой правки внутри feature task.
- Не утверждается автоматическая CI-проверка manifest, пока это не доказано отдельной task.
