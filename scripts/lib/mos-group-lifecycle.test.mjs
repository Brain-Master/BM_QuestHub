import assert from "node:assert/strict";
import { test } from "node:test";
import { groupLifecycle, moscowDate, sheetGroupLifecycles, currentMosRows } from "./mos-group-lifecycle.mjs";
import { refreshAnnualCards } from "./mos-annual-refresh.mjs";
import { evaluateControllerPipelineAction, normalizeSyncState } from "./mos-sync-state.mjs";
const today = "2026-09-09";
const group = { courseStart: "2026-01-01", courseEnd: today, status: "closed" };
test("zero-batch processing run is finalized, idle or unreadable state is not a false completed run", () => {
  const state=normalizeSyncState({activeRunId:"empty",runPhase:"processing",batchesTotal:0,batchesDone:0,plannerAt:new Date().toISOString()});
  assert.equal(evaluateControllerPipelineAction(state,true).action,"finalize");
  assert.equal(evaluateControllerPipelineAction(state,false).action,"none");
  assert.equal(evaluateControllerPipelineAction(normalizeSyncState(null),true).action,"plan");
});
test("Moscow inclusive lifecycle, closed admission, invalid calendar and archive flag", () => {
  assert.equal(moscowDate("2026-09-08T21:00:00Z"), today);
  assert.equal(groupLifecycle(group, today).state, "current");
  assert.equal(groupLifecycle({...group, courseEnd:"2026-09-08"}, today).state, "archived");
  assert.equal(groupLifecycle({...group, courseStart:"2026-09-10",courseEnd:"2027-05-31"}, today).state, "future");
  for (const invalid of [{}, {...group,courseStart:"2026-02-30"}, {...group,courseStart:"2026-02-29"}, {...group,courseStart:"2027-01-01"}, {...group,is_archived:"maybe"}]) assert.equal(groupLifecycle(invalid,today).state,"unknown");
  assert.equal(groupLifecycle({...group,courseStart:"2024-02-29"},today).state,"current");
  assert.equal(groupLifecycle({...group,is_archived:"TRUE"},today).state,"archived");
});
test("Sheet join excludes archives before shared-URL grouping; missing/duplicate IDs fail closed", () => {
  const groups=sheetGroupLifecycles([["shift_group_id","start_date","end_date"],["old","01.06.2026","30.06.2026"],["new","09.09.2026","31.05.2027"],["duplicate","01.06.2026","31.05.2027"],["duplicate","01.06.2026","31.05.2027"]]);
  const byUrl=new Map([["u",{url:"u",rows:["old","new","missing","duplicate"].map(shiftGroupId=>({shiftGroupId}))}]]);
  const result=currentMosRows(byUrl,groups,today);
  assert.deepEqual(result.byUrl.get("u").rows.map(r=>r.shiftGroupId),["new"]);
  assert.deepEqual(result.archivedGroupIds,["old"]); assert.equal(result.errors.length,2);
  const afterEnd=currentMosRows(result.byUrl,groups,"2027-06-01"); assert.equal(afterEnd.byUrl.size,0);
});
test("annual archived/unknown sources never call mos.ru and never receive a fresh timestamp", async () => {
  const archived={...group,courseEnd:"2026-06-30",refreshedAt:"2026-06-01T00:00:00Z"};
  const registry={version:1,expectedGroups:2,groups:{old:archived,unknown:{}},errors:[]};
  const result=await refreshAnnualCards(registry,{now:()=>"2026-09-09T00:00:00Z",fetchCard:()=>{throw Error("NETWORK_MUST_NOT_RUN");}});
  assert.equal(result.archivedGroups,1);assert.equal(result.verifiedGroups,0);assert.equal(result.ok,false);
  assert.deepEqual(result.groups,registry.groups);assert.equal(result.errors[0].code,"MOS_DATES_INVALID");
  const allArchived=await refreshAnnualCards({...registry,expectedGroups:1,groups:{old:archived}},{now:()=>"2026-09-09T00:00:00Z",fetchCard:()=>assert.fail("network")});
  assert.equal(allArchived.ok,true);assert.equal(allArchived.verifiedGroups,0);
});
