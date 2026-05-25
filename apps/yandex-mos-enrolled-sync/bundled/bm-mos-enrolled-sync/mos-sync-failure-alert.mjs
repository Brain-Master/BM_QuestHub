import { sendTelegramAlert } from "./telegram-alert.mjs";

const DEDUPE_MS = 15 * 60 * 1000;
/** @type {Map<string, number>} */
const lastSent = new Map();

/**
 * @param {{ kind: string, message: string, detail?: string, dryRun?: boolean }} opts
 */
export async function notifyMosSyncFailure(opts) {
  if (process.env.MOS_ENROLLED_TG_FAILURE?.trim() === "0") return;
  if (opts.dryRun) return;

  const key = `${opts.kind}:${opts.message.slice(0, 120)}`;
  const now = Date.now();
  const prev = lastSent.get(key);
  if (prev !== undefined && now - prev < DEDUPE_MS) return;
  lastSent.set(key, now);

  const lines = [
    "⚠️ Quest Hub · mos enrolled sync",
    "",
    `Тип: ${opts.kind}`,
    opts.message,
  ];
  if (opts.detail?.trim()) lines.push("", opts.detail.trim().slice(0, 1500));
  lines.push("", "Проверьте логи YCF bm-mos-enrolled-sync и S3 ops/*.");

  await sendTelegramAlert(lines.join("\n"));
}
