# WEB-CAMP-FINDER-STYLE-2026

## Metadata / Task Packet
Status IMPLEMENTING. User requested camp step-by-step finder in the same style as annual courses, continuation of authorized site implementation/publication. Repo Brain-Master/BM_QuestHub; current branch fix/schedule-data-and-venues-2026-09-09; base dc929bb10c0f318787f71c4d681c2e1907fdf8bc. Started 2026-10-07 Europe/Moscow. Parent sole writer.

## Objective and non-goals
Use existing annual finder CSS for camp wizard: light surface, wordmark, numbered progress, selection cards, age panel, navigation. Preserve camp filtering, URL scope, unknown data, registration, S3. No annual redesign, data changes, dependencies, infrastructure changes.

## Authorized / forbidden paths
Write apps/web/components/camp-finder.tsx and this plan. Read annual component/CSS/domain, existing scripts/docs. External QA reports/helpers under /home/xipsin/projects/BM_QuestHub/reports/camp-finder-style-2026-10-07. Existing CSS imported without changes. Protected data/S3/runtime/workflows/credentials unchanged; PA-BUILD-002/003 generation only through check. Existing deployment read-only helper may consume credentials without output. Scoped commit/push/PR/merge/autodeploy authorized by ongoing user site change request; no branch change. Preserve all unrelated dirty paths.

## Preflight
2026-10-07: pwd/root/branch/HEAD/status(all files)/log/diffcheck exit0. Node22.23.1/npm10.9.8. Prior task full check/live browser passed same base. Root AGENTS/PLANS, web AGENTS and local Next CSS documentation read. No dependency install. Two unrelated tracked plans and existing untracked docs/scripts/services preserved.

## Architecture / classification
CampFinder product_domain: URL-controlled selection -> unchanged pure camp match/steps -> schedule cards/booking. Annual CSS is existing product UI styling with second actual consumer; no extracted library. Scope CSS to wizard controls to avoid styling booking dialogs or dark result cards. No network/data-layer edits.

## UX / security
Match annual light wizard, selected cards and green CTA, visible numbered progress. Keep catalogue unchanged. Native buttons with aria-pressed, semantic labelled steps, keyboard focus outline, focus heading after step change, mobile 320/390 and desktop1440. Keep unknown conditions visible, never invent dates/age/address. No child data in URLs. All browser POSTs intercepted, no test leads. Existing loading/error notices outside constructor retained.

## Implementation
1 Import existing annual CSS; add wizard-only header/progress/question shell.
2 Show school/campus/date choice cards, retain age native select and URL updates.
3 Verify local screenshots and browser back/reload/scope/unknown conditions; full check and offer tests; two audits; freeze and secret scan; exact staging/commit; existing deploy and live browser.

## Negative paths
Unknown school/campus/date remains empty results; pending address/date explicit. All locations/date/age skip selections retained. Back/reload URL state retained. Do not modify annual filters/registration APIs.

## Acceptance / test plan
A1 annual shared classes and light theme visibly match: screenshots1440/390/320.
A2 card selection/steps/back/reload/result scope: Playwright external helper.
A3 annual unaffected and existing camp regression browser: prior browser helper plus focused wizard assertions.
A4 npm --prefix apps/web run check; node --import tsx --test lib/offers/*.test.ts (cwd apps/web); git diff --check; make secret-scan. No new implementation-mirroring unit tests needed for styling.
A5 protected hashes unchanged, two APPROVE reviews, exact-SHA deploy and live verification.

## Validation / failures / scope changes
Target PRE-FREEZE. Validation pending. Read-only documentation lookup initially used .mdx instead of .md, corrected via rg discovery; no files modified by failed read. No scope changes.

## Audits / freeze / staging / final
Two independent read-only auditors required; findings and receipts stored externally. Freeze SHA256 sorted relativepath+NUL+bytes+NUL; this plan included, receipt external avoiding self-reference. Secret scan before explicit stage; staged bytes must match freeze. Commit fix(web): align camp wizard with annual course design. Stop on data drift, failed checks, review blockers. No next task. Completion and deploy receipts external; status not DONE until live verification.

## Validated candidate
2026-10-07 Europe/Moscow. Full npm --prefix apps/web run check PASS final source (log /tmp/camp-style-check-final2.log);118offer tests PASS (/tmp/camp-style-tests.log); git diff --check PASS. External browser.mjs baseline regression PASS1440/390, including mocked503/retry; style-browser.mjs finalPASS1440/390/320 checks identical computed annual theme, selected cards, keyboard cross-route focus, school disclosure, dates/age/back/reload, unknownvalues, axe WCAG2A/AA+2.1AA, nooverflow. Screenshots visually inspected. All production writes intercepted. Style test firstfailed because it expected a selected campus card to remainafter choosing knownexactcampus; existing campSteps correctly advances to dates, test corrected without changingproductlogic; failed log retained. Finalschool disclosure makes selectedschool compact without newURLstate; native keyboard verified. Two initial+diff audits report no blockers. No source data/annualCSS/domain changes.

Status FROZEN after this append. External freeze.json captures both authorized paths, sourcebase and hashes. Finalreview/secret/stage/deploy completion receipts external. No edits after freeze. STOP until two finalAPPROVE and secretPASS. Remaininguncertain campdata unchanged bydesign.
