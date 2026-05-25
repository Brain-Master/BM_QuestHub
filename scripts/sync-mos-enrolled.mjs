#!/usr/bin/env node
/**
 * Sync enrolled on Hot «Форматы» from mos.ru activity cards.
 *
 *   node scripts/sync-mos-enrolled.mjs --once          # single run (default)
 *   node scripts/sync-mos-enrolled.mjs --daemon        # every 15 min
 *   node scripts/sync-mos-enrolled.mjs --dry-run
 *   node scripts/sync-mos-enrolled.mjs --enable|--disable|--status
 *   node scripts/sync-mos-enrolled.mjs --probe URL     # test parser for one card
 *
 * Toggle: make mos-enrolled-sync-on | mos-enrolled-sync-off
 * Or env MOS_ENROLLED_SYNC=1|0
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";
import {
  applyMosEnrolledConfig,
  formatMosEnrolledConfig,
  writeMosEnrolledConfigFile,
} from "./lib/mos-enrolled-config.mjs";
import {
  mosEnrolledSyncEnabled,
  setMosEnrolledSyncEnabled,
} from "./lib/mos-enrolled-enabled.mjs";
import { initMosCookieSession } from "./lib/mos-enrolled-cookie-store.mjs";
import { fetchMosEnrolledCount } from "./lib/mos-enrolled-fetch.mjs";
import { syncMosEnrolledFromPortal } from "./lib/mos-enrolled-sync.mjs";

const ROOT = process.env.BM_QUESTHUB_ROOT?.trim() || loadRepoEnv();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

loadDotEnv(path.join(ROOT, "scripts", "sheets.env"));
loadDotEnv(path.join(ROOT, "apps", "web", ".env.local"));

function intervalMs() {
  return Number(process.env.MOS_ENROLLED_INTERVAL_MINUTES || 15) * 60 * 1000;
}

function usage() {
  console.log(`Usage:
  node scripts/sync-mos-enrolled.mjs [--once|--daemon] [--dry-run] [--publish]
  node scripts/sync-mos-enrolled.mjs --enable | --disable | --status
  node scripts/sync-mos-enrolled.mjs --probe <mos.ru card URL>

Make (do not pass --dry-run to make — that is make's own flag):
  make mos-enrolled-sync-dry
  make mos-enrolled-sync INTERVAL=30 DELAY=800

Config file: secret/mos-enrolled-sync.config.json (see make mos-enrolled-sync-on)`);
}

function log(msg) {
  console.log(msg);
}

async function runCycle(argv) {
  const dryRun = argv.includes("--dry-run");
  const force =
    dryRun ||
    argv.includes("--force") ||
    process.env.MOS_ENROLLED_FORCE === "1";
  const result = await syncMosEnrolledFromPortal({
    root: ROOT,
    dryRun,
    force,
    onProgress: log,
  });

  if (result.skipped) {
    log(`[mos-enrolled] disabled (${result.reason})`);
    log("[mos-enrolled] hint: make mos-enrolled-sync-on  or  --dry-run / MOS_ENROLLED_FORCE=1");
    return 0;
  }

  log(
    `[mos-enrolled] done: ${result.urls} URL(s), updated=${result.updatedRows ?? result.wouldUpdateRows ?? 0}, unchanged=${result.unchanged}, errors=${result.errors.length}`,
  );

  if (result.errors.length > 0) {
    for (const err of result.errors) {
      log(`  - ${err.url}: ${err.message}`);
    }
  }

  if (
    !dryRun &&
    (result.updatedRows ?? 0) > 0 &&
    (argv.includes("--publish") || process.env.MOS_ENROLLED_AUTO_PUBLISH === "1")
  ) {
    log("[mos-enrolled] publishing hot snapshot…");
    const pub = spawnSync(process.execPath, [path.join(__dirname, "publish-sheet-hot.mjs")], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
    });
    if (pub.status !== 0) return pub.status ?? 1;
  }

  return result.errors.length > 0 ? 1 : 0;
}

async function main() {
  const argv = process.argv.slice(2);
  applyMosEnrolledConfig(ROOT);

  if (argv.includes("--help") || argv.includes("-h")) {
    usage();
    return;
  }

  if (argv.includes("--enable")) {
    setMosEnrolledSyncEnabled(ROOT, true);
    const cfg = applyMosEnrolledConfig(ROOT);
    log("[mos-enrolled] enabled (secret/mos-enrolled-sync.enabled)");
    log(`[mos-enrolled] config: ${formatMosEnrolledConfig(cfg)}`);
    log("[mos-enrolled] edit secret/mos-enrolled-sync.config.json for timings");
    return;
  }
  if (argv.includes("--disable")) {
    setMosEnrolledSyncEnabled(ROOT, false);
    log("[mos-enrolled] disabled");
    return;
  }
  if (argv.includes("--status")) {
    const gate = mosEnrolledSyncEnabled(ROOT);
    const cfg = applyMosEnrolledConfig(ROOT);
    log(`[mos-enrolled] ${gate.enabled ? "ON" : "OFF"} (${gate.reason})`);
    log(`[mos-enrolled] effective: ${formatMosEnrolledConfig(cfg)}`);
    return;
  }

  const configIdx = argv.indexOf("--write-config");
  if (configIdx >= 0) {
    const patch = {};
    for (let i = configIdx + 1; i < argv.length; i++) {
      const [key, val] = argv[i].split("=");
      if (!key || val === undefined) continue;
      if (key === "intervalMinutes") patch.intervalMinutes = Number(val);
      if (key === "urlDelayMs") patch.urlDelayMs = Number(val);
      if (key === "fetchTimeoutMs") patch.fetchTimeoutMs = Number(val);
      if (key === "autoPublish") patch.autoPublish = val === "1" || val === "true";
    }
    const cfg = writeMosEnrolledConfigFile(ROOT, patch);
    log(`[mos-enrolled] wrote config: ${formatMosEnrolledConfig(cfg)}`);
    return;
  }

  const probeIdx = argv.indexOf("--probe");
  if (probeIdx >= 0) {
    const url = argv[probeIdx + 1];
    if (!url) {
      console.error("--probe requires mos.ru card URL");
      process.exit(1);
    }
    await initMosCookieSession(ROOT);
    const hit = await fetchMosEnrolledCount(url);
    console.log(JSON.stringify(hit, null, 2));
    return;
  }

  const daemon = argv.includes("--daemon");

  if (daemon) {
    const gate = mosEnrolledSyncEnabled(ROOT);
    if (!gate.enabled) {
      console.error(`[mos-enrolled] daemon refused: ${gate.reason}`);
      process.exit(1);
    }
    log(
      `[mos-enrolled] daemon started (every ${process.env.MOS_ENROLLED_INTERVAL_MINUTES || 15} min, Ctrl+C to stop)`,
    );
    log(`[mos-enrolled] timings: ${formatMosEnrolledConfig(applyMosEnrolledConfig(ROOT))}`);
    let running = false;
    const tick = async () => {
      if (running) {
        log("[mos-enrolled] previous cycle still running — skip tick");
        return;
      }
      running = true;
      try {
        const code = await runCycle(argv);
        if (code !== 0) log(`[mos-enrolled] cycle finished with code ${code}`);
      } finally {
        running = false;
      }
    };
    await tick();
    const timer = setInterval(tick, intervalMs());
    const stop = () => {
      clearInterval(timer);
      log("[mos-enrolled] daemon stopped");
      process.exit(0);
    };
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
    return;
  }

  const code = await runCycle(argv);
  process.exit(code);
}

main().catch((err) => {
  console.error("[mos-enrolled]", err.message || err);
  process.exit(1);
});
