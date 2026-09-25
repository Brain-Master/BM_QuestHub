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
 assert.deepEqual(retiredAnnualListings,['2548561','2549843','2549844','2549845']);
 for(const listingId of retiredAnnualListings){assert.equal(isRetiredAnnualGroup({listingId}),true);assert.equal(isRetiredAnnualGroup({annual:{listingId},id:'renamed'}),true);}
 for(const x of [null,{},'2548561',{listingId:'25485610'},{listingId:'2463216',groupCode:'К4055-26',freeSeats:0,status:'closed'}])assert.equal(isRetiredAnnualGroup(x),false);
});
test('full refresh skips all four, retains historical records and checks school875 normally',async()=>{
 const selected=Object.fromEntries(Object.entries(registry.groups).filter(([,g])=>isRetiredAnnualGroup(g)||g.listingId==='2463216'));
 const calls=[];
 const result=await refreshAnnualCards({version:1,expectedGroups:5,groups:selected,errors:[]},{now:()=>now().toISOString(),fetchCard:async id=>{
  calls.push(id);assert.equal(id,'871045');return selected['К1981-26'];
 }});
 assert.deepEqual(calls,['871045']);assert.equal(result.archivedGroups,4);assert.equal(result.verifiedGroups,1);assert.equal(result.ok,true);
 for(const [id,g]of Object.entries(selected))if(isRetiredAnnualGroup(g))assert.deepEqual(result.groups[id],g);
});
test('capacity refresh skips four retired and eight explicitly superseded old-hot offers without archive flags',async()=>{
 const offers=snapshot.offersByQuest.shmi.filter(isRetiredAnnualGroup).map((o,i)=>({...o,id:`renamed:${i}`,scheduleCard:{...o.scheduleCard,isArchived:false}}));
 assert.equal(offers.length,12);
 const before=JSON.stringify(offers);
 const result=await refreshMosAvailability({...snapshot,offersByQuest:{shmi:offers}},registry.groups,undefined,{now,fetchCard:()=>assert.fail('retired MOS card requested')});
 assert.equal(result.archived,12);assert.equal(result.expected,0);assert.equal(result.verified,0);assert.deepEqual(result.errors,[]);assert.deepEqual(result.entries,{});assert.equal(JSON.stringify(offers),before);
});
