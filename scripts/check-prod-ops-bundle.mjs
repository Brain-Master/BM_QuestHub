#!/usr/bin/env node
const opsId = process.argv[2] || "d4eugco206uh65ivpbtm";
const paths = process.argv.slice(3);
const pages = paths.length
  ? paths
  : ["/", "/catalog/", "/worlds/minecraft/"];

const needles = [
  opsId,
  "functions.yandexcloud.net",
  "client_submit_failed",
  "lead.client_submit_failed",
];

async function scanPage(path) {
  const base = "https://quest.b-master.pro";
  const html = await fetch(`${base}${path}`).then((r) => r.text());
  const chunks = [...html.matchAll(/\/_next\/static\/chunks\/[^"']+\.js/g)].map((m) => m[0]);
  const unique = [...new Set(chunks)];
  const hits = [];
  for (const chunk of unique) {
    const js = await fetch(`${base}${chunk}`).then((r) => r.text());
    for (const needle of needles) {
      if (js.includes(needle)) {
        hits.push({ path, chunk, needle });
        break;
      }
    }
  }
  return { path, chunks: unique.length, hits };
}

let allHits = [];
for (const path of pages) {
  const r = await scanPage(path);
  console.log(`${r.path}: ${r.chunks} chunks, ${r.hits.length} hit(s)`);
  allHits = allHits.concat(r.hits);
}

if (allHits.length === 0) {
  console.error("[bundle] OPS URL not found in scanned pages");
  process.exit(1);
}
for (const h of allHits) console.log(`  ${h.path} ${h.chunk} ← ${h.needle}`);
process.exit(0);
