#!/usr/bin/env node
/**
 * Post mos-enrolled-sync workflow failure to Telegram.
 */
import { sendTelegramAlert } from "./lib/telegram-alert.mjs";

const repo = process.env.GITHUB_REPOSITORY?.trim() || "Brain-Master/BM_QuestHub";
const runId = process.env.GITHUB_RUN_ID?.trim();
const server = (process.env.GITHUB_SERVER_URL || "https://github.com").replace(/\/$/, "");
const runUrl = runId ? `${server}/${repo}/actions/runs/${runId}` : `${server}/${repo}/actions`;
const workflow = process.env.GITHUB_WORKFLOW?.trim() || "Mos enrolled sync";

const text = [
  "⚠️ Quest Hub: mos.ru → Hot enrolled sync failed",
  "",
  `Workflow: ${workflow}`,
  `Repo: ${repo}`,
  runUrl,
  "",
  "Проверьте: MOS_ENROLLED_COOKIES_JSON, доступ к mos.ru, GOOGLE_SERVICE_ACCOUNT_JSON.",
].join("\n");

await sendTelegramAlert(text);
