# Data backups (local only)

Pre-migration snapshots of `apps/web/content` and `apps/web/data` are stored here
before unified data model V2 work. These directories are **not** committed to git.

## Latest backup

- Path: `backups/data-pre-v2-migration-20260519-033348/`
- Created: 2026-05-19 (branch `feat/unified-data-model-v2`)
- Contents: full copy of `content/`, `data/`, and `docs/data/` at migration start

To restore locally:

```powershell
Copy-Item -Recurse -Force backups/data-pre-v2-migration-20260519-033348/content apps/web/content
Copy-Item -Recurse -Force backups/data-pre-v2-migration-20260519-033348/data apps/web/data
```
