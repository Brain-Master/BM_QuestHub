# WEB-SCHOOL-937-YEAR1-2026-09-28

## Task packet / authority
Repository Brain-Master/BM_QuestHub. Branch fix/schedule-data-and-venues-2026-09-09. Expected HEAD 642f274e902ada07749676abae548ed5145837ef.
Owner explicitly requests adding missing records to the live website and supplies eight exact identities, school/address, teacher, years, Wednesday/Friday slots, prices and dated capacity. Implement four missing Wednesday SHMI1 and update four Friday SHMI2 facts. Publication of this scoped content is authorized; no unrelated deployment. NO COMMIT unless needed for durable publisher source, in which case scoped fix(web): add school 937 first-year groups after checks. No force push, branch changes, unrelated staging.

## Scope / protected operations
Source addition apps/web/content/annual-additions/school-937-year1.json; scripts/lib/school-937-year1-source.mjs; scripts/import-school-937-year1.ts; scripts/compose-annual-additions.mjs; annual-group-overrides.ts and annual-owner-ages.mjs. Focused new tests and existing tests whose current group counts/source reconstruction change.
PA-GEN-001 generator-only: apps/web/content/year-schedule.generated.json, annual-mos-refresh.generated.json, apps/web/data/offers-snapshot.json. PA-GEN-003 conditional PUT only bm-questhub/data/offers-snapshot.json. No cold/media/config/auth changes. Task-local report/helpers in reports/school-937-2026-09-28. Existing deployment credentials may be consumed internally for the requested scoped publication, never printed/copied into source. Exact S3 profile from existing scripts/s3.env; existing authenticated GitHub session for durable source release if required. Existing workflows may be briefly paused only for cutover, then restored to original states. No MOS timer/VPS change.

## Preflight
Tracked tree/index clean, existing untracked docs/services preserved. Root/branch/HEAD/status/log/diff-check inspected. Initial node lookup failed because PATH omitted installed Node; resolved by selecting existing /home/xipsin/.nvm/versions/node/v22.23.1/bin. Repeated preflight PASS Node22.23.1/npm10.9.8. No install. Current source74 groups; live S3 matches local hot bytes ed6d437d13190a54b44dbe53c29c69f75f41a0cf63ec83eaa8020214b69e8839.

## Architecture / classification
product_domain data addition. Owner source plus public exact MOS cards -> append-only source composition -> registry -> existing hot compiler -> conditional publication -> existing read-only UI. Existing corpus and legacy identities unchanged. Code's explicit year/teacher/age overrides extended only to four exact codes. No schema migration.

## UX / security / non-goals
Existing school937 campus25 reused; not25k2. Four Wednesdays year1 and four Fridays year2, ages6–13, owner-confirmed teacher. No roster/student/application/contact/private-note fields published. Raw portal age/teacher remain distinct. No UI redesign, other schools, public form submissions, dependency or infrastructure changes.

## Audits
A: inspected composer, compiler and revision restoration; preserve immutable prior supplements and append a new composition stage. Update coherent source revision in registry and annual offers; old publisher must not erase unknown groups.
B: inspected publication/failure boundaries; backup current exact hot object, CAS PUT, preserve cold snapshots and non-target offer content. Live sidecar may update capacities later; historical counts never presented as a fresh scheduled run.
Required independent agents were invoked; both unavailable due service usage limit. Parent performs separate A/B read-only passes and explicit self-review fallback; no independent APPROVE claim.

## Steps / acceptance / tests
1. Confirm eight exact public MOS identities/slots/end dates (user omitted courseEnd); retain user pedagogical facts.
2. Append source composer and backed-up migration; regenerate hot only. Ensure4new IDs,8school937 offers,74previous retained, all unrelated offers byte-equivalent except coherent revision metadata.
3. New source/negative/identity tests; existing annual/import/offer tests; tsc; public snapshot validation; hot --check idempotence. Browser GET-only at desktop/mobile, verify8/4/4 and links.
4. Freeze exact source/candidate hashes and self-review fallback. Publish only after local acceptance, conditional write/readback and restore publishers. Prove browser reads public hot data.
5. Record receipt and limitations, no next task.

## Negative paths / stop / rollback
Stop on source preimage/identity drift, missing end date, duplicate ID, unsafe link, wrong address/year, schema failure, secret exposure, concurrent hot write or unavailable publication access. Backup before generator and before remote PUT. Rollback only if remote still matches this task candidate; never overwrite intervening publication.

## Validation / failures / scope changes
PRE-FREEZE. Public MOS first four cards verified on28Sep2026, end2027-05-31; counts match owner rows. Initial PATH failure and unavailable audit agents retained above. No other task or production change yet.

## Freeze / review / staging / final
Pending. Plan excluded from fingerprint. NO staging before gates; no unrelated paths. Status IMPLEMENTING. Next task not started.

## Validation checkpoint
102 offer tests PASS;22 historical migration/refresh tests PASS;3 new937 tests PASS; public15JSON/media validator PASS; migration and hot compiler --check PASS. Initial source guard exposed JSON property-order mismatch between raw composer and schema output; fixed by canonical key ordering and new reorder regression, no remote mutation. Historical tests now pin immutable74 fixtures; current count assertions updated. Typecheck found pre-existing optional scheduleCard spread in retired-schools test; same test also requires74→78 adjustment. Added explicit existence assertion to retain meaningful fixture and satisfy type narrowing. Narrow test repair included; no runtime retirement behavior changed. One edit command used web cwd with root-relative paths and failed before any writes; corrected root.

## Freeze and independent review
2026-09-29: Node22 full web check PASS,114 generated pages; tsc PASS;102 offer,22 historical,3 new source tests PASS;2 retirement tests passed after fixture narrowing. Local GET-only desktop1440/mobile390 browser6scenarios PASS8/4/4, exact identities, teacher/price and no overflow or JS errors. First browser harness expected spaced price1 000 but UI1000 is valid; changed assertion to allow whitespace, no product edit. Live old shell correctly retained4 against intercepted new-source data; this confirms need for coordinated rebuild, not deployment success.
27 product/test files frozen SHA25655b613e875265bcde849576fc2d75c0fcf8aadefb78d2b16766270379a56871c, sorted path+NUL+bytes+NUL; plan excluded. AuditorA independently reproduced and APPROVE. AuditorB deployment review found undefined metadata comparison and incomplete workflow drain checks; corrected before any remote writes, final review pending.
Full source scope also includes scripts/fixtures/annual-74-before-937-year1/{source,registry,offers}.json, historical migration tests and current count tests incl apps/web/lib/sites/retired-schools.test.ts. Prior supplements immutable. Secret scan1479PASS; diffcheckPASS.
Release authorization: owner's request to add groups on site requires durable source release and coherent hot publication. Commit fix(web): add school 937 first-year groups; exact27files plus this plan only. Push existing feature branch, create PR to main; merge after CI and conditional hot publication so auto-deploy builds matching source. Existing remote main49f3dd61e0b98e69242d2b6701abca682b4edeb9 and currentHEAD642f274 have identical trees. No other branch, UI, infra or data publication. Original Sheet sync279541681 active; enrolled282599547 disabled_manually. Pause only active hot publisher; restore only original state after matching source/remote hot/main. MOS sidecar writer untouched.

Final publication reviewer APPROVE helper SHA25682ffe7a517fb5648c4e48e79c66216915c31f5b9cb7565c1f55a8864c60e821b. Exact source freeze unchanged. Source and deployment approvals both independent. Public hot backup/candidate captured; remote not yet changed.
