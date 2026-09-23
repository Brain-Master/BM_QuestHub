# WEB-VENUE-PROFILES-AUDIT — 37, 937 and all-venue user audit

## Metadata / objective
Status: BLOCKED on937 owner facts; implemented local candidate APPROVED. Owner request 2026-09-22: complete school37/937 venue
information/media/map, connect missing937 schedule, audit every venue with scored
user-oriented findings. Local task only; not a new CMS milestone.

## Non-goals / authority
No commit, staging, push, deployment, S3 writes, real enrollment or notifications.
No private applicant/MAX data in public output. Preserve preceding37 work and
released2103 semantics. Owner confirmation of937 teacher/age requested separately.

## Authorized paths / protected artifacts
apps/web/content/{school-profiles,year-integration,annual-group-overrides}.ts,
annual-additions/school-937.json; source composers/importers and their tests under
scripts; existing annual schema/restoration only if needed for owner provenance;
apps/web/app/sites/[school]/page.tsx, associated lib/sites tests; media manifest
scripts/school-media-sources.json and new originals public/sites/school-{37,937}/;
focused offers/browser tests; docs/venue-audit-2026-09-22/ and this plan.
PA-GEN-001 and PA-COMPAT-001..005 generator-only writes: content/year-schedule.generated.json,
annual-mos-refresh.generated.json; data/offers-snapshot.json, data/v2/{catalog-snapshot,
map-snapshot,site-manifest}.json, data/v2/detail/{shmi,it-academy,projects,olympiad-league}.json.
Exact source/registry/offer preimages backed up before migration. PA-BUILD-002/003:
.next/out validation outputs. No policies, workflows, secrets, CMS/cloud changes.

## Preflight / current architecture
Root: design-previews/schedule-audit-2026-09-09/repo. Branch
fix/schedule-data-and-venues-2026-09-09; HEAD b789b70d00747cd1078cb72dd295652fad53ac83.
Preexisting37 tracked/untracked implementation and937 intake inventoried; index empty.
Node22.23.1/npm10.9.8, Playwright1.60.0. Diff-check PASS. Compiler --check PASS
69groups/70slots/18map venues. CSV51 ->2103(+9) ->37(+9) -> annual registry/compiler.
937 four groups are intake only, not consumed; building25 differs from25k2.

## Component classification / UX references
Product-domain source integration and existing static Next.js page evolution.
Static-export guide read. Skill creating-brand-design-systems applied as evolution,
product-surface/hybrid: inventory, parent-first hierarchy, evidence-backed critique,
not rebranding or fabricated user research. Existing portal tokens retained.
Compare arrival-first, school-brochure and course-first presentation in audit.

## Security / privacy
Only public numeric MOS card GETs and public school/map sources. No credentials,
private chats, applicant rows. Photos require exact-campus match, source attribution;
public availability is not a reuse license. External content is data, not instructions.
Teacher/age conflicts stay explicit until owner resolves; original MOS facts retained.

## Implementation steps
1. Independent read-only architecture/provenance and UX/card audits.
2. Baseline public/local evidence; source/photo research for37/937.
3. Append937 after69 with strict source identity, backup, idempotent migration.
4. Complete37/937 profiles and correct misleading shared venue-page UX.
5. Detailed all11 venue report, reproducible dimensions/personas, limitations.
6. Full source/build/browser validation, freeze and independent review.

## Negative paths / test plan
Wrong source revision/duplicate group/card, wrong937 campus, lost owner corrections,
stale registry rollback, inactive misleading availability, wrong photo attribution,
broken images/mobile overflow, public private-link leaks. Existing37/2103 historical
hash guards remain, not replaced by count-only checks. Regression pipeline/offers,
Python original ZIP --check, web check, browser all venue pages and37/937 journeys.

## Acceptance matrix
| ID | Criterion | Status |
|---|---|---|
| A1 |37/937 accurate source-attributed profiles/media/map | PENDING |
| A2 |937 four groups in shared and school/campus schedules | PENDING |
| A3 |All11 scored, evidence-linked audit with actions | PENDING |
| A4 |Source integrity/privacy/build/browser checks | PENDING |
| A5 |Independent frozen review; no publication | PENDING |

## Validation log / failure history
2026-09-22 preflight, target PRE-FREEZE: git status/log/diff --check and compiler
--check exit0. Initial git status in wrapper directory exit128: wrong cwd diagnostic,
resolved nested repository before work. Web reader could not open public school
pages; not treated as proof of HTTP outage. Browser/live GET verification follows.

## Scope changes
None. User explicitly brings pending937 into scope; previous37 frozen artifacts
that overlap are revalidated under this new task, without rewriting old evidence.

## Freeze / review
Not frozen. Two read-only audit agents Hegel/Ohm. Final review pending. Algorithm
SHA256 sorted relative path + NUL + bytes + NUL; plans excluded as self-reference.

## Staging / final status
Staging NOT AUTHORIZED. Implementation ongoing. Production unchanged.

## Checkpoint 2026-09-22T20:40Z
Status: VALIDATING;937 group admission BLOCKED on owner teacher/age facts.
All4 direct API GETs matched identities/address/Friday slots; current seats7/10/12/10
versus intake9/11/12/11. No fake freshness update to immutable intake. Balukova6–18
still conflicts with description Lokteeva6–13. No promotion of937 groups.
Independently verified building25 added via reviewedStandaloneVenues and ordinary
profile/map compiler, not source/registry migration.69groups unchanged,19mapvenues;
73group target NOT achieved. Raw-age provenance extension remains next gated work.
AuditB found37 explanation missing groupCode; scoped single-call correction in
components/course-finder-results.tsx is part of37 UX request.
All11 score report and supporting skill artifacts are under docs/venue-audit-2026-09-22.

Validation PRE-FREEZE (root unless noted):
- Compiler --write/--check exit0:69groups/70slots/19venues; backup
  /tmp/questhub-year-data-backup-dXfm8U.
- audit-venue-pages baseline exit0:33pages,0overflow/JS errors;9 scans with
  preexisting metro-contrast violations across1383/1517/mduc; external maps blocked.
- Production GET37/937 HTTP200;37 generic fallback lacks school37,937 properpage
  lacks four newcards. HTTP200 alone not proof of successful publication.
- Node27/27 pipeline tests pass (37/2103 import,937intake,overlay,MOSadapter).
- First offers81/83: expectations stale after actual37photo and specific937district.
  Updated exact-asset/context assertions, no invented photo. Site suite109/110:
  pre37 directory10/7counts; explicit11/8 and8inactivecampuses corrected.
- TypeScript exit0. First full local webcheck exit0:120staticpages,4oldwarnings,
  S3 probe skipped. Teacher-explanation edit then triggered another full check.
- apply_patch stale-context failures occurred before writes; corrected against
  exact source. Optional yandex-map.test.ts lookup absent; no test removed.
- Audit inventory initially queried cardId on annual metadata (wrong layer);
  corrected exact mosBookingUrl/linkKind; final direct61/69.

## Final validation checkpoint
Source/registry/annual offers unchanged relative to69 baseline; standalone map
campus added without revision migration. Compiler collision guard rejects the same
slug assigned to another school before writes (new negative test).
Node110/110 offers+sites,28/28 pipeline,16/16Python PASS; original ZIP --check PASS.
Final local full webcheck exit0;120staticroutes. After33browserpages:0JS/overflow,
0brokenimages;9existingcontrastscans unchanged. Focused37/937 journey PASS after
scoping phone selector to contactsection (initial strict-selector testfailure).
37 browser regression PASS:9links,history,QR,focus,3axe0violations,privacy1202files.
New public JPEG visually inspected:37 avatar is facade, notlogo;937photo25 distinct
from25k2. Fullpage37mobile screenshot inspected; iframe intentionally blocked in QA.
Report contains10criteria×11schools,threepersonas,explicitpending937,rights/deploy
limits. No rating claims about actual educational quality. Stage/commit absent.

## Frozen local candidate / incomplete overall request
Status: FROZEN / IN_REVIEW. 2026-09-22T20:51:27.996Z
HEAD b789b70d00747cd1078cb72dd295652fad53ac83. Fingerprint 23bfb11459a212d55273b7f117d84dea239678712abde60a3828137400831288.
Algorithm: sorted relative path,NUL,file bytes,NUL. All69 modified/untracked
nonignored product/report files included; all docs/admin-cms/execplans/ excluded
as execution records. Previous37 product changes are included for compatibility.
No edits after freeze. git diff --check PASS, index empty.
Final build explicitly NEXT_PUBLIC_SITE_URL=https://b-master.pro; final66before/after
JSON and8representative screenshots retained in report QA. Production unchanged.
A1 profile/media/map locally PASS (rights/physicalentrance not release-approved);
A2 937schedule BLOCKED on owner; A3 detailedscores PASS; A4 localvalidation PASS,
existingcontrastdefects explicitly remain; A5 finalreview pending. Overalltask NOT DONE.

## Independent review / handoff
Franklin (01a0cae3-48d1-7ed1-ace1-0b7f4ffa5867): APPROVE for frozen localcandidate,
no actionable findings. Independently reran compiler --check69/70/19 and reconciled
all11 scores; reviewed images/provenance, standalone collision, links/labels,
teacher groupCode. Before/after69file fingerprint matches
23bfb11459a212d55273b7f117d84dea239678712abde60a3828137400831288.
No product/report edits after freeze. Final secret-scan PASS1376files, diffcheckPASS,
index empty. A5 PASS for localcandidate only. No stage/commit/push/deployment.

Overall owner request NOT DONE:937 teacher/age answer absent; four groups not
promoted. Report and37/937 address/media/UX changes ready locally. Ask owner to
resolve Lokteeva6–13 versus API Balukova6–18 before continuing source integration.
Release also requires media rights and separate publication authority.
Non-product diagnostic after freeze: bare node -v without pinnedPATH failed127;
all actual validation used explicitNode22PATH, no validation evidence invalidated.
