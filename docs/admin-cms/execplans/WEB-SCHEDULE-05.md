# WEB-SCHEDULE-05 — Owner corrections before publication

Repository: Brain-Master/BM_QuestHub
Authorized branch: fix/schedule-data-and-venues-2026-09-09
Expected HEAD: a99ea122d421cfd2beadb07b48c466f89a7ea97f
Task: WEB-SCHEDULE-05 — restore application collection and owner-confirmed venue/group facts before publishing.
Commit: fix(web): reconcile school data and restore registration flow

## Authority and release boundary

Owner added five requirements during04, before any commit/push/S3 PUT/deploy:
failed applications; Mechvarium base at Ryazansky prospekt38 under renovation,
not open, no classes;1212 only Vasilisa Vladimirovna Tolmacheva, prior Ivan is a
portal placeholder;17 SHMI1 Anna and SHMI2 Vasilisa; use supplied full dataset;
show sites without current groups in gray including map markers.
This explicit instruction lifts the125-file freeze for these corrections and
retains publication authority after fresh validation/review. Prior source
approval is historical, not approval of new bytes. No publication yet.

Do not push outside the owner-approved release.
Do not start an unrelated task.

## Scope and non-goals

Preserve all existing work and03 behavior. No guessed teachers, years from age,
fake base classes or destructive deduplication. No logo actually attached: keep
existing brand asset. No real personal-data test submission, CAPTCHA bypass,
schema rename, infrastructure addition, secret rotation or CMS changes.

## Exact write paths and protected override

Existing125-file manifest remains staging scope after re-review. Additional
correction scope: apps/web/content/annual-group-overrides.ts; school-profiles.ts;
scripts/integrate-year-schedule.ts; apps/web/lib/offers/annual-integration.test.ts;
apps/web/lib/sites/scope-card.ts; scope-card.test.ts; map-colors.ts;
map-colors.test.ts; apps/web/components/site-selection-grid.tsx;
sites-map-schematic.tsx; apps/web/app/sites/[school]/page.tsx;
apps/web/lib/lead-submit-client.ts and adjacent focused test;
apps/web/components/booking-form.tsx; offer-booking-action.tsx;
apps/yandex-lead-receiver/index.js; index.test.js; README.md;
scripts/verify-course-finder-ui.mjs;
docs/data/school-profiles-2026-09-09.md;
docs/data/annual-schedule-audit-2026-09-09.md; this plan and04 release evidence.
Choose actual booking fix only after root-cause evidence.

PA-GEN-001 / PA-COMPAT-001/002/003/004/005: exact eight03 generated snapshots
may be regenerated only by integrate-year-schedule.ts --write, then --check and
schema/tier tests. Never hand-edit JSON, source ZIP/CSV or generated registry.
PA-SECRET-001/002/005: retain04 in-memory credential boundary; additionally
read live bm-lead-receiver version d4et4qv541kafc85aq8l, function
d4ellekng389grh5rck4 config and scoped recent error diagnostics. Output only
status/error class/phase/count, never parent/child data or credential values.
Read-only Telegram getMe/getChat and Google Sheets metadata/access checks may
use this function's existing credentials; never send/append as a diagnostic.
Public OPTIONS/GET do not collect leads. A synthetic end-to-end write, if
essential, requires separate owner confirmation. Record exact config correction
and rollback before any operational mutation. Final release keeps04 controls.

## Preflight and audits

Root/branch/HEAD unchanged, index empty,128 dirty paths after04. Frozen source
hash14509dca999267ab012af6ac702429e97eb85e6f2142762c9fcf5dc6196473fc lifted,
not discarded. Node22.23.1/npm10.9.8; previous check and secret scan PASS.
Audit A: Kant read-only dataset and teacher provenance, pending.
Audit B: Goodall read-only inactive sites/maps, pending.
Parent: live application-failure diagnosis before implementation.

## Initial evidence

Public lead OPTIONS204, exact b-master.pro CORS origin, version
d4et4qv541kafc85aq8l: missing CORS origin not currently established.
Handler validates payload, then Telegram, then Google Sheets; either primary
delivery failure yields502. Need actual cause, never a false-success UI patch.
No lead payload submitted. IAM intermittently times out; functions list once
succeeded. Authenticated MOS state: idle, no activeRunId/lock,0batches.

## Acceptance / validation / rollback

Retain03 tests; add owner teacher precedence/refresh survival; dataset
identity/code/slot comparison; base no groups and pre-opening copy; gray but
clickable labeled zero-group cards and markers; finding-group facets still
exclude zero options. Browser desktop/mobile/focus/share/back/loading/error.
Booking handler/client contract with explicit fakes, no production form POST.
Live OPTIONS and read-only downstream checks distinct from e2e success.
Fresh web check, domain/lifecycle/overlay/handler tests, secret scan, fingerprint
and independent approval. Exact reviewed data with renewed backup/CAS against04
baseline; rollback only owned objects and exact versions. Retain failed runs.
No success claim without HTTPS readback and actual deployment SHA.

Initial status was READ_ONLY_AUDIT_AND_DIAGNOSIS. Current status is recorded below.

Both read-only audits complete. A: original archive SHA matches source,51IDs /
52slots retained; six1212 teachers corrected by owner, school17 already matches.
Eight2044 suspected replacements coexist in original archive; do not merge them.
B: include inactive sites only in directory, preserve listedOnSites and existing
positive-count facets; count groups per campus, gray markers in both color modes
and all-empty clusters, keep links/keyboard accessible.
Additional exact source paths: apps/web/content/venues/bm-base-moscow.yaml;
apps/web/components/live-sites.tsx; course-finder-results.tsx;
apps/web/lib/sites/city-card.ts and existing city-card.test.ts if needed.
Base address/name/status confirmed by owner; coordinates are a separate public
building reference, not a claimed entrance or opening date. Future logo absent.
Booking read-only diagnostics: Telegram bot/chat200, Google OAuth200, Sheets
metadata/range200,25rows. No message sent and no row appended. Function timeout
10s is observed but root cause not yet proven. Windows yc.exe may read scoped
function logs using the already authorized CLI profile, masked summaries only.

Review05 follow-up: add exact path apps/web/lib/offers/use-live-schedule.ts for
a read-only hasLiveSnapshot indicator; no fetch/auth policy change. This lets
LiveSites distinguish unknown availability from a successfully loaded zero.
Goodall found two P2: no-baseline loading/error falsely says no groups, and gray
popup CTA still opens the school's schedule. Correct both within current scope,
retain counter/keyboard regression checks. No publication while unresolved.

Booking diagnosis fallback: Cloud Logging CLI reads timed out. The same leads
spreadsheet has an Ops tab documented by yandex-lead-ops-reporter. Read only
operational columns Ops!A:I; do not request J:M (names/contact/offer). Summarize
timestamp, allowlisted event/error class/status only, never raw error text or
payload. Existing Sheets readonly OAuth; no permission or credential changes.

Additional regression path: apps/web/components/live-sites.test.tsx, SSR of the
actual LiveSites/SWR boundary for no-baseline loading/error, successful empty,
cached-empty error and non-empty fallback. No production requests or effects.

## Checkpoint 2026-09-10

Owner said continue. Product requirements2-5 implemented locally, booking1 still
under diagnosis. No commit/stage/push/S3 PUT/YCF creation/Timeweb deployment.
Confirmed source:51annual groups/52weekly slots. Teacher overrides correct six1212
groups and pin six17 groups by year. Original CSV/API registry not edited.
Base profile at Ryazansky38: preparing,0groups,0photos, original BrainMaster logo.
Directory10sites/4gray;16campuses/8gray. Unknown loading/error without baseline
does not claim zero; valid empty and retained data remain distinct. Gray popup
and inactive-site sidebar use informational links. Group facets stay positive.

Read-only review: Kant APPROVE data/refresh precedence, Goodall APPROVE after two
P2 corrections. Independent final reviewer restart needed after network failure.

Validation evidence in /tmp/questhub-release-zymr7H:
- domain-05-final.log:87/87 PASS, including5 actual SWR/SSR availability scenarios.
- pipeline-05-final.log:30/30 PASS; lead-05-final.log:8/8 unchanged receiver tests.
- web-05-r5.log:lint/schema/audit/host tests/build111pages PASS, with explicit
  NEXT_PUBLIC_OFFERS_SNAPSHOT_URL=/data/offers-snapshot.json for local browser.
- browser-05-r5/results.json:26scenario groups PASS,8axe scans/no violations,
  no unexpected writes; booking requests/responses completely intercepted mocks.
- Focused browser: gray1212/Novoyasenevsky campus inside active school, profile
  popup href and Enter navigation PASS. Screenshot campus1212-gray-popup.png.
- secret-scan-05-final.log:PASS1288files; git diff --check PASS, index empty.

Failure history retained: nullable studyYear TS error corrected; base photo test
caught four inherited illustrations (compiler override fixed, assets not deleted).
One unit invocation from repo root missed tsconfig alias; correct apps/web cwd
passes. One preview build omitted explicit client snapshot URL, causing browser
count0 while external requests were intentionally blocked; corrected environment,
not assertions. browser05-r3 hit30s networkidle reload timeout; retry reached map.
browser05-r4/focused probe caught expected href without Next's canonical trailing
slash; assertion corrected to actual configured route. Final r5 passes unchanged
product bytes. No test disabled, no timeout increased, no hidden network writes.

Booking evidence: production b-master.pro and quest.b-master.pro preflights have
matching ACAO; localhost3195 and www.b-master.pro do not. No claim www is actually
served. Telegram getMe/getChat, Google readonly OAuth and Sheets access all200.
Function activeversion d4et4qv541kafc85aq8l has10s timeout, sequential Telegram then
Sheets then optional n8n; latency/partial delivery are risks, not proven cause.
Cloud log CLI times out; Ops contains41 operational rows, latest2026-08-20, no
matching fresh failure. No real/synthetic lead submitted. Asked user whether the
failure is production or localhost; no answer yet. Do not widen CORS or return
false success. New logo not actually attached. Eight2044 possible replacements
and seven unconfirmed study years remain unresolved, not guessed.

Frozen product:131paths, SHA256
d8919e1545d7282d135a3442e717a6b684af7d0f35ffde079e8f4d7661876e66
(sorted relativepath NUL bytes NUL; git diff files plus untracked, excluding only
WEB-SCHEDULE-02/03/04-RELEASE/05 administrative plans). Earlier360f6d hash covered
the no-trailing-slash test expectation and is superseded. No publication gate
is passed by local validation or pending final review alone.

## Booking root evidence / continuation 2026-09-10

Final reviewer Socrates APPROVE for frozen131 data/UI paths (requirements2-5),
not booking or release. Subsequent direct read-only Cloud Logging gRPC succeeds
where Windows CLI stalled: exactfunction d4ellekng389grh5rck4, activeversion
d4et4qv541kafc85aq8l, logging enabled,48h bounded ERROR/FATAL request. Found34ERROR
entries on2026-09-09, all matching runtime execution-timeout classifiers; none
contain the handler's Primary lead delivery failed marker. This proves runtime
termination happens in production; precise failed phase/user attempt not yet tied.
No log payload or personal data saved. Official APIs/protos used only for read:
reader.logging.yandexcloud.net / yandex.cloud.logging.v1.LogReadingService/Read.

Booking implementation scope was already authorized above. Lift131 freeze only
for exact receiver index.js/index.test.js/README.md and any specifically reviewed
client regression required; no data/UI redesign. Audits A Bernoulli and B Goodall
review bounded delivery design before edits. Proposed repair: bounded primary
requests including response bodies, explicit safe phase/deadline diagnostics,
optional n8n cannot consume unbounded request time,200 only after both primary
destinations accept. No automatic non-idempotent POST retry, no CORS broadening,
no pretending a partial or timed-out delivery succeeded.

Operational correction after new freeze/review: PA-OPS override exactly function
d4ellekng389grh5rck4, new code version with executionTimeout30s (was10s), sufficient
headroom above bounded handler budget. Retain all other live config, environment,
service account, memory, runtime, tags and URLs. Priorversion retained for rollback;
write durable local intent before create, reconcile uncertain response read-only,
verify exactoperation/newversion/$latest/config. Do not create a second function,
change downstream sheets/chats or send a synthetic lead without owner confirmation.

## Final combined freeze and release gate

Receiver implemented:26s total handler budget,22s shared primary budget,12s
per-phase ceiling including response body, bounded64KiB JSON, cancellation cleanup,
no POST retries, safe phase/status/requestId diagnostics. HTTP200 only after
Telegram ok:true and Sheets exactly one appended row. Optional n8n cannot defeat
primary success. Partial delivery remains502/unknown and can require reconciliation;
this is not an idempotency redesign. CORS unchanged.

Evidence lead-repair-final.log:25/25 PASS, original8 retained; hangs at headers/body,
shared deadlines, partial/failed primary, exact wire/21-column contract, malformed
OAuth, bounded logs/body and optional n8n tested. Audits Bernoulli/Goodall APPROVE
runtime at21 tests; four additional Goodall checks persisted and pass (25 total).
No real/synthetic production lead posted. User confirmation for one marked test
and clarification of failing origin still pending, not assumed.

Combined134 feature paths SHA256
1103a10dfa13407dfea0ab70422d388aa01e4d809e24aa98f7e1425040f1fce7
using the same sorted path NUL bytes NUL scheme; all131 previously approved UI/data
bytes unchanged. Exact manifest /tmp/questhub-release-zymr7H/freeze05-final.json.
The four WEB-SCHEDULE plans are administrative evidence exclusions, stage explicitly.
Fresh independent combined review and secret/staged gates remain mandatory.

Operational preparation only: exact lead package SHA256
20ee4086497a1aedd23ac546785b6439800a1bd9ec9a80012cf05a8448d36b20,
lead-release.mjs audited APPROVE. It binds package/local/commit index.js+package.json,
CAS checks oldversion/config, fsyncs unique intent before create, preserves all
config except timeout30s, verifies exact successfuloperation and latest ACTIVEversion.

MOS read-only status2026-09-09T21:29:50Z: idle, no activeRunId/lock,0batches and
0visible/inflight/delayed worker messages; planner120s and async retriesCount0.
This does NOT prove absence of queued asynchronous old-planner invocations.
Worker cutover HOLD until old invocation/backlog gate is actually established.
No queue purge, trigger pause, or fake successful refresh authorized. Finalizer,
controller/planner/monolith also not yet deployed. Function package code release
is distinct from51-card successful refresh;8source identities still unresolved.

Publication remains authorized per04: exact feature commit/PR/main and existing
Timeweb195536, eight S3keys via per-object CAS, lead function correction. Preserve
old snapshots/versions for rollback. If MOS cutover cannot safely be established,
report that operational part pending rather than claiming active-only live success.
No commit, push or remote mutation performed as of this checkpoint.

Final independent review Socrates APPROVE134/source and scopedsite/S3/lead release;
independently recomputed1103a10d fingerprint and reran25receiver tests PASS.
Combined secret-scan PASS1288files. Goodall APPROVE renewed S3helper SHA256
46d7c82dcef4a7f3a905ff49ef723feae6e186fae393f3e4347929812f6ed634:
cache verified gitshow buffers during all-object preflight, use only those buffers
for CAS PUT; durable intent, ACL and anonymous readback. Old snapshot-backup.json
retained unchanged; snapshot-release05.json refreshed read-only against all8live
ETags/bodyhashes/ACLs. MOS cutover HOLD unchanged. Proceed explicit138paths staging
(134product plus four plans), staged parity/check/secret/build, then normal release.
