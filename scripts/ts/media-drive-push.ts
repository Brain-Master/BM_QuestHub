#!/usr/bin/env node
/**
 * Push full media/inbox tree to Google Drive Sync/ (placeholders + local sources).
 */
import fs from "node:fs";
import path from "node:path";

import {
  buildSlotUploadPayload,
  enumerateInboxSlots,
} from "../../apps/web/lib/media/media-inbox-manifest.ts";
import {
  driveSyncSubfolder,
  loadMediaInboxContext,
  parseForceFlag,
  repoRootFromScriptsTs,
  webRoot,
} from "./media-drive-shared.ts";

const ROOT = repoRootFromScriptsTs();
const force = parseForceFlag(process.argv.slice(2));

async function main() {
  const { loadDotEnv, loadRepoEnv } = await import("../load-dotenv.mjs");
  loadRepoEnv();
  loadDotEnv(path.join(ROOT, "scripts", "design-pack-oauth.env"));
  loadDotEnv(path.join(ROOT, "scripts", "design-pack.env"));

  const {
    ensureFolder,
    ensureFolderPath,
    findFileByName,
    resolveDriveAccessToken,
    uploadOrUpdateNamedFile,
  } = await import("../lib/google-drive-sync.mjs");

  const parentId = process.env.GOOGLE_MEDIA_DRIVE_FOLDER_ID?.trim();
  if (!parentId) {
    console.error("[media-drive-push] Set GOOGLE_MEDIA_DRIVE_FOLDER_ID in scripts/design-pack.env");
    process.exit(1);
  }

  const { token, auth } = await resolveDriveAccessToken({ root: ROOT });
  console.log(`[media-drive-push] auth: ${auth === "oauth" ? "oauth (user)" : `service_account`}`);

  const syncName = driveSyncSubfolder();
  const syncRootId = await ensureFolder(token, parentId, syncName);
  console.log(`[media-drive-push] target: BM_QuestHub_Media / ${syncName}`);

  const readmeSrc = path.join(ROOT, "docs", "design", "pack", "inbox-README.txt");
  if (fs.existsSync(readmeSrc)) {
    await uploadOrUpdateNamedFile(token, syncRootId, readmeSrc, "README.txt", {
      logTag: "media-drive-push",
    });
  }

  const wr = webRoot(ROOT);
  const context = loadMediaInboxContext(ROOT);
  const slots = enumerateInboxSlots(context);
  const stats = { upload: 0, skip: 0, placeholder: 0, source: 0 };

  for (const entry of slots) {
    const parentFolderId = await ensureFolderPath(token, syncRootId, entry.inboxDir);
    const existing = await findFileByName(token, parentFolderId, entry.driveFileName);
    const payload = buildSlotUploadPayload(wr, entry, Boolean(existing), force);

    if (payload.action === "skip") {
      stats.skip += 1;
      continue;
    }

    await uploadOrUpdateNamedFile(
      token,
      parentFolderId,
      payload.localPath,
      payload.driveFileName,
      { logTag: "media-drive-push" },
    );
    stats.upload += 1;
    if (payload.payloadKind === "placeholder") stats.placeholder += 1;
    else stats.source += 1;
  }

  const url = `https://drive.google.com/drive/folders/${syncRootId}`;
  console.log(
    `[media-drive-push] done: ${stats.upload} uploaded (${stats.source} source, ${stats.placeholder} placeholder), ${stats.skip} skipped`,
  );
  if (force) console.log("[media-drive-push] --force overwrote existing Drive files where uploaded");
  console.log(`[media-drive-push] open: ${url}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
