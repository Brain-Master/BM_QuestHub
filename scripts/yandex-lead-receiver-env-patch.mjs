#!/usr/bin/env node
/**
 * Clone a Yandex function version and override environment (merges all keys from source).
 *
 *   node scripts/yandex-lead-receiver-env-patch.mjs --source d4ef6sr3971m7nl5gs68 --set ALLOWED_ORIGINS=https://quest.b-master.pro,...
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import os from "node:os";

const YC =
  process.env.YC_CLI ??
  path.join(os.homedir(), "yandex-cloud", "bin", process.platform === "win32" ? "yc.exe" : "yc");

function parseArgs(argv) {
  const out = { set: {} };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--source") out.source = argv[++i];
    else if (argv[i] === "--function") out.function = argv[++i];
    else if (argv[i] === "--set") {
      const pair = argv[++i] ?? "";
      const eq = pair.indexOf("=");
      if (eq <= 0) {
        console.error(`[env-patch] invalid --set ${pair}`);
        process.exit(1);
      }
      out.set[pair.slice(0, eq)] = pair.slice(eq + 1);
    } else if (argv[i] === "--description") out.description = argv[++i];
  }
  return out;
}

function ycJson(args) {
  const out = execFileSync(YC, [...args, "--format", "json"], { encoding: "utf8" });
  return JSON.parse(out);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceId = args.source;
  const functionName = args.function ?? "bm-lead-receiver";
  if (!sourceId || !Object.keys(args.set).length) {
    console.error(
      "Usage: node scripts/yandex-lead-receiver-env-patch.mjs --source <version-id> --set KEY=value [--description text]",
    );
    process.exit(1);
  }

  const src = ycJson(["serverless", "function", "version", "get", sourceId]);
  const env = { ...(src.environment ?? {}), ...args.set };

  const envFlags = [];
  for (const [k, v] of Object.entries(env)) {
    envFlags.push("--environment", `${k}=${v}`);
  }

  const createArgs = [
    "serverless",
    "function",
    "version",
    "create",
    "--function-name",
    functionName,
    "--runtime",
    src.runtime ?? "nodejs22",
    "--entrypoint",
    src.entrypoint ?? "index.handler",
    "--memory",
    String((src.resources?.memory ?? 134217728) / 1024 / 1024) + "m",
    "--execution-timeout",
    (src.execution_timeout ?? "10s").replace(/s$/, "s"),
    "--source-version-id",
    sourceId,
    ...envFlags,
  ];
  if (args.description) createArgs.push("--description", args.description);

  const created = ycJson(createArgs);
  console.log(
    JSON.stringify(
      {
        id: created.id,
        function_id: created.function_id,
        environment_keys: Object.keys(created.environment ?? env).sort(),
        ALLOWED_ORIGINS: (created.environment ?? env).ALLOWED_ORIGINS,
      },
      null,
      2,
    ),
  );
}

main();
