import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import {isRetiredAnnualGroup,retiredAnnualListings} from '../../apps/web/content/annual-retirements.mjs';
import {refreshAnnualCards} from './mos-annual-refresh.mjs';
process.env.TSX_TSCONFIG_PATH=new URL('../../apps/web/tsconfig.json',import.meta.url).pathname;
const {require:tsRequire}=await import('tsx/cjs/api');
const {refreshMosAvailability}=tsRequire('./mos-live-capacity.ts',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url)));
const registry=read('../../apps/web/content/annual-mos-refresh.generated.json');
const snapshot=read('../../apps/web/data/offers-snapshot.json');
const now=()=>new Date('2026-09-24T10:00:00Z');
test('exact MOS listing identities, not group-code/name/capacity guesses',()=>{
 assert.deepEqual(retiredAnnualListings,['2548561','2549843','2549844','2549845','2463216']);
 for(const listingId of retiredAnnualListings){assert.equal(isRetiredAnnualGroup({listingId}),true);assert.equal(isRetiredAnnualGroup({annual:{listingId},id:'renamed'}),true);}
 for(const x of [null,{},'2548561',{listingId:'25485610'},{listingId:'2549783',groupCode:'К4055-26',freeSeats:0,status:'closed'}])assert.equal(isRetiredAnnualGroup(x),false);
});
test('full refresh retains five withdrawn-listing records and nine replaced2103 cards without requests',async()=>{
 const selected=Object.fromEntries(Object.entries(registry.groups).filter(([,g])=>isRetiredAnnualGroup(g)));
 const calls=[];
 const result=await refreshAnnualCards({version:1,expectedGroups:14,groups:selected,errors:[]},{now:()=>now().toISOString(),fetchCard:async id=>{
  calls.push(id);assert.fail('retired card fetched');
 }});
 assert.equal(Object.keys(selected).length,14);assert.deepEqual(calls,[]);assert.equal(result.archivedGroups,14);assert.equal(result.verifiedGroups,0);assert.equal(result.ok,true);
 for(const [id,g]of Object.entries(selected))if(isRetiredAnnualGroup(g))assert.deepEqual(result.groups[id],g);
});
test('capacity refresh skips five retired and seventeen explicitly superseded old-hot offers without archive flags',async()=>{
 const offers=snapshot.offersByQuest.shmi.filter(isRetiredAnnualGroup).map((o,i)=>({...o,id:`renamed:${i}`,scheduleCard:{...o.scheduleCard,isArchived:false}}));
 assert.equal(offers.length,22);
 const before=JSON.stringify(offers);
 const result=await refreshMosAvailability({...snapshot,offersByQuest:{shmi:offers}},registry.groups,undefined,{now,fetchCard:()=>assert.fail('retired MOS card requested')});
 assert.equal(result.archived,22);assert.equal(result.expected,0);assert.equal(result.verified,0);assert.deepEqual(result.errors,[]);assert.deepEqual(result.entries,{});assert.equal(JSON.stringify(offers),before);
});
