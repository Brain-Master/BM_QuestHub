import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {refreshAnnualSelection, runSelection} from './refresh-annual-selection.mjs';
import {historical69} from './lib/confirmed-school-source.mjs';

const source = historical69(JSON.parse(fs.readFileSync(new URL('../apps/web/content/year-schedule.generated.json', import.meta.url))));
const baseline = JSON.parse(fs.readFileSync(new URL('./fixtures/annual-69-before-1517/registry.json', import.meta.url)));
const ids = ['listing:2415012', 'К7648-26', 'К7651-26', 'listing:2542312', 'К7733-26'];
const seats = [1, 4, 1, 2, 2];
const now = () => '2026-09-23T01:00:00.000Z';
const fake = (calls = []) => async (cardId, expected) => {
  const index = ids.findIndex(id => baseline.groups[id].cardId === cardId);
  assert.notEqual(index, -1, 'no requests outside the selected school');
  const row = baseline.groups[ids[index]];
  assert.deepEqual(expected, {listingId: row.listingId, groupCode: row.groupCode});
  calls.push(cardId);
  return {...row, status: 'open', totalSeats: 15, freeSeats: seats[index]};
};

test('exact five identities refresh without claiming global success or losing other errors', async () => {
  const calls = [], original = structuredClone(baseline);
  original.errors.push({groupId: ids[0], phase: 'card', code: 'MOS_TIMEOUT'});
  const input = structuredClone(original);
  const result = await refreshAnnualSelection(source, input, ids, {fetchCard: fake(calls), now});
  assert.equal(result.ok, true); assert.equal(result.candidate.ok, false);
  assert.equal(result.candidate.expectedGroups, 69); assert.equal(result.candidate.verifiedGroups, 5);
  assert.deepEqual(calls.sort(), ids.map(id => baseline.groups[id].cardId).sort());
  assert.deepEqual(input, original, 'input is not mutated');
  assert.deepEqual(result.candidate.errors, baseline.errors);
  assert.ok(result.candidate.errors.some(e => e.groupId === 'К4956-26' && e.code === 'MOS_TIMEOUT'));
  assert.deepEqual(result.candidate.candidates, baseline.candidates);
  for (const [id, card] of Object.entries(baseline.groups)) {
    if (!ids.includes(id)) assert.deepEqual(result.candidate.groups[id], card);
    else {
      assert.equal(result.candidate.groups[id].refreshedAt, now());
      assert.equal(result.candidate.groups[id].freeSeats, seats[ids.indexOf(id)]);
      assert.equal(result.candidate.groups[id].status, 'open');
      assert.equal(result.candidate.groups[id].totalSeats, 15);
    }
  }
});

test('empty/duplicate/unknown/unregistered/revision mismatch fails before network', async () => {
  const forbidden = async () => {assert.fail('unexpected network');};
  for (const selection of [[], [ids[0], ids[0]], ['not-a-group'], ['К4046-26']]) {
    await assert.rejects(refreshAnnualSelection(source, baseline, selection, {fetchCard: forbidden, now}), /SELECTION_INVALID/);
  }
  await assert.rejects(refreshAnnualSelection({...source, sourceSha256: '0'.repeat(64)}, baseline, ids, {fetchCard: forbidden, now}), /REVISION_MISMATCH/);
  const moved = structuredClone(baseline); moved.groups[ids[0]].listingId = '999';
  await assert.rejects(refreshAnnualSelection(source, moved, ids, {fetchCard: forbidden, now}), /IDENTITY_MISMATCH/);
  const duplicate=structuredClone(baseline);duplicate.groups[ids[1]].cardId=duplicate.groups[ids[0]].cardId;duplicate.groups[ids[1]].link=duplicate.groups[ids[0]].link;
  await assert.rejects(refreshAnnualSelection(source,duplicate,ids,{fetchCard:forbidden,now}),/DUPLICATE_CARD/);
});

test('Moscow-midnight archival cannot turn zero requests into successful selection', async () => {
  const ending=structuredClone(baseline);
  for(const id of ids)ending.groups[id].courseEnd='2026-09-23';
  let ticks=0;
  const result=await refreshAnnualSelection(source,ending,ids,{
    now:()=> ++ticks<=11?'2026-09-23T20:59:59.000Z':'2026-09-23T21:00:00.000Z',
    fetchCard:async()=>{assert.fail('archived card must not be requested');},
  });
  assert.equal(result.ok,false);assert.equal(result.candidate,null);
  assert.deepEqual(result.errors,[{phase:'selection',code:'ANNUAL_SELECTION_INCOMPLETE'}]);
});

test('archive and stale clocks reject before requests; no source-freshness fabrication', async () => {
  const forbidden = async () => {assert.fail('unexpected network');};
  await assert.rejects(refreshAnnualSelection(source, baseline, ids, {fetchCard: forbidden, now: () => '2025-01-01T00:00:00Z'}), /STALE_CLOCK/);
  await assert.rejects(refreshAnnualSelection(source, baseline, ids, {fetchCard: forbidden, now: () => '2028-01-01T00:00:00Z'}), /NOT_CURRENT/);
});

test('effective study year cannot change silently through a refreshed source title', async t => {
  const f = repository(t), before = fs.readFileSync(f.registryPath, 'utf8');
  await assert.rejects(runSelection({repositoryRoot: f.dir, ids, write: true, now, fetchCard: async (card, expected) => {
    const row = await fake()(card, expected);
    return card === baseline.groups[ids[0]].cardId ? {...row, title: 'Школа молодого IT-инженера (3 год обучения)'} : row;
  }}), /YEAR_REVIEW_REQUIRED/);
  assert.equal(fs.readFileSync(f.registryPath, 'utf8'), before);
});

test('one failed card prevents all selected changes; location/identity/partial/capacity guards survive', async () => {
  for (const [code, change] of [
    ['MOS_TIMEOUT', () => {throw Error('MOS_TIMEOUT');}],
    ['MOS_IDENTITY_CHANGED', row => ({...row, groupCode: 'WRONG'})],
    ['MOS_LOCATION_REVIEW_REQUIRED', row => ({...row, address: 'Другой корпус'})],
    ['MOS_PARTIAL_FIELDS', row => ({...row, freeSeats: null})],
    ['MOS_INVALID_CAPACITY', row => ({...row, freeSeats: 16})],
  ]) {
    const unchanged = structuredClone(baseline);
    const result = await refreshAnnualSelection(source, unchanged, ids, {now, fetchCard: async (card, expected) => {
      const row = await fake()(card, expected);
      return card === baseline.groups[ids[0]].cardId ? change(row) : row;
    }});
    assert.equal(result.ok, false); assert.equal(result.candidate, null);
    assert.deepEqual(result.errors, [{groupId: ids[0], phase: 'card', code}]);
    assert.deepEqual(unchanged, baseline);
  }
});

function repository(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'questhub-selection-test-'));
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  const content = path.join(dir, 'apps/web/content'); fs.mkdirSync(content, {recursive: true});
  const registryPath = path.join(content, 'annual-mos-refresh.generated.json');
  const sourcePath = path.join(content, 'year-schedule.generated.json');
  fs.writeFileSync(registryPath, JSON.stringify(baseline, null, 2) + '\n');
  fs.writeFileSync(sourcePath, JSON.stringify(source, null, 2) + '\n');
  return {dir, registryPath, sourcePath};
}

test('dry-run/failure do not write; successful application saves exact preimage', async t => {
  const f = repository(t), before = fs.readFileSync(f.registryPath, 'utf8');
  const dry = await runSelection({repositoryRoot: f.dir, ids, fetchCard: fake(), now});
  assert.equal(dry.selectionOk, true); assert.equal(dry.applied, false);
  assert.equal(fs.readFileSync(f.registryPath, 'utf8'), before);
  const failed = await runSelection({repositoryRoot: f.dir, ids, write: true, now, fetchCard: async () => {throw Error('MOS_TIMEOUT');}});
  assert.equal(failed.selectionOk, false); assert.equal(failed.applied, false);
  assert.equal(fs.readFileSync(f.registryPath, 'utf8'), before);
  const applied = await runSelection({repositoryRoot: f.dir, ids, write: true, fetchCard: fake(), now});
  t.after(() => fs.rmSync(applied.backup, {recursive: true, force: true}));
  assert.equal(applied.applied, true); assert.equal(applied.wholeRegistryOk, false);
  assert.equal(fs.readFileSync(path.join(applied.backup, 'registry.json'), 'utf8'), before);
  assert.equal(JSON.parse(fs.readFileSync(f.registryPath)).groups[ids[1]].freeSeats, 4);
  assert.deepEqual(JSON.parse(fs.readFileSync(f.sourcePath)), source);
});

test('source or registry changed during reads is preserved and not overwritten', async t => {
  for (const target of ['registryPath', 'sourcePath']) {
    const f = repository(t), concurrent = JSON.stringify(target === 'sourcePath' ? {...source, asOf: '2026-09-09'} : {...baseline, attemptedAt: now()});
    await assert.rejects(runSelection({repositoryRoot: f.dir, ids, write: true, now, fetchCard: async (card, expected) => {
      fs.writeFileSync(f[target], concurrent);
      return fake()(card, expected);
    }}), /PREIMAGE_CHANGED/);
    assert.equal(fs.readFileSync(f[target], 'utf8'), concurrent);
  }
});
