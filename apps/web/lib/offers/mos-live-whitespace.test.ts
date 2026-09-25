import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { refreshMosAvailability } from '../../../../scripts/lib/mos-live-capacity';
import { annualMosRefreshSchema } from './annual-schedule';
import { mergeMosAvailability, reconcileMosAvailability } from './mos-availability';
import { questSchema } from '../schemas';
import { getScheduleBookingMode, getScheduleDisplayStatus } from './schedule-board';
import { parseOffersSnapshot } from './snapshot-parse';

test('MOS boundary whitespace is harmless but real schedule and identity changes require review', async () => {
  const snapshot = parseOffersSnapshot(JSON.parse(fs.readFileSync('data/offers-snapshot.json', 'utf8')));
  const registry = annualMosRefreshSchema.parse(JSON.parse(fs.readFileSync('content/annual-mos-refresh.generated.json', 'utf8')));
  const offer = snapshot.offersByQuest.shmi.find(o => o.id === 'year:К4609-26');
  assert.ok(offer);
  const expected = registry.groups['К4609-26'];
  const source = { ...snapshot, offersByQuest: { shmi: [offer] } };
  const run = (patch: Partial<typeof expected>) => refreshMosAvailability(source, registry.groups, undefined, {
    now: () => new Date('2026-09-24T10:00:00Z'),
    fetchCard: async () => ({ ...expected, ...patch }),
  });
  const whitespace = await run({ title: `  ${expected.title}\n` });
  assert.equal(whitespace.verified, 1);
  const changes: Partial<typeof expected>[] = [{ title: expected.title + ' другая программа' }, { courseEnd: '2027-06-30' }, { slots: [{ weekday: 'Пятница', start: '12:00', end: '12:45' }] }];
  for (const patch of changes) {
    const result = await run(patch);
    assert.equal(result.verified, 0);
    assert.equal(result.errors[0].code, 'MOS_SCHEDULE_REVIEW_REQUIRED');
  }
});

test('review blocks survive subsequent transport failures for the same binding, then clear only after verified recovery', async () => {
  const snapshot = parseOffersSnapshot(JSON.parse(fs.readFileSync('data/offers-snapshot.json', 'utf8')));
  const registry = annualMosRefreshSchema.parse(JSON.parse(fs.readFileSync('content/annual-mos-refresh.generated.json', 'utf8')));
  const offer = snapshot.offersByQuest.shmi.find(o => o.id === 'year:К4609-26'); assert.ok(offer);
  const expected = registry.groups['К4609-26'];
  const source = { ...snapshot, offersByQuest: { shmi: [offer] } };
  const catalog = JSON.parse(fs.readFileSync('data/v2/catalog-snapshot.json', 'utf8'));
  const quest = questSchema.parse({ ...catalog.courses.find((q:{slug:string})=>q.slug==='shmi'), offers:[offer] });
  const changes: Partial<typeof expected>[] = [{cardId:'9999',link:'https://www.mos.ru/pgu2/activity/card/9999'}, {address:'Other address'}, {organization:'Other organization'}, {title:'Other programme'}, {slots:[{weekday:'Пятница',start:'12:00',end:'12:45'}]}];
  for (const patch of changes) {
    let at = new Date('2026-09-24T10:00:00Z');
    const conflict = await refreshMosAvailability(source,registry.groups,undefined,{now:()=>at,fetchCard:async()=>({...expected,...patch})});
    assert.equal(conflict.verified,0);
    at = new Date('2026-09-24T10:05:00Z');
    const failed = await refreshMosAvailability(source,registry.groups,conflict,{now:()=>at,fetchCard:async()=>{throw Error('MOS_TIMEOUT');}});
    assert.equal(failed.entries[offer.id].error,conflict.entries[offer.id].error);
    const merged = mergeMosAvailability([quest],failed,at)[0].offers[0];
    assert.equal(getScheduleBookingMode(merged,getScheduleDisplayStatus(merged,at),undefined,at).kind,'disabled');
    // Client also defends against an older publisher that forgets the review cause.
    const transient = structuredClone(failed); transient.errors[0].code='MOS_TIMEOUT'; transient.entries[offer.id].error='MOS_TIMEOUT';
    assert.equal(reconcileMosAvailability(conflict,transient,at).entries[offer.id].error,conflict.entries[offer.id].error);
    at = new Date('2026-09-24T10:10:00Z');
    const recovered = await refreshMosAvailability(source,registry.groups,failed,{now:()=>at,fetchCard:async()=>({...expected,status:'open',freeSeats:2})});
    assert.equal(recovered.verified,1); assert.equal(recovered.entries[offer.id].error,undefined);
    const valid = mergeMosAvailability([quest],reconcileMosAvailability(failed,recovered,at),at)[0].offers[0];
    assert.equal(getScheduleBookingMode(valid,getScheduleDisplayStatus(valid,at),undefined,at).kind,'mos');
  }
});
