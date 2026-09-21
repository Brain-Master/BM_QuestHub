# WEB-SCHOOL-2103-RELEASE

## Authority, objective and classification
2026-09-21 owner instruction: "Публикуй", answering the explicit request for
main publication and site data update. Supersedes the previous local-only gate
only for this completed school2103 slice. Status: APPROVED (release execution next).
Objective: publish the reviewed nine groups/two campuses on b-master.pro with
1000 RUB per 45-minute lesson, preserve the old51 groups and all unrelated data.
Classification: product_domain operational release, no new library/UI changes.
No cloud MOS synchronizer repair, lead delivery repair, unrelated CMS work,
new teacher assertions, dependency upgrades, secret disclosure or broad cleanup.

## Preflight and frozen candidate
Checkout: design-previews/schedule-audit-2026-09-09/repo.
Branch fix/schedule-data-and-venues-2026-09-09; HEAD0dc46c5fa173e5cef228976ac61f8741d7ea3260.
Live GitHub main and Timeweb app195536 both1dd3cc4875d1d3359fd0c770cb1d40da6c7d543b.
Latest Timeweb deployment cef633de-9ef7-4053-8f5b-86bcb0b72e33 success.
Node22.23.1/npm10.9.8; git diff --check PASS. Product33-file fingerprint
abce8c64d432493610cc45768289ac2fefa6a2e7c23263f37a412915d89c124d,
independent Hume review APPROVE; tests recorded in WEB-SCHOOL-2103.md.
Only that plan and this release record can change without product refreeze.
Public hot snapshot SHA256 matches exact pre-import backup:
ef03da2353cc3922aef1b2e4bb05017baf234d9a0adf91fe6772bd87d1a596f4.
Production source modes are s3/s3, strict1, auto-deploy enabled.

## Authorized operations / protected paths
Stage explicit33 reviewed primary paths listed by the implementation freeze,
plus WEB-SCHOOL-2103.md and this record. Generated files PA-GEN-001 and
PA-COMPAT-001..005 were generated and validated in the implementation task;
no manual generated edits here. Run make secret-scan before staging and commit.
Commit subject: feat(web): publish school 2103 annual groups and verified lesson price.
Fetch main; verify identical baseline tree; push current feature branch; create
one scoped PR, check CI, merge into main without force/amend/rewrite. Main's
normal Timeweb auto-deploy is in scope. Existing PR9 and PR1 remain untouched.

PA-OPS-010 operational capability, PA-COMPAT-007: app195536 only, temporarily
PATCH its existing envs preserving all fields except SITE_SNAPSHOT_SOURCE and
OFFERS_SNAPSHOT_SOURCE -> local. This makes the first code deployment contain
the reviewed new campus routes without publishing incompatible data first.
Do not change public runtime URLs, domains, other app settings, workflows or
repository deployment scripts. Restore the exact two prior s3 values after
data cutover and redeploy the same release SHA in normal S3-backed mode.

PA-GEN-003/004, PA-COMPAT-001..005: conditional PUT only these public keys in
the existing active bucket, using the exact generated local files:
- data/offers-snapshot.json
- data/v2/map-snapshot.json
- data/v2/catalog-snapshot.json
- data/v2/detail/shmi.json
- data/v2/detail/it-academy.json
- data/v2/detail/projects.json
- data/v2/detail/olympiad-league.json
- data/v2/site-manifest.json (last)
No deletes, other prefixes, legacy bucket or media uploads. Back up current
bytes/ETags/metadata; require each byte preimage to match baseline git before
release; PUT If-Match prevents overwriting concurrent changes. All keys must
match reviewed SHA256 after upload. Conditional write support confirmed in
https://yandex.cloud/en/docs/storage/s3/api-ref/object/upload .

Use existing owner-provided GitHub/Timeweb/S3 credentials in memory only;
never print values or stage credentials. Private operational helper/backups:
/tmp/questhub-release-2103-phXm9D (directory0700, metadata files0600).
No persistent secret copies. App env backup contains only existing build envs,
kept private and excluded from git. Audit errors emit status/name, not payloads.

## Sequence, compatibility and rollback
1. Read-only audit A/B; live backup and baseline compare; freeze verify.
   PA-OPS-001 external operational state only: temporarily disable existing
   Sheet sync workflow279541681 and Mos enrolled sync282599547, record their
   active pre-state and drain queued/in-progress/waiting/pending/requested runs.
   No YAML edits, cancellations or cloud-runtime changes. Cloud finalization
   dispatches Sheet sync for public snapshots, so disabling this publication
   boundary also excludes that writer. Keep disabled through final verification,
   then restore both active states. Recheck all8ETags/bytes after exclusion.
2. Secret-scan, explicit staging, staged scan, commit/push, PR/CI.
3. Set app's two build sources local; verify preserved env/settings; merge.
4. Verify exact-SHA deploy success and new campus route over HTTPS.
5. CAS publish eight generated objects, manifest last; verify bytes/readers.
6. Restore original s3 build modes, rebuild same SHA, verify exact deployment.
7. Real production browser GETs: school9, campus2/7, global60, price1000,
   booking visible, mobile reflow; no enrollment or other POST submissions.
New code accepts old data during transition. Cached old strict-reader clients
may need reload after data cutover; do not advertise zero-reload migration.
If code deploy fails before cutover, production data stays unchanged. Restore
app envs. If data cutover partially fails, rollback only successfully written
keys using their new ETags and backed-up metadata, then verify. Persist write
intent atomically BEFORE each PUT. Lost responses are reconciled with exact
expected bytes/ETag. Rollback records progress atomically and recognizes exact
baseline bytes/metadata on retry; verify all8baseline keys before declaring done.
Never overwrite
an ETag conflict. If complete release fails, restore all eight originals first,
restore original build modes and deploy prior main SHA1dd3cc4. Keep publishers
suspended: do not resume until GitHub main, deployed app and all8 public data
blobs agree. If rollback required, use a scoped non-rewriting revert PR for this
release, deploy that resulting main SHA and verify baseline data; only then
resume. No git reset. Helper resume enforces main/app SHA, successful deploy,
original envs, complete main git-tree and exact public blob hashes before any
enable call, and fences main again after validation.
Stop on new main changes, unexpected data preimage, failing scan/CI, concurrent
deployment/config edit, unknown external write, or missing rollback evidence.

## Acceptance / evidence log
Pending: exact release SHA in main + successful Timeweb deployment; eight
remote data hashes match approved local output; real HTTPS and browser checks;
normal S3 modes restored; only scoped files committed and clean worktree.
Local validation is not production evidence. Existing eight unresolved MOS
identities and contact-vs-teacher uncertainty remain explicitly unresolved.
No live enrollment tests. Browser checks will permit real public GETs and block
write requests; local mock-only reports will not stand in for live evidence.

## Failure history / review / final status
Preflight incidental rg glob referenced nonexistent lib/load* (exit2), no
mutation; explicit actual files then inspected. No production failure so far.
Audit A identified unconditional-publisher race; bounded workflow exclusion
added. Audit B fault-injected lost PUT/rollback responses and found incomplete
rollback journals; intent-before-write + atomic progress + baseline reconciliation
added before any production writes. Product approval remains unchanged.
Live backup8/8 exact HEAD baseline; node --check helper PASS; make secret-scan
PASS1299files; import and integration --check PASS60groups/17venues; focused
Node tests19/19 PASS. Remote main tree exactly equals current HEAD baseline.
Production snapshot validator PASS. Offer suite80/80 PASS again from apps/web
with `node --import tsx --test lib/offers/*.test.ts`. An extra focused run from
repository root failed due to missing tsconfig path alias (@/lib/schemas);
classified as incorrect command cwd, corrected to documented apps/web command.
GitHub publisher drain status queries supported; all10 status counts were0
before suspension. Manual content-admin snapshot PUT remains a human editing
path: owner notified not to edit during cutover; ETags/hash checks detect drift.
Audit A approves two-workflow publication exclusion with the announced manual
editor freeze. Audit B approves journal fixes (35 memory-only fault checks) and
drain correction (14 checks): a single unfiltered paginated run inventory avoids
missing jobs that move from queued to running between separate status queries.
Installed gh2.45 lacks --slurp (read-only probe exit1); equivalent --paginate
with jq @json and per-line parsing verified live:52/52 and41/41 runs, allcompleted.
Operational helper frozen SHA256:
4e4133069910a099b6f0606a205a2b98ce55cc55ae607ed1b03b372356b731f6.
Final reviewer found rollback -> unguarded resume could leave old publicdata
against new main publisher. Added fail-closed main/app/data agreement checks;
rollback leaves publication paused until a compatible main revision is deployed.
Fresh independent Hume review: APPROVE for helper4e413306;11 in-memory scenarios
PASS including rollback -> resume rejection with zero enable calls and idempotent
retry. No remaining confirmed blockers. Final production execution receipts are
to be recorded in the release PR after deployment; this commit captures the
approved pre-release candidate, not an assertion that production is already updated.
