import { test } from "node:test";
import assert from "node:assert/strict";
import { projectMosCard, requestMosJson, fetchMosCard, searchMosListing } from "./mos-annual-cards.mjs";
import { refreshAnnualCards } from "./mos-annual-refresh.mjs";
import { restorePublishedAnnual } from "./mos-annual-published.mjs";
const expected = { listingId: "123", groupCode: "К1-26" };
const fixture = () => ({ circle: { number:"123",organizationName:"Школа" },group: {id:12,number:"К1-26",name:"ШМИ1",fullAddress:"Адрес",isOpen:true,classStartDate:"01.09.2026",classEndDate:"31.05.2027",placeCount:12,freeSpace:3,ageFrom:6,ageTo:12,prices:[{name:"За одно занятие",value:1000}],schedules:[{dates:[{day:2,startDate:"14:00",endDate:"14:45"},{day:4,startDate:"14:00",endDate:"14:45"}]}]}});
const reply = data => new Response(JSON.stringify({status:"success",data}),{headers:{"content-type":"application/json"}});
test('annual lifecycle rechecked before each request across Moscow midnight',async()=>{
  const card={...projectMosCard(fixture(),expected),courseEnd:'2026-09-09',refreshedAt:'2026-09-08T00:00:00.000Z'};
  let clock='2026-09-09T20:59:59.000Z',calls=0;
  const second={...card,cardId:'13',groupCode:'К2-26'};
  const r=await refreshAnnualCards({version:1,expectedGroups:2,groups:{one:card,two:second},errors:[]},{concurrency:1,now:()=>clock,fetchCard:async()=>{calls++;clock='2026-09-09T21:00:01.000Z';return card}});
  assert.equal(calls,1);assert.equal(r.archivedGroups,1);assert.equal(r.verifiedGroups,1);assert.equal(r.ok,true);assert.deepEqual(r.groups.two,second);
});
test('archive coverage includes undiscovered cards; listing errors clear only for wholly archived sources',async()=>{
  const old={listingId:'123',courseStart:'2025-09-01',courseEnd:'2026-05-31'};
  const registry={version:1,expectedGroups:1,groups:{},errors:[{listingId:'123',phase:'search',code:'MOS_TIMEOUT'}]};
  const opts={now:()=> '2026-09-09T00:00:00.000Z',fetchCard:async()=>{throw Error('Unexpected network')},sourceGroups:{old}};
  const r=await refreshAnnualCards(registry,opts);
  assert.equal(r.ok,true);assert.equal(r.archivedGroups,1);assert.deepEqual(r.errors,[]);
  const mixed=await refreshAnnualCards({...registry,expectedGroups:2},{...opts,sourceGroups:{old,current:{...old,courseEnd:'2027-05-31'}}});
  assert.equal(mixed.ok,false);assert.equal(mixed.errors[0].code,'MOS_TIMEOUT');
});
test("exact card, prices, admission and both weekdays; no sibling enrollment sum", async()=>{
  const result = await fetchMosCard("12",expected,{fetchImpl:async()=>reply({item:fixture(),otherItems:[{group:{placeCount:900,freeSpace:0}}]})});
  assert.equal(result.freeSeats,3);assert.equal(result.slots.length,2);assert.equal(result.lessonPrice,1000);assert.equal(result.coursePrice,null);
  assert.equal(result.link,"https://www.mos.ru/pgu2/activity/card/12");
});
test("next workflow preserves newer published facts across a failed card refresh",async()=>{
  const card={...projectMosCard(fixture(),expected),refreshedAt:"2026-09-08T00:00:00.000Z"};
  const registry={version:1,sourceSha256:"a".repeat(64),expectedGroups:1,groups:{"К1-26":card},errors:[]};
  const mapping={asOf:'2026-09-08',venueByGroup:{'К1-26':'school-a'}};
  const offer={id:"year:К1-26",venueSlug:'school-a',mosBookingUrl:card.link,startDate:card.courseStart,endDate:card.courseEnd,weeklySlots:card.slots,
    annual:{...card,asOf:mapping.asOf,admission:"closed",sourceSha256:registry.sourceSha256,freeSeats:0,lessonPrice:1100,refreshedAt:"2026-09-09T00:00:00.000Z"}};
  const restored=restorePublishedAnnual(registry,[offer],mapping);
  const failed=await refreshAnnualCards(restored,{fetchCard:async()=>{throw Error("MOS_HTTP_503")}});
  assert.equal(failed.groups["К1-26"].lessonPrice,1100);assert.equal(failed.groups["К1-26"].freeSeats,0);
  assert.equal(failed.groups["К1-26"].status,"closed");assert.equal(failed.groups["К1-26"].refreshedAt,offer.annual.refreshedAt);
  assert.equal(failed.ok,false);assert.equal(registry.groups["К1-26"].lessonPrice,1000);
  assert.throws(()=>restorePublishedAnnual(registry,[{...offer,mosBookingUrl:card.link+"9"}],mapping),/IDENTITY/);
  assert.throws(()=>restorePublishedAnnual(registry,[offer,offer],mapping),/DUPLICATE/);
  assert.throws(()=>restorePublishedAnnual(registry,[{...offer,venueSlug:'school-b'}],mapping),/VENUE/);
  assert.throws(()=>restorePublishedAnnual(registry,[{...offer,id:'year:unknown'}],mapping),/UNKNOWN/);
  assert.throws(()=>restorePublishedAnnual(registry,[{...offer,annual:{...offer.annual,asOf:'2026-09-10',sourceSha256:'b'.repeat(64),refreshedAt:undefined}}],mapping),/REVISION/);
  assert.throws(()=>restorePublishedAnnual({...registry,groups:{}},[offer],mapping),/REGISTRY_ENTRY_MISSING/);
  assert.throws(()=>restorePublishedAnnual(registry,[{...offer,annual:{...offer.annual,studyYear:3}}],mapping),/YEAR_REVIEW_REQUIRED/);
  await assert.rejects(refreshAnnualCards(registry,{concurrency:NaN}),/CONCURRENCY/);
});
test("identity, capacity, dates and malformed weekday fail closed",()=>{
  assert.throws(()=>projectMosCard(fixture(),{...expected,groupCode:"К2-26"}),/MISMATCH/);
  for(const patch of [{freeSpace:13},{classStartDate:"31.02.2026"},{schedules:[{dates:[{day:0}]}]}]) {
    const item=fixture();Object.assign(item.group,patch);assert.throws(()=>projectMosCard(item,expected));
  }
});
test("upstream errors never include response body and non-read routes are denied",async()=>{
  await assert.rejects(requestMosJson("/groups/12",undefined,{fetchImpl:async()=>new Response("sensitive upstream",{status:500})}),/^Error: MOS_HTTP_500$/);
  await assert.rejects(requestMosJson("/groups/subscribe",{}),/DENIED/);
  await assert.rejects(requestMosJson("/groups/12",{}),/DENIED/);
  await assert.rejects(requestMosJson("/groups/12",undefined,{fetchImpl:async()=>new Response("<html>challenge</html>")}),/NON_JSON/);
});
test("search is bounded, filtered by listing, and page repeats cannot false-pass",async()=>{
  const result=await searchMosListing("123",{fetchImpl:async(url,options)=>{assert.equal(options.method,"POST");return reply({items:[fixture()],total:1});}});
  assert.equal(result.length,1);
  await assert.rejects(searchMosListing("123",{fetchImpl:async()=>reply({items:[fixture()],total:3})}),/DUPLICATE/);
});
test("partial refresh preserves previous facts and timestamp, never reports complete",async()=>{
  const card={...projectMosCard(fixture(),expected),refreshedAt:"2026-09-08T00:00:00.000Z"};
  const registry={version:1,expectedGroups:1,groups:{"К1-26":card},errors:[]};
  const failed=await refreshAnnualCards(registry,{fetchCard:async()=>{throw Error("MOS_HTTP_503")},now:()=>"2026-09-09T00:00:00.000Z"});
  assert.equal(failed.ok,false);assert.equal(failed.verifiedGroups,0);assert.deepEqual(failed.groups,registry.groups);
  const good=await refreshAnnualCards(registry,{fetchCard:async()=>({...card,freeSeats:0,status:"closed"}),now:()=>"2026-09-09T00:00:00.000Z"});
  assert.equal(good.ok,true);assert.equal(good.groups["К1-26"].freeSeats,0);assert.equal(good.groups["К1-26"].status,"closed");
  const moved=await refreshAnnualCards(registry,{fetchCard:async()=>({...card,address:"Другой корпус"})});
  assert.equal(moved.ok,false);assert.equal(moved.errors[0].code,"MOS_LOCATION_REVIEW_REQUIRED");
  for(const patch of [{lessonPrice:null,freeSeats:null},{ageMin:15,ageMax:6},{totalSeats:1,freeSeats:3}]){
    const invalid=await refreshAnnualCards(registry,{fetchCard:async()=>({...card,...patch})});
    assert.equal(invalid.ok,false);assert.equal(invalid.verifiedGroups,0);assert.deepEqual(invalid.groups,registry.groups);
  }
});
