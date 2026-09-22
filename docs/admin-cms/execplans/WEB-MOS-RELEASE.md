# WEB-MOS-RELEASE — publish the approved MOS registration flow

## Objective and authority

2026-09-22, Europe/Moscow. Owner: “Давай на сайт выложим изменения”.
Publish the already reviewed 15-second smooth popup, compact single-CTA cards,
optional contact form and anonymous departure notifications to b-master.pro.
This instruction supersedes the local-only/no-commit boundary of the three
preceding WEB-MOS ExecPlans for this package only. No next feature is included.

## Preflight and classification

Repo: /home/xipsin/projects/BM_QuestHub/design-previews/schedule-audit-2026-09-09/repo.
Branch fix/schedule-data-and-venues-2026-09-09; HEAD
917b656a9bfc9aa5d89636e993673344b6ef4680. Fresh remote main and Timeweb live commit
23493781c99982a6f3693a54af12cee7ac2054fc; HEAD/main trees identical.
43 dirty primary files match the previous frozen/reviewed fingerprint:
005ac077c7c67aae9a191108a77507b2b4a8a19e061e1decc05eac518410b12e.
The manifest is in WEB-MOS-TRANSITION.md; all WEB-MOS ExecPlans are execution
records excluded from that product fingerprint. No unrelated dirty files.
Governance AGENTS.md, PLANS.md, apps/web/AGENTS.md and protected registry read.
Node22.23.1. git diff --check PASS; current backend tests38PASS.
Product-domain release, with narrowly scoped operational writes; no redesign.

## Exact scope and protected capabilities

Stage only the43 reviewed primary paths plus WEB-MOS-DIRECT-BOOKING.md,
WEB-MOS-TRANSITION.md, WEB-MOS-COMPACT.md and this release record.
PA-COMPAT-007: approved shared public booking behavior only.
PA-BUILD-002/003: generated local build artifacts only via existing checks.
PA-OPS-010: existing Timeweb app195536; main auto-deploy, preserve s3/s3 modes,
credentials, environment, deployment settings and all data.
Yandex operational target only bm-lead-receiver/d4ellekng389grh5rck4.
Baseline version d4e9dif2lh8eeurptq9a, ACTIVE/$latest, nodejs22/index.handler,
128MiB,30s,concurrency1; log folder b1gspr48onc7vlv9elco.
Preserve all nine existing environment values and every other runtime setting.
Package exactly index.js, mos-booking-click.js, package.json, no dependencies.
No S3/Sheets/schedule writes, sync-controller changes, workflow/env edits,
credential rotation, other cloud functions, forced push, reset or unrelated work.

## Release plan and audit gates

1. Two independent readonly release audits: git/CI/scope and receiver/runtime/
   rollback/security. Parent alone edits; no agent production mutations.
2. Build a minimal temporary REST helper and ZIP under
   /tmp/questhub-mos-release-M96fN3. Capture yc.exe IAM token and existing cloud
   environment privately in memory; never secrets in argv, files, logs or PR.
   Read baseline and latest immediately before POST; stop on drift/unknown keys.
   Journal nonsecret write intent before a single createVersion request. On an
   uncertain response, reconcile version/operation metadata; do not retry blindly.
   Preserve configuration explicitly. Inspect dry-run, package membership/hash.
3. Revalidate fingerprints/protected files, unit/browser checks and secret scan;
   freeze product plus helper; fresh independent APPROVE before staging/writes.
4. Explicitly stage reviewed paths, staged diff/secret checks, commit and push
   current branch. Create/attach one PR to main; wait for required CI checks.
5. Receiver first: createVersion ZIP publishes new $latest. Wait for ACTIVE,
   compare configuration to baseline and verify safe GET/OPTIONS. Only after
   identifying the new active version, send rejected event-branch probes that
   cannot dispatch Telegram/Sheets/n8n/ops. No synthetic valid event or form.
6. After CI and receiver checks, merge with exact expected head SHA. Existing
   Timeweb auto-deploy consumes main; verify exact merge SHA and successful
   deployment. Do not manually trigger a duplicate deployment or change modes.
7. Verify public routes and production browser UI with real read-only data,
   intercepting all browser writes and mos.ru departures. Check sole card CTA,
   15s/smooth progress, optional form, desktop/mobile and no page errors.
   Runtime metadata and browser mock transport do NOT prove real Telegram/Sheet
   delivery; leave a real synthetic submission deferred pending approval.
8. Record sanitized receipt/PR evidence and final live URLs, close audit agents.

## Validation and existing evidence

Previous immutable candidate: WEB-MOS-COMPACT.md documents full web check112
routes, TypeScript,20domain tests, twice12compound browser checks,26finder checks,
7axe scans0violations (contrast incomplete),22design package checks and reviewer
Lorentz APPROVE. Current turn rechecks candidate hash rather than inventing new
evidence for old runs. Repeat browser/client/backend smoke and secret scan for
release; CI verifies admin. Use Node22 PATH. No build during browser tests.
Commands: node --test apps/yandex-lead-receiver/*.test.js;
node --import tsx --test lib/mos-booking-click.test.ts (apps/web);
node scripts/verify-mos-direct-booking.mjs; make secret-scan;
git diff --check; git diff --cached --check. Verification artifacts are ignored
or temporary, not staged. No secret values in evidence.

## Rollback, stop conditions and operational safety

Stop before merge if receiver is not ACTIVE/config-identical, tests/CI fail,
remote main drifts, release hash changes, unrelated edits appear, or secrets risk
exposure. Stop and reconcile an uncertain cloud write; do not create duplicates.
If public UI regresses, revert only this release merge with a normal commit and
wait for Timeweb success (never reset main). Leave the additive receiver in place
until old frontend is live. Only if receiver itself regresses, create a new
version using baseline versionId d4e9dif2lh8eeurptq9a and its original preserved
runtime/environment. Creating that version restores $latest; do not attempt to
delete/move a reserved tag. Do not roll back to historical10s versions.
No old data-cutover helper mutation (pause/sourceMode/publish/rollback) is allowed.
Real leads must retain30s runtime and unchanged existing consent/Sheet contract.

API references used to verify upload, immutable version and $latest semantics:
https://yandex.cloud/en/docs/functions/functions/api-ref/Function/createVersion
https://yandex.cloud/en/docs/functions/operations/function/version-manage
https://yandex.cloud/en/docs/functions/concepts/function

## Execution evidence / freeze / final review

Audit A Pauli01a0c83b-3aa3-76e3-a8a3-23747093a272 APPROVE. Audit B
Averroes01a0c83b-3f6f-7ae2-9d9a-8067557bcf2d initially found two temporary-helper
issues: verification allowed a baseline ID and rollback rejected config drift.
Parent corrected both: bind verify/rollback to recorded deployment identity;
event probe also requires exact event-specific response. Rollback uses only
GET/OPTIONS verification, never the new event probe. Original config remains
strictly validated, but rollback can repair our identified version's config.
Audit B re-review APPROVE. One synthetic test initially used a21-character fake
version ID; fixed test identity to20characters;12helper tests now PASS.

Fresh current-turn validation: backend38PASS; client2PASS; local browser12compound
checks/7axe scans0violations, color-contrast incomplete; no unexpected writes or
pageerrors. Full local-source web check exit0,112routes,4existing lint warnings.
Secret scan1332filesPASS.52protected files byte-identical to HEAD, fingerprint
abf58332c3313d5017f5aeb0ab97f72451d174879d183bb9b6ac9dcd500eaded.
Artifacts: /tmp/questhub-mos-release-M96fN3/web-check.log and local-browser/report.json.

FROZEN2026-09-22: product43files hash remains
005ac077c7c67aae9a191108a77507b2b4a8a19e061e1decc05eac518410b12e.
Temporary receiver-release.mjs SHA256
9c2f1c3f586417d2c89a610f033439f2fc041dccc2d2635eaf90de9246748cb0.
ZIP3members10564bytes, source bytes verified; SHA256
199ef9d0a7e76a560f366588f29b8c865b89707bbabe8a6dff24c928b227e7f4.
Production-browser script SHA256
4484d6edf2592c7df4949986519a83276a7954dc4d9559a44deb8048150239b5.
Staged validation: exact product/index bytes, cached name-status/stat/check,
make secret-scan, node --test apps/yandex-lead-receiver/*.test.js,
client test above, and node --test temporary receiver-release.test.mjs.
Fresh final reviewer pending; no production writes or staged paths yet.
Execution records are excluded from product fingerprint; publish sanitized
post-commit receipt separately so the deployed product remains frozen.

Owner added four school937 groups during this release. They are a separate
following data slice, not included in this frozen package; no data edits yet.
