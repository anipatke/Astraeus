// The one quick browser check (O-038 T-145): `npm run check:browser`. Starts its own dev server, runs the steps of the chosen tier (--tier quick|full, default full; --step <name> alone runs only the named steps,
// and with --tier adds them to the tier (O-094 T-424); --skip-examples leaves out the packed hello-* steps; --list prints them) one after another (one browser at a time) into
// docs/evidence/browser-<UTC stamp>/, prints a line per step and a total, and exits non-zero on any failure or console error.
import { runSet } from "./runner.mjs";
import { loadLimits } from "../../../../tools/gate-limits.mjs";
import { addedStepsLimit, selectSteps } from "./browser-steps.mjs";

const USAGE = "usage: run-browser.mjs [--tier quick|full] [--step <name>]... [--skip-examples] [--list]";
const args = process.argv.slice(2);
let tier;
const names = [];
let list = false;
let skipExamples = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--tier" && args[i + 1] !== undefined) tier = args[++i];
  else if (args[i] === "--step" && args[i + 1] !== undefined) names.push(args[++i]);
  else if (args[i] === "--skip-examples") skipExamples = true;
  else if (args[i] === "--list") list = true;
  else {
    console.error(`unknown argument "${args[i]}"; ${USAGE}`);
    process.exit(2);
  }
}
let steps;
try {
  // `--step` alone runs only the named steps; with `--tier` the named steps join the tier.
  steps =
    tier === undefined ? selectSteps({ steps: names, skipExamples }) : selectSteps({ tier, add: names, skipExamples });
} catch (error) {
  console.error(`${error.message}; ${USAGE}`);
  process.exit(2);
}
if (list) {
  for (const step of steps) console.log(`${step.name} | ${step.tier}`);
} else {
  // A `--step`-only run is neither tier: it prints step lines and a total without a limit. A quick tier with added steps is a quick run whose total limit is quickLookOutTotal
  // plus each added step's own limit beyond look-out (gate-limits.json); a full tier already holds every step.
  if (tier === undefined && names.length > 0) process.exitCode = await runSet("browser", steps, undefined, "steps");
  else if (tier === "quick" && names.length > 0) {
    const limits = loadLimits();
    console.log(`added steps: ${names.join(", ")}`);
    process.exitCode = await runSet(
      "browser",
      steps,
      { ...limits, browser: { ...limits.browser, quickTotal: addedStepsLimit(limits, names) } },
      "quick",
    );
  } else process.exitCode = await runSet("browser", steps, undefined, tier ?? "full");
}
