// The owner's preview on localhost:5490 (I-201): one command that always serves the checkout as it is now.
//   npm run preview:owner
// It stops an earlier preview started by this command, starts the site dev server with a fresh dependency cache (`--force`), and restarts it whenever the
// checkout's commit or branch changes under it (a branch switch, checkout, rebase or new commit), so the preview never serves a mix of two versions.
// Must not: run for browser checks (they start their own servers on other ports) or touch git state.
import { spawn, execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PORT = 5490;
const PID_FILE = join(tmpdir(), "astraeus-owner-preview.pid");
const POLL_MS = 2000;

/** The commit and branch the checkout is on, e.g. "o089-slim 4727f062…"; a change means the files under the server may have changed all at once. */
function checkoutState() {
  const run = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  return `${run(["rev-parse", "--abbrev-ref", "HEAD"])} ${run(["rev-parse", "HEAD"])}`;
}

/** Stops a preview this command started earlier (its supervisor stops its own server). */
function stopEarlier() {
  if (!existsSync(PID_FILE)) return;
  const pid = Number(readFileSync(PID_FILE, "utf8"));
  try {
    process.kill(pid, "SIGTERM");
    console.log(`owner-preview: stopped the earlier preview (pid ${pid})`);
  } catch {
    // already gone
  }
  rmSync(PID_FILE, { force: true });
}

let server;
let stopping = false;

function startServer() {
  const vite = join(ROOT, "node_modules", ".bin", "vite");
  server = spawn(vite, ["packages/astraeus-site", "--port", String(PORT), "--strictPort", "--force"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  server.on("exit", (code) => {
    if (stopping || server.restarting) return;
    console.error(
      `owner-preview: the server stopped (exit ${code}). If port ${PORT} is taken by a server not started with this command, stop that one and run again.`,
    );
    shutdown(1);
  });
}

function restartServer(reason) {
  console.log(`owner-preview: ${reason}; restarting the preview with a fresh cache. Reload the page.`);
  const old = server;
  old.restarting = true;
  old.once("exit", startServer);
  old.kill("SIGTERM");
}

function shutdown(code = 0) {
  stopping = true;
  server?.kill("SIGTERM");
  if (existsSync(PID_FILE) && readFileSync(PID_FILE, "utf8") === String(process.pid)) rmSync(PID_FILE, { force: true });
  process.exit(code);
}

stopEarlier();
// Give a stopped server a moment to free the port.
await new Promise((done) => setTimeout(done, 500));
writeFileSync(PID_FILE, String(process.pid));
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

let state = checkoutState();
console.log(`owner-preview: serving ${state} on http://localhost:${PORT}/`);
startServer();
setInterval(() => {
  let next;
  try {
    next = checkoutState();
  } catch {
    return; // git busy mid-operation; look again next tick
  }
  if (next === state) return;
  const reason = `the checkout changed (${state} -> ${next})`;
  state = next;
  restartServer(reason);
}, POLL_MS);
