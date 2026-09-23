# WEB-SCHOOL-937 — four Friday SHMI-2 groups, correct campus

## Objective / authority / preflight

2026-09-22. Owner requests adding the four supplied school937 groups to the site.
Following slice after WEB-MOS-RELEASE; its reviewed UI is committed b789b70d00747cd1078cb72dd295652fad53ac83,
PR14 (release in progress). Repo design-previews/schedule-audit-2026-09-09/repo,
branch fix/schedule-data-and-venues-2026-09-09. Worktree clean before this plan.
Governance/protected registry read. No changes to UI release candidate.
Two conflicts have been sent to owner: actual teacher (contact/name Lokteeva vs
API teacher Balukova), and advertised6–13 vs technical6–18 age. Preserve source
facts separately; no silent substitution. Do not publish disputed public fields
until owner resolves them. Implementation of unambiguous data may proceed.

## Confirmed facts and input evidence

Owner pasted transcript read fully from Codex attachment bf0a0acf-4b9a-42e5-a597-df5a65ffe667.
Four direct public API GETs verified matching identities/slots/prices/dates.
No search-based linkage, no authentication or enrollment.
К2215-26/card1049854/listing2573579/Friday14:00–14:45/free9of12;
К2216-26/card1049859/listing2573583/Friday15:00–15:45/free11of12;
К2217-26/card1049862/listing2573587/Friday16:00–16:45/free12of12;
К2218-26/card1049865/listing2573589/Friday17:00–17:45/free11of12.
All open,2026-09-28..2027-05-31,1000RUB/lesson,36000RUB/course.
Supplied programme SHMI second year; raw group titles omit year. Cabinet103 is
owner-supplied, not a verified entrance. No personal phone is added to snapshots.
Address25 is distinct from existing25k2; new LOC-011/campus
school-937-marshala-zakharova-25 under school-937. Old IDs/photo/legacy offers stay.
Coordinates55.619040,37.699562 verified via Yandex house page:
https://yandex.com/maps/213/moscow/house/ulitsa_marshala_zakharova_25/Z04YcA5pTEMFQFtvfXpweHxnZA==/
School org https://yandex.com/maps/org/shkola_937_imeni_geroya_rossiyskoy_federatsii_a_v_perova_zdaniye_1/1349921670/
No new photo: do not reuse image of25k2 for25.

## Scope / invariants / classification

Product-domain data addition, no new UI/brand or sync architecture. Parent edits.
Source supplement content/annual-additions/school-937.json; scripts/lib/school-937-source.mjs,
compose-annual-additions.mjs,import-school-937.ts; CSV entrypoint;
annual-group-overrides.ts,year-integration.ts,school-profiles.ts;
integrate-year-schedule.ts,refresh-annual-from-published.ts (four exact-code year
resolution only). Focused import/refresh/offer/UI tests and this execution record.
PA-GEN-001/PA-COMPAT-001..005 generator-only changes: source and refresh registries,
offers-snapshot plus seven cold snapshots (catalog,map,fourdetails,manifest).
Preserve all60previous groups/legacy offers, apart from explicit source revision.
No generated JSON manual edits. Existing2103 composer immutable, next composition
CSV51→2103nine→937four. Base source hash23b9dbb84ccb2e2eb577efaf94ecdca1c952603ab5ea6ebb9cb5b68d6c594c97,
full projection digesta6e74117cedf5ff7833fd072bfcc0df6215a85c30604bd0b4621e3e773e0322e.
Migration has exact preimages, backup, partial-I/O rollback and idempotent check.
Registry gains4entries but prior unsuccessful whole-refresh status/timestamps
must not be rewritten as success. Direct card IDs remain available to refresher.
Do not infer all future937 groups areSHMI2; only these four owner-provided codes.

## Sequence / gates / tests

1. Read-only architecture audit A Aquinas01a0c84d-d3e5-7203-bd31-92351e56a754:
   recommended chained composition, exact campus and code-scoped year at all
   three restore/compiler call sites; age provenance must survive restore.
   Second audit B validates source/campus boundaries and migration before freeze.
2. Parent implements source/migration/mapping. Resolve owner fields before final
   public projection. If no answer arrives, preserve local work, stop publication
   of this slice and ask; complete independent UI release meanwhile.
3. Validate import write/check; original CSV reproducibility; idempotent compiler;
  64groups/65slots/11annual addresses/18mapvenues, unchanged60+legacy; schema/TS;
   test scripts/school-937-import.test.mjs,school-2103-import.test.mjs,
   annual-overlay-refresh.test.mjs,apps/web/lib/offers/*.test.ts,Python importer tests.
   Full local-source web check then isolated browser school937 fourFridaygroups,
   exact links/1000price/SHMI2, distinct campuses, QRscope, mobile, no realPOSTs.
   make secret-scan; diffcheck; frozen fingerprints; fresh independent APPROVE.
4. Publication only after field reconciliation and separate exact release plan:
   explicit stage/commit/push/PR/CI; new campus route deployed before data; scoped
   S3CAS+backup/manifestlast, exclude concurrent publishers, preserve latest data,
   restore originalbuildmodes and publisherstates. No raw unconditionalupload.
   Existing937 QR stays /sites/school-937/agenda/. No cloud MOS scheduler repair.

## Stop / rollback / evidence

Stop on source identity/revision drift, failed tests, unresolved public facts,
conflicting remote writes or broader scope. Undo only own narrow patches; retain
source backups and never reset user work. Production release remains separate
from local proof.

## Intake checkpoint — waiting for owner facts, not published

Only three new untracked files: this plan, sanitized school-937.json and focused
scripts/school-937-intake.test.mjs. The source retains raw API teacher/age and
separate ownerContext (no phone); unresolved actualTeacher/publicAgeRange explicit.
No current consumers import this supplement. All tracked source/generator/data
files unchanged; index empty. No937 commit, runtime projection or remote write.
Audit B Boyle01a0c855-34a9-7f12-87fb-2205362aec27: no blocking intake findings;
both disputed facts must be resolved before runtime publication. Three intake
tests exit0; make secret-scan1335PASS; diffcheckPASS. 64-group/compiler/browser
checks in the plan have NOT run because that implementation has not started.
Two intake product paths sorted pathNULbytesNUL SHA256:
80f529e3643fa90e27d7329aa388765b4e3fe0afe19b4147d531a838ba811e26.
Normal UI release continues independently; actual937 schedule is not yet live.
