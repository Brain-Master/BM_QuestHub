import "server-only";

import { resolveContentSlugSets } from "@/lib/content/content-slugs";

import { syncHotOffersFromGoogleSheet } from "./sync-hot-core";
import { writeOffersSnapshotAtomic } from "./snapshot-io";
import { sendTelegramAlert } from "./telegram";

export type SyncOffersResult = {
  ok: true;
  rowCount: number;
  questKeys: string[];
  generatedAt: string;
};

/**
 * Полный пайплайн: Google hot sheet → парсинг → запись offers-snapshot.json.
 */
export async function syncOffersFromGoogleSheet(): Promise<SyncOffersResult> {
  const { venueSlugs, questSlugs } = resolveContentSlugSets();
  const result = await syncHotOffersFromGoogleSheet({
    venueSlugs,
    questSlugs,
    onAlert: sendTelegramAlert,
  });
  await writeOffersSnapshotAtomic(result.snapshot);
  return {
    ok: true,
    rowCount: result.rowCount,
    questKeys: result.questKeys,
    generatedAt: result.generatedAt,
  };
}
