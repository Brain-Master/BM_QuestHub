/** Local, explicit card selection. No credentials, publication or implicit retry. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {refreshAnnualCards} from './lib/mos-annual-refresh.mjs';
import {groupLifecycle, moscowDate} from './lib/mos-group-lifecycle.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(new URL('../apps/web/package.json', import.meta.url));
const {require: tsRequire} = require('tsx/cjs/api');
const {yearScheduleSchema} = tsRequire('../apps/web/lib/year-schedule.ts', import.meta.url);
const {annualMosRefreshSchema} = tsRequire('../apps/web/lib/offers/annual-schedule.ts', import.meta.url);
const {annualProgrammeName} = tsRequire('../apps/web/lib/offers/annual-programme-name.ts', import.meta.url);
const {reviewedGroupCodes, reviewedStudyYear} = tsRequire('../apps/web/content/annual-group-overrides.ts', import.meta.url);
const {annualLocations} = tsRequire('../apps/web/content/year-integration.ts', import.meta.url);

export async function refreshAnnualSelection(sourceInput, registryInput, ids, options = {}) {
  const source = yearScheduleSchema.parse(sourceInput);
  const registry = annualMosRefreshSchema.parse(registryInput);
  const sourceGroups = Object.fromEntries(source.groups.map(g => [g.id, g]));
  if (source.sourceSha256 !== registry.sourceSha256 || source.groups.length !== registry.expectedGroups ||
    Object.keys(registry.groups).some(id => !Object.hasOwn(sourceGroups, id))) throw Error('ANNUAL_SOURCE_REVISION_MISMATCH');
  if (!Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length ||
    ids.some(id => typeof id !== 'string' || !Object.hasOwn(sourceGroups, id) || !Object.hasOwn(registry.groups, id))) {
    throw Error('ANNUAL_SELECTION_INVALID');
  }
  const now = options.now ?? (() => new Date().toISOString());
  const effectiveYear = (id, card) => {
    const original = sourceGroups[id];
    const location = annualLocations.find(l => l.sourceId === original.locationId);
    if (!location) throw Error('ANNUAL_SELECTION_LOCATION_UNKNOWN');
    return reviewedStudyYear(location.schoolScopeSlug, original.groupCode) ?? annualProgrammeName(card.title).studyYear;
  };
  if (new Set(ids.map(id => registry.groups[id].cardId)).size !== ids.length) throw Error('ANNUAL_SELECTION_DUPLICATE_CARD');
  for (const id of ids) {
    const previous = registry.groups[id], original = sourceGroups[id];
    const expectedCode = reviewedGroupCodes[id] ?? original.groupCode;
    if (!expectedCode || previous.listingId !== original.listingId || previous.groupCode !== expectedCode) {
      throw Error('ANNUAL_SELECTION_IDENTITY_MISMATCH');
    }
    if (!['current', 'future'].includes(groupLifecycle(previous, moscowDate(now())).state)) {
      throw Error('ANNUAL_SELECTION_NOT_CURRENT');
    }
    if (Date.parse(now()) <= Date.parse(previous.refreshedAt)) throw Error('ANNUAL_SELECTION_STALE_CLOCK');
  }
  const selected = new Set(ids);
  const result = await refreshAnnualCards({
    ...registry, expectedGroups: ids.length, verifiedGroups: 0, archivedGroups: 0, ok: false,
    groups: Object.fromEntries(ids.map(id => [id, registry.groups[id]])), candidates: {}, errors: [],
  }, {fetchCard: options.fetchCard, now, sourceGroups: Object.fromEntries(ids.map(id => [id, sourceGroups[id]]))});
  // All-or-nothing for this explicit selection; even four successes out of five
  // cannot replace the registry or appear as a completed correction.
  if (!result.ok || result.verifiedGroups !== ids.length) return {ok: false,
    errors: result.errors.length ? result.errors : [{phase: 'selection', code: 'ANNUAL_SELECTION_INCOMPLETE'}], candidate: null};
  for (const id of ids) if (Date.parse(result.groups[id].refreshedAt) <= Date.parse(registry.groups[id].refreshedAt)) {
    throw Error('ANNUAL_SELECTION_STALE_CLOCK');
  }
  for (const id of ids) if (effectiveYear(id, result.groups[id]) !== effectiveYear(id, registry.groups[id])) {
    throw Error('ANNUAL_SELECTION_YEAR_REVIEW_REQUIRED');
  }
  const errors = registry.errors.filter(e => !(selected.has(e.groupId) && ['card', 'lifecycle'].includes(e.phase)));
  const candidate = annualMosRefreshSchema.parse({
    ...registry, groups: {...registry.groups, ...result.groups}, attemptedAt: result.attemptedAt,
    verifiedGroups: ids.length, archivedGroups: 0,
    ok: ids.length === registry.expectedGroups && errors.length === 0, errors,
  });
  return {ok: true, errors: [], candidate};
}

export async function runSelection({repositoryRoot = root, ids, write = false, fetchCard, now} = {}) {
  const sourcePath = path.join(repositoryRoot, 'apps/web/content/year-schedule.generated.json');
  const registryPath = path.join(repositoryRoot, 'apps/web/content/annual-mos-refresh.generated.json');
  const sourceBytes = fs.readFileSync(sourcePath, 'utf8'), registryBytes = fs.readFileSync(registryPath, 'utf8');
  const registry = JSON.parse(registryBytes);
  const result = await refreshAnnualSelection(JSON.parse(sourceBytes), registry, ids, {fetchCard, now});
  const report = {selectionOk: result.ok, applied: false, selectedIds: ids, errors: result.errors};
  if (!result.ok) return report;
  report.wholeRegistryOk = result.candidate.ok;
  report.verifiedThisRun = result.candidate.verifiedGroups;
  report.expectedWholeRegistry = result.candidate.expectedGroups;
  report.cards = ids.map(id => ({id, before: registry.groups[id], after: result.candidate.groups[id]}));
  if (!write) return report;
  if (fs.readFileSync(sourcePath, 'utf8') !== sourceBytes || fs.readFileSync(registryPath, 'utf8') !== registryBytes) {
    throw Error('ANNUAL_SELECTION_PREIMAGE_CHANGED');
  }
  const backup = fs.mkdtempSync(path.join(os.tmpdir(), 'questhub-annual-selection-'));
  fs.writeFileSync(path.join(backup, 'registry.json'), registryBytes, {flag: 'wx'});
  // Same-directory staging makes replacement atomic even when /tmp and the
  // repository live on different filesystems. Never truncate the current file.
  const temporary = path.join(path.dirname(registryPath), `.annual-selection-${randomUUID()}.tmp`);
  let created=false;
  try {
    const descriptor=fs.openSync(temporary,'wx');created=true;
    try {fs.writeFileSync(descriptor,JSON.stringify(result.candidate,null,2)+'\n');fs.fsyncSync(descriptor);}
    finally {fs.closeSync(descriptor);}
    if (fs.readFileSync(sourcePath,'utf8')!==sourceBytes || fs.readFileSync(registryPath,'utf8')!==registryBytes) throw Error('ANNUAL_SELECTION_PREIMAGE_CHANGED');
    fs.renameSync(temporary,registryPath);
  } finally {
    // This exact unpredictable path was created by this attempt, not supplied by
    // a caller. Cleanup must not mask the primary write/validation error.
    if(created && fs.existsSync(temporary))try{fs.unlinkSync(temporary);}catch{/* backup remains available */}
  }
  return {...report, applied: true, backup};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(a => a !== '--write' && !a.startsWith('--group-id=') && !a.startsWith('--report='))) throw Error('ANNUAL_SELECTION_ARGUMENT');
  const reports = args.filter(a => a.startsWith('--report='));
  if (reports.length > 1 || args.filter(a => a === '--write').length > 1) throw Error('ANNUAL_SELECTION_ARGUMENT');
  const reportPath = reports[0]?.slice(9);
  if (reportPath && (!path.isAbsolute(reportPath) || fs.existsSync(reportPath) || !fs.statSync(path.dirname(reportPath)).isDirectory())) {
    throw Error('ANNUAL_SELECTION_REPORT_PATH');
  }
  const result = await runSelection({ids: args.filter(a => a.startsWith('--group-id=')).map(a => a.slice(11)), write: args.includes('--write')});
  if (reportPath) fs.writeFileSync(reportPath, JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
  console.log(JSON.stringify(result));
  if (!result.selectionOk) process.exitCode = 2;
}
