// One demo's optional browser checks (O-034 T-110): `npm run check:demo -- <apollo|showers|jupiter>`. Same behaviour as run-engine.mjs, into docs/evidence/demo-<name>-<UTC stamp>/.
import { runSet } from "./runner.mjs";

/** Set membership per demo: edit here. */
const DEMOS = {
  apollo: [
    { name: "lite", script: "browser-lite.mjs" },
    { name: "phone", script: "browser-phone.mjs" },
    { name: "controls", script: "browser-controls.mjs" },
    { name: "spike02", script: "browser-spike02.mjs" },
    { name: "spike03", script: "browser-spike03.mjs" },
    { name: "anchor-labels", script: "browser-anchor-labels.mjs" },
    { name: "tap-focus", script: "browser-tap-focus.mjs" },
    { name: "view-link", script: "browser-view-link.mjs" },
    { name: "embedded", script: "browser-embedded.mjs" },
    { name: "home-curve-fits", script: "browser-home-curve-fits.mjs" },
    { name: "sky", script: "browser-sky.mjs" },
  ],
  showers: [
    { name: "showers-perseids", script: "browser-showers.mjs", args: ["perseids"] },
    { name: "showers-geminids", script: "browser-showers.mjs", args: ["geminids"], env: { ASTRAEUS_LIGHT: "1" } },
    { name: "public-showers", script: "browser-public-showers.mjs", public: true },
    { name: "story-panels", script: "browser-story-panels.mjs" },
  ],
  jupiter: [
    { name: "jupiter-io", script: "browser-jupiter-io.mjs" },
    { name: "moon-panel", script: "browser-moon-panel.mjs" },
    { name: "orbit-motion", script: "browser-orbit-motion.mjs" },
  ],
};

const demo = process.argv[2];
if (!Object.hasOwn(DEMOS, demo ?? "")) {
  console.error(`usage: npm run check:demo -- <${Object.keys(DEMOS).join("|")}>`);
  process.exitCode = 2;
} else {
  process.exitCode = await runSet(`demo-${demo}`, DEMOS[demo]);
}
