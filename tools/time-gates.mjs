// The timed gates (O-060 T-283): `npm run check:gates [-- name ...]` runs the ordinary gates one after another (lint, typecheck, build, test, test:full,
// check:engine-alone, check:pack, check:node-consumer, check:react-consumer; or just those named), prints each one's wall-clock time against its limit from
// tools/gate-limits.json, and warns when one is over. Exit code: 1 if a gate failed, else 0; time alone never changes it. `check:browser` reports its own steps.
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadLimits, overrun } from "./gate-limits.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Run each gate (`{ name, command, args }`), time it, and report to `log` against `limits.gates[name]`.
 * Resolves to `{ ok, rows }`; `ok` depends on exit codes only.
 */
export function timeGates(gates, limits, log = console.log, cwd = root) {
  const rows = [];
  for (const gate of gates) {
    const started = Date.now();
    const run = spawnSync(gate.command, gate.args ?? [], { cwd, encoding: "utf8", maxBuffer: 2 ** 28 });
    const seconds = Math.round((Date.now() - started) / 100) / 10;
    const limit = limits.gates[gate.name];
    const passed = run.status === 0;
    if (!passed) log(`${run.stdout ?? ""}${run.stderr ?? ""}`.split("\n").slice(-40).join("\n"));
    log([gate.name, passed ? "passed" : `FAILED (exit ${run.status})`, `${seconds}s`, limit === undefined ? "no limit" : `limit ${limit}s`].join(" | "));
    const warning = overrun(gate.name, seconds, limit);
    if (warning) log(warning);
    rows.push({ name: gate.name, passed, seconds, limit, warning });
  }
  return { ok: rows.every((row) => row.passed), rows };
}

export function npmGates(names) {
  return names.map((name) => ({ name, command: "npm", args: ["run", name, "--silent"] }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const limits = loadLimits();
  const named = process.argv.slice(2);
  const unknown = named.filter((name) => limits.gates[name] === undefined);
  if (unknown.length > 0) { console.error(`no limit stated for: ${unknown.join(", ")}`); process.exit(2); }
  const { ok, rows } = timeGates(npmGates(named.length > 0 ? named : Object.keys(limits.gates)), limits);
  const total = Math.round(rows.reduce((sum, row) => sum + row.seconds, 0));
  console.log(`total ${total}s over ${rows.length} gates; ${rows.filter((row) => row.warning).length} over limit`);
  process.exit(ok ? 0 : 1);
}
