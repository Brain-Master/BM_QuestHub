# BM QuestHub — реестр защищённых артефактов

Нормативный документ **только** для classification защищённых paths/globs и требований к Task Packet override. Authority выше остаётся у root `AGENTS.md`, root `PLANS.md` и конкретного Task Packet. Этот реестр **не расширяет** scope задачи. Отсутствие path в реестре **не отменяет** явный запрет Task Packet / `AGENTS.md`. При неоднозначности agent **stops** before read/write.

Порядок для path classification после принятия:

```text
AGENTS.md → PLANS.md → Task Packet → ExecPlan → PROTECTED_ARTIFACTS.md
```

## 1. Protection classes

### `generated_output`

Создаётся generator/build/compiler. Default: read metadata/content только если task requires; **manual edit forbidden**; write only through confirmed generator; stage only if Task Packet explicitly authorizes generated artifacts; generation drift validation required.

### `sensitive_secret`

Secret/credential/session/key material. Default: **content read forbidden**; output/log/screenshot forbidden; stage/commit forbidden; metadata-only existence check allowed when task explicitly needs it; Task Packet **cannot** authorize disclosure into chat/log/source.

### `operational_critical`

Workflow, deploy, publication, production configuration or migration utility. Default: read allowed for scoped audit; write requires exact paths, failure analysis, rollback and operational checks; no broad cleanup; no production execution unless explicitly authorized.

### `migration_history`

Released schema/data migration history. Default: **append-only**; released migrations **immutable**; no rename/reorder/delete/edit; checksum/compatibility checks required; policy-only until an actual migration path is adopted.

### `compatibility_contract`

Public snapshot/media/path/API compatibility relied on by current consumers. Default: non-breaking change only; breaking change requires explicit migration Task Packet, compatibility plan, consumer evidence and rollback. File path may be normal source; contract semantics remain protected.

### `build_ephemeral`

Generated local build/cache output. Default: **never stage/commit**; may be created by authorized validation; cleanup only when owned by current task and explicitly allowed; external/pre-existing artifacts not deleted.

No additional classes without stop/authorization.

## 2. Status semantics

| Status | Meaning |
|---|---|
| `existing` | Path/glob confirmed by current repository tree and/or config evidence; at least one match or confirmed file. |
| `external-logical` | Not a repository filesystem path; confirmed public object-key / external convention **without** credentials. |
| `policy-only` | Must be protected when present; matching artifact not confirmed now (zero matches allowed). |

Do not mark `existing` when the path is absent.

## 3. Registry

| ID | Path or logical key | Status | Class | Owner/capability | Default read | Default mutation | Required override evidence |
|---|---|---|---|---|---|---|---|
| PA-GEN-001 | `apps/web/data/**` | existing | generated_output | snapshot compiler / sheet sync | metadata/content if task requires | generator only; no manual edit | IDs+paths+ops; generator command; drift/schema checks |
| PA-GEN-002 | `apps/web/media/**` | existing | generated_output | media ingest / S3 media publish | metadata/content if task requires | generator/pipeline only; no hand-edit of public variants | IDs+paths+ops; ingest/sync validation |
| PA-GEN-003 | `data/offers-snapshot.json` | external-logical | generated_output | hot S3 publish | object metadata via authorized ops | put via hot publish only | ops Task Packet; validate; no cold overwrite |
| PA-GEN-004 | `data/v2/` | external-logical | generated_output | cold S3 publish | object metadata via authorized ops | put/delete-scoped via cold publish | ops Task Packet; validate; isolate from hot |
| PA-GEN-005 | `media/` | external-logical | generated_output | media S3 publish | object metadata via authorized ops | sync via media target only | ops Task Packet; prod URL smoke when required |
| PA-BUILD-001 | `apps/admin/dist/**` | policy-only | build_ephemeral | admin Vite build (`outDir`) | local inspect OK | generate via build only; never stage | Task Packet validation ownership |
| PA-BUILD-002 | `apps/web/out/**` | existing | build_ephemeral | web static export (`distDir`) | local inspect OK | generate via build only; never stage | Task Packet; no staged files |
| PA-BUILD-003 | `apps/web/.next/**` | existing | build_ephemeral | Next intermediate cache | local inspect OK | generate via tooling only; never stage | Task Packet; no staged files |
| PA-OPS-001 | `.github/workflows/**` | existing | operational_critical | CI/CD publication & ops | scoped audit read | exact paths; rollback; no secret values in YAML | IDs+paths+ops; syntax/static; rollback |
| PA-OPS-002 | `scripts/run-sheet-sync.mjs` | existing | operational_critical | sheet → snapshot orchestrator | scoped audit read | exact Task Packet write | rollback; sync validation |
| PA-OPS-003 | `scripts/publish-sheet-hot.mjs` | existing | operational_critical | hot publish | scoped audit read | exact Task Packet write | validate + hot isolation |
| PA-OPS-004 | `scripts/publish-sheet-cold.mjs` | existing | operational_critical | cold publish / deploy chain | scoped audit read | exact Task Packet write | validate + cold isolation + rollback |
| PA-OPS-005 | `scripts/run-s3-sync.mjs` | existing | operational_critical | S3 sync entry | scoped audit read | exact Task Packet write | target isolation; dry-run when available |
| PA-OPS-006 | `scripts/sync-s3-sdk.mjs` | existing | operational_critical | S3 SDK sync targets | scoped audit read | exact Task Packet write | target isolation; no credential log |
| PA-OPS-007 | `scripts/sync-s3-public.mjs` | existing | operational_critical | S3 public sync | scoped audit read | exact Task Packet write | target isolation |
| PA-OPS-008 | `scripts/migrate-s3-bucket.mjs` | existing | operational_critical | same-provider S3 migrate | scoped audit read | exact Task Packet; dry-run first | count/head verify; rollback |
| PA-OPS-009 | `scripts/migrate-s3-cross.mjs` | existing | operational_critical | cross-provider S3 migrate | scoped audit read | exact Task Packet; dry-run first | prefix verify; rollback |
| PA-OPS-010 | `scripts/timeweb-deploy.mjs` | existing | operational_critical | Timeweb deploy | scoped audit read | exact Task Packet; no prod exec unless authorized | build-check; rollback |
| PA-OPS-011 | `scripts/timeweb-build-check.mjs` | existing | operational_critical | pre-deploy build gate | scoped audit read | exact Task Packet write | build gate evidence |
| PA-OPS-012 | `scripts/deploy-yandex-content-admin.mjs` | existing | operational_critical | Yandex content-admin deploy | scoped audit read | exact Task Packet; no prod exec unless authorized | deploy smoke; rollback |
| PA-OPS-013 | `scripts/setup-content-admin.mjs` | existing | operational_critical | content-admin setup | scoped audit read | exact Task Packet write | env isolation; no secret commit |
| PA-OPS-014 | `scripts/sync-media-inbox-to-drive.mjs` | existing | operational_critical | media Drive push | scoped audit read | exact Task Packet write | Drive scope; no credential log |
| PA-OPS-015 | `scripts/pull-media-inbox-from-drive.mjs` | existing | operational_critical | media Drive pull | scoped audit read | exact Task Packet write | Drive scope |
| PA-OPS-016 | `scripts/ts/media-drive-push.ts` | existing | operational_critical | media Drive push impl | scoped audit read | exact Task Packet write | same as PA-OPS-014 |
| PA-OPS-017 | `scripts/ts/media-drive-pull.ts` | existing | operational_critical | media Drive pull impl | scoped audit read | exact Task Packet write | same as PA-OPS-015 |
| PA-OPS-018 | `apps/web/timeweb.app.env.example` | existing | operational_critical | Timeweb App env template | read OK (public example) | exact Task Packet; keep non-secret | no real secrets in example |
| PA-SECRET-001 | `secret/**` | existing | sensitive_secret | credential store | metadata-only if authorized | never content mutate/stage/commit via agent | cannot authorize disclosure |
| PA-SECRET-002 | `.env` ; `.env.*` | existing | sensitive_secret | env secrets | content read forbidden | stage/commit forbidden | cannot authorize disclosure |
| PA-SECRET-003 | `**/*.pem` | policy-only | sensitive_secret | private keys | content read forbidden | stage/commit forbidden | cannot authorize disclosure |
| PA-SECRET-004 | `**/*.key` | policy-only | sensitive_secret | private keys | content read forbidden | stage/commit forbidden | cannot authorize disclosure |
| PA-SECRET-005 | `**/*service-account*.json` | policy-only | sensitive_secret | service-account JSON | content read forbidden | stage/commit forbidden | cannot authorize disclosure |
| PA-MIG-001 | any adopted database/data migration directory | policy-only | migration_history | future DB migrations | audit when adopted | append-only; released immutable | ADR + checksum/upgrade checks |
| PA-MIG-002 | `packages/content-db/migrations/**` | policy-only | migration_history | planned content-db (absent) | N/A until adopted | append-only when adopted; do not invent package here | architecture target only |
| PA-COMPAT-001 | catalog snapshot v2 shape (`apps/web/data/v2/catalog-snapshot.json`) | existing | compatibility_contract | public catalog consumers | contract docs + fixtures | non-breaking only | migration Task Packet + consumer evidence |
| PA-COMPAT-002 | map snapshot v2 shape (`apps/web/data/v2/map-snapshot.json`) | existing | compatibility_contract | public map consumers | contract docs + fixtures | non-breaking only | migration Task Packet + consumer evidence |
| PA-COMPAT-003 | offers snapshot v1 shape (`apps/web/data/offers-snapshot.json`) | existing | compatibility_contract | public schedule consumers | contract docs + fixtures | non-breaking only | migration Task Packet + consumer evidence |
| PA-COMPAT-004 | detail snapshots (`apps/web/data/v2/detail/**`) | existing | compatibility_contract | course detail consumers | contract docs + fixtures | non-breaking only | migration Task Packet + consumer evidence |
| PA-COMPAT-005 | site manifest paths (`apps/web/data/v2/site-manifest.json`) | existing | compatibility_contract | site bootstrap | contract docs + fixtures | non-breaking only | migration Task Packet + hash/path checks |
| PA-COMPAT-006 | public media resolution (`media/` + `apps/web/media/**` conventions) | existing | compatibility_contract | site media consumers | docs + URL smoke | non-breaking only | migration Task Packet + consumer evidence |
| PA-COMPAT-007 | current site page expectations | existing | compatibility_contract | public Next site | findings + consumer tests | non-breaking only | migration Task Packet + parity/diff |
| PA-COMPAT-008 | `docs/admin-cms/03_reference/30_CURRENT_STATE_FINDINGS.md` §11 | existing | compatibility_contract | compatibility inventory doc | read OK | docs task only; do not silently weaken list | docs Task Packet |

### Secret exceptions (notes)

Markdown globs do **not** auto-negate. For `PA-SECRET-002`, public examples are **excluded** from `sensitive_secret`:

- `!.env.example`
- `!*.env.example`

Examples remain ordinary writable files only under a Task Packet that names them; they are not secret material.

### External-logical rules

Logical keys never include bucket names, account IDs, tokens, signed query strings, or host secrets. Keys are object-path conventions only.

## 4. Task override contract

Minimum Task Packet fields for any protected mutation:

```text
Protected registry IDs:
Exact paths:
Requested operations:
Reason:
Current owner/capability:
Expected base SHA:
Pre-edit hashes when applicable:
Generation/source path:
Compatibility impact:
Security impact:
Required validation:
Rollback:
Commit policy:
Stop conditions:
```

Rules:

- listing only a class or parent directory is insufficient;
- wording `write protected files` is insufficient;
- override applies only to named IDs/paths/operations;
- neighboring artifacts remain forbidden;
- read ≠ write ≠ delete ≠ stage ≠ commit ≠ push;
- Task Packet **cannot** override: secret disclosure; manual edit of generated output; released migration mutation; push prohibition; hidden baseline failures; scope expansion without new owner instruction;
- emergency exception requires explicit maintainer instruction and separate incident/rollback evidence, not model inference;
- this registry **does not** authorize stage/commit by itself.

## 5. Operation matrix

| Class | Inspect | Edit manually | Regenerate/append | Delete | Stage/commit |
|---|---|---|---|---|---|
| generated_output | YES if task requires | NO | YES via confirmed generator | only if Task Packet names delete | only if Task Packet explicitly authorizes those generated paths AND AGENTS gates |
| sensitive_secret | content NO; metadata-only if authorized | NO | NO | NO | NO |
| operational_critical | YES scoped | only exact Task Packet | N/A | only exact Task Packet | only Task Packet + AGENTS gates |
| migration_history | YES when adopted | released NO | append-only YES | released NO | only Task Packet + AGENTS gates |
| compatibility_contract | YES | only compatible change OR migration-authorized | N/A | only migration-authorized | only Task Packet + AGENTS gates |
| build_ephemeral | YES local | NO | YES via build | only owned+allowed cleanup | NO |

## 6. Required validation by class

- **generated_output:** exact generator command from Task Packet/repository policy; drift check; schema/contract validation; source→output trace.
- **sensitive_secret:** metadata-only check; redaction; secret scan when adopted (exact command from Task Packet/repository policy).
- **operational_critical:** syntax/static validation; dry run where available; rollback and environment isolation (exact commands from Task Packet/repository policy).
- **migration_history:** checksum; clean install; upgrade; rollback/forward-fix policy; supported versions after ADR (exact commands from Task Packet/repository policy).
- **compatibility_contract:** fixtures; consumer tests; parity/diff and migration plan (exact commands from Task Packet/repository policy).
- **build_ephemeral:** path ownership; assert no staged files under the pattern.

Do not invent repository commands.

## 7. Baseline inventory summary

| Status | Count |
|---|---:|
| existing | 32 |
| external-logical | 3 |
| policy-only | 6 |

| Class | Count |
|---|---:|
| generated_output | 5 |
| sensitive_secret | 5 |
| operational_critical | 18 |
| migration_history | 2 |
| compatibility_contract | 8 |
| build_ephemeral | 3 |

**Total rows:** 41. Counts are structural; per-file hashes are not maintained here.

Evidence for adoption lives in `docs/admin-cms/execplans/M0-06.md`.

## 8. Maintenance rules

- registry update is a separate policy task;
- feature tasks must not silently add/remove rows;
- newly introduced generated/workflow/migration paths require registry review;
- removed paths remain documented until removal/migration evidence is accepted;
- update `docs/admin-cms/INDEX.md` navigation when the registry path changes;
- never add secret values;
- never add current milestone/status prose;
- every row retains evidence in its adoption ExecPlan.
