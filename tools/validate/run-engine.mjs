// The engine browser checks (O-034 T-110): `npm run check:engine`. Starts its own dev server, runs these scripts one after another into docs/evidence/engine-<UTC stamp>/,
// prints a line per script and a total, and exits non-zero on any failure or console error. Uses the project's own playwright-core (PLAYWRIGHT_CORE is an optional override).
import { runSet } from "./runner.mjs";

/** Set membership: edit here. `public` steps run against a scratch ASTRAEUS_PUBLIC_BUILD=1 build; `noBrowser` ones are handed its directory. */
const STEPS = [
  { name: "shell", script: "browser-shell.mjs", scene: "synthetic" },
  { name: "synthetic", script: "browser-synthetic.mjs", scene: "synthetic, synthetic-bare, synthetic-ring" },
  { name: "synthetic-ring", script: "browser-synthetic-ring.mjs", scene: "synthetic-ring, synthetic" },
  { name: "synthetic-listed", script: "browser-synthetic-listed.mjs", scene: "synthetic-listed, synthetic" },
  { name: "orbit-look", script: "browser-orbit-look.mjs", scene: "synthetic (Earth-Moon, readable scale)" },
  { name: "controls", script: "browser-controls.mjs", scene: "synthetic" },
  { name: "phone", script: "browser-phone.mjs", scene: "synthetic" },
  { name: "layout", script: "browser-layout.mjs", scene: "synthetic" },
  { name: "embedded", script: "browser-embedded.mjs", scene: "synthetic" },
  { name: "anchor-labels", script: "browser-anchor-labels.mjs", scene: "synthetic" },
  { name: "tap-focus", script: "browser-tap-focus.mjs", scene: "synthetic" },
  { name: "view-link", script: "browser-view-link.mjs", scene: "synthetic" },
  { name: "orbit-motion", script: "browser-orbit-motion.mjs", scene: "synthetic" },
  { name: "scale-menu", script: "browser-scale-menu.mjs", scene: "harness page (no experience)" },
  { name: "public-build-assets", script: "public-build-assets.mjs", public: true, noBrowser: true },
  { name: "public-addresses", script: "public-addresses.mjs", public: true, noBrowser: true },
];

process.exitCode = await runSet("engine", STEPS);
