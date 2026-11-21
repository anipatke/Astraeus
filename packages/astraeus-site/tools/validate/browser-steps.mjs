// The steps of `npm run check:browser` and which tier each belongs to (O-086 T-388). Read by run-browser.mjs and by the limits test.
/** The steps: edit here. `tier` is "quick" (the everyday check) or "full" (adds the long journeys; the full tier runs every step). `public` steps run against a scratch ASTRAEUS_PUBLIC_BUILD=1 build; `noBrowser` ones are handed its directory; an `example` step builds the examples and previews the named one. */
export const STEPS = [
  {
    name: "smoke",
    tier: "quick",
    script: "browser-smoke.mjs",
    env: { ASTRAEUS_SKIP_VIEWS: "synthetic-journey" },
    scene: "every public page and demo view except the made-up journey, desktop and phone",
  },
  {
    name: "synthetic-journey",
    tier: "full",
    script: "browser-smoke.mjs",
    env: { ASTRAEUS_VIEWS: "synthetic-journey" },
    scene:
      "the made-up 1977-to-170-AU journey, desktop and phone side by side: moons, Saturn's orbit line, the phone near-Saturn sequence",
  },
  {
    name: "smoke-public-showers",
    tier: "quick",
    script: "browser-smoke.mjs",
    public: true,
    env: { ASTRAEUS_VIEWS: "showers", ASTRAEUS_SIZES: "desktop" },
    scene: "showers views on the scratch public build, desktop size: stream dots drawn for each shipped stream file",
  },
  {
    name: "planets-phone",
    tier: "quick",
    script: "journey-planets-phone.mjs",
    scene: "planets on a phone: switch planet, focus Io, open a place card",
  },
  {
    name: "meteor-shower",
    tier: "full",
    script: "journey-meteor-shower.mjs",
    scene: "showers (Perseids): play, seek, open a story panel",
  },
  {
    name: "views",
    tier: "full",
    script: "journey-views.mjs",
    scene:
      "synthetic-views (made-up, two probes, three views): a visitor switch and a host setView at desktop and phone size, the stay rule holds the camera still",
  },
  {
    name: "look-out",
    tier: "full",
    script: "journey-look-out.mjs",
    scene:
      "synthetic-lookout (made-up, Sun, Earth and Mars): opens looking out from Earth, the menu offers Look out from Earth and Mars clear of the controls, Focus returns; two made-up sky figures, an outline and four switches, the site trace control (Stay, Fade and Stay-then-Hide, each waiting for the `sky-trace:<id>` line set in `data-sky-lines` to appear and go), labels do not overlap; desktop and phone size",
  },
  {
    name: "catalogue",
    tier: "full",
    script: "journey-catalogue.mjs",
    scene:
      "components.html (the component catalogue) at desktop and phone size: one entry per shelf part with its import and add lines, the page fits its window, an example starts one viewer holding the part's words, starting another stops the first, stopping leaves none",
  },
  {
    name: "hello-scene",
    tier: "quick",
    script: "check-hello-scene.mjs",
    example: "hello-scene",
    env: { HELLO_STORY: "1" },
    scene:
      "examples/hello-scene from the packed tarballs: the made-up story (anchors, events, one panel, looking at the probe), Earth and Moon drawn, time set, desktop and phone",
  },
  {
    name: "hello-react",
    tier: "quick",
    script: "check-hello-scene.mjs",
    example: "hello-react",
    scene:
      "examples/hello-react (AstraeusScene) from the packed tarballs: Earth, Moon and the followed path drawn, time set, desktop and phone",
  },
  {
    name: "hello-planets",
    tier: "quick",
    script: "check-hello-planets.mjs",
    example: "hello-planets",
    scene:
      "examples/hello-planets from the packed tarballs: the Sun to Mars drawn, the page's own sliders and scale button drive the viewer, Earth's distance from the Sun, no overlap, desktop and phone",
  },
  {
    name: "hello-sky",
    tier: "quick",
    script: "check-hello-sky.mjs",
    example: "hello-sky",
    scene:
      "examples/hello-sky from the packed engine and constellations tarballs: looks out from Earth toward Orion, three story steps (turn, select, trace Orion, the trace cleared on leaving), Orion hidden until traced, its card, the ecliptic switch, no overlap, desktop and phone",
  },
  { name: "public-build-assets", tier: "quick", script: "public-build-assets.mjs", public: true, noBrowser: true },
  { name: "public-addresses", tier: "quick", script: "public-addresses.mjs", public: true, noBrowser: true },
];

export const TIERS = ["quick", "full"];

/** The steps to run, in list order. `step` names (any tier) win over `tier`; an unknown tier or step name throws a RangeError naming it. */
export function selectSteps({ tier = "full", steps = [], all = STEPS } = {}) {
  if (steps.length > 0) {
    const unknown = steps.find((name) => !all.some((s) => s.name === name));
    if (unknown !== undefined)
      throw new RangeError(`unknown step "${unknown}" (steps: ${all.map((s) => s.name).join(", ")})`);
    return all.filter((s) => steps.includes(s.name));
  }
  if (!TIERS.includes(tier)) throw new RangeError(`unknown tier "${tier}" (tiers: ${TIERS.join(", ")})`);
  return tier === "full" ? [...all] : all.filter((s) => s.tier === tier);
}
