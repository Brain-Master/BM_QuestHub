#!/usr/bin/env node
/**
 * Upload docs/data/drive/FOR_EDITORS to Google Drive BM_QuestHub_Data/FOR_EDITORS.
 * BM_QuestHub_Data is a sibling of BM_QuestHub_Media (separate folder ID).
 * Usage: make data-docs-push
 */
import path from "node:path";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";
import {
  ensureFolder,
  resolveDriveAccessToken,
  syncDirectoryToDrive,
} from "./lib/google-drive-sync.mjs";

const ROOT = loadRepoEnv();

loadDotEnv(path.join(ROOT, "scripts", "design-pack-oauth.env"));
loadDotEnv(path.join(ROOT, "scripts", "design-pack.env"));

function editorsSubfolder() {
  return process.env.GOOGLE_DATA_EDITORS_SUBFOLDER?.trim() || "FOR_EDITORS";
}

async function main() {
  const dataRootId = process.env.GOOGLE_DATA_DRIVE_FOLDER_ID?.trim();
  if (!dataRootId) {
    console.error(
      "[data-docs-push] Set GOOGLE_DATA_DRIVE_FOLDER_ID in scripts/design-pack.env",
    );
    console.error("  (ID папки BM_QuestHub_Data — сосед BM_QuestHub_Media, не внутри неё)");
    process.exit(1);
  }

  const localDir = path.join(ROOT, "docs", "data", "drive", "FOR_EDITORS");
  const { token, auth } = await resolveDriveAccessToken({ root: ROOT });
  console.log(`[data-docs-push] auth: ${auth === "oauth" ? "oauth (user)" : "service_account"}`);

  const targetId = await ensureFolder(token, dataRootId, editorsSubfolder());
  console.log(`[data-docs-push] target: BM_QuestHub_Data / ${editorsSubfolder()}`);

  const stats = await syncDirectoryToDrive(token, localDir, targetId, { files: 0, dirs: 0 });
  console.log(
    `[data-docs-push] done: ${stats.files} files, ${stats.dirs} subfolders`,
  );
  console.log(`[data-docs-push] open: https://drive.google.com/drive/folders/${targetId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
