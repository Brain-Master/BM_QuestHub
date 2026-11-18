# MOS capacity worker

Runs the existing bundled `mos-live-capacity-handler` on a five-minute UTC schedule. First execution is at the next boundary plus two seconds. One child at a time, 290-second deadline, then SIGTERM/SIGKILL. Graceful container stop waits for the active child. A crash does not bypass the S3 lease or its expiration.

Package `index.js` with `node scripts/deploy-mos-live-capacity.mjs --package`; do not edit the generated bundle. A release directory contains `index.js`, `runner.cjs`, and `manifest.json` with SHA-256 values for both files. Startup verifies those hashes.

Use an official Node22 image pinned by digest, a nonroot user, read-only filesystem, no ports, no Docker socket, dropped capabilities, bounded resources/logs and a small `/tmp` tmpfs. Mount only the release read-only and a private JSON file at `/run/secrets/mos-s3.json`. Credentials are read by the child and never passed through Docker environment, argv or logs.

The private JSON contains exactly `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET` (`bm-questhub`) and `MOS_AVAILABILITY_ENABLED` (`1`). Never commit it. The existing handler writes only its availability sidecar and lease; it does not modify the course source or submit applications.

`--dry-run` reads without writes; `--schedule` publishes using the existing source/identity validation, CAS and lease. `--health` checks scheduler heartbeat only; it is not evidence that every MOS card refreshed. Coverage and dated errors remain in S3.

Cutover requires a successful remote dry-run, pausing/draining the old cloud timer, an expired lease, reviewed release hashes, and verification of two automatic published cycles. Never run two publishers deliberately. Rollback stops only this worker, waits for child/lease drain, then resumes the saved cloud timer. Existing server projects, containers and networks are outside this service's scope.
