#!/usr/bin/env node
/**
 * Post sheet-sync workflow failure to Telegram (CI: if: failure() step).
 *
 * Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 * Optional: GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_WORKFLOW, INPUT_TIER
 */
import { sendTelegramAlert } from "./lib/telegram-alert.mjs";

const tier = process.env.INPUT_TIER?.trim() || process.env.TIER?.trim() || "?";
const repo = process.env.GITHUB_REPOSITORY?.trim() || "Brain-Master/BM_QuestHub";
const runId = process.env.GITHUB_RUN_ID?.trim();
const server = (process.env.GITHUB_SERVER_URL || "https://github.com").replace(/\/$/, "");
const runUrl = runId ? `${server}/${repo}/actions/runs/${runId}` : `${server}/${repo}/actions`;

const workflow = process.env.GITHUB_WORKFLOW?.trim() || "Sheet sync";

const text = [
  "⚠️ Quest Hub: sheet-sync failed",
  "",
  `Tier: ${tier}`,
  `Workflow: ${workflow}`,
  `Repo: ${repo}`,
  runUrl,
  "",
  "Open Actions → failed step log (Sync from Google Sheets).",
].join("\n");

await sendTelegramAlert(text);
