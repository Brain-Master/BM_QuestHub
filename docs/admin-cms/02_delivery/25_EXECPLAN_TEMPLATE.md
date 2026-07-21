# ExecPlan `<TASK_ID>` — `<TITLE>`

## 0. Metadata

- Status: `PLANNING`
- Repository:
- Branch:
- Base SHA:
- Started at:
- Task Packet path:
- Agent:

## 1. Objective

Одно предложение.

## 2. Non-goals

- ...

## 3. Authorized paths

### Read

- ...

### Write

- ...

### Forbidden/protected

- ...

## 4. Preflight evidence

```text
Command:
Exit:
Output summary:
```

- Worktree interpretation:
- Tool versions:
- Baseline status:

## 5. Current architecture

- Entry point:
- Data flow:
- Existing contracts:
- Relevant tests:
- Constraints:

## 6. Read-only audit A

### Findings

- path:line — finding

### Accepted/rejected

- ...

## 7. Read-only audit B

### Findings

- path:line — finding

### Accepted/rejected

- ...

## 8. Component classification

| Component | Classification | Rationale |
|---|---|---|
| ... | product_domain | ... |

## 9. UX contract

- User goal:
- Desired feeling:
- Save/publish semantics:
- Loading:
- Empty:
- Error:
- Permission:
- Conflict:
- Keyboard:
- Responsive:
- Referenced scenarios:

## 10. Security analysis

- Identity:
- Authorization:
- Input bounds:
- Secret exposure:
- Logging:
- SSRF/upload/CSRF where relevant:
- Audit event:

## 11. Implementation plan

1. ...
2. ...
3. ...

Каждый пункт должен быть меньше всей task и не расширять scope.

## 12. Negative paths

- ...

## 13. Test plan

| Layer | Behavior | Exact test/command |
|---|---|---|
| Unit | ... | ... |
| Component | ... | ... |
| Integration | ... | ... |
| A11y | ... | ... |

## 14. Acceptance matrix

| ID | Criterion | Evidence | Status |
|---|---|---|---|
| A1 | ... | ... | NOT RUN |

## 15. Validation log

### Run 1

- Time:
- Command:
- Exit:
- Result:
- Evidence:

Не удалять failed runs.

## 16. Failure history

| Time | Failure | Classification | Action |
|---|---|---|---|

## 17. Scope changes

| Time | Requested change | Authorized by | Result |
|---|---|---|---|

## 18. Freeze record

- Status: `NOT FROZEN`
- HEAD:
- Changed paths:
- `git diff --check`:
- Algorithm:
- Fingerprint:
- Time:
- Statement: `No edits after freeze`.

## 19. Independent review

### Findings

- ...

### Verdict

`PENDING`

## 20. Staging and commit

- Commit authorized: yes/no
- Staged paths:
- Secret scan:
- Staged validation:
- Commit subject:
- Commit SHA:
- Push: no

## 21. Final status

- Outcome:
- Remaining risks:
- Excluded work:
- Final git status:
- Next task started: `NO`
