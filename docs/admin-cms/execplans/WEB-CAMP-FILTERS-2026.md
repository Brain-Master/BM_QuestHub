# WEB-CAMP-FILTERS-2026
## Metadata and Task Packet
Status IMPLEMENTING. Owner requests /camp links open wizard by default and annual-equivalent filtering. Continuing authorized implementation/publication. Repo Brain-Master/BM_QuestHub, branch fix/schedule-data-and-venues-2026-09-09, base825d40ee7559e8c2b437668cb97fc13da7069634, 2026-10-07 Europe/Moscow. Parent solewriter; two read-only auditors.
## Objective / non-goals
Default wizard for camp root/school/campus; explicit catalogue escape. Annual-like responsive filters: school, campus, programme, dates, age, archive, summary/count/reset. Preserve shared URLs/Back/reload and failclosed unknown scopes. No annual changes, new data, infra/dependencies, booking API changes.
## Scope
Write apps/web/components/camp-finder.tsx; new camp-finder.module.css; apps/web/lib/offers/camp-finder.ts and .test.ts; thisplan. Existing annual CSS read/import only. Reports/helpers external reports/camp-filters-2026-10-07. Protecteddata/S3/runtime/workflows/secrets unchanged; PA-BUILD002/003 authorized checkgeneration only. Existing exactSHA publication/retry credentialconsumption only nooutput. Commit/push/PRmerge/autodeploy authorized by continuing userwebsite change request. Keep unrelated changes.
## Preflight
root/branch/HEAD/log/statusall/diffcheck PASS; Node22.23.1/npm10.9.8. Previousbase local/live testsPASS. Existing AGENTS/PLANS/localNextCSS/searchparams instructions stillapply. Current14unrelated dirtypaths captured /tmp/camp-filters-preflight-status.txt.
## Architecture / classification / UX
CampFinder product_domain URLstate->pure camp match/presentation/choicecounts->existingScheduleBoardCard. SharedannualCSS onlycontrols; darkcards and bookingoutside. Filters visible sidebar ondesktop catalogue, toggle onmobile/wizardresults; summary+count visible; focusnotlost at breakpoint. Native controls labels+aria-expanded/controls, keyboardfocus, nooverflow320. Explicit offerdeeplink and existing filterdeeplinks showresults. Embedded allschedule stays catalogue. Unknown date/age remain eligible+marked. Unknown scope/programme failclosed. Scope reset preservesroute. Filteroptions derived fromdata andotherselections includingarchive; unavailablechoice retained withdisabled explanation. No PII inURL; allwritesmocked inQA.
## Implementation / negative paths
1 Pure presentation defaults + programme and faceted choicecounts.
2 Wizarddefault and explicitcatalogue, responsiveannual-likefilters with resets.
3 Regression root/campus/embedded/legacy/sharedfilters/invalid/empty/archive/Back/reload/keyboard andmockedbooking.
## Validation / acceptance
Existing npm --prefix apps/web run check; node --import tsx --test lib/offers/*.test.ts (cwdapps/web); browser320/390/1440 includingnewdefault+facets,axe,oldannual unchanged,reset/scope,refresh/failure; gitdiffcheck;protectedhashes;make secret-scan;twoAPPROVE;freeze sortedpathNULbytesNUL SHA256;explicitstage+samebytes;commit fix(web): open camp wizard and align schedule filters;exactSHAdeploy+livecheck. Stop onfailedchecks,datadrift,unreviewed changes. No nexttask.
## Security / failure / scope / lifecycle
No newnetwork/secret ormutationboundary. Prerequisites available. No failures yet. Freeze/review/stage/deploy receipts external avoidselfreference. Plan includedinfingerprint. Finalstatus onlyDONE afterliveverification; externalcompletionreceipt records lifecycle.

## Final validation / failure record
2026-10-07 Europe/Moscow. Full web check PASS finalsource /tmp/camp-filters-check-layout.log;120offer tests PASS /tmp/camp-filters-tests-final.log; gitdiffcheckPASS. Browser finalPASS1440/390/320 includes barewizard/campuswizard, explicitcatalogue, facets/programme/unknownrecovery, archive35, routepreservingreset, storedlinks/Back/reload, focusatbreakpoint, axeWCAG2A/AA+2.1AA, CTAwithinbounds, annual69+ compatibility, mockedregistration503/retry. Supplemental manualrefresh10->9 + source503 cachedresults/notice PASS. Data/protectedfiles unchanged.
Failurehistory: browser repeatedly reproduced oldprogrammequery restored when returningto cachedroot after samepathhistoryedits; narrowfix uses exactURL fullnavigation onlycrosspathname, preservinglocalhistory for samepathfilters. No assertion weakened. Separate Playwright matcher reported optiondisabled asenabled despiteDOM disabled; switched assertionto native disabledproperty. Visualreview found sidebar+2cardcolumns couldclip CTA; catalogue nowonewidecolumn, explicitCTAbounds checked. Initialquery-school/venue/campus compatibility gap corrected on audit withunit/browserregression. Final allchecks passed. No further scopechange.

## Frozen record
Status FROZEN afterthisappend; sourcepaths5 listed externalfreeze.json withsortedpathNULbytesNUL SHA256, planincluded. Two independent finalreviews/secret/stage/commit/deployreceipts external. No editsafterfreeze. No S3 orruntimechanges; exactnewPR publication authorized bycurrentuser request. FinalDONE onlyafterlivebrowserconfirmation.
