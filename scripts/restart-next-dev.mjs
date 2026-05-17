import { execFile, spawn } from "node:child_process";
import process from "node:process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const PORT = "3000";

async function getPidsOnPort(port) {
  if (process.platform === "win32") {
    const { stdout } = await execFileAsync("netstat", ["-ano", "-p", "tcp"]);

    return [
      ...new Set(
        stdout
          .split(/\r?\n/)
          .map((line) => line.trim().split(/\s+/))
          .filter((columns) => columns[1]?.endsWith(`:${port}`) && columns[3] === "LISTENING")
          .map((columns) => columns[4])
          .filter(Boolean),
      ),
    ];
  }

  try {
    const { stdout } = await execFileAsync("lsof", ["-ti", `tcp:${port}`]);
    return [...new Set(stdout.split(/\s+/).filter(Boolean))];
  } catch (error) {
    if (error.code === 1) {
      return [];
    }

    throw error;
  }
}

async function killPid(pid) {
  if (String(process.pid) === pid) {
    return;
  }

  if (process.platform === "win32") {
    await execFileAsync("taskkill", ["/PID", pid, "/T", "/F"]);
    return;
  }

  process.kill(Number(pid), "SIGTERM");
}

async function waitForPortFree(port) {
  const deadline = Date.now() + 5_000;

  while (Date.now() < deadline) {
    if ((await getPidsOnPort(port)).length === 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Port ${port} is still busy after stopping the previous process.`);
}

const pids = await getPidsOnPort(PORT);

if (pids.length > 0) {
  console.log(`Stopping process(es) on port ${PORT}: ${pids.join(", ")}`);
  await Promise.all(pids.map(killPid));
  await waitForPortFree(PORT);
} else {
  console.log(`Port ${PORT} is free.`);
}

console.log(`Starting Next dev server on port ${PORT}...`);

const child =
  process.platform === "win32"
    ? spawn("npm --prefix apps/web run dev:host", { shell: true, stdio: "inherit" })
    : spawn("npm", ["--prefix", "apps/web", "run", "dev:host"], { stdio: "inherit" });

child.on("error", (error) => {
  console.error(`Failed to start Next dev server: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(1);
    return;
  }

  process.exit(code ?? 0);
});
