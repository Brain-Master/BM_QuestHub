#!/usr/bin/env node
/** Admin CMS CI guard (INT-02). Node built-ins only; no network/secrets. */
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const MIN_ADMIN_TEST_FILES = 5;
export const MIN_ADMIN_TESTS = 53;
export const EXPECTED_MANIFEST_ENTRIES = 32;
export const REQUIRED_NODE = "22.23.1";
export const WORKFLOW_REL = ".github/workflows/admin-cms-ci.yml";
export const MANIFEST_REL = "docs/admin-cms/MANIFEST.sha256";

const ANSI_RE = /\u001b\[[0-9;]*m/g;
const MANIFEST_LINE_RE = /^([0-9a-f]{64}) {2}(.+)$/;
const FORBIDDEN_WORKFLOW_SNIPPETS = [
  "pull_request_target", "workflow_run:", "permissions: write-all", "contents: write",
  "actions: write", "checks: write", "pull-requests: write", "${{ secrets.",
  "persist-credentials: true", "npm install", "npx", "curl", "wget", "gh api", "gh pr", "git push",
];
const REQUIRED_WORKFLOW = [
  ["name: Admin CMS CI", "name"], ["pull_request:", "pull_request"], ["push:", "push"],
  ["workflow_dispatch:", "dispatch"], ["contents: read", "contents-read"],
  ["actions/checkout@v4", "checkout-v4"], ["fetch-depth: 0", "fetch-depth"],
  ["persist-credentials: false", "no-creds"], ["actions/setup-node@v4", "setup-node-v4"],
  ["22.23.1", "exact-node"], ["timeout-minutes: 15", "timeout"], ["npm ci", "npm-ci"],
  ["make secret-scan", "secret-scan"], ["admin-cms-quality:", "job-id"],
];

function fail(code, phase, message) {
  console.error(`[admin-cms-ci-guard] phase=${phase} status=FAIL ${message}`);
  process.exit(code);
}
function usageFail(message) { fail(2, "cli", message); }
function matchPrefix(p, prefix) { return p === prefix || p.startsWith(`${prefix}/`); }

export function normalizeRepoPath(value) {
  if (typeof value !== "string") throw new Error("invalid path: non-string");
  let p = value.replace(/\\/g, "/").trim();
  if (!p) throw new Error("invalid path: empty");
  while (p.startsWith("./")) p = p.slice(2);
  p = p.replace(/\/+/g, "/");
  if (p.endsWith("/") && p.length > 1) p = p.slice(0, -1);
  if (!p) throw new Error("invalid path: empty");
  if (path.isAbsolute(value) || path.win32.isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value) || p.startsWith("/")) {
    throw new Error("invalid path: absolute");
  }
  if (p.includes("\0") || p.includes("\\")) throw new Error("invalid path: unsafe");
  const parts = p.split("/");
  for (const part of parts) {
    if (part === "" || part === "." || part === "..") throw new Error("invalid path: traversal");
  }
  return parts.join("/");
}

export function isPublicEnvExample(repoPath) {
  try {
    const base = normalizeRepoPath(repoPath).split("/").pop() ?? "";
    return base === ".env.example" || base.endsWith(".env.example");
  } catch {
    return false;
  }
}

export function forbiddenChangedPathReason(repoPath) {
  let p;
  try { p = normalizeRepoPath(repoPath); } catch { return "unsafe-path"; }
  if (matchPrefix(p, "apps/admin/dist")) return "admin-dist";
  if (matchPrefix(p, "apps/admin/node_modules")) return "admin-node-modules";
  if (matchPrefix(p, "tools/secret-scan/node_modules")) return "secret-scan-node-modules";
  if (matchPrefix(p, "secret")) return "secret-dir";
  if (matchPrefix(p, "BM_QuestHub_CMS_Document_Package")) return "source-doc-package";
  const base = p.split("/").pop() ?? "";
  const lower = base.toLowerCase();
  if (lower.endsWith(".pem")) return "pem";
  if (lower.endsWith(".key")) return "key";
  if (lower.includes("service-account") && lower.endsWith(".json")) return "service-account-json";
  if (base === ".env" || (base.startsWith(".env.") && !isPublicEnvExample(p))) return "env-secret";
  return null;
}

export function parseManifestLine(line) {
  if (typeof line !== "string") throw new Error("manifest: non-string line");
  if (line.trim() === "") throw new Error("manifest: blank line");
  const m = MANIFEST_LINE_RE.exec(line);
  if (!m || !/^[0-9a-f]{64}$/.test(m[1])) throw new Error("manifest: malformed row");
  const rel = m[2];
  if (rel.startsWith("/") || rel.includes("\\") || rel.includes("..") || path.isAbsolute(rel)) {
    throw new Error("manifest: unsafe path");
  }
  for (const part of rel.split("/")) {
    if (!part || part === "." || part === "..") throw new Error("manifest: traversal");
  }
  return { hash: m[1], path: rel };
}

export function verifyDocumentationManifest(options) {
  const manifestPath = options.manifestPath ?? path.join(options.repoRoot, MANIFEST_REL);
  const packageRoot = options.packageRoot ?? path.join(options.repoRoot, "docs", "admin-cms");
  const expectedEntries = options.expectedEntries ?? EXPECTED_MANIFEST_ENTRIES;
  const lines = fs.readFileSync(manifestPath, "utf8").split(/\r?\n/).filter((l) => l.length > 0);
  const seen = new Set();
  let valid = 0;
  for (const line of lines) {
    const row = parseManifestLine(line);
    if (seen.has(row.path)) throw new Error("manifest: duplicate path");
    seen.add(row.path);
    const abs = path.join(packageRoot, row.path);
    if (!fs.statSync(abs).isFile()) throw new Error("manifest: not a regular file");
    const hash = crypto.createHash("sha256").update(fs.readFileSync(abs)).digest("hex");
    if (hash !== row.hash) throw new Error("manifest: hash mismatch");
    valid += 1;
  }
  if (lines.length !== expectedEntries) {
    throw new Error(`manifest: expected ${expectedEntries} entries, got ${lines.length}`);
  }
  return { entries: lines.length, valid };
}

function parseSide(side) {
  const counts = { passed: 0, failed: 0, skipped: 0, todo: 0 };
  for (const part of side.replace(/\([^)]*\)\s*$/, "").trim().split("|").map((x) => x.trim())) {
    const m = part.match(/^(\d+)\s+(passed|failed|skipped|todo)\b/i);
    if (m) counts[m[2].toLowerCase()] = Number(m[1]);
  }
  return counts;
}

export function parseVitestSummary(output) {
  const text = String(output).replace(ANSI_RE, "");
  const filesLine = text.match(/Test Files\s+([^\n\r]+)/);
  const testsLine = text.match(/\bTests\s+([^\n\r]+)/);
  if (!filesLine || !testsLine) throw new Error("vitest: missing summary lines");
  const files = parseSide(filesLine[1]);
  const tests = parseSide(testsLine[1]);
  if (files.passed === 0 && files.failed === 0 && tests.passed === 0 && tests.failed === 0
    && !/\d+\s+passed/.test(filesLine[1]) && !/\d+\s+passed/.test(testsLine[1])) {
    throw new Error("vitest: malformed summary");
  }
  return {
    passedFiles: files.passed, failedFiles: files.failed, skippedFiles: files.skipped, todoFiles: files.todo,
    passedTests: tests.passed, failedTests: tests.failed, skippedTests: tests.skipped, todoTests: tests.todo,
  };
}

export function verifyVitestSummary(summary) {
  if (!summary || typeof summary !== "object") throw new Error("vitest: missing summary");
  const s = summary;
  if (s.failedFiles !== 0 || s.failedTests !== 0) throw new Error("vitest: failures present");
  if (s.skippedFiles !== 0 || s.skippedTests !== 0 || s.todoFiles !== 0 || s.todoTests !== 0) {
    throw new Error("vitest: skipped/todo present");
  }
  if (s.passedFiles < MIN_ADMIN_TEST_FILES) throw new Error(`vitest: passed files below baseline (${MIN_ADMIN_TEST_FILES})`);
  if (s.passedTests < MIN_ADMIN_TESTS) throw new Error(`vitest: passed tests below baseline (${MIN_ADMIN_TESTS})`);
  return true;
}

function countTopLevelJobs(workflowText) {
  const ids = [];
  let inJobs = false;
  let jobsIndent = null;
  for (const line of workflowText.split(/\r?\n/)) {
    if (/^jobs:\s*$/.test(line)) { inJobs = true; jobsIndent = 0; continue; }
    if (!inJobs) continue;
    if (/^\S/.test(line) && !/^\s*$/.test(line)) break;
    const m = line.match(/^([ \t]+)([A-Za-z0-9_-]+):\s*$/);
    if (!m) continue;
    const indent = m[1].length;
    if (jobsIndent === 0) { jobsIndent = indent; ids.push(m[2]); }
    else if (indent === jobsIndent) ids.push(m[2]);
  }
  return ids;
}

export function verifyWorkflowPolicy(workflowText) {
  if (typeof workflowText !== "string" || !workflowText.trim()) throw new Error("workflow: empty");
  for (const snip of FORBIDDEN_WORKFLOW_SNIPPETS) {
    if (workflowText.includes(snip)) throw new Error("workflow: forbidden snippet");
  }
  for (const [needle, label] of REQUIRED_WORKFLOW) {
    if (!workflowText.includes(needle)) throw new Error(`workflow: missing ${label}`);
  }
  const jobs = countTopLevelJobs(workflowText);
  if (jobs.length !== 1 || jobs[0] !== "admin-cms-quality") {
    throw new Error("workflow: expected exactly one job admin-cms-quality");
  }
  return true;
}

function runGit(repoRoot, args) {
  const result = spawnSync("git", args, { cwd: repoRoot, encoding: "utf8", shell: false, maxBuffer: 16 * 1024 * 1024 });
  if (result.error) throw new Error(`git failed: ${result.error.message}`);
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || "").trim().slice(0, 200);
    throw new Error(`git exit ${result.status}${err ? `: ${err}` : ""}`);
  }
  return result.stdout;
}

export function listChangedPaths(repoRoot, baseSha) {
  const out = runGit(repoRoot, ["diff", "--name-only", "-z", `${baseSha}...HEAD`]);
  if (!out) return [];
  const seen = new Set();
  const paths = [];
  for (const raw of out.split("\0").filter((p) => p.length > 0)) {
    const n = normalizeRepoPath(raw);
    if (seen.has(n)) continue;
    seen.add(n);
    paths.push(n);
  }
  return paths;
}

export function listTrackedPaths(repoRoot) {
  const out = runGit(repoRoot, ["ls-files", "-z"]);
  if (!out) return [];
  return out.split("\0").filter((p) => p.length > 0).map((raw) => normalizeRepoPath(raw));
}

function resolveRepoRoot(explicit) {
  if (explicit) return path.resolve(explicit);
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8", shell: false });
  if (result.status !== 0 || !result.stdout.trim()) {
    throw new Error("MISSING_PREREQUISITE: cannot resolve repository root");
  }
  return path.resolve(result.stdout.trim());
}

function assertBaseCommit(repoRoot, baseSha) {
  if (!/^[0-9a-f]{7,40}$/i.test(baseSha)) throw new Error("invalid base sha");
  const result = spawnSync("git", ["cat-file", "-e", `${baseSha}^{commit}`], {
    cwd: repoRoot, encoding: "utf8", shell: false,
  });
  if (result.status !== 0) throw new Error("base commit missing");
}

export function runPreflight(options) {
  if (process.versions.node !== REQUIRED_NODE) {
    throw new Error(`Node must be exactly ${REQUIRED_NODE} (got ${process.versions.node})`);
  }
  const repoRoot = resolveRepoRoot(options.repoRoot);
  const baseSha = options.baseSha;
  if (!baseSha) throw new Error("MISSING_PREREQUISITE: --base required");
  assertBaseCommit(repoRoot, baseSha);
  const check = spawnSync("git", ["diff", "--check", `${baseSha}...HEAD`], {
    cwd: repoRoot, encoding: "utf8", shell: false,
  });
  if (check.status !== 0) throw new Error("git diff --check failed");
  const changed = listChangedPaths(repoRoot, baseSha);
  const forbidden = changed.map(forbiddenChangedPathReason).filter(Boolean);
  if (forbidden.length > 0) throw new Error(`forbidden changed paths: ${forbidden.length}`);
  const ephemeral = listTrackedPaths(repoRoot).filter((p) =>
    matchPrefix(p, "apps/admin/dist") || matchPrefix(p, "apps/admin/node_modules")
    || matchPrefix(p, "tools/secret-scan/node_modules"));
  if (ephemeral.length > 0) throw new Error(`tracked ephemeral paths: ${ephemeral.length}`);
  const manifest = verifyDocumentationManifest({ repoRoot });
  const workflowPath = path.join(repoRoot, WORKFLOW_REL);
  if (!fs.existsSync(workflowPath)) throw new Error("workflow file missing");
  verifyWorkflowPolicy(fs.readFileSync(workflowPath, "utf8"));
  console.log(`[admin-cms-ci-guard] phase=preflight status=PASS changed=${changed.length} manifest=${manifest.valid}/${manifest.entries} node=${REQUIRED_NODE}`);
  return { changedCount: changed.length, manifest };
}

function parseArgs(argv) {
  const mode = argv[0];
  const flags = {};
  for (let i = 1; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith("--")) usageFail("unknown positional");
    const key = a.slice(2);
    const val = argv[i + 1];
    if (!val || val.startsWith("--")) usageFail(`missing value for --${key}`);
    flags[key] = val;
    i += 1;
  }
  return { mode, flags };
}

function readTextFile(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return buf.slice(2).toString("utf16le");
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) return buf.slice(3).toString("utf8");
  return buf.toString("utf8");
}

function runTestSummary(flags) {
  if (!flags.log || !flags["github-summary"]) usageFail("test-summary requires --log and --github-summary");
  if (!fs.existsSync(flags.log)) usageFail("test log missing");
  const summary = parseVitestSummary(readTextFile(flags.log));
  verifyVitestSummary(summary);
  const skipped = summary.skippedTests + summary.todoTests + summary.skippedFiles + summary.todoFiles;
  fs.appendFileSync(flags["github-summary"], [
    "## Admin test summary", "", "| Metric | Value |", "| --- | ---: |",
    `| Passed files | ${summary.passedFiles} |`, `| Passed tests | ${summary.passedTests} |`,
    `| Failed files | ${summary.failedFiles} |`, `| Failed tests | ${summary.failedTests} |`,
    `| Skipped/todo | ${skipped} |`, "",
  ].join("\n"), "utf8");
  console.log(`[admin-cms-ci-guard] phase=test-summary status=PASS files=${summary.passedFiles} tests=${summary.passedTests}`);
}

function main(argv) {
  const { mode, flags } = parseArgs(argv);
  if (mode !== "preflight" && mode !== "test-summary") usageFail("unknown mode");
  const unknown = Object.keys(flags).filter((k) =>
    mode === "preflight" ? k !== "base" : k !== "log" && k !== "github-summary");
  if (unknown.length > 0) usageFail("unknown flag");
  try {
    if (mode === "preflight") {
      if (!flags.base) usageFail("preflight requires --base");
      runPreflight({ baseSha: flags.base });
      return;
    }
    runTestSummary(flags);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    fail(msg.startsWith("MISSING_PREREQUISITE") ? 2 : 1, mode, msg);
  }
}

const isDirect = process.argv[1]
  && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);
if (isDirect) main(process.argv.slice(2));
