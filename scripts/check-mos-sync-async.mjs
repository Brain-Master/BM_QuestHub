#!/usr/bin/env node
/** Verify bm-mos-enrolled-sync $latest has async invocation configured. */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const YC = path.join(process.env.USERPROFILE || "", "yandex-cloud", "bin", "yc.exe");

if (!fs.existsSync(YC)) {
  console.error("[check] yc not found");
  process.exit(1);
}

const r = spawnSync(
  YC,
  [
    "serverless",
    "function",
    "version",
    "list",
    "--function-name",
    "bm-mos-enrolled-sync",
    "--limit",
    "1",
    "--format",
    "json",
  ],
  { encoding: "utf8" },
);
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(1);
}
const list = JSON.parse(r.stdout || "[]");
const ver = list[0] ?? null;
if (!ver) {
  console.error("[check] no versions");
  process.exit(1);
}
const asyncSa =
  ver.async_service_account_id ||
  ver.async_invoke_config?.service_account_id ||
  ver.async_invocation_config?.service_account_id;
console.log(`[check] version=${ver.id} timeout=${ver.execution_timeout} async_sa=${asyncSa ?? "MISSING"}`);
process.exit(asyncSa ? 0 : 1);
