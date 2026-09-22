# WEB-MOS-COMPACT — 15-second smooth transition and compact cards

## Metadata / objective / authority
2026-09-22 Europe/Moscow. Status DONE (local, unpublished). Owner explicitly requests15seconds,
smooth progress, only Записаться на mos.ru on cards; retain optional form inside
existing popup. Repository Brain-Master/BM_QuestHub, root
/home/xipsin/projects/BM_QuestHub/design-previews/schedule-audit-2026-09-09/repo,
branch fix/schedule-data-and-venues-2026-09-09,
HEAD917b656a9bfc9aa5d89636e993673344b6ef4680. NO COMMIT.

## Preflight
pwd,rev-parse,branch,status,log10,diff --check:exit0. Existing43 dirty primary
files exactly match prior reviewed hash1599e9f426d4a3df6ecd31c66e75380d5a33d372413813ebd500487d0b8d1549;
both prior ExecPlans excluded, preserve previous work. Node22.23.1/npm10.9.8,
Playwright1.60.0. apps/web npx tsc --noEmit:exit0 PRE-FREEZE.
Root AGENTS/PLANS, protected registry, Next local use-client guide read.

## Scope / protected operations / non-goals
Only apps/web/components/mos-booking-countdown.tsx,offer-booking-action.tsx,
course-finder.module.css (obsolete optional selector only);
apps/web/content/mos-booking-copy.ts;
scripts/verify-mos-direct-booking.mjs,verify-course-finder-ui.mjs;
apps/web/e2e/quest-schedule.spec.ts,schedule-board.visual.spec.ts (popup opt-in path);
docs/design/mos-booking-transition/** and this record.
PA-COMPAT-007 override scoped to owner-requested CTA/timer evolution;
PA-BUILD-002/003 generated local out/.next only via existing web check.
Forbidden: backend/event contract, generated data/media, workflows, dependencies,
secrets, ordinary/waitlist behavior, yearly table links, commit/push/deployment.

## Architecture / classification / security
product_domain: existing shared MOS action opens accessible controlled dialog;
countdown owns deadline/cancellation, optional form owns consent and submission.
Remove secondary card entry and dangling aria-describedby. Keep native href,
exact group identity, focus restore, pause/hide/close/unmount cancellation.
Use one15s deadline:250ms semantic timer + requestAnimationFrame transform for
smooth visual fraction. No React rerender every frame. Reduced-motion users get
static decorative track with textual seconds; handle preference changes live.
Cancel RAF and interval on every existing cancellation/cleanup. Notification
and optional form unchanged; no new collection or security boundary.

## UX / skill / decisions
References18_ACCESSIBILITY_AND_RESPONSIVE,32_UI_COPY_CATALOG. Skill evolution /
product-surface / autonomous: update existing package, no rebrand or new assets.
Compare: A dual entry(noisy, rejected by owner), B single entry + progressive
disclosure(selected), C remove optional form entirely(out of scope). Preserve
palette and44px CTA. Loading/empty/disabled/ordinary forms unchanged. Ancillary
card text gone; popup still clearly explains optional contacts. Success never
auto-navigates. Motion does not convey information absent from countdown text.

## Plan / audits / negatives
Two readonly subagent audits required: A consumers/selectors, B RAF lifecycle
and test risks. Parent alone edits. Test14999/15000ms deadline; no navigation
at10s; cancellation at14s; within-one-second continuous progress; reduced-motion
and live switching; sole card CTA; form opt-in and stale-response/consent/focus
regressions. No real POSTs. Preserve previous test assertions except explicit
owner-revised paths/deadline; no weakening or source-string-only acceptance.

## Validation commands / acceptance
Node22 PATH. Working directory repo unless stated; log actual exit/timestamp.
apps/web: npx tsc --noEmit; node --import tsx --test lib/mos-booking-click.test.ts.
Repo: SITE_SNAPSHOT_SOURCE=local OFFERS_SNAPSHOT_SOURCE=local
NEXT_PUBLIC_OFFERS_SNAPSHOT_URL=/data/offers-snapshot.json npm --prefix apps/web run check.
Then stable local3198 export: node scripts/verify-mos-direct-booking.mjs;
PREVIEW_URL=http://127.0.0.1:3198 QA_OUTPUT=/tmp/questhub-finder-compact-qa node scripts/verify-course-finder-ui.mjs;
apps/web/node_modules/.bin/playwright test --config=/tmp/questhub-mos-data.config.ts --reporter=dot;
make secret-scan; git diff --check; skill validate_brand_package.py on existing
package. Browser rerun for lifecycle stability. No simultaneous build/served tests.
Acceptance:15s/continuous progress, soleCTA, optional path+failure safety,
keyboard/mobile/axe, protected data unchanged, fresh frozen-review APPROVE.
Legacy Windows visual baselines deferred; real delivery/production/screen-reader
full audit deferred, not PASS. Screenshots local /tmp/questhub-mos-compact-qa.

## Stop / rollback / failure history / scope changes
Stop on unexplained changes, protected scope expansion, missing tools, findings.
Rollback only own patches, never reset old dirty work. Instruction output
truncation: relevant omitted portions reread. No scope expansion so far.

## Freeze / review / staging / final
Pending checks; fingerprint sorted relative path NUL bytes NUL across all dirty
primary files, exclude all WEB-MOS-*.md execution records explicitly. Review
fresh and readonly; no edits after freeze. Staging/commit/push NOT AUTHORIZED.
Production unchanged, next task not started. Evidence appended as work completes.

Do not push.
Do not start the next task.

## Audits and implementation evidence
Readonly A Kierkegaard01a0c81a-c426-7941-915f-dcf8f1924109 found obsolete optional
button selectors/false-pass quest fallback; revised all targeted consumer tests
to actual card-link → opt-in, retaining consent/payload/errors/focus assertions.
Visual test scoped to first schedule card, no page-wide accidental form target.
Shared44px sizing/focus/wrapping retained; only obsolete helper CSS removed.
Readonly B Tesla01a0c81a-cbe6-72d0-a176-4b8e4a915f0b confirmed cancellation and
motion-switch risks; adopted monotonic performance.now, shared15_000 constant,
RAF+interval cleanup, media listener cleanup, continuous32ms sample checks.
Parent independently inspected/applied; agents no edits/tests/network/secrets.
Audits ran parallel to parent inspection/initial narrow edits, final findings
integrated before final build/validation. Agents closed. No additional scope.

## Validation log —2026-09-22 Europe/Moscow / PRE-FREEZE
All commands in Test plan above executed with Node22 PATH; repo cwd except noted.
- Two local-source npm --prefix apps/web run check runs exit0. First before
  monotonic-clock refinement, second on final source.7hosttests,112routes;
 4existing lint warnings + existing Next tracing warning remain. Final log
  /tmp/questhub-mos-compact-check.log. No served-browser tests during builds.
- apps/web npx tsc --noEmit exit0; client node --import tsx --test
  lib/mos-booking-click.test.ts exit0,2PASS. Backend unchanged and not retested
  this turn; prior38PASS is historical, not new evidence.
- domain Playwright /tmp/questhub-mos-data.config.ts exit0,20PASS.
- node scripts/verify-mos-direct-booking.mjs exit0,12compound checks,
 7axe scans0violations/contrast incomplete,0pageerrors/0unexpected writes,
 8mockclick/4mockform. /tmp/questhub-mos-compact-qa/report.json.
- Finder script with3198 and /tmp/questhub-finder-compact-qa exit0,26PASS.
- secret-scan exit0,1331files; package validator exit0,22checks;
  git diff --check exit0. No test failures; instruction truncation recorded above.
- Inspected compact390px card and320px popup PNG; selected-offer details remain
  expanded by existing deep-link behavior, not a compactness regression.
- Protected52files under apps/web/data,apps/admin,packages,.github identical
  to HEAD; SHA256abf58332c3313d5017f5aeb0ab97f72451d174879d183bb9b6ac9dcd500eaded.
  Secrets/deploy/backend/data unchanged, no staged paths. Next task not started.

## Freeze2026-09-22T11:03:05+03:00
Status FROZEN. HEAD917b656a9bfc9aa5d89636e993673344b6ef4680.
43primary paths, exactly the explicit sorted manifest in WEB-MOS-TRANSITION.md
section Freeze candidate2026-09-21; no primary file additions/deletions this turn.
Exclude all three WEB-MOS-*.md ExecPlans as execution records. Primary changed
this turn: the8source/test paths in Scope and11mos-booking-transition docs;
other24primary files preserved. SHA256(sorted path NUL bytes NUL):
005ac077c7c67aae9a191108a77507b2b4a8a19e061e1decc05eac518410b12e.
git diff --check exit0. No edits after freeze. Fresh independent review pending;
rerun browser/scan may update ignored artifacts only. Staging NOT AUTHORIZED.

## Final review and frozen validation
Frozen browser rerun exit0:12compound checks/7axe0violations (contrast incomplete),
0pageerrors/0unexpected writes,8mockclick/4mockform. Frozen secret-scan1331PASS,
package-validator22PASS,diff --check exit0. No primary edits after freeze.
Fresh readonly Lorentz01a0c824-8565-7071-865b-517dfddffa15: APPROVE; independently
verified43-file fingerprint and52protected files identical to HEAD, no blocking
findings. Reviewer did not rerun tests, edit or make external writes.
Acceptance15s+smooth, soleCTA, optional-flow safety, mobile/keyboard checks,
protected integrity and fresh-review gates PASS. Full manual accessibility and
production deferred as declared. Scope complete locally; no stage/commit/push/
deploy/real notifications; previous dirty work preserved. Next task not started.
Preview3198 remains available; refresh page to load new static assets.
