// The one quick browser check (O-038 T-145): `npm run check:browser`. Starts its own dev server, runs these steps one after another (one browser at a time) into
// docs/evidence/browser-<UTC stamp>/, prints a line per step and a total, and exits non-zero on any failure or console error.
import { runSet } from "./runner.mjs";

/** The steps: edit here. `public` steps run against a scratch ASTRAEUS_PUBLIC_BUILD=1 build; `noBrowser` ones are handed its directory; an `example` step builds the examples and previews the named one. */
const STEPS = [
  { name: "smoke", script: "browser-smoke.mjs", scene: "every public page and demo view, desktop and phone" },
  { name: "smoke-public-showers", script: "browser-smoke.mjs", public: true, env: { ASTRAEUS_VIEWS: "showers" }, scene: "showers views on the scratch public build: stream dots drawn" },
  { name: "planets-phone", script: "journey-planets-phone.mjs", scene: "planets on a phone: switch planet, focus Io, open a place card" },
  { name: "meteor-shower", script: "journey-meteor-shower.mjs", scene: "showers (Perseids): play, seek, open a story panel" },
  { name: "hello-scene", script: "check-hello-scene.mjs", example: "hello-scene", scene: "examples/hello-scene from the packed tarballs: Earth, Moon and the followed path drawn, time set, desktop and phone" },
  { name: "hello-react", script: "check-hello-scene.mjs", example: "hello-react", scene: "examples/hello-react (AstraeusScene) from the packed tarballs: Earth, Moon and the followed path drawn, time set, desktop and phone" },
  { name: "public-build-assets", script: "public-build-assets.mjs", public: true, noBrowser: true },
  { name: "public-addresses", script: "public-addresses.mjs", public: true, noBrowser: true },
];

process.exitCode = await runSet("browser", STEPS);
