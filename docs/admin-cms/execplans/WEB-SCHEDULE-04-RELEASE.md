# WEB-SCHEDULE-04-RELEASE — Publish reviewed schedule and school profiles

Update: owner supplied new teacher/base facts and application-failure requirement
before publication. Release paused,125-file freeze lifted under WEB-SCHEDULE-05.
No commit, push, S3 publication or YCF version creation performed under04 yet.

## Task Packet / authority

Repository: Brain-Master/BM_QuestHub
Authorized branch: fix/schedule-data-and-venues-2026-09-09
Expected HEAD: a99ea122d421cfd2beadb07b48c466f89a7ea97f
Task: WEB-SCHEDULE-04-RELEASE — publish the reviewed schedule candidate to b-master.pro.
Commit: feat(web): release schedule filters and enriched school profiles

Owner instruction on 2026-09-09: «Давай выложим всё на сайт», following the report
that the implementation was locally approved and not published. This explicitly
authorizes this release's commit, normal feature-branch push, PR and merge into
main, existing Timeweb deployment and scoped snapshot/updater publication. It
supersedes the NO COMMIT / no-push / no-publication boundary of WEB-SCHEDULE-03
for this release only. No force push, unrelated CMS PR merge, hosting migration,
new infrastructure or invented source facts is authorized.

Do not push outside this owner-authorized release.
Do not start the next task.

## Objective and non-goals

Publish and directly verify the unchanged approved user-facing candidate and its
active-only update behavior through the existing main / Timeweb / Yandex chain.
No new features, teacher assignments, guessed study years, unconfirmed group
merges, BM base address, or claim of media licensing verification. Preserve the
documented eight unresolved cards and seven study years. Publication permission
does not confirm those facts. Do not modify the other checkouts or CMS branch.

## Exact scope and protection overrides

The exact 125 feature paths are the final manifest in WEB-SCHEDULE-03.md. Their
reviewed SHA256 is 14509dca999267ab012af6ac702429e97eb85e6f2142762c9fcf5dc6196473fc
(sorted relative path, NUL, bytes, NUL). No product edits authorized by this
release packet. Stage/commit only those exact paths plus WEB-SCHEDULE-02.md,
WEB-SCHEDULE-03.md and this release plan after gates. Generated data is already
generator-produced and reviewed; never hand-edit it. Any required regeneration
must record input/output and receive a new freeze and review before staging.

Protected IDs: PA-GEN-001/003/004 and PA-COMPAT-001/002/003/004/005/006/007;
PA-OPS-001/002/003/005/006/007/010. The exact changed operational paths and JSON
paths are in the 125-file manifest; only stage/commit their approved bytes.
Read existing deploy and S3 scripts; execute existing data-cold/data-hot upload
only after valid live backup and source parity checks. External paths are exactly
data/offers-snapshot.json and the files under data/v2 corresponding to the local
reviewed v2 tree. No delete, migration, or unrelated media/ops prefix publication.
Existing school photos are apps/web/public/sites files served by the web export.
Build output apps/web/out and .next are validation-only, never staged.

YCF publication: update code versions of existing mos sync functions only after
resolving IDs and preserving environment, runtime, service account, queues,
triggers, timeout, and memory. No queue recreation, consumer purge, credentials
rotation or unrelated function update. Read-only audit must resolve exact
functions before any mutation and append them below. No Google Sheet edits are
needed for code release. An existing automatic update run may proceed normally;
do not claim all 51 cards verified when eight are unresolved.

Secret-use override (PA-SECRET-001/002/005): owner previously supplied the project
credential directory and new keys for publication. Main agent may load these
existing files into isolated process memory solely for authenticated GitHub,
Timeweb, S3 and Yandex release requests: Windows project secret/github.token,
scripts/timeweb.env, scripts/s3.env, scripts/s3-hot.env, scripts/sheets.env under
/mnt/d/WORK/01_Active_Projects/BM_QuestHub; equivalent ignored files in the
original Linux project /home/xipsin/projects/BM_QuestHub/BM_QuestHub only when
required by the existing loader; and Yandex CLI config at
/mnt/c/Users/Xipsin/.config/yandex-cloud/config.yaml. Metadata-check first;
never display file contents, tokens, environment values, full API payloads,
auth headers or credentials in logs, artifacts, commits or reviewer context.
No secret file edits or copying into the candidate. Network output is bounded
and allowlisted. Existing host/bucket/app identity must be verified before use.

## Preflight and architecture

Exact repo: /home/xipsin/projects/BM_QuestHub/design-previews/schedule-audit-2026-09-09/repo.
Preflight PASS: cwd/root, branch, full HEAD, status, log10, diff-check; 127 dirty
paths, empty staging. No unexplained files. Node22.23.1, npm10.9.8,
Playwright1.60.0. All prior product/browser gates documented in WEB-SCHEDULE-03.
Timeweb app195536/main and public S3 must be revalidated live; local tracking refs
are not current remote evidence. Sites skill inspected but not applicable to
this existing Timeweb deployment; no Sites file/service created.

Architecture: static Next export plus S3 hot offers and cold map/catalog/detail.
Publish cold data before the new build; avoid stale hot overwrites by comparing
the live snapshot and retaining newer annual refresh data through the existing
compiler/publication flow. Verify public assets and snapshots, not just CI.

## Independent audits

A: Bernoulli — read-only operational/YCF/S3 release ordering audit, pending.
B: Goodall — read-only Timeweb/build/media/public acceptance audit, pending.
Final: independent reviewer must approve actual unchanged feature fingerprint
and release operational packet before staging. Main alone writes or deploys.

## Validation and acceptance

1. Recompute exact125 fingerprint; git diff --check and empty index.
2. Live GitHub main/PR/checks, Timeweb app/deploy/branch, S3 public baseline.
3. Existing approved product evidence: web check111 routes; domain79, pipeline19,
   state16, overlay10, runtimecopy26; browser14 25scenarios/8axe/0unexpectedwrites.
4. Fresh make secret-scan on final frozen candidate. Stage explicit approved
   paths; git diff --cached --check; compare staged blobs to reviewed bytes;
   run npm --prefix apps/web run check with explicit snapshot source configuration.
5. Normal feature commit/push and PR merge only if required CI passes and current
   main is compatible. No bypass of branch protection.
6. Observe exact deployment commit and terminal success; public GET-only smoke:
   /agenda/, /sites/, /sites/school-2044/, school agenda, images, short URLs,
   available-only filters, no unexpected writes. No production booking tests.
7. Verify YCF version activation separately; inability to deploy it is partial
   release, not proof of active-only production behavior.

## Failure and rollback

Retain all failed commands and classify them. No retry that erases history.
Stop on fingerprint drift, unexplained main changes, secret finding, incompatible
live data, unexpected target, or a new implementation boundary. Snapshot backups
are private local task-owned artifacts, with hashes and timestamps. Restore only
exact changed object keys if rollback is needed, preserving newer unrelated hot
data. Code rollback uses previous known-good Timeweb full commit SHA and normal
Git revert reviewed changes, never reset/force-push. YCF rollback repoints tags to
recorded prior versions without changing environment/queues.

## Progress / evidence

Release status: PREFLIGHT / read-only remote inspection pending.
Staging/commit/push/deployment: NOT STARTED.
Fingerprint: pending fresh check of approved125 bytes; this administrative plan,
WEB-SCHEDULE-02 and WEB-SCHEDULE-03 are separately reviewed evidence exclusions.
No next task started.

### Release preflight results

Both audits APPROVE the unchanged125 source and scoped S3/site procedure.
Audit A (Bernoulli): exactly8 CAS PUTs, no deleting sync, stop on ETag drift,
manifest last among cold. YCF requires its separate operational gate.
Audit B (Goodall): no new build/media blockers; require exact deployment SHA,
public asset/JSON checks and ACL readback, not merely an authenticated body GET.
Fresh Node22 web check PASS111 static routes and make secret-scan PASS1285files.
GitHub main, Timeweb app195536 active/main/auto-deploy and latest successful
deployment b112688d-fb88-474d-8dd4-e3e904f2762e all match base a99ea12.
Previous mos-enrolled-sync run34306615935 failed before jobs due to duplicate env
keys already removed in this candidate; historical failure retained, not ignored.

All8 authenticated S3 reads are semantically identical to the base commit.
Private backups, ETags, original ACLs and reviewed target SHA256s are in
/tmp/questhub-release-zymr7H/snapshot-backup.json; body backups in its backup/.
The task-only helper /tmp/questhub-release-zymr7H/snapshots.mjs replaces the broad
sync execution: preflight all exact keys, conditional PUT IfMatch, preserve ACLs,
metadata/cache/type, authenticated SHA256 readback. No DELETE or extra prefix.
This is an operational implementation of this packet, not new product code.
Cold7 then hot1 may be published before main merge, as both old/new consumers
share the unchanged public schemas. No newer hot data is overwritten.

### YCF execution boundary

IAM and functions list once returned200; later IAM calls timed out at connection.
This is an observed transient network boundary, not an invalid-key conclusion.
Existing functions resolved read-only:
- bm-mos-sync-finalizer: d4e1oquh9jsip14176vn
- bm-mos-url-worker: d4euql4f3rbm2g5m73jr
- bm-mos-sync-planner: d4e7uilkke1ffcoo2cq7
- bm-mos-enrolled-sync: d4ecqlbgllotnco6p5nj
- bm-mos-sync-controller: d4e6lha8cnbtj0f5oaka

Exact code-version operations for these five identities only, through reviewed
task helper /tmp/questhub-release-zymr7H/ycf.mjs; existing broad provision scripts
are not run. Packages generated in the private task directory via existing
stageMosLibs with reviewed scripts/lib source, existing app handler and pinned
package locks, npm ci --omit=dev --ignore-scripts, standard-library ZIP. All five
handler imports PASS and lockfiles unchanged; no files in candidate regenerated.
Live version/config must still be read before mutation and matched immediately
before CreateVersion. Preserve all environment/security/resources/async settings
in memory, never serialize them to evidence. Store only prior version ID and
configuration hash. Do not change queues, triggers, custom tags or IAM. New
versions switch $latest according to the existing runtime convention. Verify
ACTIVE, full release description and exact config hash separately from site.
Official CreateVersion/GetVersionByTag REST documentation checked on 2026-09-09.

The first local state probe used SDK dist-es internal import and failed module
resolution before any network access; use public createRequire package entry.
YCF/source packaging is preparation only; no function deployed or invoked yet.
