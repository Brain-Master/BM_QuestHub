#!/usr/bin/env node
/**
 * Build BM_QuestHub_Design_Pack_v1.zip for designers.
 * Requires: pandoc + xelatex (MiKTeX), sharp (apps/web), ag-psd (scripts).
 * Usage: node scripts/build-design-pack.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { loadDotEnv } from "./load-dotenv.mjs";
import {
  defaultOAuthTokenPath,
  hasRefreshToken,
} from "./lib/google-drive-oauth.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACK_SRC = path.join(ROOT, "docs", "design", "pack");
const ASSETS = path.join(ROOT, "docs", "design", "assets");
const DIST = path.join(ROOT, "dist", "design-pack", "BM_QuestHub_Design_Pack_v1");
const require = createRequire(path.join(ROOT, "apps/web/package.json"));
const sharp = require("sharp");

function refreshPath() {
  if (process.platform !== "win32") return;
  try {
    const { execSync } = require("node:child_process");
    const machine = execSync(
      '[Environment]::GetEnvironmentVariable("Path","Machine")',
      { shell: "powershell.exe", encoding: "utf8" },
    ).trim();
    const user = execSync(
      '[Environment]::GetEnvironmentVariable("Path","User")',
      { shell: "powershell.exe", encoding: "utf8" },
    ).trim();
    process.env.Path = [machine, user].filter(Boolean).join(";");
  } catch {
    /* use existing PATH */
  }
}

function which(cmd) {
  const r = spawnSync(process.platform === "win32" ? "where" : "which", [cmd], {
    shell: true,
    encoding: "utf8",
  });
  return r.status === 0 ? r.stdout.split(/\r?\n/)[0]?.trim() : null;
}

function cpDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) cpDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function writeCsv() {
  const runner = path.join(ROOT, "scripts", ".design-pack-csv.mjs");
  fs.writeFileSync(
    runner,
    `import { designPackCsvRows } from "../apps/web/lib/media/design-pack-slots.ts";
import fs from "node:fs";
const rows = designPackCsvRows();
const body = rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\\n");
fs.mkdirSync(${JSON.stringify(path.join(DIST, "presets"))}, { recursive: true });
fs.writeFileSync(${JSON.stringify(path.join(DIST, "presets", "vse_sloty.csv"))}, body + "\\n");
`,
  );
  const tsx = path.join(ROOT, "apps/web/node_modules/tsx/dist/cli.mjs");
  if (!fs.existsSync(tsx)) {
    console.warn("[design-pack] tsx missing — CSV skipped");
    return;
  }
  const r = spawnSync(process.execPath, [tsx, runner], { cwd: ROOT, stdio: "inherit" });
  fs.unlinkSync(runner);
  if (r.status !== 0) throw new Error("CSV export failed");
}

function pandocPdf(mdPath, outBase) {
  const yaml = path.join(PACK_SRC, "pandoc-pdf.yaml");
  const pdfOut = `${outBase}.pdf`;
  const docxOut = `${outBase}.docx`;
  const args = [
    mdPath,
    "-o",
    pdfOut,
    "--pdf-engine=xelatex",
    "-V",
    "lang=ru",
    ...(fs.existsSync(yaml) ? ["--metadata-file", yaml] : []),
  ];
  const pdf = spawnSync("pandoc", args, {
    encoding: "utf8",
    env: { ...process.env, MIKTEX_ALLOW_UNSAFE_ADMIN_INSTALL: "1" },
  });
  if (pdf.status === 0) {
    console.log(`[design-pack] ${path.basename(pdfOut)}`);
  } else {
    console.warn(`[design-pack] PDF failed for ${path.basename(mdPath)}:\n${pdf.stderr?.slice(0, 800)}`);
    fs.copyFileSync(mdPath, `${outBase}.md`);
  }

  const docx = spawnSync("pandoc", [mdPath, "-o", docxOut], { encoding: "utf8" });
  if (docx.status === 0) console.log(`[design-pack] ${path.basename(docxOut)}`);
}

async function buildPreviews() {
  const outRoot = path.join(DIST, "previews");
  fs.mkdirSync(outRoot, { recursive: true });

  async function walk(dir, rel = "") {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const relPath = rel ? `${rel}/${ent.name}` : ent.name;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await walk(full, relPath);
        continue;
      }
      if (!ent.name.endsWith(".svg")) continue;
      const destDir = path.join(outRoot, path.dirname(relPath));
      fs.mkdirSync(destDir, { recursive: true });
      const pngName = ent.name.replace(/\.svg$/i, ".png");
      const dest = path.join(destDir, pngName);
      try {
        await sharp(full).resize({ width: 1600, withoutEnlargement: true }).png().toFile(dest);
      } catch {
        console.warn(`[design-pack] preview skip ${relPath}`);
      }
    }
  }

  await walk(ASSETS);

  const phDir = path.join(ROOT, "apps/web/media/placeholders");
  if (fs.existsSync(phDir)) {
    const slotPreviews = path.join(outRoot, "slots");
    fs.mkdirSync(slotPreviews, { recursive: true });
    for (const name of fs.readdirSync(phDir)) {
      if (!name.endsWith(".placeholder.webp")) continue;
      const base = name.replace(".placeholder.webp", ".png");
      await sharp(path.join(phDir, name)).png().toFile(path.join(slotPreviews, base));
    }
  }
  console.log("[design-pack] previews/ PNG");
}

function writeDeliveryNotes() {
  const text = `BM Quest Hub — Design Pack v1.0.0
=====================================

Передайте дизайнеру весь ZIP или папку BM_QuestHub_Design_Pack_v1.

Быстрый старт:
  1. Прочитать 01_Инструкция_дизайнеру.pdf
  2. Открыть templates-psd/ для нужного слота
  3. Экспортировать файлы по 02_Структура_inbox.pdf → Google Drive: BM_QuestHub_Media/Sync/
  4. Сообщить редактору — нужны make media-drive-pull и publish на сервере

Сборка пакета (для команды):
  make design-pack
  → dist/design-pack/BM_QuestHub_Design_Pack_v1.zip

Инструменты PDF (один раз на машине сборки):
  winget install JohnMacFarlane.Pandoc
  winget install MiKTeX.MiKTeX

Дата сборки: ${new Date().toISOString().slice(0, 10)}
`;
  fs.writeFileSync(path.join(DIST, "DELIVERY.txt"), text, "utf8");
  fs.writeFileSync(path.join(DIST, "inbox-README.txt"), fs.readFileSync(path.join(PACK_SRC, "inbox-README.txt"), "utf8"));
}

function main() {
  refreshPath();

  if (!which("pandoc")) {
    console.error("[design-pack] pandoc not in PATH — winget install JohnMacFarlane.Pandoc");
    process.exit(1);
  }
  if (!which("xelatex")) {
    console.error("[design-pack] xelatex not in PATH — winget install MiKTeX.MiKTeX");
    process.exit(1);
  }

  const psdScript = path.join(ROOT, "scripts", "generate-design-pack-psd.mjs");
  const psdRun = spawnSync(process.execPath, [psdScript], { cwd: ROOT, stdio: "inherit" });
  if (psdRun.status !== 0) process.exit(psdRun.status ?? 1);

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  fs.writeFileSync(
    path.join(DIST, "README.txt"),
    "BM Quest Hub Design Pack v1\r\nСм. DELIVERY.txt и 01_Инструкция_дизайнеру.pdf\r\n",
    "utf8",
  );
  fs.writeFileSync(path.join(DIST, "VERSION.txt"), "1.0.0\n", "utf8");

  pandocPdf(path.join(PACK_SRC, "handbook.ru.md"), path.join(DIST, "01_Инструкция_дизайнеру"));
  pandocPdf(
    path.join(PACK_SRC, "media-inbox-layout.md"),
    path.join(DIST, "02_Структура_inbox"),
  );

  writeCsv();
  cpDir(path.join(PACK_SRC, "psd"), path.join(DIST, "templates-psd"));
  cpDir(ASSETS, path.join(DIST, "templates-svg"));

  buildPreviews()
    .then(() => {
      writeDeliveryNotes();

      const zipPath = path.join(ROOT, "dist", "design-pack", "BM_QuestHub_Design_Pack_v1.zip");
      fs.mkdirSync(path.dirname(zipPath), { recursive: true });
      if (process.platform === "win32") {
        const r = spawnSync(
          "powershell",
          [
            "-NoProfile",
            "-Command",
            `Compress-Archive -LiteralPath '${DIST}' -DestinationPath '${zipPath}' -Force`,
          ],
          { stdio: "inherit" },
        );
        if (r.status !== 0) process.exit(r.status ?? 1);
      } else {
        spawnSync("zip", ["-r", zipPath, "."], { cwd: path.dirname(DIST), stdio: "inherit" });
      }
      console.log(`[design-pack] ready: ${zipPath}`);

      loadDotEnv(path.join(ROOT, "scripts", "design-pack-oauth.env"));
      loadDotEnv(path.join(ROOT, "scripts", "design-pack.env"));
      loadDotEnv(path.join(ROOT, "apps", "web", ".env.local"));

      const driveFolderId = process.env.GOOGLE_MEDIA_DRIVE_FOLDER_ID?.trim();
      const hasSa = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim());
      const hasOAuth = hasRefreshToken(defaultOAuthTokenPath(ROOT));

      if (driveFolderId && (hasOAuth || hasSa)) {
        console.log("[design-pack] uploading to Google Drive…");
        const pub = spawnSync(
          process.execPath,
          [path.join(ROOT, "scripts", "publish-design-pack-to-drive.mjs")],
          { cwd: ROOT, stdio: "inherit", env: process.env },
        );
        if (pub.status !== 0) process.exit(pub.status ?? 1);
      } else if (driveFolderId) {
        console.log(
          "[design-pack] Drive skip — no credentials. OAuth: make design-pack-oauth-login — or set GOOGLE_SERVICE_ACCOUNT_JSON (Shared drive)",
        );
      } else {
        console.log(
          "[design-pack] Drive skip — set GOOGLE_MEDIA_DRIVE_FOLDER_ID in scripts/design-pack.env",
        );
      }
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

main();
