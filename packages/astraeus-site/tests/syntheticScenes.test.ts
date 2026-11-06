// O-059 T-271: the nine made-up scenes the dev page opens are built only through the public Scene API, and the five that were rebuilt keep what they showed (compared with
// tests/fixtures/syntheticScenesBefore.json, captured from the engine fixtures they replace). The other three moved unchanged. ARCH-03: these prove the engine is not tied to our demos.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Scene, earth, jupiter, saturn, sun, uranus } from "astraeus";
import { buildSyntheticScene } from "../src/synthetic/syntheticScene";
import { buildSyntheticRingScene, RING_MEMBER_COUNT } from "../src/synthetic/syntheticRingScene";
import { BELT_MEMBER_COUNT, buildSyntheticBeltScene } from "../src/synthetic/syntheticBeltScene";
import { buildSyntheticListedScene, LISTED_MEMBER_COUNT } from "../src/synthetic/syntheticListedScene";
import { buildSyntheticEccentricScene } from "../src/synthetic/syntheticEccentricScene";
import { buildSyntheticProbeScene, PROBE_FLYBY_UTC_MS } from "../src/synthetic/syntheticProbeScene";
import { buildSyntheticViewsScene } from "../src/synthetic/syntheticViewsScene";
import { buildSyntheticJourneyScene, JOURNEY_JUPITER_UTC_MS } from "../src/synthetic/syntheticJourneyScene";

type Before = Record<string, { events: [string, number][]; window: { startUtcMs: number; endUtcMs: number }; rates: number[]; clockRate: number; panels: string[]; groups: { id: string; count: number }[]; windows: unknown[][]; camera?: unknown }>;
const before = JSON.parse(readFileSync(join(__dirname, "fixtures", "syntheticScenesBefore.json"), "utf8")) as Before;

const REBUILT: readonly [string, () => Scene][] = [
  ["synthetic", buildSyntheticScene],
  ["ring", buildSyntheticRingScene],
  ["belt", buildSyntheticBeltScene],
  ["listed", buildSyntheticListedScene],
  ["eccentric", buildSyntheticEccentricScene],
];

// Differences the rebuild accepts, each with its reason (O-059 note section 6, T-271 drift notes):
// - Earth, Moon and the Sun keep their catalogue cards (orientation limits, label reach), and every body gets a Focus preset; Follow stays only where it was (setFollowChoices).
// - The Sun's marker size (`visualOverrides`) and a Sun-centred scene's `sceneCenter` entry are not public; the scene's first body is its centre.
// - The made-up far, listed-parent and eccentric paths are bodies on made-up elements, so they carry a body card and menu entry beside their orbit line, and the lines start at periapsis.
// - The ring, belt and listed dots keep their orbits' shapes; where each dot sits along its orbit is the group's own even spread, not the old fixture's per-member draw.
// - The marker's card has no contact-rate row: a rate readout belongs to a group. The contact window shows its own rate.
describe.each(REBUILT)("the %s scene keeps what its fixture showed", (name, build) => {
  const scene = build();
  const was = before[name]!;

  it("has the same events, timeline span, speeds and story panels", () => {
    expect(scene.events.map((event) => [event.id, event.timeUtcMs])).toEqual(was.events);
    expect(scene.timeline).toMatchObject({ windowStartUtcMs: was.window.startUtcMs, windowEndUtcMs: was.window.endUtcMs, openUtcMs: was.window.startUtcMs, rates: was.rates, rate: was.clockRate });
    expect(scene.panels.map((panel) => panel.id)).toEqual(was.panels);
  });

  it("has the same groups with the same member counts", () => {
    expect(scene.groups.map((group) => ({ id: group.id, count: group.count }))).toEqual(was.groups);
  });

  it("reads back through the public reads without a viewer", () => {
    expect(() => scene.check()).not.toThrow();
    expect(scene.bodies.length + scene.paths.length + scene.groups.length).toBeGreaterThan(1);
  });
});

/** The camera's reach and far plane as the scene states them: the far plane defaults to 2.5 times the reach when `setReach` gives none (its doc comment). */
const reachOf = (scene: Scene) => ({ maxFocusDistance: scene.camera.reachEarthRadii, far: scene.camera.farEarthRadii ?? scene.camera.reachEarthRadii! * 2.5 });

describe("the rebuilt scenes' own features", () => {
  it("synthetic: one marker path and the contact window with both provenance spans (read through scene.activities)", () => {
    const scene = buildSyntheticScene();
    expect(scene.paths.map((path) => path.id)).toEqual(["survey-marker"]);
    const windows = scene.activities.map((window) => [window.id, window.windowStartUtcMs, window.windowEndUtcMs, window.peak.timeUtcMs, window.unit, window.samples.length, window.provenance?.length]);
    expect(windows).toEqual(before["synthetic"]!.windows);
  });

  it("ring: 10,000 orbits about Earth", () => {
    const [ring] = buildSyntheticRingScene().groups;
    expect(ring).toMatchObject({ id: "debris-ring", count: RING_MEMBER_COUNT, center: "earth", plane: "EQJ" });
  });

  it("belt: a Sun-centred group, Earth with its orbit line, a far object, and a reach that gives today's far plane", () => {
    const scene = buildSyntheticBeltScene();
    expect(scene.groups[0]).toMatchObject({ id: "dust-belt", count: BELT_MEMBER_COUNT, center: "sun" });
    expect(scene.bodies.map((body) => [body.id, body.orbit])).toEqual([["sun", false], ["earth", true], ["far-marker", true]]);
    expect(reachOf(scene)).toEqual(before["belt"]!.camera);
  });

  it("listed: 3,000 listed orbits clumped near a made-up parent", () => {
    const scene = buildSyntheticListedScene();
    expect(scene.groups[0]).toMatchObject({ id: "listed-orbits", count: LISTED_MEMBER_COUNT, center: "sun" });
    expect(scene.groups[0]!.knownLimitations.join(" ")).toContain("25% of the dots are drawn near");
    expect(scene.bodies.map((body) => body.id)).toContain("listed-parent");
  });

  it("eccentric: Earth drawn 200 times larger, a made-up orbit out to 51 AU, the true and Solar system scales and the wider reach", () => {
    const scene = buildSyntheticEccentricScene();
    expect(scene.bodies.find((body) => body.id === "earth")?.enlarge).toBe(200);
    expect(scene.scales).toEqual(["true-scale", "solar-system"]);
    expect(reachOf(scene)).toEqual(before["eccentric"]!.camera);
  });
});

describe("the three moved scenes", () => {
  it("probe: a made-up path fixed to the Sun, ending at Earth's place on day 200", () => {
    const scene = buildSyntheticProbeScene();
    expect(scene.paths.map((path) => [path.id, path.center])).toEqual([["probe", "sun"]]);
    expect(scene.events.map((event) => [event.id, event.timeUtcMs])).toEqual([["probe-flyby", PROBE_FLYBY_UTC_MS]]);
    const probe = scene.stateOf("probe", PROBE_FLYBY_UTC_MS).positionKm;
    const planet = scene.stateOf("earth", PROBE_FLYBY_UTC_MS).positionKm;
    expect(Math.hypot(probe[0]! - planet[0]!, probe[1]! - planet[1]!, probe[2]! - planet[2]!)).toBeLessThan(1);
  });

  it("views: three views, each with its own camera rule, opening on the first", () => {
    const scene = buildSyntheticViewsScene();
    expect(scene.views).toMatchObject({ place: "top-bar", startId: "a" });
    expect(scene.views?.items.map((view) => view.id)).toEqual(["a", "b", "both"]);
    expect(scene.events.map((event) => event.id)).toEqual(["event-a", "event-b", "event-shared"]);
  });

  it("journey: a path past Jupiter, Saturn and Uranus, built once the planet series are loaded", async () => {
    await new Scene().addBody(sun).addBody(earth).addBody(jupiter).addBody(saturn).addBody(uranus).load();
    const scene = buildSyntheticJourneyScene();
    expect(scene.paths.map((path) => path.id)).toEqual(["traveller"]);
    expect(scene.events.find((event) => event.id === "traveller-jupiter")?.timeUtcMs).toBe(JOURNEY_JUPITER_UTC_MS);
  });
});
