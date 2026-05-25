#!/usr/bin/env node
/**
 * End-to-end diagnostics for adaptive mos.ru YCF stack.
 *
 *   node scripts/diagnose-mos-sync-ycf.mjs
 *   make diagnose-mos-sync-ycf
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadRepoEnv } from "./load-dotenv.mjs";
import { publicBaseUrlForBucket } from "./lib/s3-storage.mjs";

const ROOT = loadRepoEnv();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const YC = path.join(process.env.USERPROFILE || "", "yandex-cloud", "bin", "yc.exe");
const S3_BASE = publicBaseUrlForBucket("hot");

const CONTROLLER = "bm-mos-sync-controller";
const SYNC = "bm-mos-enrolled-sync";

function log(msg) {
  console.log(msg);
}

function fail(msg) {
  console.log(`  FAIL  ${msg}`);
  return false;
}

function ok(msg) {
  console.log(`  OK    ${msg}`);
  return true;
}

function warn(msg) {
  console.log(`  WARN  ${msg}`);
}

function runNode(script, args = []) {
  const r = spawnSync(process.execPath, [path.join(__dirname, script), ...args], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return { status: r.status ?? 1, stdout: r.stdout || "", stderr: r.stderr || "" };
}

function ycInvoke(name, data) {
  if (!fs.existsSync(YC)) {
    return { status: 1, body: null, raw: "yc not found" };
  }
  const r = spawnSync(
    YC,
    ["serverless", "function", "invoke", "--name", name, "--data", data],
    { encoding: "utf8", timeout: 120_000 },
  );
  const raw = (r.stdout || r.stderr || "").trim();
  let body = null;
  try {
    const outer = JSON.parse(raw);
    if (typeof outer.body === "string") {
      body = JSON.parse(outer.body);
    } else {
      body = outer;
    }
  } catch {
    body = { raw };
  }
  return { status: r.status ?? 1, body, raw };
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function ageMinutes(iso) {
  if (!iso) return null;
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  return Math.round(ms / 60_000);
}

async function main() {
  let allOk = true;

  log("\n[diagnose] 1/5 Infrastructure (verify-mos-sync-adaptive)");
  const verify = runNode("verify-mos-sync-adaptive.mjs");
  if (verify.status !== 0) {
    allOk = false;
    fail("verify-mos-sync-adaptive");
    if (verify.stderr) console.log(verify.stderr);
  } else {
    ok("functions + controller timer");
  }

  log("\n[diagnose] 2/5 S3 ops state + site snapshot");
  try {
    const state = await fetchJson(`${S3_BASE}/ops/mos-sync-state.json`);
    const ctrlAge = ageMinutes(state.lastControllerAt);
    const syncAge = ageMinutes(state.lastSyncAt);
    log(`  lastControllerAt: ${state.lastControllerAt ?? "—"} (${ctrlAge ?? "?"} min ago)`);
    log(`  lastSyncAt:       ${state.lastSyncAt ?? "—"} (${syncAge ?? "?"} min ago)`);
    log(`  nextDueAt:        ${state.nextDueAt ?? "—"}`);
    log(
      `  runPhase:         ${state.runPhase ?? "idle"} (${state.batchesDone ?? 0}/${state.batchesTotal ?? 0} batches, run=${state.activeRunId ?? "—"})`,
    );
    if (ctrlAge === null || ctrlAge > 10) {
      allOk = false;
      fail("lastControllerAt stale (>10 min) — controller tick or S3 write issue");
    } else {
      ok("controller recently updated state");
    }
    if (state.lastSyncAt === null) {
      warn("lastSyncAt never set — sync may not have completed yet");
    } else if (syncAge !== null && syncAge > 120) {
      warn(`lastSyncAt ${syncAge} min ago — check bm-mos-enrolled-sync logs`);
    }
  } catch (e) {
    allOk = false;
    fail(`mos-sync-state.json: ${e instanceof Error ? e.message : e}`);
  }

  try {
    const offers = await fetchJson(`${S3_BASE}/data/offers-snapshot.json`);
    const genAge = ageMinutes(offers.generatedAt);
    log(`  offers.generatedAt: ${offers.generatedAt ?? "—"} (${genAge ?? "?"} min ago)`);
    log("  (updates after hot publish / sheet-sync, not from controller alone)");
  } catch (e) {
    warn(`offers-snapshot.json: ${e instanceof Error ? e.message : e}`);
  }

  log("\n[diagnose] 3/5 Invoke bm-mos-sync-controller");
  const ctrl = ycInvoke(CONTROLLER, "{}");
  if (ctrl.body && typeof ctrl.body === "object") {
    log(`  response: ${JSON.stringify(ctrl.body).slice(0, 500)}`);
    const invokeOk =
      !ctrl.body.invoked ||
      ctrl.body.invokeStatus === 202 ||
      (ctrl.body.invokeStatus >= 200 && ctrl.body.invokeStatus < 300);
    if (ctrl.body.ok === true || (ctrl.body.stateOk && invokeOk)) {
      ok(`controller ok (invoked=${ctrl.body.invoked}, reason=${ctrl.body.reason})`);
      if (ctrl.body.stateOk === false) {
        warn(`S3 state write failed: ${ctrl.body.stateError ?? "unknown"}`);
      }
      if (ctrl.body.invoked && !invokeOk) {
        warn(`sync invoke status ${ctrl.body.invokeStatus} — check bm-mos-enrolled-sync`);
      }
    } else {
      allOk = false;
      fail(`controller error: ${ctrl.body.error ?? JSON.stringify(ctrl.body)}`);
    }
  } else {
    allOk = false;
    fail(`controller invoke parse failed: ${ctrl.raw.slice(0, 200)}`);
  }

  log("\n[diagnose] 4/5 Invoke bm-mos-sync-planner (dryRun)");
  const planner = ycInvoke("bm-mos-sync-planner", '{"dryRun":true,"source":"diagnose"}');
  if (planner.body?.ok === true || planner.body?.skipped) {
    ok(`planner dryRun (urls=${planner.body?.urlCount ?? "?"})`);
  } else if (planner.body?.reason === "pipeline_ymq") {
    warn("planner missing — deploy YMQ pipeline");
  } else {
    warn(`planner: ${JSON.stringify(planner.body ?? planner.raw).slice(0, 200)}`);
  }

  log("\n[diagnose] 4b/5 Monolith sync (legacy / dryRun)");
  const sync = ycInvoke(SYNC, '{"dryRun":true}');
  if (sync.body && typeof sync.body === "object") {
    if (sync.body.reason === "pipeline_ymq") {
      ok("monolith disabled (MOS_SYNC_PIPELINE=ymq) — expected");
    } else if (sync.body.skipped) {
      warn(`sync skipped: ${sync.body.reason}`);
    } else if (sync.body.ok === true) {
      ok(`sync dryRun ok, urls=${sync.body.urls}`);
    } else {
      allOk = false;
      fail(`sync dryRun failed: ${sync.body.error ?? "errors in result"}`);
    }
    const tail = String(sync.body.log || "")
      .split("\n")
      .filter((l) => l.includes("[mos-enrolled]"))
      .slice(-3);
    for (const line of tail) log(`  ${line}`);
  } else {
    allOk = false;
    fail(`sync invoke: ${sync.raw.slice(0, 200)}`);
  }

  log("\n[diagnose] 5/5 Summary");
  if (allOk) {
    ok("stack looks healthy — watch lastSyncAt after next due tick");
  } else {
    fail("issues found — see docs/data/mos-enrolled-sync.md § Диагностика");
  }

  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
