# WEB-MOS-DIRECT-BOOKING — direct mos.ru links, optional contacts, click notifications

## Authority / objective / preflight
Owner request2026-09-21: remove mandatory questionnaire before mos.ru; notify
BrainMaster of the click; offer the questionnaire voluntarily because portal
updates lag. This is one local frontend/receiver vertical slice, NO COMMIT,
NO PUSH, NO PRODUCTION DEPLOY or real Telegram/Sheet submission in this task.
Branch fix/schedule-data-and-venues-2026-09-09, HEAD917b656a9bfc9aa5d89636e993673344b6ef4680.
Main23493781 has the same published feature tree (previous release); no checkout
change needed. Working tree initially clean; diff --check PASS. Node22.23.1,
npm10.9.8, Playwright1.60.0. Baseline receiver tests25/25 PASS.
Status: LOCAL IMPLEMENTATION COMPLETE / APPROVE / NOT PUBLISHED. Classification: product_domain, existing identity evolution.

## Scope / paths / protected boundaries
Frontend: apps/web/components/{offer-booking-action,mos-booking-success,booking-form}.tsx;
also course-finder.module.css for native-anchor parity and year-schedule.tsx
for its existing direct booking links (same event contract).
apps/web/lib/registration-flow.ts; new lib/mos-booking-click.ts and its test;
new scoped copy content/mos-booking-copy.ts; relevant component/e2e regression
tests including existing scripts/verify-course-finder-ui.mjs and
scripts/verify-school-2103-ui.mjs; new scripts/verify-mos-direct-booking.mjs.
Receiver: apps/yandex-lead-receiver/index.js, new mos-booking-click.js and tests,
existing index.test.js only for truthful optional-form message expectations;
README.md documents additive event contract and deployment requirements.
Documentation: this plan, docs/design/mos-direct-booking/** (small product-surface
handoff required by selected design skill, not a brand redesign).
PA-COMPAT-007: existing booking UI changes only for available mos actions;
PA-BUILD-002/003: local generated web build output only, never staged.
No snapshots, content data, prices, teachers, public URLs, credentials, runtime
envs, deployment scripts, workflows, CMS/API auth contracts or dependencies changed.
Public lead receiver gains a separate validated event; ordinary lead fields,
consent,21-column Sheet contract and deadline behavior remain intact.
This owner request authorizes that additive non-PII notification capability;
production activation requires a later explicit release including the receiver.

## UX / evidence / alternatives
Selected skill creating-brand-design-systems: evolution/product-surface/hybrid.
Existing lime finder / dark modal / shared controls retained. Parent benefit:
reach the exact school card immediately, retain our tab and optional help.
Territories evaluated: (A) obligatory choice modal (still blocks the primary
action), (B) direct primary link + optional secondary contacts (selected),
(C) direct link then auto-open questionnaire (unwanted interruption).
Main action uses a real anchor, target_blank/noopener/noreferrer, no awaited
notification and no JS-only popup. Anchor navigation works without a handler
and with notification failure. Existing query-dependent schedules themselves
require JS on cold load (empty Suspense export); no claim of whole-site no-JS
support and no unrelated SSR rewrite. Test native no-JS anchor in isolated markup.
Secondary action opens the existing consent form; honest copy says contacts are
optional, faster contact from our team is not priority in the mos.ru queue,
not a reserved place. Successful form never auto-opens a duplicate portal tab.
Failure keeps the user's form and retry path, plus a visible direct portal link.
No live network POST or synthetic lead is permitted during browser QA.

## Architecture / new event contract
OfferBookingAction is the shared consumer in finder, programme groups and legacy
schedule cards. Existing action gates (sold out, archived, missing link) retained.
Browser emits best-effort POST event booking.mos_click to existing lead endpoint,
with only offer/quest/venue/variant IDs and a random per-event ID. No contact,
child data, cookie ID, IP, referrer or page URL is added. Existing analytics
consent remains unchanged. Navigation does not await network; failures are not
shown as a failed booking. Browser keepalive is best effort, not delivery proof.
Receiver validates exact fields/size/origin, resolves labels and destination
from the fixed public snapshots (not caller-supplied text/URLs), and sends a
separate Telegram message marked 'click, not an application'. It does not write
a fake lead to Sheets or n8n. Endpoint is anonymous and Origin is not identity;
bounded per-instance deduplication/cooldowns are explicitly not a distributed
anti-abuse or exactly-once guarantee. No automatic uncertain POST retry.
Source reads and Telegram request have bounded time/body limits and safe logs.

## Validation / acceptance
Read-only audit A: all entry points, state contracts and optional form preservation.
Read-only audit B: anonymous event validation, canonical lookup, abuse limits,
timeouts, event-vs-lead separation and test false-pass risks.
Commands: Node22 receiver npm test; web tsc --noEmit --incremental false;
node --import tsx --test targeted lib/component tests (apps/web cwd);
local-source npm --prefix apps/web run check; browser scripts with isolated
synthetic lead/click responses; full existing finder browser regression.
Test actual anchors, keyboard/middle/modified clicks, absent JS, failed/hung
notifications, strict event payload, duplicate clicks, optional form consent,
success without auto popup, failure preserving input, sold-out/disabled paths,
desktop/mobile320/390, focus and accessible action names; no real submissions.
Capture screenshots, inspect visually, report mocks separately from deployment.
Freeze primary changed paths/bytes excluding this execution record; fresh
independent final review must APPROVE. Secret scan even though no commit.

## Rollback / stop / execution record
Local task edits only; restore via an explicit reviewed patch if necessary.
Stop for unexpected user changes, production needs, credentials, new dependency,
unresolved scope/rights or unsupported promises. No next task.
Failure history: none in baseline tests; oversized combined tool reads truncated,
instruction remainders read separately. Further evidence added as work proceeds.

## Implementation evidence / findings addressed
Audit A (Poincare): shared6 callsites plus separate YearSchedule; no-JS cold
export limitation recorded; preserve variant URLs/gates, form fields and focus.
Audit B (Planck): event+PII segregation, exact Origin/content-type/size, fixed
source lookup, deadlines and per-instance limits. Implementation follow-up found
omitted/main variant cooldown alias; now canonical offer+venue+URL is reserved
after lookup, before Telegram, with a concurrent regression.
Native link and optional contacts implemented in the existing visual language.
Error leaves values/consent in place; stale completion from a closed form cannot
replace a reopened form; success focuses heading and never auto-opens mos.ru.
Close control was hidden behind the modal header: raised above it and enlarged
to44px; verified by actual pointer clicks at320/390px. Phone ref and field-error
associations repaired inside the same form. No source data/availability changes.

Validation before freeze (Node22.23.1):
- `node --test --test-reporter=dot apps/yandex-lead-receiver/*.test.js`:38/38 PASS.
- apps/web cwd `node --import tsx --test lib/mos-booking-click.test.ts`:2/2 PASS.
- `apps/web/node_modules/.bin/playwright test --config=/tmp/questhub-mos-data.config.ts`:
  isolated existing schedule-board-data.spec.ts,20/20 PASS, no browser server.
- `SITE_SNAPSHOT_SOURCE=local OFFERS_SNAPSHOT_SOURCE=local NEXT_PUBLIC_OFFERS_SNAPSHOT_URL=/data/offers-snapshot.json npm --prefix apps/web run check`:
  PASS,112 static routes,7 host tests;4 pre-existing lint warnings and Next tracing
  warning unchanged. Log /tmp/questhub-mos-direct-check-final.log.
- `npm --prefix apps/web exec -- tsc --noEmit --incremental false -p apps/web/tsconfig.json`:PASS.
- `node scripts/verify-mos-direct-booking.mjs`:7 compound checks PASS;
  4 axe scans,0 violations, contrast-incomplete cases disclosed;8 synthetic click
  events/3 form requests;0 page errors/unknown POSTs. Actual keyboard,middle/Ctrl,
  notification503/abort/hang,optionalconsent/error/retry/no-auto-popup/stale-session,
  native isolated noJS link,320/390px reflow and touch-close.
- `PREVIEW_URL=http://127.0.0.1:3198 QA_OUTPUT=/tmp/questhub-finder-mos-direct-qa node scripts/verify-course-finder-ui.mjs`:26 PASS.
- `PREVIEW_URL=http://127.0.0.1:3198 QA_OUTPUT=/tmp/questhub-school2103-mos-direct-qa node scripts/verify-school-2103-ui.mjs`:PASS,9groups/2campuses/1000price/mobile.
- Current local public snapshot identity cross-check:91/91 mos offer/variant
  combinations resolve; no missing IDs. No external API called for this check.
- Skill package validator:22 checks PASS. `make secret-scan`:PASS1317files.
  `git diff --check`:PASS. Final frozen reruns recorded below.

Failure history during implementation: first new browser pass found low-contrast
success helper text; corrected along with form labels/placeholders. First domain
test run19/20: old fallback-screen expectation; replaced with explicit optional
copy/no-priority/no-replacement assertions,20/20. No tests weakened/skipped to
hide a defect. Old Windows PNG visual baselines not overwritten; full legacy
visual suite not run. New local screenshots inspected separately, not a claim
of production rendering or old-baseline equivalence. No user study/full WCAG audit.

Protected apps/web/data,apps/admin,packages,.github:52 tracked files equal HEAD,
SHA256(sorted path NUL bytes NUL)=abf58332c3313d5017f5aeb0ab97f72451d174879d183bb9b6ac9dcd500eaded.
No commit/staging/push/deploy or real lead/click submissions. Next task not started.
Local static preview port3198 serves the tested export; previous3197 process preserved.
Production requires separate approval and receiver-first rollout with both JS
files packaged, exact allowed origins, existing30s lead timeout and correlated
delivery readback. Best-effort events may be lost/suppressed; not a conversion counter.

## Frozen candidate / independent final review
Primary file manifest: all31 modified/untracked implementation/test/design files,
excluding only this self-referential execution record. HEAD remains917b656a9bfc9aa5d89636e993673344b6ef4680.
Audit A final sanity: no additional concrete UX bug; no edits. Candidate frozen.
Algorithm: SHA256 over lexicographically sorted relative path + NUL + file bytes + NUL.
Primary fingerprint: 03ffb281d956a4413cccacd89a91c7ea3ed6532182c6d0019f755242628a903c.
Status: FROZEN / independent final reviewer Hume: APPROVE.

Frozen paths:
- `apps/web/components/booking-form.tsx`
- `apps/web/components/course-finder.module.css`
- `apps/web/components/mos-booking-success.tsx`
- `apps/web/components/offer-booking-action.tsx`
- `apps/web/components/year-schedule.tsx`
- `apps/web/content/mos-booking-copy.ts`
- `apps/web/e2e/quest-schedule.spec.ts`
- `apps/web/e2e/schedule-board-data.spec.ts`
- `apps/web/e2e/schedule-board.visual.spec.ts`
- `apps/web/lib/mos-booking-click.test.ts`
- `apps/web/lib/mos-booking-click.ts`
- `apps/web/lib/registration-flow.ts`
- `apps/yandex-lead-receiver/README.md`
- `apps/yandex-lead-receiver/index.js`
- `apps/yandex-lead-receiver/index.test.js`
- `apps/yandex-lead-receiver/mos-booking-click.js`
- `apps/yandex-lead-receiver/mos-booking-click.test.js`
- `docs/design/mos-direct-booking/README.md`
- `docs/design/mos-direct-booking/audit.md`
- `docs/design/mos-direct-booking/brandbook.md`
- `docs/design/mos-direct-booking/brief.md`
- `docs/design/mos-direct-booking/decision-log.md`
- `docs/design/mos-direct-booking/handoff/designer.md`
- `docs/design/mos-direct-booking/handoff/developer.md`
- `docs/design/mos-direct-booking/input-evidence.md`
- `docs/design/mos-direct-booking/manifest.json`
- `docs/design/mos-direct-booking/qa/validation-report.md`
- `docs/design/mos-direct-booking/tokens.json`
- `scripts/verify-course-finder-ui.mjs`
- `scripts/verify-mos-direct-booking.mjs`
- `scripts/verify-school-2103-ui.mjs`

Frozen validation rerun, unchanged31-file hash03ffb281d956a4413cccacd89a91c7ea3ed6532182c6d0019f755242628a903c:
- receiver38/38; client2/2; domain20/20; TypeScript; full local-source web check
  (log /tmp/questhub-mos-direct-frozen-check.log) — all exit0.
- new browser7checks/4axe scans0violations; full finder26; school2103 — exit0.
- secret-scan1317files PASS; brand-package22checks PASS; diff --check PASS.
- Branch/HEAD unchanged; index empty; all primary bytes match freeze.

Final independent review (Hume01a0c3e7-b99c-75a3-a24e-f17dd8ca319e): APPROVE.
All31 primary files reviewed,91 variant destinations independently verified,
receiver38/client2 independently rerun. No actionable defects; fingerprint
03ffb281d956a4413cccacd89a91c7ea3ed6532182c6d0019f755242628a903c confirmed.
Approval is for local implementation only; real delivery/deployment and old
Windows visual-baseline comparison remain outside this completion claim.
Final git:14 modified tracked files plus17 new primary files and this new plan;
32 changed paths total; nothing staged, no commit, push or deploy. No next task.
