# Durable lead intake

POST https://space.b-master.pro/api/leads saves a receipt and three independent channel jobs in one SQLite transaction. HTTP202 means saved, not delivered to all channels. Existing Yandex URL forwards to this endpoint for open browser tabs. Schedules continue loading from S3 unchanged.

The isolated `brainmaster-leads` Compose project runs Node22 with a persistent private `/home/deploy/brainmaster-leads/data` directory. Source is read-only. Private receiver.json is transferred from the existing receiver config without printing credentials. No host ports or public administration routes. MAX needs MAX_BOT_TOKEN and MAX_ADMIN_USER_ID; pending jobs remain not_configured until supplied.

Worker states: pending, sending, confirmed, retry (before send or definitive401/403 rejection), uncertain (possibly accepted), not_configured. Sending on restart becomes uncertain. Never blindly reset uncertain jobs: Sheets reads column C to confirm a receipt; absence does not authorize another append. Telegram/MAX uncertainty requires manual reconciliation. `confirmed` means API accepted, not administrator read.

Operational checks, from the runtime directory on the VPS:

```
docker compose ps
docker compose exec -T receiver node /app/lead-service/check.cjs
docker compose exec -T receiver node -e 'const {DatabaseSync}=require("node:sqlite");const d=new DatabaseSync("/data/leads.sqlite",{readOnly:true});console.log(d.prepare("SELECT channel,state,count(*) AS count FROM jobs GROUP BY channel,state").all());d.close()'
df -h ./data
```

Do not instantiate LeadStore from a second process: construction performs restart recovery. Use read-only DatabaseSync for administrative inspection. No personal fields in logs/status output. Main process uses flock to enforce one worker. Daily SQLite online backups retain seven copies in data/backups, permissions0700/0600. These are local recovery copies; host loss still requires an independently configured off-host backup. Preserve the whole data directory during releases and rollback.

Deployment: verify pinned image, exact source hashes, downstream read-only checks and health. Back up the existing Caddy snippet; validate complete configuration then gracefully reload under proxy/.deploy.lock. Only space host's exact /api/leads route changes. Verify pulse anonymous authentication and publications fallback. Only then replace the legacy Yandex handler with forwarder.js. Frontend maps the exact legacy URL to the new endpoint and persists an opaque submission ID for retries.

Rollback must preserve the SQLite store. Restore Caddy snippet only if routing to VPS is being intentionally disabled; open new frontend tabs still use the VPS endpoint. Prefer forward repair. Restore legacy Yandex code by creating a version from the original immutable version with its full config, only after reconciling pending VPS jobs; reverting to independent old processing without reconciliation risks duplicate delivery. Do not invoke unrelated diagnostic functions or restart neighboring containers.
