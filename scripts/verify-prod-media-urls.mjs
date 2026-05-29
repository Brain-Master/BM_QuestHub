#!/usr/bin/env node
/**
 * Smoke: production must not serve SPA HTML for S3 media paths on the site origin.
 *
 *   node scripts/verify-prod-media-urls.mjs
 *   SITE_URL=https://quest.b-master.pro node scripts/verify-prod-media-urls.mjs
 */
const SITE_URL = (process.env.SITE_URL ?? "https://quest.b-master.pro").replace(
  /\/$/,
  "",
);
const YC_SAMPLE =
  process.env.MEDIA_SAMPLE_PATH ?? "media/quests/cyber-rhythm/hero.webp";

const ycUrl = `https://storage.yandexcloud.net/bm-questhub/${YC_SAMPLE.replace(/^\//, "")}`;

const samples = [
  {
    label: "yandex object storage",
    url: ycUrl,
    expectContentTypePrefix: "image/",
    forbidHtml: false,
  },
];

async function head(url) {
  const res = await fetch(url, { method: "HEAD", redirect: "follow" });
  return {
    status: res.status,
    contentType: res.headers.get("content-type") ?? "",
    contentLength: res.headers.get("content-length") ?? "",
  };
}

async function catalogBundleUsesYc() {
  const pageUrl = `${SITE_URL}/catalog/`;
  const res = await fetch(pageUrl);
  if (!res.ok) throw new Error(`catalog HTTP ${res.status}`);
  const html = await res.text();
  const chunks = [
    ...html.matchAll(/\/_next\/static\/chunks\/[^"]+\.js/g),
  ].map((m) => m[0]);
  const unique = [...new Set(chunks)];
  for (const chunk of unique) {
    const js = await fetch(`${SITE_URL}${chunk}`);
    if (!js.ok) continue;
    const text = await js.text();
    if (text.includes("storage.yandexcloud.net/bm-questhub")) return true;
  }
  return false;
}

async function main() {
  let failed = 0;
  for (const sample of samples) {
    const { status, contentType, contentLength } = await head(sample.url);
    const okStatus = status === 200;
    const okType = contentType.startsWith(sample.expectContentTypePrefix);
    const isHtml = contentType.includes("text/html");
    const ok = okStatus && okType && !(sample.forbidHtml && isHtml);
    console.log(
      `[verify-prod-media] ${sample.label}\n  ${sample.url}\n  ${status} ${contentType} len=${contentLength} ${ok ? "OK" : "FAIL"}`,
    );
    if (!ok) failed++;
  }
  const bundleOk = await catalogBundleUsesYc();
  console.log(
    `[verify-prod-media] catalog client bundle references YC media: ${bundleOk ? "OK" : "FAIL"}`,
  );
  if (!bundleOk) failed++;

  if (failed > 0) {
    console.error(
      `[verify-prod-media] ${failed} check(s) failed — set NEXT_PUBLIC_S3_PUBLIC_BASE_URL in App Platform and redeploy`,
    );
    process.exit(1);
  }
  console.log("[verify-prod-media] all checks passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
