// The engine browser checks (O-034 T-110): `npm run check:engine`. Starts its own dev server, runs these scripts one after another into docs/evidence/engine-<UTC stamp>/,
// prints a line per script and a total, and exits non-zero on any failure or console error. Uses the project's own playwright-core (PLAYWRIGHT_CORE is an optional override).
import { runSet } from "./runner.mjs";

/** Set membership: edit here. `public` steps run against a scratch ASTRAEUS_PUBLIC_BUILD=1 build; `noBrowser` ones are handed its directory. */
const STEPS = [
  { name: "shell", script: "browser-shell.mjs" },
  { name: "synthetic", script: "browser-synthetic.mjs" },
  { name: "synthetic-ring", script: "browser-synthetic-ring.mjs" },
  { name: "synthetic-listed", script: "browser-synthetic-listed.mjs" },
  { name: "orbit-look", script: "browser-orbit-look.mjs" },
  { name: "public-build-assets", script: "public-build-assets.mjs", public: true, noBrowser: true },
  { name: "public-addresses", script: "public-addresses.mjs", public: true, noBrowser: true },
];

process.exitCode = await runSet("engine", STEPS);
