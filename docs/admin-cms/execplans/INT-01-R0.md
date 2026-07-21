# ExecPlan INT-01-R0 — Normalize trailing whitespace in accepted governance docs

## 0. Metadata

- Status: `BLOCKED`
- Classification: see § Component classification
- Repository: `Brain-Master/BM_QuestHub` (`D:/WORK/01_Active_Projects/BM_QuestHub`)
- Branch: `cms-foundation/m0-m1-06`
- Base SHA: `aa45e868491435697d794214634cb02639c9665d`
- Final HEAD: `aa45e868491435697d794214634cb02639c9665d` (unchanged)
- Started at: `2026-07-21T08:36:00+03:00`
- Finished at: `2026-07-21T08:40:00+03:00`
- Task Packet: owner prompt `BM QuestHub CMS — Corrective Task Prompt INT-01-R0`
- Agent: parent release/integration engineer (Composer)
- Active repository policy: root `AGENTS.md`
- Active ExecPlan policy: root `PLANS.md`
- Canonical template: `docs/admin-cms/02_delivery/25_EXECPLAN_TEMPLATE.md`
- Commit policy: `NO COMMIT`
- Push policy: `DO NOT PUSH`
- Stop condition: `R38` — active `MANIFEST.sha256` embeds old `README.md` hash and is outside authorized write paths

## 1. Trigger

INT-01 stopped before Commit 1 because `git diff --cached --check` reported trailing whitespace:

| Path | Trailing-whitespace lines |
|---|---:|
| `docs/admin-cms/BASELINE_COMMANDS.md` | 50 |
| `docs/admin-cms/README.md` | 3 |
| `docs/admin-cms/execplans/M0-06.md` | 1 |

Total: 54 lines. Commits 2–4 were clean. Weakening `--check` was rejected.

## 2. Objective

Remove only trailing ASCII spaces/tabs from the three files, recompute affected governance fingerprints, prove future Commit 1 passes `git diff --cached --check`, and leave no staging/commit/push/PR.

## 3. Non-goals

- INT-01 four commits / push / draft PR;
- rewrite historical ExecPlan hash tables;
- weaken whitespace checks;
- reflow Markdown / change EOL/BOM/final newline;
- M1-07 / M1-09 / M2 / CI;
- edit product source/tests/tooling.

## 4. Authorized / forbidden paths

### Write (authorized)

| Path | Classification |
|---|---|
| `docs/admin-cms/BASELINE_COMMANDS.md` | `repository_governance_document` |
| `docs/admin-cms/README.md` | `repository_governance_document` |
| `docs/admin-cms/execplans/M0-06.md` | `repository_execution_record` / historical bytes normalized |
| `docs/admin-cms/execplans/INT-01-R0.md` | `repository_execution_record` / corrective integration record |

### Forbidden (selected)

All other paths, including `docs/admin-cms/MANIFEST.sha256`, `PACKAGE_INFO.json`, other docs, apps, Makefile, scripts, tools, workflows, `.cursor/**`, `.vscode/**`, source package dir.

## 5. Current branch / base

```text
branch: cms-foundation/m0-m1-06
HEAD: aa45e868491435697d794214634cb02639c9665d
origin/main: aa45e868491435697d794214634cb02639c9665d
commits ahead: 0
remote branch cms-foundation/m0-m1-06: absent
index: empty
```

## 6. Existing INT-01 backup

Path: `D:/WORK/01_Active_Projects/BM_QuestHub_INT-01_backup_20260721-081942`

Verified present and unchanged for key artifacts:

| Artifact | SHA-256 |
|---|---|
| `tracked-working-tree.patch` | `92d97a1dabbbaa8b48dedfe4c0a9a169c2d9aa72c63c50fbf2b22ccf5d28e011` |
| `intended-untracked.zip` | `7716dc0782f369c80c7845807315b9ffda4189d689d6f71adf1c974d0cb1eed1` |
| `external-fingerprint.txt` | `cd53883838060ce74e4b7023faafeca648a6ae67c24f49f6091c893ffcf36412` |

Not modified/deleted by INT-01-R0.

## 7. Preflight

```text
root: D:/WORK/01_Active_Projects/BM_QuestHub
remote: https://github.com/Brain-Master/BM_QuestHub.git
branch/HEAD: cms-foundation/m0-m1-06 / aa45e868491435697d794214634cb02639c9665d
fnm: 1.39.0
node: v22.23.1 (fnm multishell)
npm: 10.9.8
make: GNU Make 4.4.1
git: 2.42.0.windows.2
index: empty
```

## 8. Semantic hard-break audit

Inventoried all 54 lines with path, line number, trail count, and content preview.

Findings:

- BASELINE lines 210–216, 221–227, 232–238, 243–249, 254–260, 265–271: labeled fields (`**Status:**`, `**Evidence:**`, …) each complete; next line is another field or blank — not prose continuation.
- BASELINE lines 276–283: complete numbered list items; next line is next item.
- README lines 3–5: metadata labels (`**Версия:**`, `**Дата:**`, `**Целевой репозиторий:**`) — complete fields.
- M0-06 line 143: finished sentence ending with period.

Verdict: all 54 occurrences are **accidental**. No intentional Markdown hard break requiring `<br>` substitution.

## 9. Exact 54-line inventory

Stored outside repo:

`D:/WORK/01_Active_Projects/BM_QuestHub_INT-01-R0_backup_20260721-083757/trailing-whitespace-inventory.txt`

Counts: BASELINE 50, README 3, M0-06 1, total 54.

## 10. Original file hashes

| Path | SHA-256 | Bytes | EOL | BOM | Final NL |
|---|---|---:|---|---|---|
| `docs/admin-cms/BASELINE_COMMANDS.md` | `c02b260b91ee0041a1c5afd1338e0de623ac3132c4a5c1ad0bde4217793a95d5` | 20472 | CRLF | no | yes |
| `docs/admin-cms/README.md` | `837efc5e36d934b0ef7a85aaaf9284c4533b8973b2f2eaf348568339089e157d` | 9057 | LF | no | yes |
| `docs/admin-cms/execplans/M0-06.md` | `5dac5eb9b464ce693f68b2f381e561ede06746f52193312e89646088a0575548` | 12543 | CRLF | no | yes |

## 11. Byte-preserving normalization method

One-off Node 22 script outside the repository:

1. read file bytes;
2. decode UTF-8 (BOM preserved if present);
3. replace `/[ \t]+(?=\r?\n|$)/g` only;
4. encode UTF-8;
5. write same path.

Trial normalize proved (then restored after STOP):

| Path | New SHA-256 | Lines corrected | Non-trailing changed | EOL/BOM/final NL |
|---|---|---:|---|---|
| BASELINE | `dff5ddbb5d59ff6cc0a4630f078568ab1ccf709b568ada4e13c0404d5530e93a` | 50 | no | preserved |
| README | `8c7ec9aec6e0b63c5fa83d782b629a0e4ab832aade06ab4acd29be189026681d` | 3 | no | preserved |
| M0-06 | `10961523c9791d6a66d04d91753098e6f95f11dd4fc494ceba56578f3a80a483` | 1 | no | preserved |

`equalsNormalizedOriginal`: true for all three.

## 12. Diff proof

Trial: line counts unchanged (293/150/289); only trailing ASCII space/tab removed; fixed bytes equal `normalize(original backup bytes)`.

After STOP: three files restored byte-for-byte to original hashes (MANIFEST 32/32 again).

## 13. Fingerprint impact analysis

### Old → new (trial normalize; not left applied)

| Fingerprint | Old | New (trial) | Impact |
|---|---|---|---|
| File BASELINE | `c02b260b…3a95d5` | `dff5ddbb…530e93a` | would change |
| File README | `837efc5e…089e157d` | `8c7ec9ae…026681d` | would change |
| File M0-06 | `5dac5eb9…575548` | `10961523…80a483` | would change |
| Governance ref (AGENTS+PLANS+INDEX+PROTECTED+BASELINE+SECRET) | `d9c84581…8be4dd01` | `556329b7…ebcd7b24` | would change (BASELINE only) |
| M0-12 primary (ADR_BACKLOG+INDEX) | `f5f95872…098da50` | unchanged | no |
| M0 package FP (33 package files) | `da2737ed…3d92b6e` | `aff08c2b…926ba5e2` | would change |
| M1-05 primary | `e1a5e591…9355aa` | unchanged | no |
| M1-06 primary | `0ed8b7ba…e3b91d6` | unchanged | no |

### Active machine-readable manifest

`docs/admin-cms/MANIFEST.sha256` line for `README.md` embeds:

```text
837efc5e36d934b0ef7a85aaaf9284c4533b8973b2f2eaf348568339089e157d  README.md
```

After README normalize, MANIFEST verify would be 31/32 FAIL. Updating `MANIFEST.sha256` is required for a consistent package, but that path is **outside** INT-01-R0 authorized writes.

`M0-12-R1.md`: absent.

M0-06 historical primary/combined fingerprints: historical immutable records of earlier bytes; not rewritten. M0-06.md is not in package MANIFEST and not in M0-12 primary set.

## 14. Historical-record policy

Historical ExecPlans remain immutable records of bytes reviewed then.

INT-01-R0 (this file) records the superseding mapping and STOP.

Future INT-01-R0b / INT-01-R1 must use the new governance fingerprint and new package fingerprint after authorized MANIFEST update.

## 15. Future INT-01-R1 requirements (blocked until R0 completes)

Cannot authorize INT-01-R1 until whitespace correction is accepted with consistent MANIFEST.

## 16. Validation

| Check | Result |
|---|---|
| Semantic audit 54 accidental | PASS |
| Trial normalize byte proof | PASS |
| Active MANIFEST consistency after README change | **FAIL / STOP R38** |
| Commit 1 staged `--check` | NOT RUN (correction not accepted) |
| Secret scan / product gates | NOT required after restore; product bytes unchanged |
| Three files restored | PASS |
| External dirty FP | `3281a56b987716f5f4d79a6b8d90e982feb9630c7e29074c0ba83353d7dc49af` MATCH |
| Index empty / HEAD unchanged | PASS |

## 17. Acceptance matrix

| ID | Result |
|---|---|
| R1–R18 | PASS |
| R19–R29 | PASS (trial) then restored |
| R30 | PASS (this ExecPlan) |
| R31 | PASS (no trailing WS in this file) |
| R32–R37 | PASS (analysis complete) |
| R38 | **FAIL** — MANIFEST must update; unauthorized |
| R39–R40 | PASS (policy documented) |
| R41–R52 | FAIL / N/A (correction not accepted) |
| R53–R58 | PASS (restored; HEAD/branch unchanged) |
| R59–R60 | FAIL (no APPROVE freeze of corrected artifacts) |
| R61–R64 | PASS (no commit/push/PR; no next roadmap) |

## 18. Freeze

Corrected artifacts were **not** frozen as accepted. Trial hashes recorded above. Working tree restored to pre-R0 original hashes for the three files.

This ExecPlan is the only lasting repository write from INT-01-R0.

## 19. Review

Independent subagent unavailable; parent performed a separate read-only governance-whitespace-correction review.

Verdict: **BLOCKED** (not APPROVE). Blocking finding: R38 active `MANIFEST.sha256` outside authorized paths.

## 20. Git actions

```text
Staged: NO
Committed: NO
Pushed: NO
PR: NO
HEAD unchanged
branch unchanged
```

## 21. Final status

```text
INT-01-R0: BLOCKED / R38
```

Required next task:

```text
INT-01-R0b — Expand authorized writes to update MANIFEST.sha256
  after README trailing-whitespace normalize; record superseding
  package fingerprint; re-apply proven normalize to three files;
  complete Commit 1 --check proof.
```

## 22. Component classification

| Artifact | Classification |
|---|---|
| `BASELINE_COMMANDS.md` | `repository_governance_document` |
| `README.md` | `repository_governance_document` |
| `M0-06.md` | `repository_execution_record` / historical bytes normalized |
| `INT-01-R0.md` | `repository_execution_record` / corrective integration record |

## 23. R0 correction backup

`D:/WORK/01_Active_Projects/BM_QuestHub_INT-01-R0_backup_20260721-083757`

Contains originals (byte-identical pre-edit), inventory, pre-hashes, normalize-report, STOP analysis.
