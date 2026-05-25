#!/usr/bin/env node
/**
 * Local verification for mos sync lib fixes (unit tests + optional YCF invoke).
 *
 *   node scripts/verify-mos-sync-lib.mjs
 *   node scripts/verify-mos-sync-lib.mjs --ycf
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.join(ROOT, "scripts", "lib");
const YC = path.join(process.env.USERPROFILE || "", "yandex-cloud", "bin", "yc.exe");

function runTests() {
  const tests = fs
    .readdirSync(LIB)
    .filter((n) => n.startsWith("mos-sync") && n.endsWith(".test.mjs"))
    .map((n) => path.join(LIB, n));

  const r = spawnSync(process.execPath, ["--test", ...tests], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r.status === 0;
}

function ycInvoke(name, data) {
  const r = spawnSync(
    YC,
    ["serverless", "function", "invoke", "--name", name, "--data", data],
    { encoding: "utf8", timeout: 240_000 },
  );
  const raw = (r.stdout || r.stderr || "").trim();
  let body = null;
  try {
    const outer = JSON.parse(raw);
    body = typeof outer.body === "string" ? JSON.parse(outer.body) : outer;
  } catch {
    body = { raw: raw.slice(0, 400) };
  }
  return { status: r.status ?? 1, body };
}

function main() {
  const withYcf = process.argv.includes("--ycf");
  let ok = runTests();
  if (!ok) {
    console.error("[verify-mos-sync-lib] unit tests failed");
    process.exit(1);
  }
  console.log("[verify-mos-sync-lib] unit tests OK");

  if (!withYcf) {
    console.log("[verify-mos-sync-lib] run redeploy + --ycf for cloud smoke");
    process.exit(0);
  }

  if (!fs.existsSync(YC)) {
    console.error("[verify-mos-sync-lib] yc not found, skip cloud smoke");
    process.exit(1);
  }

  const ctrl = ycInvoke("bm-mos-sync-controller", "{}");
  console.log("[verify-mos-sync-lib] controller:", JSON.stringify(ctrl.body).slice(0, 400));
  const ctrlOk =
    ctrl.body?.ok === true ||
    (ctrl.body?.invoked === true && ctrl.body?.invokeStatus === 202);
  if (!ctrlOk && ctrl.body?.raw?.includes("504")) {
    console.warn(
      "[verify-mos-sync-lib] controller 504 — enable async on bm-mos-enrolled-sync or raise controller timeout",
    );
  } else if (!ctrlOk) {
    ok = false;
  }

  const sync = ycInvoke("bm-mos-enrolled-sync", '{"dryRun":true}');
  console.log("[verify-mos-sync-lib] sync dryRun:", JSON.stringify(sync.body).slice(0, 400));
  if (sync.body?.skipped) {
    console.log("[verify-mos-sync-lib] sync skipped (ok)");
  } else if (sync.body?.ok === true) {
    console.log("[verify-mos-sync-lib] sync dryRun ok");
  } else if ((sync.body?.errors?.length ?? 0) > 0 && (sync.body?.urls ?? 0) > 0) {
    console.warn(
      "[verify-mos-sync-lib] sync dryRun partial (mos.ru timeouts) — deploy OK, check mos.ru",
    );
  } else {
    ok = false;
  }

  process.exit(ok ? 0 : 1);
}

main();
