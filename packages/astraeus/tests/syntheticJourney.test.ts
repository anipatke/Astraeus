// O-047 T-203: the made-up 1977-to-170-AU journey builds on the public API, and a Sun-centred scene with a path reaching 170 AU frames it whole (I-114).
import { beforeAll, describe, expect, it } from "vitest";
import { Scene, earth, sun, type DataSource } from "astraeus";
import { loadPlanetSeries } from "../src/core/planetSeries";
import { solarSystemScale } from "../src/core/scalePolicy";
import { createOrbitCameraState } from "../src/app/CameraController";
import { stepCameraTarget, type CameraStepInput } from "../src/app/sceneCamera";
import { cameraReachOf } from "../src/app/experienceDefinition";
import { FAR_PER_REACH, fitReach, liveReach, scaleLength } from "../src/app/sceneFraming";
import { EQUATORIAL_UP } from "../src/app/viewUp";
import type { SceneTargets } from "../src/app/sceneTargets";
import type { RenderVector } from "../src/app/renderCoordinates";
import { pacedRate } from "../src/core/pacing";
import { infoView } from "../src/shell/infoModel";
import { buildSyntheticJourneyScene, JOURNEY_END_AU, JOURNEY_END_UTC_MS, JOURNEY_JUPITER_UTC_MS, JOURNEY_LAUNCH_UTC_MS, JOURNEY_SATURN_UTC_MS } from "../src/synthetic/syntheticJourneyScene";
import { solarSystemPolicyForTest } from "./scalePolicies";

const AU_KM = 149_597_870.7;
const stub = (name: string, provides: string[]): DataSource => ({ name, provides });
const DATA = [stub("astraeus-data-jupiter", ["io", "europa", "ganymede", "callisto"]), stub("astraeus-data-saturn", ["mimas", "enceladus", "tethys", "dione", "rhea", "titan", "iapetus"])];
const policy = solarSystemPolicyForTest({ earth: 60 });

/** The camera's farthest zoom-out the viewer allows, clamping a huge request, in scaled units. */
function farthestZoom(definition: ReturnType<Scene["toDefinition"]>, aspect: number, span: number): number {
  const positions = new Map<string, RenderVector>([["sun", [0, 0, 0]]]);
  const targets: SceneTargets = { bodyIdFor: (id) => id, placed: positions as SceneTargets["placed"], absoluteOf: () => [0, 0, 0], groupViews: [], sunCentredViews: [], trackedViews: [], bodySetViews: [], timeUtcMs: 0, policy, placement: {} as SceneTargets["placement"] };
  const input: CameraStepInput = { camState: createOrbitCameraState(1e12, "sun"), controls: { cameraRequest: null }, targets, frame: { centre: "sun", span }, catalogue: definition.catalogue!, reach: liveReach(cameraReachOf(definition), policy, aspect), fovDeg: 45, viewUp: EQUATORIAL_UP, firstFrame: false, previousUp: null };
  stepCameraTarget(input);
  return input.camState.distance;
}

describe("a Sun-centred scene with a path reaching 170 AU (I-114)", () => {
  const far = [0, 100, 200].map((i) => ({ time: Date.UTC(1977, 0, 1) + i * 86_400_000 * 365, positionKm: [(JOURNEY_END_AU * AU_KM * i) / 200, 0, 0] }));
  const scene = () => new Scene().addBody(sun).addBody(earth, { enlarge: 60 }).setTime(far[0]!.time).addTrajectory({ id: "far", center: "sun", samples: far, lineFixedTo: "sun" }).setScale(solarSystemScale);

  it("widens the default zoom-out and far plane so the whole path fits from any point on it, at a desktop and a phone shape", () => {
    const definition = scene().toDefinition();
    expect(cameraReachOf(definition).cover).toBeDefined();
    for (const aspect of [1.6, 390 / 844]) {
      const reach = liveReach(cameraReachOf(definition), policy, aspect);
      const fitted = fitReach(scaleLength(policy, 2 * JOURNEY_END_AU * AU_KM), aspect);
      expect(reach.minFocusDistance!).toBeGreaterThanOrEqual(fitted * 0.999);
      expect(reach.far!).toBeGreaterThanOrEqual(reach.minFocusDistance! * FAR_PER_REACH);
      expect(farthestZoom(definition, aspect, 6)).toBeGreaterThanOrEqual(fitted * 0.999);
      // The far plane lies beyond the farthest camera-to-focus distance plus the path itself, so nothing is cut off; near is 0.1 x the distance, so the depth ratio stays 25 or less at the limit.
      expect(reach.far! / (0.1 * reach.minFocusDistance!)).toBeLessThanOrEqual(25.0001);
    }
  });

  it("never narrows the default: a short path leaves the reach to the scene's own span, and a declared reach wins", () => {
    const short = new Scene().addBody(sun).addBody(earth, { enlarge: 60 }).setTime(far[0]!.time).addTrajectory({ id: "near", center: "sun", samples: far.map((s, i) => ({ time: s.time, positionKm: [AU_KM * 0.5 * i, 0, 0] })), lineFixedTo: "sun" }).setScale(solarSystemScale);
    const huge = farthestZoom(short.toDefinition(), 1.6, 2000);
    expect(huge).toBeGreaterThanOrEqual(2000 * 3.5);
    const declared = scene();
    declared.camera.setReach(9_999);
    expect(cameraReachOf(declared.toDefinition())).toEqual({ maxFocusDistance: 9_999, far: 24_997.5 });
  });
});

describe("the made-up journey", () => {
  beforeAll(async () => { await loadPlanetSeries(); });
  const definition = () => buildSyntheticJourneyScene().toDefinition(DATA);

  it("builds inside every body's years and frames the 170 AU end of the path", () => {
    const built = definition();
    expect(built.experience.window).toEqual({ startUtcMs: JOURNEY_LAUNCH_UTC_MS, endUtcMs: JOURNEY_END_UTC_MS });
    expect(built.experience.events.map((event) => event.id)).toEqual(["traveller-jupiter", "traveller-saturn"]);
    const end = built.trackedBodies![0]!.trajectory.stateAt(JOURNEY_END_UTC_MS).positionKm;
    expect(Math.hypot(...end) / AU_KM).toBeCloseTo(JOURNEY_END_AU, 3);
    expect(cameraReachOf(built).cover!.farthestKm() / AU_KM).toBeCloseTo(2 * JOURNEY_END_AU, 1); // twice the farthest, so the whole path fits from any point of it
  });

  it("slows playback near each encounter and speeds it up in the cruise, easing between", () => {
    const pacing = definition().pacing!;
    const day = 86_400;
    expect(pacedRate(pacing, JOURNEY_JUPITER_UTC_MS)).toBeCloseTo(day, 0);
    expect(pacedRate(pacing, JOURNEY_SATURN_UTC_MS)).toBeCloseTo(day, 0);
    expect(pacedRate(pacing, Date.UTC(1979, 8, 1))).toBeGreaterThan(day * 10);
    expect(pacedRate(pacing, Date.UTC(2010, 0, 1))).toBeCloseTo(31_557_600, -2);
  });

  it("changes the path's provenance along the journey", () => {
    const built = definition();
    const at = (time: number) => infoView(built.experience, { kind: "object", id: "traveller" }, time)!.provenance!;
    expect(at(JOURNEY_JUPITER_UTC_MS).sourceType).toBe("reconstructed");
    expect(at(Date.UTC(2010, 0, 1)).sourceType).toBe("illustrative");
  });
});
