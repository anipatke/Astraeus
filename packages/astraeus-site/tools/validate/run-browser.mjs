// The one quick browser check (O-038 T-145): `npm run check:browser`. Starts its own dev server, runs the steps of the chosen tier (--tier quick|full, default full; --step <name> runs named steps; --list prints them) one after another (one browser at a time) into
// docs/evidence/browser-<UTC stamp>/, prints a line per step and a total, and exits non-zero on any failure or console error.
import { runSet } from "./runner.mjs";
import { selectSteps } from "./browser-steps.mjs";

const USAGE = "usage: run-browser.mjs [--tier quick|full] [--step <name>]... [--list]";
const args = process.argv.slice(2);
let tier = "full";
const names = [];
let list = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--tier" && args[i + 1] !== undefined) tier = args[++i];
  else if (args[i] === "--step" && args[i + 1] !== undefined) names.push(args[++i]);
  else if (args[i] === "--list") list = true;
  else {
    console.error(`unknown argument "${args[i]}"; ${USAGE}`);
    process.exit(2);
  }
}
let steps;
try {
  steps = selectSteps({ tier, steps: names });
} catch (error) {
  console.error(`${error.message}; ${USAGE}`);
  process.exit(2);
}
if (list) {
  for (const step of steps) console.log(`${step.name} | ${step.tier}`);
} else {
  // A `--step` run is neither tier: it prints step lines and a total without a limit.
  process.exitCode = await runSet("browser", steps, undefined, names.length > 0 ? "steps" : tier);
}
