#!/usr/bin/env node
/**
 * Pull media inbox files from Google Drive Sync/ into apps/web/media/inbox/.
 */
import path from "node:path";

import { isInboxPullPath } from "../../apps/web/lib/media/media-inbox-manifest.ts";
import { mediaInboxRoot } from "../../apps/web/lib/media/inbox-paths.ts";
import {
  driveSyncSubfolder,
  repoRootFromScriptsTs,
  webRoot,
} from "./media-drive-shared.ts";

const ROOT = repoRootFromScriptsTs();

async function main() {
  const { loadDotEnv, loadRepoEnv } = await import("../load-dotenv.mjs");
  loadRepoEnv();
  loadDotEnv(path.join(ROOT, "scripts", "design-pack-oauth.env"));
  loadDotEnv(path.join(ROOT, "scripts", "design-pack.env"));

  const {
    downloadFile,
    ensureFolder,
    resolveDriveAccessToken,
    walkDriveFolder,
  } = await import("../lib/google-drive-sync.mjs");

  const parentId = process.env.GOOGLE_MEDIA_DRIVE_FOLDER_ID?.trim();
  if (!parentId) {
    console.error("[media-drive-pull] Set GOOGLE_MEDIA_DRIVE_FOLDER_ID in scripts/design-pack.env");
    process.exit(1);
  }

  const { token, auth } = await resolveDriveAccessToken({ root: ROOT });
  console.log(`[media-drive-pull] auth: ${auth === "oauth" ? "oauth (user)" : "service_account"}`);

  const syncName = driveSyncSubfolder();
  const syncRootId = await ensureFolder(token, parentId, syncName);
  const files = await walkDriveFolder(token, syncRootId);

  const wr = webRoot(ROOT);
  const inboxRoot = mediaInboxRoot(wr);
  let downloaded = 0;
  let skipped = 0;

  for (const file of files) {
    if (!isInboxPullPath(file.relPath)) {
      skipped += 1;
      continue;
    }
    const dest = path.join(inboxRoot, file.relPath.split("/").join(path.sep));
    console.log(`[media-drive-pull] download: ${file.relPath}`);
    await downloadFile(token, file.id, dest);
    downloaded += 1;
  }

  console.log(
    `[media-drive-pull] done: ${downloaded} file(s) → ${inboxRoot}, ${skipped} ignored (not inbox sources)`,
  );
  console.log("[media-drive-pull] next: make publish-sheet-cold and/or make publish-sheet-hot");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
