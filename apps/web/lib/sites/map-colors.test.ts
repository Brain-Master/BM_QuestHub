import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import {questSchema, venueSchema, worldSchema} from '../schemas';
import {getSchoolScopes} from '../offers/agenda';
import {buildSiteScopeCards} from './scope-card';
import {buildCityCards} from './city-card';
import {getSiteMapColor,buildSiteMapColorMap,campusHasNoGroups,INACTIVE_MAP_MARKER_COLOR} from './map-colors';
const read=(p:string)=>JSON.parse(fs.readFileSync(p,'utf8'));
const catalog=read('data/v2/catalog-snapshot.json'),hot=read('data/offers-snapshot.json');
const venues=venueSchema.array().parse(read('data/v2/map-snapshot.json').venues);
const quests=questSchema.array().parse(catalog.courses.map((q:{slug:string})=>({...q,offers:hot.offersByQuest[q.slug]??[]})));
const params={venues,quests,worlds:worldSchema.array().parse(catalog.worlds),scopes:getSchoolScopes(venues)};
test('directory retains inactive identities, while group-selectable sites remain six',()=>{
 const all=buildSiteScopeCards({...params,includeInactive:true}).filter(s=>s.listedOnSites);
 assert.equal(all.length,10);assert.equal(all.filter(s=>s.shiftCount===0).length,4);
 assert.equal(buildSiteScopeCards(params).length,6);
 const colors=buildSiteMapColorMap(all);
 for(const site of all){if(site.shiftCount===0){assert.equal(colors.get(site.slug),INACTIVE_MAP_MARKER_COLOR);assert.equal(getSiteMapColor({...site,mapColor:'#ff0000'}),INACTIVE_MAP_MARKER_COLOR);}else assert.notEqual(colors.get(site.slug),INACTIVE_MAP_MARKER_COLOR);}
 assert.equal(all.flatMap(s=>s.campuses.filter(c=>campusHasNoGroups(s,c))).length,8);
 const school=all.find(s=>s.slug==='school-1212')!;
 assert.ok(school.shiftCount>0);assert.ok(school.campuses.some(c=>campusHasNoGroups(school,c)));assert.ok(school.campuses.some(c=>!campusHasNoGroups(school,c)));
});
test('zero-group cities remain browsable only when the directory explicitly requests them',()=>{
 const base={city:'moscow',courseSlugs:[],shiftCount:0,studentCount:0};
 assert.equal(buildCityCards([base]).length,0);
 assert.equal(buildCityCards([base],{includeInactive:true}).length,1);
 assert.equal(buildCityCards([],{includeInactive:true}).length,0);
});
