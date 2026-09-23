import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {schoolProfiles} from '../../content/school-profiles';
import {venueSchema} from '../schemas';
const venues=venueSchema.array().parse(JSON.parse(fs.readFileSync('data/v2/map-snapshot.json','utf8')).venues);
test('937 has two distinct verified buildings, correct photos, and no fabricated offers',()=>{
 const school=venues.filter(v=>v.schoolScopeSlug==='school-937');
 assert.equal(school.length,2);
 const old=school.find(v=>v.slug==='school-937-orekhovo')!;
 const current=school.find(v=>v.slug==='school-937-marshala-zakharova-25')!;
 assert.equal(old.address,'ул. Маршала Захарова, 25, корп. 2');
 assert.equal(current.address,'ул. Маршала Захарова, 25');
 assert.deepEqual([current.latitude,current.longitude],[55.619040,37.699562]);
 assert.equal(current.photos[0].url,'/sites/school-937/zakharova-25-original.jpg');
 assert.equal(old.photos[0].url,'/sites/school-937/zakharova-25k2-original.jpg');
 assert.match(current.entranceNote??'',/кабинет 103/);
 const source=JSON.parse(fs.readFileSync('content/year-schedule.generated.json','utf8'));
 assert.equal(source.groups.filter((g:{locationId:string})=>g.locationId==='LOC-011').length,4,'four explicitly confirmed groups, not inferred from the venue');
});
test('37 imagery is honestly labelled as a building, not an invented school emblem',()=>{
 const p=schoolProfiles['school-37'];
 assert.match(p.logoAlt??'',/Здание школы/);
 assert.ok(fs.existsSync('public'+p.logoUrl));
 const campus=p.campuses['school-37-michurinsky-28'];
 assert.match(campus.photoSource??'',/1318471492/);
 assert.match(campus.contactNote??'',/Кузнецова Ольга Максимовна/);
 assert.ok(fs.existsSync('public'+campus.photoUrl));
});
