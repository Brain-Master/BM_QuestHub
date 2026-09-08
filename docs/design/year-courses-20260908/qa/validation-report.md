# Validation report

Initial scoped ESLint: passed. Whole-project tsc --noEmit: failed in existing schedule/data test fixtures (outside modified files); no claim of clean global baseline. First media conversion attempt found Windows-only sharp; generator now uses existing ffmpeg without dependency changes. Chromium default installation revision differed; local checks use explicit existing Chromium executable.

Visual desktop review: hierarchy, photo crops and four directions inspected. Final browser run passed 21 checks; machine-readable results and full/viewport screenshots are in browser/results.json and browser/annual-*.png. Publication/rights review and production export/deployment remain deferred. No claim of complete manual accessibility audit or user research.

## Verified scoped results

All five annual routes: HTTP 200, one heading, actual image decode, contact link and no horizontal overflow at 1440/390/320px. Desktop and mobile screenshots inspected. Native video playback succeeds; ffprobe confirms 30 seconds, video-only stream (no unverified audio). Card navigation, Reload and Back, FAQ expansion, reduced-motion styling and keyboard-visible card focus passed in the latest run before shared-page smoke checks.

Test harness corrections: scroll lazy-loaded images into view before decode/capture; wait for settled reload/back navigation and streamed shared-page headings; simulate keyboard input before asserting focus-visible. Trial native anchors were reverted; final code retains Next Link navigation and scoped lint passes. No production tests weakened or baseline fixtures edited.

Parent review A (not independent): additive static routes and local assets; no API/write path introduced; schedule SHA256 remains 8cdfac12f5b181987b427c5507792c2de9f8436ee8fab5b919666e75bfa7f911. Parent review B (not independent): crops and Cyrillic reflow inspected; archive footage labelled honestly; no new price/availability/age claims. Existing development React key warning remains outside this patch; full-site accessibility and booking regression acceptance are not claimed.

Shared-page smoke: /, /catalog/, /agenda/, /sites/, /legal/ returned 200 and rendered main content. Existing catalogue/agenda use lower-level headings, so smoke records h1 counts rather than pretending to certify their heading hierarchy. New annual pages retain the stricter one-h1 assertion. All requests outside the preview origin were blocked in the browser test; this verifies local UI, not production data delivery. Final scoped lint and changed tracked-file whitespace check pass; package validator passes 22 checks.

## WEB-SCHEDULE-01 — weekly schedule extension

- passed: deterministic import and regeneration drift check; 16 synthetic negative/positive importer unit tests.
- passed: scoped ESLint; TypeScript compiler API check of all new/modified entry points and their imports, zero diagnostics.
- failed baseline: whole-project tsc retains errors in unchanged schedule/data test fixtures; no global green claim.
- passed: final schedule browser run, 7 scenario groups covering 51 cards/52 slots/8 locations, 46 source-open/5 closed, exact school/campus joins, 1517 direct URL, no invented IDs, unknown capacity, combined filters, empty/reset, 320/390/1440 widths and keyboard focus. Results and screenshots in schedule/.
- passed: original annual-page regression script, 21 checks after integration; results /tmp/questhub-schedule-annual-regression/results.json.
- passed: mobile first-screen/filter and actual 1517 card visual inspection; no horizontal clipping.
- deferred: live mos.ru availability check, production release, complete assistive-technology audit. All public facts labelled 2026-09-08.

Failure history: initial getByLabel exact matching did not locate wrapped select labels even though accessibility tree exposed correct names; changed test to role+accessible-name selectors, no UI/test requirement weakened. Initial zero-POST assertion included Next development stack-frame diagnostics and existing agenda traffic telemetry. Final test separately asserts zero annual workspace application POSTs, records legacy-page attempts and blocks all external/non-diagnostic mutation requests. No telemetry or existing booking code changed.

Parent audit A: source joins, stable identifiers, two-slot group, no intensive snapshot mutations. Parent audit B: dated statuses, withheld synthetic capacities/registry teachers, allowlisted output fields/URLs, missing prices not zero, native controls. These are parent reviews, not independent subagent approvals.
