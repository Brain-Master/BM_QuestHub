# ExecPlan INT-01-R0b — Normalize governance whitespace and refresh documentation manifest

## 0. Metadata

- Status: `DONE`
- Classification: see § Component classification
- Repository: `Brain-Master/BM_QuestHub` (`D:/WORK/01_Active_Projects/BM_QuestHub`)
- Branch: `cms-foundation/m0-m1-06`
- Base SHA: `aa45e868491435697d794214634cb02639c9665d`
- Final HEAD: `aa45e868491435697d794214634cb02639c9665d` (unchanged)
- Started at: `2026-07-21T09:02:00+03:00`
- Finished at: `2026-07-21T09:10:00+03:00`
- Task Packet: owner prompt `BM QuestHub CMS — Corrective Task Prompt INT-01-R0b`
- Agent: parent release/integration engineer (Composer)
- Active repository policy: root `AGENTS.md`
- Active ExecPlan policy: root `PLANS.md`
- Canonical template: `docs/admin-cms/02_delivery/25_EXECPLAN_TEMPLATE.md`
- Commit policy: `NO COMMIT`
- Push policy: `DO NOT PUSH`

## 1. Trigger / R38

INT-01-R0 BLOCKED because `docs/admin-cms/MANIFEST.sha256` embeds the SHA-256 for `README.md`. After trial-normalize, MANIFEST validation would be 31/32. R0 restored the three Markdown files and left only `docs/admin-cms/execplans/INT-01-R0.md` (SHA-256 `f5512b09ee78a75602ef81592b10796dfa30a2e5f0ff67755b513c00ac2938d1`). That historical record is not edited.

## 2. Objective

Re-apply the proven trailing-whitespace normalize to three accepted governance Markdown files, update only the `README.md` hash row in `MANIFEST.sha256`, recompute superseding governance and package fingerprints, and prove future Commit 1 passes `git diff --cached --check`.

## 3. Non-goals

- INT-01 four commits / push / draft PR / INT-01-R1;
- rewrite historical ExecPlans including INT-01-R0;
- weaken whitespace checks;
- reflow Markdown / change EOL/BOM/final newline;
- reorder or regenerate MANIFEST broadly;
- edit INDEX / PROTECTED_ARTIFACTS / ADR_BACKLOG;
- M1-07 / M1-09 / M2 / CI.

## 4. Authorized / forbidden paths

### Write

| Path | Classification |
|---|---|
| `docs/admin-cms/BASELINE_COMMANDS.md` | `repository_governance_document` |
| `docs/admin-cms/README.md` | `repository_governance_document` |
| `docs/admin-cms/execplans/M0-06.md` | `repository_execution_record` / historical bytes normalized |
| `docs/admin-cms/MANIFEST.sha256` | `repository_package_manifest` |
| `docs/admin-cms/execplans/INT-01-R0b.md` | `repository_execution_record` / corrective integration record |

### Forbidden

All other paths, including `INT-01-R0.md`, other ExecPlans, INDEX, protected registry, apps, tooling, workflows, external dirty trees.

## 5. Identity

```text
branch: cms-foundation/m0-m1-06
HEAD: aa45e868491435697d794214634cb02639c9665d
origin/main: aa45e868491435697d794214634cb02639c9665d
commits ahead: 0
remote branch: absent
index: empty
fnm 1.39.0 / node v22.23.1 / npm 10.9.8
```

## 6. Existing backups

| Backup | Path | Status |
|---|---|---|
| INT-01 | `D:/WORK/01_Active_Projects/BM_QuestHub_INT-01_backup_20260721-081942` | verified unchanged |
| R0 | `D:/WORK/01_Active_Projects/BM_QuestHub_INT-01-R0_backup_20260721-083757` | verified unchanged |
| R0b | `D:/WORK/01_Active_Projects/BM_QuestHub_INT-01-R0b_backup_20260721-090509` | created; originals byte-identical |

## 7. Preflight

Identity/tooling matched. INT-01-R0.md present. INT-01-R0b.md absent before write. Index empty. Pre-state:

| Artifact | SHA-256 | Match |
|---|---|---|
| BASELINE | `c02b260b91ee0041a1c5afd1338e0de623ac3132c4a5c1ad0bde4217793a95d5` | original |
| README | `837efc5e36d934b0ef7a85aaaf9284c4533b8973b2f2eaf348568339089e157d` | original |
| M0-06 | `5dac5eb9b464ce693f68b2f381e561ede06746f52193312e89646088a0575548` | original |
| MANIFEST | `8d8f549b7e1abc1738fac44f8f0b74049d85868a24e6037c2b6578d6778d7782` | original |
| INT-01-R0.md | `f5512b09ee78a75602ef81592b10796dfa30a2e5f0ff67755b513c00ac2938d1` | frozen |
| MANIFEST validate | 32/32 | PASS |
| Governance ref | `d9c845813cec9fef93a35c09635554c36b9671e3786c4db41ad5d9618be4dd01` | PASS |
| Package FP (repo-relative 33 files) | `da2737ed3c8e1a754e0e0159fe82d4ce74e8a2e4a25f82d8dea8d6bab3d92b6e` | PASS |

## 8. R0 frozen evidence

Trial hashes from INT-01-R0 (must be reproduced):

| File | Trial SHA-256 |
|---|---|
| BASELINE | `dff5ddbb5d59ff6cc0a4630f078568ab1ccf709b568ada4e13c0404d5530e93a` |
| README | `8c7ec9aec6e0b63c5fa83d782b629a0e4ab832aade06ab4acd29be189026681d` |
| M0-06 | `10961523c9791d6a66d04d91753098e6f95f11dd4fc494ceba56578f3a80a483` |

Trial governance: `556329b7b8d1627ca003e57f5cc7fa286979180579213719d5284ad2ebcd7b24`.

Incomplete trial package FP (README changed, MANIFEST stale; package-relative miscompute also recorded historically): `aff08c2b…` — **not reused**.

## 9. Manifest audit

- Format: `sha256sum` lines `HASH␠␠PATH` (two spaces); LF; no BOM; final newline.
- Entries: 32 content hashes. Manifest does **not** list itself as a content row; package fingerprint adds `docs/admin-cms/MANIFEST.sha256` as the 33rd file.
- Paths: package-relative inside the file; fingerprint uses repository-relative `docs/admin-cms/<path>` (M0-02).
- Coverage of corrected files:
  - `README.md`: **listed**
  - `BASELINE_COMMANDS.md`: not listed
  - `execplans/M0-06.md`: not listed
- Old README row (verbatim):

```text
837efc5e36d934b0ef7a85aaaf9284c4533b8973b2f2eaf348568339089e157d  README.md
```

## 10. Semantic whitespace audit reference

R0 audit: 54 accidental trailing whitespace lines; 0 intentional Markdown hard breaks. Independently re-inventoried before normalize: 50 + 3 + 1 = 54.

## 11. Exact normalization

Algorithm: `/[ \t]+(?=\r?\n|$)/g` via Node 22 byte-aware write.

| File | Corrected lines | New SHA-256 | Trial match |
|---|---:|---|---|
| BASELINE | 50 | `dff5ddbb5d59ff6cc0a4630f078568ab1ccf709b568ada4e13c0404d5530e93a` | yes |
| README | 3 | `8c7ec9aec6e0b63c5fa83d782b629a0e4ab832aade06ab4acd29be189026681d` | yes |
| M0-06 | 1 | `10961523c9791d6a66d04d91753098e6f95f11dd4fc494ceba56578f3a80a483` | yes |

EOL/BOM/final-newline/line counts preserved; non-trailing bytes unchanged; fixed bytes equal normalize(R0b backup originals).

## 12. Manifest row updates

Only README hash token replaced. Row order, separators, path text, EOL, BOM, final newline, and all other hashes preserved.

New README row:

```text
8c7ec9aec6e0b63c5fa83d782b629a0e4ab832aade06ab4acd29be189026681d  README.md
```

Validator: **32/32 PASS**.

## 13. Old/new file hashes

| Path | Old | New |
|---|---|---|
| BASELINE | `c02b260b91ee0041a1c5afd1338e0de623ac3132c4a5c1ad0bde4217793a95d5` | `dff5ddbb5d59ff6cc0a4630f078568ab1ccf709b568ada4e13c0404d5530e93a` |
| README | `837efc5e36d934b0ef7a85aaaf9284c4533b8973b2f2eaf348568339089e157d` | `8c7ec9aec6e0b63c5fa83d782b629a0e4ab832aade06ab4acd29be189026681d` |
| M0-06 | `5dac5eb9b464ce693f68b2f381e561ede06746f52193312e89646088a0575548` | `10961523c9791d6a66d04d91753098e6f95f11dd4fc494ceba56578f3a80a483` |
| MANIFEST | `8d8f549b7e1abc1738fac44f8f0b74049d85868a24e6037c2b6578d6778d7782` | `90d5707c9fa038715c2c6bc13f663659c11ebd104798dab209debdbcdae96573` |

## 14. Fingerprints

| Fingerprint | Old | New / unchanged |
|---|---|---|
| Governance reference | `d9c845813cec9fef93a35c09635554c36b9671e3786c4db41ad5d9618be4dd01` | `556329b7b8d1627ca003e57f5cc7fa286979180579213719d5284ad2ebcd7b24` |
| M0 package (final) | `da2737ed3c8e1a754e0e0159fe82d4ce74e8a2e4a25f82d8dea8d6bab3d92b6e` | `a4429957fb665ad0ccb3a293728f3424e6e41d28250d08825044819878f0c65f` |
| Incomplete trial package | `aff08c2b…` | not used |
| M0-12 primary | `f5f95872d315bf2ba0bec1724442e94c22a420f9fbf8fcf7daafbfe5e098da50` | unchanged |
| M1-05 primary | `e1a5e591efbf5419f8ed08054cc5f379f84abcb2da9a6ca9261e215e4f9355aa` | unchanged |
| M1-06 primary | `0ed8b7ba536a29d58c69ab9ab04d44a43e36537e60196e365d83c9bdfe3b91d6` | unchanged |
| M1-04 primary | `26dc2a053f92173f416df51e528608a007d38b825f4e84aa228fc1209076d6d3` | historical; product artifacts unchanged |
| M0-06 | historical ExecPlan bytes normalized (1 trailing WS); historical freeze fingerprints remain immutable records |

## 15. Historical-record policy

Historical ExecPlans (including INT-01-R0, M0-02..M0-12, M1-*) remain immutable. INT-01-R0b is the superseding evidence for whitespace + MANIFEST refresh. Future INT-01-R1 must use the new governance and package fingerprints above.

## 16. Commit 1 manifest impact

Future Commit 1 includes `AGENTS.md`, `PLANS.md`, and `docs/admin-cms/**` (including INT-01-R0.md and INT-01-R0b.md). External dirty paths excluded. Staged `--check` proof recorded in Validation.

## 17. Validation

| Gate | Result |
|---|---|
| Trial hashes reproduced | PASS |
| MANIFEST 32/32 | PASS |
| Governance FP = trial | PASS |
| Final package FP recorded (not incomplete) | PASS |
| M0-12 / M1-05 / M1-06 unchanged | PASS |
| Broken relative links in docs/admin-cms | 0 |
| Commit 1 staged `--check` | PASS then unstaged |
| Secret scan | PASS (Node 22) |
| Index empty / HEAD unchanged | PASS |
| External dirty FP | `3281a56b987716f5f4d79a6b8d90e982feb9630c7e29074c0ba83353d7dc49af` |

## 18. Acceptance matrix

B1–B66: PASS (see final report).

## 19. Freeze

Primary:

- BASELINE `dff5ddbb5d59ff6cc0a4630f078568ab1ccf709b568ada4e13c0404d5530e93a`
- README `8c7ec9aec6e0b63c5fa83d782b629a0e4ab832aade06ab4acd29be189026681d`
- M0-06 `10961523c9791d6a66d04d91753098e6f95f11dd4fc494ceba56578f3a80a483`
- MANIFEST `90d5707c9fa038715c2c6bc13f663659c11ebd104798dab209debdbcdae96573`

Corrected-artifact fingerprint (4 primary paths, repo-relative sorted path NUL bytes NUL): recorded at freeze time in final report after ExecPlan SHA.

Governance reference: `556329b7b8d1627ca003e57f5cc7fa286979180579213719d5284ad2ebcd7b24`

Package fingerprint: `a4429957fb665ad0ccb3a293728f3424e6e41d28250d08825044819878f0c65f`

## 20. Review

Independent subagent unavailable; parent performed a separate read-only governance-manifest-correction review.

Verdict:

```text
APPROVE
```

## 21. Git actions

```text
Staged: NO
Committed: NO
Pushed: NO
PR: NO
```

## 22. Final status

```text
INT-01-R0b: DONE / APPROVE
```

## 23. Component classification

| Artifact | Classification |
|---|---|
| BASELINE / README | `repository_governance_document` |
| M0-06.md | `repository_execution_record` / historical bytes normalized |
| MANIFEST.sha256 | `repository_package_manifest` |
| INT-01-R0b.md | `repository_execution_record` / corrective integration record |
