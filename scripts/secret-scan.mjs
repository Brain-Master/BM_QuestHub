#!/usr/bin/env node
/**
 * Repository secret-scan gate wrapper.
 *
 * Canonical entry: `make secret-scan` → `node scripts/secret-scan.mjs`
 *
 * Scans Git tracked files + untracked non-ignored files (current worktree).
 * Does not scan Git history, ignored local secrets, remotes, or secret stores.
 *
 * Never disables secret masking. Never uses --output (Secretlint exits 0 with
 * findings when --output is set). Never shell-expands candidate paths.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FALLBACK_ROOT = path.resolve(SCRIPT_DIR, "..");

/** Conservative Windows CreateProcess command-line budget (characters). */
const MAX_BATCH_CHARS = 28000;

function fail(code, phase, message) {
  console.error(`[secret-scan] phase=${phase} status=FATAL ${message}`);
  process.exit(code);
}

function resolveRepoRoot() {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
    shell: false,
  });
  if (result.status !== 0) {
    fail(2, "resolve-root", "MISSING_PREREQUISITE: git rev-parse --show-toplevel failed");
  }
  const root = result.stdout.trim();
  if (!root) {
    fail(2, "resolve-root", "MISSING_PREREQUISITE: empty repository root");
  }
  return path.resolve(root);
}

function assertNodeMajor22() {
  const major = Number.parseInt(process.versions.node.split(".")[0], 10);
  if (major !== 22) {
    fail(
      2,
      "node-version",
      `MISSING_PREREQUISITE: active Node major must be 22 (got ${process.versions.node})`,
    );
  }
}

function resolveSecretlintBin(repoRoot) {
  const toolPkgDir = path.join(repoRoot, "tools", "secret-scan");
  const toolModules = path.join(toolPkgDir, "node_modules");
  const secretlintPkgJson = path.join(toolModules, "secretlint", "package.json");
  if (!fs.existsSync(secretlintPkgJson)) {
    fail(
      2,
      "tool-install",
      "MISSING_PREREQUISITE: tools/secret-scan/node_modules missing; run npm ci in tools/secret-scan",
    );
  }
  const requireFromTool = createRequire(pathToFileURL(path.join(toolPkgDir, "package.json")).href);
  let pkg;
  try {
    pkg = requireFromTool("secretlint/package.json");
  } catch {
    fail(
      2,
      "tool-install",
      "MISSING_PREREQUISITE: cannot resolve local secretlint package",
    );
  }
  const binField = pkg.bin;
  let binRel;
  if (typeof binField === "string") {
    binRel = binField;
  } else if (binField && typeof binField === "object" && typeof binField.secretlint === "string") {
    binRel = binField.secretlint;
  } else {
    fail(2, "tool-bin", "FATAL: secretlint package.json bin entry missing or unexpected");
  }
  const secretlintRoot = path.dirname(requireFromTool.resolve("secretlint/package.json"));
  const binAbs = path.resolve(secretlintRoot, binRel);
  if (!fs.existsSync(binAbs)) {
    fail(2, "tool-bin", `FATAL: secretlint bin not found at declared path`);
  }
  return { binAbs, version: pkg.version };
}

function enumerateCandidates(repoRoot) {
  const result = spawnSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    {
      cwd: repoRoot,
      encoding: "buffer",
      shell: false,
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  if (result.status !== 0) {
    fail(2, "enumerate", "FATAL: git ls-files enumeration failed");
  }
  const raw = result.stdout.toString("utf8");
  const parts = raw.split("\0").filter((p) => p.length > 0);
  const accepted = [];
  for (const rel of parts) {
    if (path.isAbsolute(rel)) {
      fail(2, "enumerate", `FATAL: absolute candidate path rejected`);
    }
    const normalized = rel.replace(/\\/g, "/");
    if (normalized.split("/").includes("..")) {
      fail(2, "enumerate", `FATAL: path traversal rejected`);
    }
    const abs = path.resolve(repoRoot, normalized);
    const relToRoot = path.relative(repoRoot, abs);
    if (relToRoot.startsWith("..") || path.isAbsolute(relToRoot)) {
      fail(2, "enumerate", `FATAL: candidate resolves outside repository`);
    }
    let st;
    try {
      st = fs.lstatSync(abs);
    } catch {
      // Deleted between enumeration and scan — skip.
      continue;
    }
    if (st.isSymbolicLink()) {
      let target;
      try {
        target = fs.realpathSync(abs);
      } catch {
        fail(2, "enumerate", `FATAL: unsafe symlink cannot be resolved`);
      }
      const targetRel = path.relative(repoRoot, target);
      if (targetRel.startsWith("..") || path.isAbsolute(targetRel)) {
        fail(2, "enumerate", `FATAL: symlink target outside repository rejected`);
      }
    }
    accepted.push(normalized);
  }
  return accepted;
}

function batchPaths(paths) {
  const batches = [];
  let current = [];
  let currentLen = 0;
  for (const p of paths) {
    const addition = p.length + 1;
    if (current.length > 0 && currentLen + addition > MAX_BATCH_CHARS) {
      batches.push(current);
      current = [];
      currentLen = 0;
    }
    current.push(p);
    currentLen += addition;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

function runBatch(repoRoot, binAbs, configAbs, ignoreAbs, files) {
  const args = [
    binAbs,
    "--no-glob",
    "--no-color",
    "--no-terminalLink",
    "--secretlintrc",
    configAbs,
    "--secretlintignore",
    ignoreAbs,
    ...files,
  ];
  // Rejected flags must never appear in executed args:
  // --no-maskSecrets, --output, --format=mask-result, --force
  if (args.includes("--no-maskSecrets") || args.includes("--output")) {
    fail(2, "invoke", "FATAL: forbidden secretlint flags present in argument construction");
  }
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: false,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.error) {
    fail(2, "invoke", `FATAL: failed to spawn secretlint: ${result.error.message}`);
  }
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return typeof result.status === "number" ? result.status : 2;
}

function main() {
  assertNodeMajor22();
  const repoRoot = resolveRepoRoot();
  if (path.resolve(repoRoot) !== path.resolve(FALLBACK_ROOT) && !fs.existsSync(repoRoot)) {
    fail(2, "resolve-root", "FATAL: repository root does not exist");
  }

  const configAbs = path.join(repoRoot, ".secretlintrc.json");
  const ignoreAbs = path.join(repoRoot, ".secretlintignore");
  if (!fs.existsSync(configAbs)) {
    fail(2, "config", "FATAL: .secretlintrc.json missing");
  }
  if (!fs.existsSync(ignoreAbs)) {
    fail(2, "config", "FATAL: .secretlintignore missing");
  }

  const { binAbs, version } = resolveSecretlintBin(repoRoot);
  console.log(`[secret-scan] phase=start tool=secretlint@${version} node=${process.versions.node}`);

  const candidates = enumerateCandidates(repoRoot);
  if (candidates.length === 0) {
    fail(2, "enumerate", "FATAL: candidate file count is zero");
  }
  const batches = batchPaths(candidates);
  console.log(
    `[secret-scan] phase=enumerate files=${candidates.length} batches=${batches.length}`,
  );

  let aggregateExit = 0;
  for (let i = 0; i < batches.length; i++) {
    const status = runBatch(repoRoot, binAbs, configAbs, ignoreAbs, batches[i]);
    if (status === 2) {
      console.error(`[secret-scan] phase=batch index=${i + 1}/${batches.length} status=FATAL`);
      process.exit(2);
    }
    if (status === 1) {
      aggregateExit = 1;
      console.error(`[secret-scan] phase=batch index=${i + 1}/${batches.length} status=FINDINGS`);
      continue;
    }
    if (status !== 0) {
      console.error(
        `[secret-scan] phase=batch index=${i + 1}/${batches.length} status=FATAL unexpected_exit=${status}`,
      );
      process.exit(2);
    }
  }

  if (aggregateExit === 1) {
    console.error(`[secret-scan] phase=complete status=FINDINGS files=${candidates.length}`);
  } else {
    console.log(`[secret-scan] phase=complete status=PASS files=${candidates.length}`);
  }
  process.exit(aggregateExit);
}

main();
