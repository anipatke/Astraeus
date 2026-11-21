// Records the frame-loop profile (O-087 T-394): `node packages/astraeus-site/tools/validate/run-profile.mjs`. Builds the public site once, opens one Chromium and runs profile-frame-loop.mjs.
// The JSON goes to ASTRAEUS_PROFILE_OUT (default profile.json in the run's evidence folder). Never part of `check:browser`; nothing else may run a browser meanwhile.
import { join } from "node:path";
import { runSet } from "./runner.mjs";

const out =
  process.env.ASTRAEUS_PROFILE_OUT ??
  join(process.cwd(), "docs", "evidence", `o087-profile-run-${Date.now()}`, "profile.json");
const step = {
  name: "profile-frame-loop",
  script: "profile-frame-loop.mjs",
  public: true,
  env: { ASTRAEUS_PROFILE_OUT: out },
  scene:
    "the Apollo 11 page and Saturn planets page, paused and playing, diagnostics on and off, 3 runs of a 10 s window each",
};
process.exitCode = await runSet("profile", [step], undefined, "steps");
console.log(`profile: ${out}`);
