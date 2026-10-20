// One demo's optional browser checks (O-034 T-110): `npm run check:demo -- <apollo|showers|jupiter>`. Same behaviour as run-engine.mjs, into docs/evidence/demo-<name>-<UTC stamp>/.
import { runSet } from "./runner.mjs";

/** Set membership per demo: edit here. */
const DEMOS = {
  apollo: [
    { name: "smoke", script: "browser-lite.mjs", scene: "apollo11 + home page", env: { LITE_ONLY: "apollo11", LITE_PAGES: "index" } },
    { name: "apollo-shell", script: "browser-apollo-shell.mjs" },
    { name: "spike02", script: "browser-spike02.mjs" },
    { name: "home-curve-fits", script: "browser-home-curve-fits.mjs" },
    { name: "story-panels", script: "browser-story-panels.mjs", env: { STORY_ONLY: "apollo" } },
  ],
  showers: [
    { name: "smoke", script: "browser-lite.mjs", scene: "showers, perseids, geminids", env: { LITE_ONLY: "showers*", LITE_PAGES: "" } },
    { name: "showers-perseids", script: "browser-showers.mjs", args: ["perseids"] },
    { name: "showers-geminids", script: "browser-showers.mjs", args: ["geminids"], env: { ASTRAEUS_LIGHT: "1" } },
    { name: "public-showers", script: "browser-public-showers.mjs", public: true },
    { name: "story-panels", script: "browser-story-panels.mjs", env: { STORY_ONLY: "showers" } },
  ],
  jupiter: [
    { name: "smoke", script: "browser-lite.mjs", scene: "jupiter-io + catalogue page", env: { LITE_ONLY: "jupiter-io", LITE_PAGES: "assets" } },
    { name: "jupiter-io", script: "browser-jupiter-io.mjs" },
    { name: "moon-panel", script: "browser-moon-panel.mjs" },
    { name: "jupiter-tap", script: "browser-jupiter-tap.mjs" },
    { name: "story-panels", script: "browser-story-panels.mjs", env: { STORY_ONLY: "jupiter" } },
  ],
};

const demo = process.argv[2];
if (!Object.hasOwn(DEMOS, demo ?? "")) {
  console.error(`usage: npm run check:demo -- <${Object.keys(DEMOS).join("|")}>`);
  process.exitCode = 2;
} else {
  process.exitCode = await runSet(`demo-${demo}`, DEMOS[demo]);
}
