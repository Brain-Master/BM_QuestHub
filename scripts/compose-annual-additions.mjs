/** Ordered reviewed additions, including the owner-confirmed1212/937 transition. */
import fs from 'node:fs';
import {composeSchool2103} from './lib/school-2103-source.mjs';
import {composeSchool37} from './lib/school-37-source.mjs';
import {composeConfirmedSchools} from './lib/confirmed-school-source.mjs';
const addition=school=>JSON.parse(fs.readFileSync(new URL(`../apps/web/content/annual-additions/school-${school}.json`,import.meta.url),'utf8'));
const original=JSON.parse(fs.readFileSync(0,'utf8'));
process.stdout.write(JSON.stringify(composeConfirmedSchools(composeSchool37(composeSchool2103(original,addition('2103')),addition('37')),addition('1212'),addition('937'))));
