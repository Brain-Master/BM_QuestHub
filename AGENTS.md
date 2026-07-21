# Strict Engineering Rules for BM QuestHub CMS Agents

> Репозиторная политика для ИИ-агентов, работающих над CMS в `Brain-Master/BM_QuestHub`.
>
> Политика адаптирована из предоставленного владельцем шаблона строгих инженерных правил. Она обязательна для любого material change.

## 0. Константы проекта

- Проект: `BM QuestHub CMS`.
- Репозиторий: `Brain-Master/BM_QuestHub`.
- Корень: результат `git rev-parse --show-toplevel`; не предполагать путь.
- Основная ветка репозитория: `main`.
- Разрешённая ветка и base SHA: только из текущего Task Packet.
- Package manager: `npm`.
- Node.js baseline: major `22` (CI/workflow evidence: `.github/workflows/sheet-sync.yml` задаёт `node-version: "22"`); точную patch-версию не закреплять без repository evidence; локальная Node 24 из M0-01 не меняет policy; tool mismatch (локальная major ≠ baseline) является stop/blocker для tasks, где exact Node baseline обязателен; M0-03 и последующие policy tasks не меняют Node и не устанавливают version manager.
- TypeScript/React/Next/Vite versions: только версии, закреплённые текущими `package.json` и lockfiles.
- Язык основного UI: русский.
- UX-контракт: `docs/admin-cms/01_ux/` после размещения пакета в репозитории.
- API contract target: `docs/admin-cms/contracts/admin-api.openapi.yaml`. На момент принятия этой policy файл отсутствует; это planned target, не действующий source of truth. До отдельной adoption task endpoint contract changes требуют отдельного Task Packet. Агент не должен заявлять OpenAPI validation/generation pass до появления файла и команды.
- Root ExecPlan policy: `PLANS.md`.
- Canonical ExecPlan template: `docs/admin-cms/02_delivery/25_EXECPLAN_TEMPLATE.md`.
- Default ExecPlan directory: `docs/admin-cms/execplans/`.
- Нормативный реестр защищённых артефактов: `docs/admin-cms/PROTECTED_ARTIFACTS.md`. Exact path classification и Task Packet override requirements берутся из этого реестра (единый детальный path list). High-level categories ниже — non-exhaustive reminders, не второй полный table.
- Generated/public artifacts по умолчанию защищены (см. реестр), включая non-exhaustive examples:
  - `apps/web/data/**`;
  - generated snapshot/detail files;
  - build outputs;
  - generated media variants.
- Секретные пути всегда запрещены к чтению/выводу/коммиту без специального разрешения (абсолюты; реестр не ослабляет):
  - `secret/**`;
  - `*.env` и `*.env.*`, кроме явно публичных `.env.example` / `*.env.example` (см. registry exceptions);
  - credential files;
  - private keys, cookies, PAT, service-account JSON.
- Workflow и production deployment paths защищены по умолчанию (см. реестр), включая non-exhaustive examples:
  - `.github/workflows/**`;
  - deployment scripts;
  - S3 migration scripts;
  - production environment configuration.
- Любая mutation защищённого артефакта требует, чтобы Task Packet назвал registry IDs и exact operations (и exact paths) по `PROTECTED_ARTIFACTS.md`.
- Перед staging выполнить adopted secret-scan gate `make secret-scan` (policy: `docs/admin-cms/SECRET_SCAN.md`) на frozen candidate bytes. Secrets остаются masked; findings и missing tool install блокируют staging/commit; `--output`/report file не могут превратить findings в success. Scanner PASS необходим, но сам по себе не авторизует commit — нужен Task Packet. History scan не подразумевается.

Не угадывать неизвестные константы. Получить их из репозитория или остановиться.

# 1. Авторитет и scope

Порядок авторитетности:

1. Явная инструкция владельца для текущей задачи.
2. Этот `AGENTS.md`.
3. Одобренный Task Packet.
4. Одобренный ExecPlan.
5. `docs/admin-cms/PROTECTED_ARTIFACTS.md` — только path classification и override requirements; не расширяет Task Packet.
6. Документы `docs/admin-cms/`.
7. Package-local документация.
8. Существующие соглашения.
9. Defaults инструментов.

Каждая задача обязана иметь:

- точную цель;
- non-goals;
- разрешённые write paths;
- запрещённые paths;
- prerequisites;
- acceptance criteria;
- validation commands;
- stop conditions;
- commit policy.

Задача не разрешает:

- соседний cleanup;
- redesign за пределами экрана;
- upgrade зависимостей;
- смену framework/ORM/auth provider;
- редактирование generated files;
- weakening tests;
- исправление чужого baseline;
- начало следующего roadmap task.

Любое расширение scope требует остановки и обновлённого Task Packet.

# 2. Необсуждаемые Git-правила

Без явного разрешения:

- не переключать и не создавать ветки;
- не создавать worktree;
- не merge/rebase/reset/amend;
- не переписывать history;
- не force-push;
- не push;
- не stage до freeze и review;
- никогда не использовать `git add .` или `git add -A`;
- stage только explicit paths;
- не изменять protected files;
- не начинать следующую задачу;
- не удалять и не восстанавливать чужие изменения;
- не применять `git checkout --`, `git restore`, `git clean` без точного разрешения.

Commit разрешён только если Task Packet прямо разрешает commit и все gates прошли. Push всегда отдельное действие владельца.

# 3. Обязательный execution protocol

## Phase 0. Preflight

До планирования и редактирования выполнить:

```bash
pwd
git rev-parse --show-toplevel
git branch --show-current
git rev-parse HEAD
git status --short --branch
git status --porcelain=v1 --untracked-files=all
git log -10 --oneline --decorate
git diff --check

command -v node
node --version
command -v npm
npm --version
```

Для UI/E2E при необходимости:

```bash
command -v npx
npx playwright --version
```

Для DB-задач:

```bash
docker version
docker info
docker context show
```

Зафиксировать:

- repository root;
- branch;
- HEAD;
- tracked/untracked changes;
- tool versions;
- package manager;
- lockfiles;
- protected path hashes, если Task Packet их задаёт;
- baseline commands и результаты.

Preflight failure блокирует:

- ExecPlan;
- subagents;
- install;
- edits;
- stage;
- commit.

Не называть сбой transient только потому, что retry зелёный. Нужны доказательства.

## Phase 1. Классификация компонентов

Каждый новый или materially revised component классифицируется как один тип.

### `product_domain`

BM QuestHub-specific сущности, workflows, API, DB, permissions, snapshots и business rules.

### `repository_admin_template`

Репозиторный шаблон, потенциально пригодный другим продуктам, но не доказанный как library.

Примеры:

- admin shell;
- release job UI pattern;
- migration harness;
- CI conventions;
- API error envelope.

### `reusable_admin_library`

Product-neutral API с реальным вторым consumer или явно одобренным исключением.

До второго реального consumer не создавать reusable library. Не создавать фальшивый второй consumer.

Классификацию и rationale записать в ExecPlan.

## Phase 2. ExecPlan

Для material task создать/обновить ExecPlan по `docs/admin-cms/02_delivery/25_EXECPLAN_TEMPLATE.md` и lifecycle policy `PLANS.md`.

Обязательно:

- objective и non-goals;
- authorized/forbidden paths;
- base SHA;
- current architecture;
- classification;
- dependency direction;
- UX requirements;
- security analysis;
- implementation steps;
- negative paths;
- test plan;
- acceptance matrix;
- exact commands;
- commit subject или `NO COMMIT`;
- stop conditions;
- failure history;
- scope changes.

ExecPlan является execution record, а не формальностью.

## Phase 3. Read-only audit

Для material task использовать два независимых read-only audit pass.

Если orchestration поддерживает subagents:

- Auditor A: architecture, data flow, duplication, path:line evidence.
- Auditor B: security, failure modes, UX regressions, false-pass and test risks.

Если subagents недоступны, parent выполняет два отдельные прохода и явно маркирует A/B.

Auditors не имеют права:

- edit;
- install;
- stage;
- commit;
- push;
- change branch;
- start another task.

Parent независимо проверяет принятые findings.

## Phase 4. Implementation

Только parent agent редактирует.

Правила:

- только authorized paths;
- smallest complete change;
- не добавлять speculative abstraction;
- не менять public contracts без разрешения;
- не смешивать refactor и behavior change без необходимости;
- не скрывать defect через fallback;
- не копировать domain schema в UI;
- не редактировать snapshot output вместо source;
- не менять UX-contract молча.

## Phase 5. Targeted validation

Порядок:

1. static/type checks для изменённого package;
2. focused unit tests;
3. component tests;
4. contract/integration tests;
5. accessibility tests для UI;
6. focused E2E для critical path;
7. повторные независимые runs, если flakiness/lifecycle relevant.

Failure блокирует progress. Нельзя перезапустить до зелёного и забыть предыдущий сбой. Failure history сохраняется.

## Phase 6. Full validation

Использовать только существующие или Task Packet-authorized commands.

Нормативный дизайн статусов команд, ownership, целевой композиции `check-fast` / `check` / `check-full`, side-effect policy и roadmap gaps: `docs/admin-cms/BASELINE_COMMANDS.md`. Этот документ **не делает** planned command executable. Task Packet обязан перечислить exact commands, которые существуют на старте задачи. Полная трёхслойная композиция не дублируется здесь — только в `BASELINE_COMMANDS.md`.

Текущий known baseline (команды объявлены в repository manifests; наличие script ≠ PASS; в policy-adoption task эти команды не запускались и не заявляются PASS):

```bash
npm --prefix apps/admin run build
npm --prefix apps/web run check
git diff --check
```

Evidence на момент принятия policy (перепроверено M0-07 design; M0-11 adoption update): `apps/admin` объявляет `dev`/`build`/`preview` (+ later typecheck/lint/test через M0-08..M0-10). `apps/web` и root объявляют `check`. `make check` существует (web-only orchestration). `make check-fast` и `make check-full` **не существуют**, пока не завершится orchestration ownership (см. `BASELINE_COMMANDS.md`). Stable secret scan adopted as `make secret-scan` (M0-11; `docs/admin-cms/SECRET_SCAN.md`). Dependencies availability и фактический exit code определяются только при реальном запуске в соответствующей task.

По мере появления stable scripts (planned future gates, не current gates; не вызывать как existing до verification) использовать:

```bash
npm --prefix apps/admin run typecheck
npm --prefix apps/admin run lint
npm --prefix apps/admin run test
npm --prefix apps/admin run test:a11y
npm --prefix apps/admin run test:e2e
npm --prefix apps/admin run build

npm --prefix apps/web run check

make check-fast
make check
make check-full
make secret-scan
```

Нельзя заявлять pass для отсутствующей команды. Missing required script — blocker или отдельная foundation task.

Для DB/API также:

- migration checks;
- schema drift;
- OpenAPI validation/generation drift;
- integration tests;
- authorization denial tests;
- secret scan (`make secret-scan`; see `docs/admin-cms/SECRET_SCAN.md`);
- vulnerability scan по репозиторной policy.

Все mandatory commands должны exit 0. Skip допустим только repository-defined и с exact reason.

## Phase 7. Freeze

После unstaged validation:

1. записать HEAD;
2. записать все changed paths;
3. `git diff --check`;
4. вычислить deterministic fingerprint по relative paths и bytes;
5. записать algorithm/fingerprint в ExecPlan;
6. не редактировать после freeze.

Рекомендуемый algorithm:

```text
SHA-256 over sorted records:
repository-relative path, затем NUL, затем file bytes, затем NUL
```

Timestamp, absolute path, metadata и index state не участвуют.

Любой edit отменяет freeze и review.

## Phase 8. Independent final review

Fresh read-only reviewer проверяет frozen bytes:

- scope;
- architecture;
- UX contract;
- security;
- authorization;
- error/empty/loading states;
- accessibility;
- negative paths;
- cleanup/cancellation;
- contract compatibility;
- tests and false-pass;
- protected artifacts;
- fingerprint.

Вердикт только:

```text
APPROVE
```

`APPROVE_WITH_FIXES` является blocking. Любая correction требует validation, new fingerprint и fresh review.

## Phase 9. Staging

Только если Task Packet разрешает commit и reviewer = `APPROVE`:

- проверить fingerprint;
- stage explicit approved paths;
- никогда `git add .` / `git add -A`.

Выполнить:

```bash
git diff --cached --name-status
git diff --cached --stat
git diff --cached --check
```

Затем:

- выполнить `make secret-scan` на frozen candidate bytes (см. `docs/admin-cms/SECRET_SCAN.md`); findings или `MISSING_PREREQUISITE` блокируют staging; scanner PASS не заменяет authorization Task Packet;
- выполнить exact staged validation commands из текущего Task Packet; каждая команда должна существовать и быть проверена до заявления PASS.

Staged bytes должны совпадать с reviewed frozen target.

## Phase 10. Commit

Один logical Conventional Commit:

```text
type(scope): imperative summary
```

Примеры:

```text
fix(admin): send snapshot reads without a GET body
feat(admin): add read-only course list shell
test(admin): cover content client request contracts
feat(content): add immutable shift identifiers
```

Не amend. Не push. Не начинать следующую задачу.

# 4. Архитектурная политика

## 4.1. Dependency direction

```text
UI / routes / adapters
          ↓
application use cases
          ↓
domain
```

Infrastructure реализует application ports.

Запрещено:

- domain importing React/Next/Vite;
- UI importing database driver;
- client component reading process.env secrets;
- S3 writes from browser;
- platform package importing product domain;
- circular dependencies;
- hidden network I/O in constructors/module initialization.

## 4.2. Junk-drawer packages

Не создавать:

- `common`;
- `utils`;
- `helpers`;
- `shared`;
- `base`;
- `misc`.

Использовать capability-specific names:

- `content-client`;
- `release-status`;
- `form-errors`;
- `object-store`;
- `admin-auth`;
- `snapshot-compiler`.

## 4.3. Interface policy

Интерфейс определяется у consumer boundary. Не создавать interface только потому, что существует concrete class.

## 4.4. Extraction policy

После первой реализации компонент остаётся `repository_admin_template`. Reusable library — только после второго реального consumer или explicit exception.

# 5. TypeScript engineering rules

- Strict mode обязателен.
- Не использовать `any`, кроме изолированного adapter boundary с проверкой и comment.
- `unknown` валидируется до использования.
- Runtime input проверяется schema validator.
- Domain types не выводятся из случайного API response без validation.
- Discriminated unions для state machines.
- Exhaustive checks для status/action mapping.
- Не использовать non-null assertion как обычный control flow.
- Не подавлять TypeScript errors `@ts-ignore` без Task Packet.
- `@ts-expect-error` только с объяснением и test.
- Stable identifiers, не array index keys.
- Dates/time zones моделируются явно.
- Money unit фиксируется типом/контрактом.
- Booleans не кодируются строками после boundary parsing.
- Не мутировать shared objects.
- Pure domain functions не читают clock/random/env напрямую; зависимости inject.

# 6. React/UI engineering rules

- Semantic HTML first.
- Controlled/uncontrolled choice документируется.
- Form state не дублируется между несколькими stores.
- Server state и local edit state разделены.
- No effect-driven derived state, если можно вычислить render-time.
- Effects имеют cleanup и dependency correctness.
- Async operations отменяются или ignore stale result безопасно.
- No state update after unmount.
- Loading, empty, error, permission, conflict state обязательны.
- Save state видим постоянно.
- Publish никогда не смешивается с save.
- Disabled action имеет reason.
- Toast не единственный carrier критической информации.
- Accessibility patterns из `18_ACCESSIBILITY_AND_RESPONSIVE.md` обязательны.
- UI copy берётся из `32_UI_COPY_CATALOG.md` или следует его rules.
- Не показывать raw JSON, CSS classes, S3 keys и tokens обычному Editor.
- Не вводить drag-only interaction.
- Focus management обязателен для dialogs, errors и route change.

# 7. State and concurrency in UI

Каждая async mutation имеет:

- owner;
- start condition;
- cancel/stale strategy;
- success state;
- error state;
- retry/idempotency behavior;
- conflict behavior.

Запрещено:

- last-write-wins без revision;
- silent optimistic publication success;
- double-submit;
- unbounded retry;
- stale response overwriting newer state;
- debounce без flush/cancel policy;
- localStorage/sessionStorage для auth secrets.

# 8. API rules

Admin API отделён от public API.

Каждый endpoint определяет:

- authentication;
- exact authorization;
- request size;
- timeout;
- idempotency;
- pagination bounds;
- revision/ETag behavior;
- error mapping;
- audit event;
- data exposure.

Server-side authorization mandatory. Caller-supplied entity/scope IDs — input, не authority.

Правила HTTP:

- GET/HEAD без body;
- mutation body size bounded;
- content type checked;
- errors не раскрывают internals;
- correlation ID;
- safe redirects;
- SSRF defense для outbound URL;
- timeout/redirect/response limits;
- no global mutable production client without configuration.

OpenAPI после adoption является source of truth. Generated code reproducible, manual generated edits forbidden.

# 9. PostgreSQL и migrations

До одобрения ADR нельзя выбирать provider, version, ORM или migration tool.

После выбора:

- released migrations immutable;
- new migration вместо edit history;
- checksums;
- serialized migration attempts;
- transaction ownership;
- replay safety;
- failure recovery;
- actionable diagnostics;
- separate owner/migrator/runtime roles;
- no broad PUBLIC grants;
- parameterized queries;
- bounded result sets;
- explicit lock ordering;
- no network call inside transaction;
- optimistic concurrency tests;
- rollback/contention/timeout tests.

RLS только defense in depth и требует identity/pool reset tests.

# 10. Object Storage и media

- Browser не получает production write credentials.
- Upload через authorized API/presigned intent with scope.
- Size limit.
- Real MIME verification.
- Safe filename/path.
- Checksum.
- Isolated source storage.
- Bounded processing.
- Variant generation deterministic.
- Signed URLs, tokens и credentials не логируются.
- Asset usage проверяется до archive/delete.
- Replace создаёт revision; не уничтожает history.
- Public media path не является identity.

# 11. Snapshot и release rules

- Snapshot — generated output.
- UI не редактирует raw snapshot.
- Compiler детерминирован для одинакового input.
- Release immutable.
- Activation atomic.
- Partial upload не становится current.
- Verification mandatory.
- Activation success + verification failure не называется success.
- Rollback меняет release pointer и не удаляет drafts.
- Content hashes проверяются.
- Existing public contracts сохраняются до explicit migration task.

# 12. Security rules

- Deny by default.
- Minimum capability.
- Authentication ≠ authorization.
- Individual identity; shared global token не целевое решение.
- Sensitive mutation audited.
- Session expiry/revocation enforced.
- MFA для Publisher/Admin по целевой policy.
- CSRF protection для cookie mutations.
- Input syntactically/semantically validated and size-bounded.
- No secrets in source, fixtures, snapshots, logs, errors, screenshots, artifacts or command output.
- No arbitrary environment dump.
- No auth header/body logging.
- Upload security mandatory.
- Outbound HTTP SSRF protected.
- Dependency addition recorded.
- Downloaded scripts не выполняются без review.
- No production bypass endpoint.
- Impersonation/admin override requires explicit permission and audit.

# 13. Error and diagnostics

Machine-readable errors должны содержать stable code. Human message отвечает: operation, phase, cause class и recovery.

Primary error остаётся primary. Cleanup/logging failure — secondary.

Не показывать пользователю:

- stack trace;
- SQL;
- credentials;
- internal hostname;
- signed URL;
- arbitrary payload;
- full third-party response.

# 14. Logging and observability

- Structured logs.
- Stable fields.
- request/trace/job/actor/entity/revision/release IDs.
- No secrets/sensitive payload.
- Не логировать одну ошибку на каждом layer.
- terminating layer owns final log.
- bounded metric labels.
- health/readiness semantics explicit.

# 15. Testing policy

Использовать:

- unit tests для pure behavior;
- component tests для UI boundaries;
- contract tests для API;
- integration tests для DB/S3/auth;
- E2E только critical paths;
- accessibility automated + manual smoke.

Tests не зависят от:

- arbitrary sleep;
- execution order;
- mutable globals;
- wall clock where fake possible;
- public external services;
- locale/timezone defaults;
- map/object iteration order;
- fixed host ports;
- leaked processes/containers.

## No false pass

Перед exact named test убедиться, что он существует. Zero matched tests — не pass.

## Test fakes

- capability-specific;
- reject unexpected calls;
- deterministic signals;
- record contexts/inputs;
- cleanup unblocks;
- no global hooks;
- no hidden success defaults.

## UI tests

Покрывать:

- loading;
- empty;
- error;
- permission;
- dirty guard;
- save failure;
- conflict;
- keyboard;
- accessible names;
- long Russian text;
- mobile critical path.

# 16. UX conformance gate

Каждая UI task ссылается на конкретные UX documents и scenarios.

Review обязан проверить:

- user goal;
- hierarchy;
- save vs publish;
- state visibility;
- copy;
- disabled reasons;
- error recovery;
- focus;
- responsive;
- accessibility;
- no raw technical leakage.

Красивый screenshot не является UX pass.

# 17. Dependencies and generated code

- No dependency upgrade outside scope.
- New dependency requires rationale, alternatives and lockfile change.
- Generated code/assets not edited manually.
- Generator version pinned.
- Generation drift check mandatory after adoption.
- Do not add heavy state/form/table library without ADR or Task Packet.
- Prefer existing repo dependencies when adequate.

# 18. Baseline failures and blockers

При baseline failure:

1. stop;
2. preserve worktree;
3. collect read-only diagnostics;
4. identify boundary;
5. classify with evidence;
6. do not repair outside scope;
7. do not erase failure by retry;
8. create narrow follow-up;
9. restart preflight after correction commit.

Valid classes:

- tool unavailable;
- dependency install unavailable;
- daemon/container unavailable;
- deterministic baseline defect;
- network unavailable;
- stale generated artifact;
- resource collision;
- transient with evidence;
- unknown with evidence.

`Unknown` лучше выдуманной уверенности.

# 19. Review rules

Reviewer смотрит actual frozen bytes.

Material finding содержит:

- severity;
- path:line;
- failure scenario;
- violated invariant;
- required correction;
- regression test.

Review проверяет negative paths, authorization, secrets, dependency direction, generated boundaries, migration immutability, portability, accessibility, error states и false-pass risks.

Passing tests alone не означает approval.

# 20. Definition of Done

Task complete только если:

- scope satisfied;
- non-goals untouched;
- acceptance matrix PASS;
- targeted tests pass;
- integration/contract tests pass when relevant;
- accessibility gate pass for UI;
- repository gates pass;
- protected hashes unchanged;
- secret scan pass when staging/commit authorized;
- fingerprint matches reviewed bytes;
- reviewer = APPROVE;
- staged bytes match freeze if staged;
- authorized commit exists if requested;
- no unauthorized push;
- no next task started;
- final report exact.

Unit tests alone не completion.

# 21. Mandatory stop conditions

Stop immediately when:

- branch/HEAD differs;
- unexplained worktree changes;
- protected path changes;
- required tool/version differs;
- baseline fails;
- forbidden path becomes necessary;
- scope must expand;
- UX/security boundary ambiguous;
- public contract change discovered;
- deterministic test flaky;
- reviewer not APPROVE;
- staged bytes differ;
- secret scan finding;
- policy conflict;
- next task would be required to make current task appear complete.

Stopping is correct. Concealing/bypassing blocker is not.

# 22. Standard final report

Report:

- repository root;
- branch;
- base SHA;
- final SHA if commit;
- changed files;
- classification;
- objective result;
- architecture/security/UX notes;
- exact commands and outcomes;
- failed commands and history;
- reviewer findings/verdict;
- protected hashes;
- frozen fingerprint;
- final git status;
- commit/push status;
- excluded work;
- unresolved risks;
- explicit statement that next task was not started.

Нельзя claim pass для command, не запущенной на final frozen bytes.

# 23. Standard Task Packet header

Каждый Task Packet обязан содержать concrete fields без generic/unresolved tokens:

- Repository всегда: `Brain-Master/BM_QuestHub`;
- Authorized branch: concrete branch name;
- Expected HEAD: full concrete SHA;
- Task: один concrete Task ID и title;
- Objective: один concrete atomic outcome;
- Non-goals, authorized write paths, forbidden paths, UX references, prerequisites, acceptance, validation, stop conditions — обязательны и concrete;
- Commit: concrete Conventional Commit subject или literal `NO COMMIT`.

Root ExecPlan policy: `PLANS.md`. Canonical ExecPlan template: `docs/admin-cms/02_delivery/25_EXECPLAN_TEMPLATE.md`. Default ExecPlan directory: `docs/admin-cms/execplans/`.

Обязательные завершающие строки Task Packet:

```text
Do not push.
Do not start the next task.
```
