import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID from env, secret files, or bm-lead-receiver YCF.
 * @param {{ root: string, ycBin?: string, leadFunction?: string }} opts
 */
export function readTelegramEnv(opts) {
  const { root, ycBin, leadFunction = "bm-lead-receiver" } = opts;

  for (const key of ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"]) {
    if (process.env[key]?.trim()) continue;
    const file = path.join(root, "secret", "lead-receiver.deploy.txt");
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(new RegExp(`^${key}=(.+)$`));
      if (m && process.env[key] === undefined) {
        process.env[key] = m[1].trim();
      }
    }
  }

  if (process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHAT_ID?.trim()) {
    return {
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN.trim(),
      TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID.trim(),
      source: "env",
    };
  }

  const yc =
    ycBin ||
    path.join(process.env.USERPROFILE || "", "yandex-cloud", "bin", "yc.exe");
  if (!fs.existsSync(yc)) return null;

  const r = spawnSync(
    yc,
    [
      "serverless",
      "function",
      "version",
      "list",
      "--function-name",
      leadFunction,
      "--limit",
      "1",
      "--format",
      "json",
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) return null;

  try {
    const versions = JSON.parse(r.stdout || "[]");
    const env = versions[0]?.environment;
    const token = env?.TELEGRAM_BOT_TOKEN?.trim();
    const chat = env?.TELEGRAM_CHAT_ID?.trim();
    if (token && chat) {
      return {
        TELEGRAM_BOT_TOKEN: token,
        TELEGRAM_CHAT_ID: chat,
        source: leadFunction,
      };
    }
  } catch {
    return null;
  }
  return null;
}
