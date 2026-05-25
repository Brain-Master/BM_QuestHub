#!/usr/bin/env node
/**
 * Set GitHub vars/secrets for optional mos-sync-controller workflow (manual tick only).
 * Not needed when YCF timer bm-mos-sync-controller-timer is ACTIVE.
 *
 *   node scripts/setup-github-mos-sync-controller.mjs
 */
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
const deployFile = path.join(ROOT, "secret", "mos-sync-adaptive.deploy.txt");

function readDeployUrls() {
  if (!fs.existsSync(deployFile)) {
    throw new Error(`missing ${deployFile} — run make deploy-yandex-mos-sync-adaptive first`);
  }
  const text = fs.readFileSync(deployFile, "utf8");
  const controller = text.match(/^CONTROLLER_URL=(.+)$/m)?.[1]?.trim();
  if (!controller) {
    const sync = text.match(/^SYNC_URL=(.+)$/m)?.[1]?.trim();
    if (sync) return { controller: sync.replace("bm-mos-enrolled-sync", "bm-mos-sync-controller") };
    throw new Error("CONTROLLER_URL not in deploy file");
  }
  return { controller };
}

function gh(args) {
  const r = spawnSync("gh", args, { encoding: "utf8", cwd: ROOT, shell: true });
  if (r.status !== 0) {
    throw new Error(`gh ${args.join(" ")}\n${r.stderr || r.stdout}`);
  }
  return (r.stdout || "").trim();
}

function main() {
  const ycBin = path.join(
    process.env.USERPROFILE || "",
    "yandex-cloud",
    "bin",
    "yc.exe",
  );
  let controllerUrl;
  if (fs.existsSync(deployFile)) {
    const fromFile = readDeployUrls();
    controllerUrl = fromFile.controller;
  }
  if (!controllerUrl && fs.existsSync(ycBin)) {
    const r = spawnSync(
      ycBin,
      ["serverless", "function", "get", "--name", "bm-mos-sync-controller", "--format", "json"],
      { encoding: "utf8" },
    );
    if (r.status === 0) {
      const fn = JSON.parse(r.stdout || "{}");
      controllerUrl = `https://functions.yandexcloud.net/${fn.id}`;
    }
  }
  if (!controllerUrl) {
    throw new Error("cannot resolve controller URL");
  }

  const secret = crypto.randomBytes(24).toString("base64url");
  const secretFile = path.join(ROOT, "secret", "mos-controller-cron.secret.txt");
  fs.mkdirSync(path.dirname(secretFile), { recursive: true });
  fs.writeFileSync(
    secretFile,
    `# gitignored — GitHub secret MOS_CONTROLLER_CRON_SECRET\n${secret}\n`,
    "utf8",
  );

  gh(["variable", "set", "MOS_CONTROLLER_URL", "--body", controllerUrl]);
  gh(["secret", "set", "MOS_CONTROLLER_CRON_SECRET", "--body", secret]);

  console.log(`[setup] MOS_CONTROLLER_URL=${controllerUrl}`);
  console.log(`[setup] wrote ${path.relative(ROOT, secretFile)}`);
  console.log("[setup] Redeploy controller with MOS_CONTROLLER_CRON_SECRET from that file.");
}

main();
