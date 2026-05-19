#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadRepoEnv } from "./load-dotenv.mjs";

const ROOT = loadRepoEnv();
const target = process.argv[2] || "all";

const result = spawnSync(process.execPath, ["scripts/sync-s3-public.mjs", target], {
  cwd: ROOT,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
