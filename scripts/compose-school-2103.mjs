/** Shared CSV-import boundary: stdin is the original public CSV projection. */
import fs from 'node:fs';
import {composeSchool2103} from './lib/school-2103-source.mjs';
const source = JSON.parse(fs.readFileSync(0,'utf8'));
const addition = JSON.parse(fs.readFileSync(new URL('../apps/web/content/annual-additions/school-2103.json',import.meta.url),'utf8'));
process.stdout.write(JSON.stringify(composeSchool2103(source,addition)));
