import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SCRIPTS_DIR = path.join(ROOT, "scripts");

export function findTsx() {
  const candidates = [
    path.join(ROOT, "scripts/node_modules/tsx/dist/cli.mjs"),
    path.join(ROOT, "apps/web/node_modules/tsx/dist/cli.mjs"),
    path.join(ROOT, "node_modules/tsx/dist/cli.mjs"),
  ];
  return candidates.find((c) => fs.existsSync(c)) ?? null;
}

export function runTsxScript(relativeScriptPath, extraArgs = []) {
  const tsx = findTsx();
  if (!tsx) {
    console.error("[run-tsx] install tsx: cd apps/web && npm install");
    process.exit(1);
  }
  const script = path.join(SCRIPTS_DIR, relativeScriptPath);
  const r = spawnSync(process.execPath, [tsx, script, ...extraArgs], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  process.exit(r.status ?? 1);
}
