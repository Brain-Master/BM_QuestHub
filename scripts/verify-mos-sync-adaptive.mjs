#!/usr/bin/env node
/**
 * Verify adaptive mos.ru stack in Yandex Cloud (functions + controller timer).
 *
 *   node scripts/verify-mos-sync-adaptive.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
const YC = path.join(process.env.USERPROFILE || "", "yandex-cloud", "bin", "yc.exe");

const FUNCTIONS = [
  "bm-mos-enrolled-sync",
  "bm-mos-sync-controller",
  "bm-mos-sync-planner",
  "bm-mos-url-worker",
  "bm-mos-sync-finalizer",
  "bm-schedule-traffic",
];
const CONTROLLER_TIMER = "bm-mos-sync-controller-timer";
const LEGACY_SYNC_TIMER = "bm-mos-enrolled-sync-timer";
const WORKER_YMQ_TRIGGER = "bm-mos-url-worker-ymq";

function ycJson(args) {
  if (!fs.existsSync(YC)) {
    console.error("[verify] yc not found:", YC);
    process.exit(1);
  }
  const r = spawnSync(YC, [...args, "--format", "json"], { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || `yc ${args.join(" ")}`);
  }
  return JSON.parse(r.stdout || "[]");
}

function main() {
  const deployPath = path.join(ROOT, "secret", "mos-sync-adaptive.deploy.txt");
  let ok = true;

  console.log("[verify] Yandex Cloud functions:");
  const listed = ycJson(["serverless", "function", "list"]);
  for (const name of FUNCTIONS) {
    const fn = listed.find((f) => f.name === name);
    if (fn) {
      console.log(`  OK  ${name} (${fn.id})`);
    } else {
      console.log(`  MISSING  ${name}`);
      ok = false;
    }
  }

  console.log("\n[verify] Triggers:");
  const triggers = ycJson(["serverless", "trigger", "list"]);
  const controller = triggers.find((t) => t.name === CONTROLLER_TIMER);
  const legacy = triggers.find((t) => t.name === LEGACY_SYNC_TIMER);

  if (controller?.status === "ACTIVE") {
    const cron = controller.rule?.timer?.cron_expression ?? "?";
    console.log(`  OK  ${CONTROLLER_TIMER} (${cron})`);
  } else {
    console.log(`  MISSING/INACTIVE  ${CONTROLLER_TIMER}`);
    ok = false;
  }

  if (legacy) {
    console.log(`  WARN  ${LEGACY_SYNC_TIMER} still exists — remove for B1-only`);
    ok = false;
  } else {
    console.log(`  OK  no legacy ${LEGACY_SYNC_TIMER}`);
  }

  const workerTrigger = triggers.find((t) => t.name === WORKER_YMQ_TRIGGER);
  if (workerTrigger?.status === "ACTIVE") {
    console.log(`  OK  ${WORKER_YMQ_TRIGGER}`);
  } else {
    console.log(`  MISSING/INACTIVE  ${WORKER_YMQ_TRIGGER} — run deploy-yandex-mos-ymq-pipeline`);
    ok = false;
  }

  const ymqDeploy = path.join(ROOT, "secret", "mos-ymq-pipeline.deploy.txt");
  if (fs.existsSync(ymqDeploy)) {
    console.log(`\n[verify] ${path.relative(ROOT, ymqDeploy)} present`);
  } else {
    console.log("\n[verify] run: make deploy-yandex-mos-ymq-pipeline");
    ok = false;
  }

  if (fs.existsSync(deployPath)) {
    console.log(`\n[verify] ${path.relative(ROOT, deployPath)} present`);
  } else {
    console.log(`\n[verify] run: make deploy-yandex-mos-sync-adaptive`);
    ok = false;
  }

  process.exit(ok ? 0 : 1);
}

main();
