/** Explicit public original-image import; never replaces an existing local asset. */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const sources=JSON.parse(fs.readFileSync(path.join(root,"scripts/school-media-sources.json"),"utf8"));
for(const entry of sources){
  if(!/^(school-\d+|mduc-ekt)$/.test(entry.school)||!/^[-a-z0-9]+\.jpg$/.test(entry.file)||new URL(entry.url).hostname!=="avatars.mds.yandex.net")throw Error("MEDIA_TARGET_INVALID");
  const dir=path.join(root,"apps/web/public/sites",entry.school), target=path.join(dir,entry.file);
  if(fs.existsSync(target)){console.log(`${entry.school}/${entry.file}: retained`);continue;}
  const response=await fetch(entry.url,{redirect:"error",signal:AbortSignal.timeout(20000)});
  if(!response.ok||!response.headers.get("content-type")?.startsWith("image/jpeg")||Number(response.headers.get("content-length")??0)>5_000_000)throw Error("MEDIA_RESPONSE_INVALID");
  const data=Buffer.from(await response.arrayBuffer());
  if(data.length>5_000_000||data[0]!==255||data[1]!==216)throw Error("MEDIA_JPEG_INVALID");
  fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(target,data,{flag:"wx"});
  console.log(`${entry.school}/${entry.file}: ${data.length} bytes sha256=${createHash("sha256").update(data).digest("hex")}`);
}
