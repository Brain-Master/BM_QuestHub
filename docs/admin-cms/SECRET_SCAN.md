# BM QuestHub — secret scan gate

## 1. Normative scope

Этот документ — repository security policy для стабильного secret-scan gate.
Он не авторизует stage/commit/push и не заменяет root `AGENTS.md` / Task Packet.
Authority: owner instruction → `AGENTS.md` → Task Packet → этот документ → `BASELINE_COMMANDS.md`.

## 2. Stable command

Каноническая команда:

```text
make secret-scan
```

Она делегирует в:

```text
node scripts/secret-scan.mjs
```

Команда **не** выполняет install. Bootstrap для fresh checkout:

```powershell
Push-Location tools/secret-scan
try {
  npm ci --no-audit --no-fund
} finally {
  Pop-Location
}
```

## 3. Tool/version ownership

| Item | Value |
|---|---|
| Tool | Secretlint |
| Package | `tools/secret-scan` (`@bm-questhub/secret-scan`) |
| Direct deps | `secretlint`, `@secretlint/secretlint-rule-preset-recommend`, `@secretlint/secretlint-rule-no-dotenv` |
| Release family | `13.0.2` (exact pins) |
| Node | major `22` (`engines.node: 22.x`) |
| Owner task | M0-11 |
| Config | `.secretlintrc.json` |
| Exclusions | `.secretlintignore` |

Корневой `package.json` / root lockfile **не** используются.

## 4. Installation/bootstrap

1. Node 22 active.
2. Один раз: `npm ci` в `tools/secret-scan`.
3. Затем: `make secret-scan` из корня репозитория.

Отсутствие `tools/secret-scan/node_modules` → wrapper exit `2` с
`MISSING_PREREQUISITE`.

## 5. Candidate file scope

Wrapper перечисляет кандидатов через:

```text
git ls-files --cached --others --exclude-standard -z
```

В scope:

- Git tracked files;
- untracked files, не исключённые Git ignore rules;
- текущие worktree bytes;
- пути передаются как literal process args (`--no-glob`), без shell expansion.

Rejected: absolute paths, `..` traversal, paths вне root, symlink targets вне root.

## 6. Explicit non-coverage

Gate **не** сканирует:

- ignored local secret files (включая `.env` по root `.gitignore`);
- Git history / deleted blobs;
- remote branches;
- external object storage;
- CI secret stores / environment variable values;
- secret managers.

Не заявлять full-history protection. History audit — отдельная авторизация
(`SS-GAP-01`, proposal only).

## 7. Redaction/output contract

- Secret values masked by default.
- `--no-maskSecrets` запрещён.
- `--output` запрещён (Secretlint с `--output` может вернуть exit 0 при findings).
- Report file в репозиторий не пишется.
- Допустимы path / rule / line / masked diagnostics.
- Secret text и synthetic probe values не копировать в ExecPlan/issues/reports.

## 8. Exit-code contract

### Wrapper (`node scripts/secret-scan.mjs`)

| Status | Exit | Meaning |
|---|---:|---|
| PASS | 0 | нет findings; candidate count > 0 |
| FINDINGS | 1 | masked locations; commit blocked |
| FATAL | 2 | config/tool/environment/`MISSING_PREREQUISITE` |

### Make (`make secret-scan`)

GNU Make при ошибке recipe возвращает exit status `2` (стандартное поведение),
даже если wrapper завершился с `1`. Любой nonzero от Make блокирует commit.
Точное различие FINDINGS vs FATAL — по фазовым меткам wrapper
(`status=FINDINGS` / `status=FATAL`) или прямым запуском wrapper.

## 9. Exclusion policy

`.secretlintignore` начинается с policy header. Active entries только после triage:

- exact repository-relative path;
- immutable imported / synthetic fixture;
- manual review: no real credential;
- exact rule/message ID, reason, owner, review date/fingerprint;
- broader alternative rejected.

Forbidden: `**`, `*`, `docs/**`, `scripts/**`, `apps/**`, `.github/**`,
`*.md`, `*.json`, `*.yml`, `*.yaml`, `*.env*`, `package-lock.json`,
allowlisting secret text, `secretlint-disable` comments, ignoring mutable
source with a real finding.

## 10. Active exclusion registry

Active exclusions: 0

| ID | Exact path | Rule/message | Reason | Immutable? | Owner | Evidence fingerprint | Status |
|---|---|---|---|---|---|---|---|

(no rows)

Каждая будущая active ignore-строка должна иметь ровно одну запись `SS-EXC-*`,
и наоборот.

## 11. Real finding response

1. Stop.
2. Не печатать и не копировать value.
3. Зафиксировать только path, rule и line.
4. Определить: real / synthetic / false positive / unknown.
5. Если real — rotate/revoke вне логов агента.
6. Удаление из bytes/history — отдельная авторизация.
7. Повторить scan.
8. Не создавать exclusion для real secret.
9. Не commit до clean scan и явной авторизации Task Packet.

## 12. Synthetic validation contract

M0-11 negative proof uses a runtime-generated classic GitHub token-shaped
synthetic (`ghp_` + fixed repeated characters). Record only:

- rule ID;
- prefix class;
- total length;
- SHA-256 of synthetic value.

Full value and suffix must be absent from retained logs/docs.

## 13. Local usage

```text
1. Use Node 22.
2. Install pinned tool dependencies once with npm ci in tools/secret-scan.
3. Run make secret-scan.
```

## 14. CI usage

Workflow ещё не обязан вызывать gate (M0-11 не добавляет CI). Когда CI
подключит команду:

```text
1. Set up Node 22.
2. Run npm ci in tools/secret-scan.
3. Run make secret-scan from repository root.
```

Не утверждать, что workflow уже существует.

## 15. Commit authorization relationship

- Scanner PASS необходим, но **недостаточен** для commit.
- Findings или missing tool install блокируют staging/commit.
- Stage/commit разрешает только Task Packet + review APPROVE.
- History scan не подразумевается.

## 16. Known limitations/future work

- Current-worktree scope only (tracked + untracked non-ignored).
- Binary/large files may be skipped by Secretlint text/binary heuristics;
  absence of a finding is not a cryptographic guarantee.
- Detection coverage equals recommended preset + no-dotenv; not every
  possible credential shape.
- GNU Make remaps recipe exit 1 → Make exit 2.

```text
SS-GAP-01 — full Git history secret audit and rotation playbook
Status: PROPOSAL ONLY
```

No roadmap Task ID assigned.
