import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parsePreferredSchool} from './preferred-school';
import {parseSchoolHost,isUnknownSchoolHost} from './host-scope';

test('withdrawn school and its aliases cannot reappear through saved preferences',()=>{
  for(const slug of ['875','school-875','school-875-yugo-zapadnaya','school-875-vernadskogo-99k2']){
    assert.equal(parsePreferredSchool(JSON.stringify({slug,name:'Сохранённая школа'})),null);
  }
  for(const slug of ['school-2044','school-8750']){
    assert.deepEqual(parsePreferredSchool(JSON.stringify({slug,name:'Школа'})),{slug,name:'Школа'});
  }
});
test('browser host parser rejects cached875 school metadata',()=>{
 const aliases={version:1,baseDomain:'b-master.pro',portalOrigin:'https://b-master.pro',reserved:[],schools:{'875':{scopeSlug:'school-875',routeSlug:'875',name:'Школа875'},'2044':{scopeSlug:'school-2044',routeSlug:'2044',name:'Школа2044'}}};
 assert.equal(parseSchoolHost('875.b-master.pro',aliases),null);assert.equal(isUnknownSchoolHost('875.b-master.pro',aliases),true);
 assert.ok(parseSchoolHost('2044.b-master.pro',aliases));
});
