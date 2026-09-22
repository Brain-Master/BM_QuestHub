# WEB-MOS-TRANSITION — optional contact popup before mos.ru

## Metadata / authority / preflight
Owner explicitly revises previous local direct-link UX: clicking registration
opens popup with countdown, immediate link and voluntary contacts. This supersedes
the no-intermediate-screen choice of WEB-MOS-DIRECT-BOOKING, not its security or
release boundaries. Repository Brain-Master/BM_QuestHub; root current nested repo
design-previews/schedule-audit-2026-09-09/repo; branch fix/schedule-data-and-venues-2026-09-09;
HEAD917b656a9bfc9aa5d89636e993673344b6ef4680. Node22.23.1/npm10.9.8,
Playwright1.60.0. TypeScript baseline exit0, diff --check exit0.
All prior31 dirty primary files exactly match approved previous fingerprint
03ffb281d956a4413cccacd89a91c7ea3ed6532182c6d0019f755242628a903c; preserve them.
Classification product_domain. Status LOCALLY_COMPLETE_APPROVED. NO COMMIT; staging, push,
merge, deploy, real Telegram/Sheet writes and secrets NOT AUTHORIZED.

## Objective / scope / non-goals
Desktop/mobile consent-based optional assistance without losing immediate access
to the exact mos card. Parent edits only, independent readonly audits A/B and final
frozen review required. Allowed: apps/web/components/offer-booking-action.tsx;
new mos-booking-countdown.tsx; apps/web/content/mos-booking-copy.ts;
scripts/verify-mos-direct-booking.mjs updated to the new contract;
scripts/verify-course-finder-ui.mjs only intentional copy/link expectations;
docs/design/mos-booking-transition/** and this execution record.
Do not alter previous receiver/event wire, data, dependencies, APIs, credentials,
deploy scripts, yearly read-only table links or ordinary BrainMaster/waitlist forms.
PA-COMPAT-007 override scoped to this shared MOS registration UI;
PA-BUILD-002/003 allow local generated web build only, never stage outputs.

## Architecture / UX decision / skill
Skill creating-brand-design-systems, evolution/product-surface/autonomous:
use current colors/type, editable React source and local screenshots. Existing
optional-form helper and consent preserved. Compare A blocking questionnaire,
B collapsible voluntary help with controllable timer (selected), C immediate
navigation plus unsolicited form (rejected). User benefit: choice and continuity,
not pressure. No claim of guaranteed place or mos priority.
Primary click (also Enter) intercepts native anchor into dialog. Modified/middle
click/no-handler retains direct link. Modal title gets focus and restores to the
actual trigger (primary anchor or secondary contact button). Top header has10s
countdown, pause and visible 'Перейти сейчас'. Automatic navigation uses current
tab, not delayed window.open, and is clearly labelled. Optional form opt-in stops
timer permanently, including during validation/submission/error/success. Hiding
tab, closing dialog or pressing pause cancels auto-navigation; no surprise resume.
Countdown does not announce every tick. Notification only when departing, not
opening modal/pausing/closing. Keep notification network independent of navigation.
References:18_ACCESSIBILITY_AND_RESPONSIVE and32_UI_COPY_CATALOG; owner request
controls revised journey. Independent form consent is unchanged.

## Steps / negatives / validation and acceptance
1. Readonly A: shared flow/focus/state. B: timer cleanup/background/notification.
2. Implement narrow countdown header and intro; keep existing form/success states.
3. Update local browser contract test: open doesn't navigate/notify, countdown
and manual depart exact URL, pause/close/hidden/form cancel, fresh reopen resets,
modified native links, failed notifier still navigates, failure preserves form,
no auto navigation after success,320/390px/focus/axe/screenshots. Clock controlled.
4. Existing finder26 and school2103 regression; domain20; receiver38/client2
unchanged; TypeScript; local-source npm --prefix apps/web run check; secret scan.
5. Source+tests+design docs freeze SHA256(sorted path NUL bytes NUL); execplan
self-excluded. Fresh independent APPROVE; no commit/publish. No next task.
Commands use Node22 PATH. Browser synthetic interception only, same local3198
preview; legacy Windows visual baselines deferred, not falsely claimed passed.

## Security / rollback / stop / records
No new endpoint or data collection. Native fallback and exact resolved URLs
retained; no notification on merely opening popup. No arbitrary external target.
Abort timer synchronously on action plus cleanup on unmount; ignore old form success.
Rollback only this task's patches, never reset previous dirty work. Stop for
unexpected changes, permissions/scope expansion, missing tooling or secrets.
Initial failures: combined instruction reads truncated; required portions reread.
Acceptance pending actual local checks: immediate escape, respectful timer,
optional form, exact event identity, mobile keyboard/focus, no production mutation.
Freeze/review/outcomes appended below after implementation, not claimed in advance.

Do not push.
Do not start the next task.

## Implementation and audit resolution
Readonly A (Plato01a0c4f8-4a93-70f0-a89a-8ceace0409b0): isolate target/form
sessions, keep ordinary initial focus, restore real trigger or surviving fallback,
test old success AND error against newly entered values. All addressed. Readonly
B (Schrodinger01a0c4f8-54e5-79e0-ad1f-c37fc6462944): synchronous permanent
cancellation, exact deadline, notification only on departure, native modified
links and independent navigation count. Addressed by countdown and browser tests.
Both performed no edits, secret reads or real POSTs; closed after integration.

MosBookingCountdown controls a10s same-tab departure with250ms polling and a
synchronous cancellation ref. Effect-local live flag protects stale callbacks and
StrictMode cleanup. Form opt-in, pause, hide, persisted pageshow, close and unmount
cancel. Target key disposes previous card state; form key disposes old submission
state. Focus title is MOS-only. Return focus rechecks surviving controls after
React commit, because the library resolves finalFocus before card detachment.
Current form success still does not navigate automatically. No backend/event-wire
change this turn; notification remains best effort, not guaranteed delivery.

## Failure history (corrected, not suppressed)
- Ref-as-render-key rejected by lint; replaced with session state plus synchronous
  invalidation ref. Later full check passed.
- Paused Playwright clock initially prevented BaseUI focus RAF. Explicit250ms
  flush, deadline assertions based on absolute elapsed time, not a longer timer.
- Racing input autofocus replaced with persistent form-title focus, avoiding
  unwanted mobile keyboard. Form choice still stops timer synchronously.
- CSS fade looked ghosted in paused-clock PNGs; screenshots now finish animations
  using animations=disabled. Visually inspected390px popup and320px form exports.
- Live-refresh test needed SWR zero-delay focus task flushed and an actual
  response/href assertion. Once refreshed, genuine focus loss on keyed unmount
  was found; post-commit fallback added without stealing an existing focus.
- Client unit command from repo root failed tsconfig alias resolution. Reran
  from apps/web with node --import tsx:2PASS; source not changed for this error.
- School browser regression collided with output regeneration (host-aliases.json
 404). Reran only after build completed:PASS with no errors/writes. Do not rebuild
  a served export concurrently with browser tests.

## Completed local evidence before freeze
- Node22.23.1; npm --prefix apps/web run check with SITE_SNAPSHOT_SOURCE=local,
  OFFERS_SNAPSHOT_SOURCE=local, NEXT_PUBLIC_OFFERS_SNAPSHOT_URL=/data/offers-snapshot.json:
  exit0,7host tests,112static routes. Four existing lint warnings and existing
  Next dynamic tracing warning remain. Log /tmp/questhub-mos-transition-check.log.
- apps/web npx tsc --noEmit:exit0.
- Receiver node --test --test-reporter=dot apps/yandex-lead-receiver/*.test.js:
  exit0,38tests. Client node --import tsx --test lib/mos-booking-click.test.ts:
  exit0,2tests, from apps/web. No backend source changes this turn.
- Playwright /tmp/questhub-mos-data.config.ts:20PASS; existing MockTimers warning.
- Finder browser:26PASS, /tmp/questhub-finder-transition-qa. School2103 browser:
  PASS9groups/2campuses/1000price/mobile, /tmp/questhub-school2103-transition-qa.
- Brand-package validator22checks PASS; secret-scan1330files PASS; diff --check
  exit0. Final reruns and transition browser results appended with freeze.
- Protected52 tracked apps/web/data,apps/admin,packages,.github files are byte
  identical to HEAD; hash abf58332c3313d5017f5aeb0ab97f72451d174879d183bb9b6ac9dcd500eaded.
  No staged paths, no production calls, no commits/push/deploy. Previous3197 stays.

## Freeze candidate2026-09-21
Transition browser11compound checks PASS;7axe scans0violations, color-contrast
incomplete retained explicitly.0page errors/0unexpected writes,8synthetic click
requests/4synthetic form requests. PNGs desktop390/320 inspected.320x568 header
actions reachable. Evidence /tmp/questhub-mos-transition-qa/report.json.
Minor documentation patch context mismatch made no edit; corrected context used.

HEAD917b656a9bfc9aa5d89636e993673344b6ef4680.43 primary files frozen, including
31previous-task files and12new component/design files; this task edits existing
offer-booking-action,mos-booking-copy,verify-mos-direct-booking. No other source
edits this turn. Both WEB-MOS-*.md ExecPlans excluded as execution records; prior
plan retained untouched. Algorithm SHA256(sorted relative path NUL bytes NUL).
Fingerprint1599e9f426d4a3df6ecd31c66e75380d5a33d372413813ebd500487d0b8d1549.
Manifest (all changed/untracked primary paths):
```
apps/web/components/booking-form.tsx
apps/web/components/course-finder.module.css
apps/web/components/mos-booking-countdown.tsx
apps/web/components/mos-booking-success.tsx
apps/web/components/offer-booking-action.tsx
apps/web/components/year-schedule.tsx
apps/web/content/mos-booking-copy.ts
apps/web/e2e/quest-schedule.spec.ts
apps/web/e2e/schedule-board-data.spec.ts
apps/web/e2e/schedule-board.visual.spec.ts
apps/web/lib/mos-booking-click.test.ts
apps/web/lib/mos-booking-click.ts
apps/web/lib/registration-flow.ts
apps/yandex-lead-receiver/README.md
apps/yandex-lead-receiver/index.js
apps/yandex-lead-receiver/index.test.js
apps/yandex-lead-receiver/mos-booking-click.js
apps/yandex-lead-receiver/mos-booking-click.test.js
docs/design/mos-booking-transition/README.md
docs/design/mos-booking-transition/audit.md
docs/design/mos-booking-transition/brandbook.md
docs/design/mos-booking-transition/brief.md
docs/design/mos-booking-transition/decision-log.md
docs/design/mos-booking-transition/handoff/designer.md
docs/design/mos-booking-transition/handoff/developer.md
docs/design/mos-booking-transition/input-evidence.md
docs/design/mos-booking-transition/manifest.json
docs/design/mos-booking-transition/qa/validation-report.md
docs/design/mos-booking-transition/tokens.json
docs/design/mos-direct-booking/README.md
docs/design/mos-direct-booking/audit.md
docs/design/mos-direct-booking/brandbook.md
docs/design/mos-direct-booking/brief.md
docs/design/mos-direct-booking/decision-log.md
docs/design/mos-direct-booking/handoff/designer.md
docs/design/mos-direct-booking/handoff/developer.md
docs/design/mos-direct-booking/input-evidence.md
docs/design/mos-direct-booking/manifest.json
docs/design/mos-direct-booking/qa/validation-report.md
docs/design/mos-direct-booking/tokens.json
scripts/verify-course-finder-ui.mjs
scripts/verify-mos-direct-booking.mjs
scripts/verify-school-2103-ui.mjs
```
Status FROZEN_REVIEW_PENDING. Reruns may update ignored output/evidence only.

Frozen rerun: transition browser11PASS/7axe0violations (contrast incomplete),
8mockclick/4mockform/0errors/0unexpected writes; finder26PASS at
/tmp/questhub-finder-transition-frozen-qa; TypeScript exit0; secret-scan1330PASS;
skill package22checks PASS; diff --check exit0. Same43-file hash1599e9f426d4a3df6ecd31c66e75380d5a33d372413813ebd500487d0b8d1549,
index empty. Preview open request queued in Codex for existing3198 school2103
wizard URL; this is not proof of a user-visible tab or a production deployment.

## Final review / handoff
Fresh independent readonly reviewer Banach01a0c50a-c8ca-73e3-918b-00b1ddb4f3ad:
APPROVE. No primary edits after freeze. Local UX and synthetic failure paths
complete; external delivery and production remain unverified/unpublished.
Preview http://127.0.0.1:3198/sites/school-2103/agenda/?view=catalogue . Click
Записаться на mos.ru to see countdown, pause it or opt in; optional consent form
can be completed without deadline. UI browser evidence /tmp/questhub-mos-transition-qa.
Do not treat the mock report as a real notification receipt. No staged changes,
commit, push, merge, deployment, credentials access or next-task work performed.
