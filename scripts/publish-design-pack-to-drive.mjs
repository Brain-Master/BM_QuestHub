#!/usr/bin/env node
/**
 * Upload Design Pack folder to Google Drive (BM_QuestHub_Media/FOR_DESIGNER).
 *
 * Auth: OAuth (personal Gmail) oauth-first, or service account (Shared drive).
 *
 * Prereqs:
 *   make design-pack
 *   scripts/design-pack.env with GOOGLE_MEDIA_DRIVE_FOLDER_ID
 *   OAuth: make design-pack-oauth-login
 *   SA: share folder with service account (Editor)
 *
 * Usage: node scripts/publish-design-pack-to-drive.mjs
 */
import fs from "node:fs";
import path from "node:path";

import { loadDotEnv, loadRepoEnv } from "./load-dotenv.mjs";
import {
  ensureFolder,
  getFileMetadata,
  resolveDriveAccessToken,
  syncDirectoryToDrive,
} from "./lib/google-drive-sync.mjs";

const ROOT = loadRepoEnv();
loadDotEnv(path.join(ROOT, "scripts", "design-pack-oauth.env"));
loadDotEnv(path.join(ROOT, "scripts", "design-pack.env"));
loadDotEnv(path.join(ROOT, "apps", "web", ".env.local"));

function resolvePackDir() {
  const rel =
    process.env.DESIGN_PACK_DIST_DIR?.trim() ||
    "dist/design-pack/BM_QuestHub_Design_Pack_v1";
  const dir = path.isAbsolute(rel) ? rel : path.join(ROOT, rel);
  if (!fs.existsSync(dir)) {
    throw new Error(`Design pack not built: ${dir} — run: make design-pack`);
  }
  return dir;
}

async function main() {
  const parentId = process.env.GOOGLE_MEDIA_DRIVE_FOLDER_ID?.trim();
  if (!parentId) {
    console.error(
      "[design-pack-drive] Set GOOGLE_MEDIA_DRIVE_FOLDER_ID in scripts/design-pack.env",
    );
    console.error("  (folder ID from Drive URL: .../folders/XXXXXXXX)");
    process.exit(1);
  }

  const subfolder =
    process.env.GOOGLE_DESIGN_PACK_DRIVE_SUBFOLDER?.trim() || "FOR_DESIGNER";

  const packDir = resolvePackDir();
  const { token, auth, clientEmail } = await resolveDriveAccessToken({ root: ROOT });

  if (auth === "oauth") {
    console.log("[design-pack-drive] auth: oauth (user)");
  } else {
    console.log(`[design-pack-drive] auth: service_account (${clientEmail})`);
    console.log(
      "[design-pack-drive] Drive API must be enabled in THIS project:",
    );
    console.log(
      "  https://console.cloud.google.com/apis/api/drive.googleapis.com/overview?project=bm-questhub",
    );
    const impersonate = process.env.GOOGLE_DRIVE_IMPERSONATE_EMAIL?.trim();
    if (impersonate) {
      console.log(`[design-pack-drive] impersonate: ${impersonate}`);
    }
  }

  if (auth === "service_account") {
    const parentMeta = await getFileMetadata(token, parentId);
    const onSharedDrive = Boolean(parentMeta.driveId);
    console.log(
      `[design-pack-drive] parent folder: ${parentMeta.name ?? parentId}${onSharedDrive ? " (Shared drive)" : " (My Drive)"}`,
    );
    const impersonate = process.env.GOOGLE_DRIVE_IMPERSONATE_EMAIL?.trim();
    if (!onSharedDrive && !impersonate) {
      console.warn(
        "[design-pack-drive] Service account cannot upload to My Drive. Use OAuth (make design-pack-oauth-login), a Shared drive folder, OR GOOGLE_DRIVE_IMPERSONATE_EMAIL (Workspace).",
      );
    }
  } else {
    console.log(`[design-pack-drive] parent folder id: ${parentId} (OAuth / My Drive)`);
  }

  console.log(
    `[design-pack-drive] target: BM_QuestHub_Media / ${subfolder} (parent ${parentId})`,
  );
  const targetId = await ensureFolder(token, parentId, subfolder);
  const stats = await syncDirectoryToDrive(token, packDir, targetId);

  const url = `https://drive.google.com/drive/folders/${targetId}`;
  console.log(
    `[design-pack-drive] done: ${stats.files} files, ${stats.dirs} subfolders synced`,
  );
  console.log(`[design-pack-drive] open: ${url}`);
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("storage quota") || msg.includes("shared drives")) {
    console.error(`
[design-pack-drive] Service account не может писать в «Мой диск».

Вариант A — Shared drive (рекомендуется для SA):
  1. Google Drive → Общие диски → Создать «BM Quest Hub Media»
  2. Участники → добавить bm-questhub@bm-questhub.iam.gserviceaccount.com (Менеджер контента)
  3. Перенести BM_QuestHub_Media на этот диск (или создать заново)
  4. Обновить GOOGLE_MEDIA_DRIVE_FOLDER_ID в scripts/design-pack.env

Вариант B — Google Workspace:
  GOOGLE_DRIVE_IMPERSONATE_EMAIL=ваш@домен в design-pack.env
  + Domain-wide delegation для SA (scope drive) в admin.google.com

Вариант C — OAuth (личный Gmail, My Drive):
  cp scripts/design-pack-oauth.env.example scripts/design-pack-oauth.env
  make design-pack-oauth-login
  (GOOGLE_SERVICE_ACCOUNT_JSON для Drive не нужен)
`);
  }
  if (msg.includes("Google Drive API has not been used") || msg.includes("accessNotConfigured")) {
    console.error(
      "\n[design-pack-drive] Включите Google Drive API в Cloud Console проекта:",
    );
    console.error(
      "  https://console.cloud.google.com/apis/library/drive.googleapis.com\n",
    );
  }
  if (msg.includes("design-pack-oauth-login") || msg.includes("OAuth")) {
    console.error(
      "\n[design-pack-drive] OAuth: make design-pack-oauth-login — см. docs/design/pack/README.md\n",
    );
  }
  if (msg.includes("unreachable") || msg.includes("fetch failed") || msg.includes("CONNECT_TIMEOUT")) {
    console.error(`
[design-pack-drive] Нет стабильного доступа к googleapis.com с этого ПК.

  • Откройте в браузере: https://www.googleapis.com — должно отвечать
  • Если не открывается — включите VPN (Google API из Node тоже через VPN)
  • Антивирус/файрвол: разрешите node.exe исходящий HTTPS
  • Повторите: make design-pack-publish-drive
`);
  }
  console.error(e);
  process.exit(1);
});
