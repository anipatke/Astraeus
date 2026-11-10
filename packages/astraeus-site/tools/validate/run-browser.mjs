// The one quick browser check (O-038 T-145): `npm run check:browser`. Starts its own dev server, runs these steps one after another (one browser at a time) into
// docs/evidence/browser-<UTC stamp>/, prints a line per step and a total, and exits non-zero on any failure or console error.
import { runSet } from "./runner.mjs";

/** The steps: edit here. `public` steps run against a scratch ASTRAEUS_PUBLIC_BUILD=1 build; `noBrowser` ones are handed its directory; an `example` step builds the examples and previews the named one. */
const STEPS = [
  { name: "smoke", script: "browser-smoke.mjs", scene: "every public page and demo view, desktop and phone" },
  { name: "smoke-public-showers", script: "browser-smoke.mjs", public: true, env: { ASTRAEUS_VIEWS: "showers" }, scene: "showers views on the scratch public build: stream dots drawn" },
  { name: "planets-phone", script: "journey-planets-phone.mjs", scene: "planets on a phone: switch planet, focus Io, open a place card" },
  { name: "meteor-shower", script: "journey-meteor-shower.mjs", scene: "showers (Perseids): play, seek, open a story panel" },
  { name: "views", script: "journey-views.mjs", scene: "synthetic-views (made-up, two probes, three views): a visitor switch and a host setView at desktop and phone size, the stay rule holds the camera still" },
  { name: "look-out", script: "journey-look-out.mjs", scene: "synthetic-lookout (made-up, Sun, Earth and Mars): opens looking out from Earth, the menu offers Look out from Earth and Mars clear of the controls, Focus returns; two made-up sky figures, an outline and four switches, the site trace control (Stay, Fade and Stay-then-Hide, each waiting for the `sky-trace:<id>` line set in `data-sky-lines` to appear and go), labels do not overlap; desktop and phone size" },
  { name: "hello-scene", script: "check-hello-scene.mjs", example: "hello-scene", env: { HELLO_STORY: "1" }, scene: "examples/hello-scene from the packed tarballs: the made-up story (anchors, events, one panel, looking at the probe), Earth and Moon drawn, time set, desktop and phone" },
  { name: "hello-react", script: "check-hello-scene.mjs", example: "hello-react", scene: "examples/hello-react (AstraeusScene) from the packed tarballs: Earth, Moon and the followed path drawn, time set, desktop and phone" },
  { name: "hello-planets", script: "check-hello-planets.mjs", example: "hello-planets", scene: "examples/hello-planets from the packed tarballs: the Sun to Mars drawn, the page's own sliders and scale button drive the viewer, Earth's distance from the Sun, no overlap, desktop and phone" },
  { name: "public-build-assets", script: "public-build-assets.mjs", public: true, noBrowser: true },
  { name: "public-addresses", script: "public-addresses.mjs", public: true, noBrowser: true },
];

process.exitCode = await runSet("browser", STEPS);
