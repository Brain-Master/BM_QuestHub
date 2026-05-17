# Execution Log

This journal records meaningful work in the repository: what changed, why it changed, which files were touched, which decisions were made, and what remains open.

## Storage

- Journal file: `docs/execution-log.md`.
- New entries are added at the top, directly under `## Entries`.
- Keep entries factual and concise. Link to detailed docs instead of duplicating them.

## Entry Format

Use this template for each entry:

```markdown
### YYYY-MM-DD HH:MM TZ - Short Title

**Goal:** One sentence describing the requested outcome.

**Completed:**
- Concrete action or deliverable.

**Changed Files:**
- `path/to/file`: short reason.

**Decisions:**
- Decision and rationale.

**Validation:**
- Check or command result.

**Open Items:**
- Remaining blocker, external dependency, or `None`.
```

## Entries

### 2026-05-17 17:06 UTC+3 - Stable Dev Server Restart

**Goal:** Prevent parallel Next dev servers from corrupting the shared dev output and provide a reliable restart command for port 3000.

**Completed:**
- Pinned the hosted Next dev script to port 3000 and added a preflight port check so `make dev-host` does not silently fall back to port 3001.
- Added `make dev-restart` to stop the process listening on port 3000 and start the hosted dev server again on the same port.
- Added cross-platform helper scripts for checking and reclaiming the dev port, including a Windows shell-based restart path to avoid `spawn EINVAL`.

**Changed Files:**
- `Makefile`: documents and exposes the `dev-restart` target.
- `package.json`: adds the root `dev:restart` script.
- `apps/web/package.json`: pins `dev:host` to port 3000 behind the port-free check.
- `scripts/assert-port-free.mjs`: fails fast when port 3000 is already occupied.
- `scripts/restart-next-dev.mjs`: reclaims port 3000 and starts the Next dev server.
- `docs/execution-log.md`: records the dev-server workflow change.

**Decisions:**
- Keep normal `dev-host` non-destructive: it reports an occupied port instead of killing a process automatically.
- Make restart explicit through `dev-restart` so reclaiming port 3000 is intentional.

**Validation:**
- `node --check scripts/assert-port-free.mjs`
- `node --check scripts/restart-next-dev.mjs`
- `node scripts/assert-port-free.mjs 3999`
- `make -n dev-host`
- `make -n dev-restart`
- IDE diagnostics reported no linter errors for the helper scripts and package/make changes.

**Open Items:**
- None.

### 2026-05-17 05:01 UTC+3 - Execution Journal

**Goal:** Create a project execution journal and global guidance for maintaining it across projects.

**Completed:**
- Added `docs/execution-log.md` as the canonical project journal.
- Defined the journal entry format for goals, completed work, changed files, decisions, validation, and open items.
- Added a global Cursor rule requiring execution-log maintenance and pre-planning review across projects.
- Linked the journal from the project documentation index.

**Changed Files:**
- `docs/execution-log.md`: adds the journal location, format, and initial entry.
- `docs/README.md`: links the execution journal from the documentation index.
- `C:\Users\Xipsin\.cursor\rules\execution-log.mdc`: adds the global always-on execution-log rule for all projects.

**Decisions:**
- Store the project journal under `docs/` because it is durable project documentation, not tool-local state.
- Use reverse chronological entries so the latest context is easiest to find before planning or implementation.
- Keep the rule in the global Cursor rules directory so it applies across projects.

**Validation:**
- Read-back confirmed the project journal and global rule were created with the expected structure.
- IDE diagnostics reported no linter errors for the updated journal, docs index, or global rule.

**Open Items:**
- None.
