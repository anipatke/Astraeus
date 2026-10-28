// O-045 T-186: camera.fitOrbit sets the farthest zoom-out from a body's orbit and the live canvas shape (ARCH-03, TEST-03).
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon, sun, type ElementsBodyRecord } from "astraeus";
import { trueScale } from "../src/core/scalePolicy";
import { createOrbitCameraState } from "../src/app/CameraController";
import { stepCameraTarget, type CameraStepInput } from "../src/app/sceneCamera";
import { fitReach, liveReach } from "../src/app/sceneFraming";
import { cameraReachOf } from "../src/app/experienceDefinition";
import { EQUATORIAL_UP } from "../src/app/viewUp";
import type { SceneTargets } from "../src/app/sceneTargets";
import type { RenderVector } from "../src/app/renderCoordinates";

const AU_KM = 149_597_870.7;
const record: ElementsBodyRecord = {
  id: "rock", label: "Rock",
  elements: { semiMajorAxisAu: 2.5, eccentricity: 0.3, inclinationDeg: 10, ascendingNodeDeg: 40, argumentOfPerihelionDeg: 70, meanAnomalyDeg: 20 },
  epoch: { jd: 2461000.5, timeScale: "TDB", ttMinusUtcSeconds: 69.184 },
  frame: "ecliptic-j2000",
  source: { name: "Made up", url: "https://example.org/rock", solution: "S1", accessed: "2026-10-28" },
  accuracy: { classification: "indicative", statement: "Made up.", validFromUtc: "2020-01-01T00:00:00Z", validToUtc: "2030-01-01T00:00:00Z", limitations: [] },
  marker: { color: "#aabbcc", sizePx: 6 },
};
const aphelionUnits = (2.5 * 1.3 * AU_KM) / 6371.0084;
const code = (fn: () => unknown) => { try { fn(); } catch (error) { return error instanceof SceneError ? error.code : String(error); } return "none"; };
const make = () => new Scene().addBody(sun).addBodyFromElements(record, { orbit: true });
const reachAt = (scene: Scene, width: number, height: number) => liveReach(cameraReachOf(scene.toDefinition()), trueScale, width / height);

describe("camera.fitOrbit", () => {
  it("fits a made-up orbit to the canvas: 1.1 x farthest Sun distance over the sine of the narrower half field of view", () => {
    const scene = make();
    scene.camera.fitOrbit("rock");
    const wide = reachAt(scene, 1280, 800);
    expect(Math.abs(wide.maxFocusDistance! / ((1.1 * aphelionUnits) / Math.sin((22.5 * Math.PI) / 180)) - 1)).toBeLessThan(1e-5);
    expect(wide.far).toBeCloseTo(wide.maxFocusDistance! * 2.5, 3);
    const phone = reachAt(scene, 390, 844);
    expect(Math.abs(phone.maxFocusDistance! / ((1.1 * aphelionUnits) / Math.sin((10.8 * Math.PI) / 180)) - 1)).toBeLessThan(0.01);
    expect(phone.maxFocusDistance!).toBeGreaterThan(wide.maxFocusDistance!);
  });

  it("takes a body reference or an id, and a built-in comet", () => {
    const comet = new Scene().addBody(sun).addBody("swift-tuttle");
    comet.camera.fitOrbit("swift-tuttle");
    expect(reachAt(comet, 1280, 800).maxFocusDistance!).toBeGreaterThan(1e6);
    const byRef = new Scene().addBody(sun).addBody(earth);
    expect(byRef.camera.fitOrbit(earth)).toBe(byRef.camera);
  });

  it("throws a named error for a body that does not circle the Sun and for one not in the scene", () => {
    const scene = new Scene().addBody(sun).addBody(earth).addBody(moon);
    expect(code(() => scene.camera.fitOrbit("moon"))).toBe("bad-camera");
    expect(() => scene.camera.fitOrbit("moon")).toThrow(/"moon"/);
    expect(code(() => scene.camera.fitOrbit("sun"))).toBe("bad-camera");
    expect(code(() => scene.camera.fitOrbit("mars"))).toBe("unknown-body");
  });

  it("runs for a planet: Mars from the loaded planet series, within 1% of a(1+e)", () => {
    const mars = new Scene().addBody(sun).addBody("mars");
    mars.camera.fitOrbit("mars");
    const farthestKm = cameraReachOf(mars.toDefinition()).fitOrbit!.farthestKm();
    expect(Math.abs(farthestKm / (1.523679 * (1 + 0.0934) * AU_KM) - 1)).toBeLessThan(0.01);
  });

  it("keeps labels shown at any distance the fitted camera can take, also when the scene is not Sun-centred", () => {
    const labelLimit = (scene: Scene) => scene.toDefinition().experience.objects.find((object) => object.id === "earth")!.labelMaxDistance;
    const plain = new Scene().addBody(earth).addBody(moon);
    expect(labelLimit(plain)).toBe(500);
    const fitted = new Scene().addBody(earth).addBody(moon);
    fitted.camera.fitOrbit("earth");
    expect(labelLimit(fitted)).toBeUndefined();
  });

  it("lets the later of setReach and fitOrbit win", () => {
    const fitLast = make();
    fitLast.camera.setReach(500).fitOrbit("rock");
    expect(cameraReachOf(fitLast.toDefinition()).fitOrbit).toBeDefined();
    expect(cameraReachOf(fitLast.toDefinition()).maxFocusDistance).toBeUndefined();
    const reachLast = make();
    reachLast.camera.fitOrbit("rock").setReach(500);
    expect(cameraReachOf(reachLast.toDefinition())).toEqual({ maxFocusDistance: 500, far: 1250 });
  });
});

describe("the viewer re-fits when the canvas changes shape", () => {
  const positions = new Map<string, RenderVector>([["sun", [0, 0, 0]], ["rock", [10, 0, 0]]]);
  const targets: SceneTargets = {
    bodyIdFor: (id) => id,
    placed: positions as SceneTargets["placed"],
    absoluteOf: (id) => positions.get(id) ?? [0, 0, 0],
    groupViews: [], sunCentredViews: [], trackedViews: [], bodySetViews: [],
    timeUtcMs: 0, policy: trueScale, placement: {} as SceneTargets["placement"],
  };
  const stepAt = (scene: Scene, aspect: number, distance: number) => {
    const input: CameraStepInput = { camState: createOrbitCameraState(distance, "sun"), controls: { cameraRequest: null }, targets, frame: { centre: "sun", span: aphelionUnits }, catalogue: scene.toDefinition().catalogue!, reach: liveReach(cameraReachOf(scene.toDefinition()), trueScale, aspect), fovDeg: 45, viewUp: EQUATORIAL_UP, firstFrame: false, previousUp: null };
    stepCameraTarget(input);
    return input.camState.distance;
  };
  it("clamps a far zoom-out to a different limit after the aspect changes", () => {
    const scene = make();
    scene.camera.fitOrbit("rock");
    const landscape = stepAt(scene, 1.6, 1e9);
    const portrait = stepAt(scene, 390 / 844, 1e9);
    expect(landscape).toBeCloseTo(fitReach(aphelionUnits, 1.6), -1);
    expect(portrait).toBeGreaterThan(landscape);
  });
  it("opens at the same distance with or without fitOrbit", () => {
    const plain = make();
    const fitted = make();
    fitted.camera.fitOrbit("rock");
    // The opening distance the scene frames at (2.4 x the scene's span, as defaultDistance gives the centre body) sits inside the fitted limit at any canvas shape.
    const opening = 2.4 * aphelionUnits;
    for (const aspect of [1.6, 0.46]) expect(stepAt(fitted, aspect, opening)).toBe(stepAt(plain, aspect, opening));
  });
});
