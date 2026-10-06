import columbiaFile from "../data/apollo11/generated/columbia.json";
import { describe, expect, it } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";
import { SimulationClock } from "../src/core/clock";
import { readableScale, trueScale } from "../src/core/scalePolicy";
import { SPEEDS } from "../src/app/DebugControls";
import { FloatingOrigin } from "../src/app/floatingOrigin";
import { projectToScreen } from "../src/app/AnchorLabels";
import {
  anchorLabelsOf,
  jumpToEvent,
  markerRadiusUnits,
  mergeSpeeds,
  stateClampedToBounds,
  stateIfInBounds,
  trackedReadouts,
  travelledCount,
} from "../src/app/mission";
import { mapOrbitPath } from "../src/app/orbitPath";
import { eqjToRenderVector } from "../src/app/renderCoordinates";
import { trackedAbsolute } from "../src/app/sceneLayout";
import { TrackedBodyView } from "../src/app/TrackedBodyView";
import { APOLLO11_STATEMENT, apollo11Mission } from "../src/mission/apollo11";

const mission = apollo11Mission;
const [columbia, eagle] = mission.bodies;
const mid = (columbia.trajectory.bounds.startUtcMs + columbia.trajectory.bounds.endUtcMs) / 2;
const eagleMid = Math.round((eagle.trajectory.bounds.startUtcMs + eagle.trajectory.bounds.endUtcMs) / 2);

function fakeClock(startUtcMs: number) {
  let now = 0;
  const clock = new SimulationClock(startUtcMs, () => now);
  return { clock, advance: (ms: number) => { now += ms; } };
}

describe("mission module wiring", () => {
  it("builds Columbia and Eagle from the generated data through SampledTrajectory", () => {
    expect(mission.bodies.map((b) => b.id)).toEqual(["columbia", "eagle"]);
    for (const body of mission.bodies) {
      expect(body.trajectory.stateAt(body.trajectory.bounds.startUtcMs).orientation).toBeNull();
      expect(body.pathTimesUtcMs[0]).toBe(body.trajectory.bounds.startUtcMs);
      expect(body.anchorTimesUtcMs.length).toBeGreaterThan(0);
    }
  });

  it("uses the required wording and never calls the path exact", () => {
    expect(mission.title).toBe(APOLLO11_STATEMENT);
    expect(mission.title).toBe("Apollo 11 educational trajectory reconstruction based on NASA postflight trajectory data");
    const text = [mission.title, ...mission.notes, ...mission.events.map((e) => e.label)].join(" ");
    expect(text).not.toMatch(/exact\s+(apollo 11\s+)?flight path/i);
  });

  it("presets a window that spans every event", () => {
    expect(mission.window.startUtcMs).toBe(mission.events[0].timeUtcMs);
    expect(mission.window.endUtcMs).toBe(mission.events[mission.events.length - 1].timeUtcMs);
    expect(mission.window.startUtcMs).toBeLessThan(columbia.trajectory.bounds.startUtcMs);
    expect(mission.window.endUtcMs).toBeGreaterThan(columbia.trajectory.bounds.endUtcMs);
  });
});

describe("bounds hiding", () => {
  it("gives a State only inside a trajectory's bounds", () => {
    const { startUtcMs, endUtcMs } = columbia.trajectory.bounds;
    expect(stateIfInBounds(columbia, startUtcMs - 1)).toBeNull();
    expect(stateIfInBounds(columbia, endUtcMs + 1)).toBeNull();
    expect(stateIfInBounds(columbia, startUtcMs)).not.toBeNull();
    expect(stateIfInBounds(columbia, endUtcMs)).not.toBeNull();
  });

  it("omits current-position rows outside bounds and shows each vehicle only while it is sampled", () => {
    expect(trackedReadouts(mission.bodies, mission.window.startUtcMs)).toEqual([]);
    expect(trackedReadouts(mission.bodies, mid).map((r) => r.id)).toEqual(["columbia"]);
    expect(trackedReadouts(mission.bodies, eagleMid).map((r) => r.id)).toEqual(["columbia", "eagle"]);
    expect(trackedReadouts(mission.bodies, mission.window.endUtcMs)).toEqual([]);
  });

  it("holds the nearest bound for camera targeting without throwing", () => {
    const { startUtcMs, endUtcMs } = columbia.trajectory.bounds;
    expect(Array.from(stateClampedToBounds(columbia, startUtcMs - 1e9).positionKm))
      .toEqual(Array.from(columbia.trajectory.stateAt(startUtcMs).positionKm));
    expect(Array.from(stateClampedToBounds(columbia, endUtcMs + 1e9).positionKm))
      .toEqual(Array.from(columbia.trajectory.stateAt(endUtcMs).positionKm));
  });
});

describe("travelled/future path split", () => {
  const times = [10, 20, 30, 40];
  it.each([[5, 0], [10, 1], [25, 2], [40, 4], [99, 4]])("counts samples at or before %i as travelled (%i)", (t, n) => {
    expect(travelledCount(times, t)).toBe(n);
  });

  it("splits the drawn path at the current position, from the same samples under either scale", () => {
    const view = new TrackedBodyView(columbia);
    const camera = new PerspectiveCamera();
    const total = columbia.pathTimesUtcMs.length;
    const split = travelledCount(columbia.pathTimesUtcMs, mid);
    for (const policy of [trueScale, readableScale]) {
      view.update(mid, policy, new FloatingOrigin(), camera);
      const [travelled, future] = view.group.children.slice(0, 2) as import("three").Line[];
      expect(travelled.geometry.drawRange.count).toBe(split + 1);
      expect(future.geometry.drawRange.count).toBe(total - split + 1);
      const t = travelled.geometry.getAttribute("position");
      const f = future.geometry.getAttribute("position");
      // Both segments meet exactly at the marker (origin at zero, so local == absolute).
      const meet = [t.getX(split), t.getY(split), t.getZ(split)];
      expect([f.getX(0), f.getY(0), f.getZ(0)]).toEqual(meet);
      const expected = trackedAbsolute(columbia.trajectory.stateAt(mid), policy);
      meet.forEach((value, i) => expect(value).toBeCloseTo(expected[i], 4));
    }
  });

  it("draws only the future before the trajectory starts and only the travelled path after it ends", () => {
    const view = new TrackedBodyView(columbia);
    const camera = new PerspectiveCamera();
    const [travelled, future] = view.group.children.slice(0, 2) as import("three").Line[];
    const marker = view.group.children[3];
    view.update(columbia.trajectory.bounds.startUtcMs - 1, trueScale, new FloatingOrigin(), camera);
    expect(travelled.geometry.drawRange.count).toBe(0);
    expect(future.geometry.drawRange.count).toBe(columbia.pathTimesUtcMs.length);
    expect(marker.visible).toBe(false);
    view.update(columbia.trajectory.bounds.endUtcMs + 1, trueScale, new FloatingOrigin(), camera);
    expect(travelled.geometry.drawRange.count).toBe(columbia.pathTimesUtcMs.length);
    expect(future.geometry.drawRange.count).toBe(0);
    expect(marker.visible).toBe(false);
  });

  it("marks anchors as separate points from the sample line", () => {
    const view = new TrackedBodyView(columbia);
    const anchors = view.group.children[2] as import("three").Points;
    expect(anchors.geometry.getAttribute("position").count).toBe(columbia.anchorTimesUtcMs.length);
  });
});

describe("event jumps and playback", () => {
  it("jumps to every listed event exactly and rejects unknown ids", () => {
    const { clock } = fakeClock(mission.window.startUtcMs);
    for (const event of mission.events) {
      expect(jumpToEvent(clock, mission.events, event.id)).toBe(event.timeUtcMs);
      expect(clock.now()).toBe(event.timeUtcMs);
    }
    expect(() => jumpToEvent(clock, mission.events, "nope")).toThrow(RangeError);
  });

  it("yields the same State at T whether reached by seek, jump or 10,000× playback", () => {
    const target = eagleMid;
    const bySeek = fakeClock(0);
    bySeek.clock.seek(target);
    const byPlay = fakeClock(target - 5_000_000);
    byPlay.clock.setRate(10_000);
    byPlay.clock.play();
    byPlay.advance(500);
    expect(byPlay.clock.now()).toBe(target);
    for (const body of mission.bodies) {
      expect(stateIfInBounds(body, byPlay.clock.now())).toEqual(stateIfInBounds(body, bySeek.clock.now()));
    }
  });

  it("offers 1×, 100×, 1,000× and 10,000× on top of the existing speeds", () => {
    const speeds = mergeSpeeds(SPEEDS, mission.rates);
    expect(speeds.map((s) => s.rate)).toEqual([1, 100, 1_000, 3_600, 10_000, 86_400, 604_800]);
    expect(speeds.find((s) => s.rate === 10_000)?.label).toBe("10,000×");
    expect(speeds.find((s) => s.rate === 1)?.label).toBe("1×");
  });
});

describe("scale and rebasing independence for spacecraft State", () => {
  it("leaves the scientific State untouched by either scale policy", () => {
    const before = Array.from(columbia.trajectory.stateAt(mid).positionKm);
    trackedAbsolute(columbia.trajectory.stateAt(mid), trueScale);
    trackedAbsolute(columbia.trajectory.stateAt(mid), readableScale);
    expect(Array.from(columbia.trajectory.stateAt(mid).positionKm)).toEqual(before);
    expect(columbia.trajectory.stateAt(mid).center).toBe("earth");
  });

  it("maps through the same ScalePolicy and render axes as Earth and the Moon", () => {
    const state = columbia.trajectory.stateAt(mid);
    expect(trackedAbsolute(state, trueScale)).toEqual(eqjToRenderVector(trueScale.mapPosition(state.positionKm)));
    const ratio = Math.hypot(...trackedAbsolute(state, trueScale)) / Math.hypot(...trackedAbsolute(state, readableScale));
    expect(ratio).toBeCloseTo(10, 9);
  });

  it("keeps the absolute position exact however the floating origin is rebased", () => {
    const absolute = trackedAbsolute(columbia.trajectory.stateAt(mid), trueScale);
    for (const originAt of [[0, 0, 0], [59.9, -3, 12], absolute]) {
      const origin = new FloatingOrigin();
      origin.set(originAt);
      const local = origin.toLocal(absolute);
      local.forEach((value, i) => expect(value + originAt[i]).toBeCloseTo(absolute[i], 12));
    }
  });

  it("sizes the marker from camera distance only, never from State", () => {
    expect(markerRadiusUnits(10)).toBeCloseTo(markerRadiusUnits(1) * 10, 12);
    expect(markerRadiusUnits(0)).toBeGreaterThan(0);
  });

  it("only occludes behind bodies in TrueScale, where positions match radii", () => {
    const view = new TrackedBodyView(columbia);
    const camera = new PerspectiveCamera();
    const marker = view.group.children[3] as import("three").Mesh;
    view.update(mid, readableScale, new FloatingOrigin(), camera);
    expect((marker.material as { depthTest: boolean }).depthTest).toBe(false);
    view.update(mid, trueScale, new FloatingOrigin(), camera);
    expect((marker.material as { depthTest: boolean }).depthTest).toBe(true);
  });
});

describe("anchor labels (presentation only)", () => {
  it("labels every anchor with its source ID, in anchor order", () => {
    expect(anchorLabelsOf(columbia)).toEqual(columbiaFile.anchors.map((anchor) => anchor.id));
    expect(anchorLabelsOf(columbia)).toContain("A-33");
    expect(anchorLabelsOf(eagle)?.length).toBe(eagle.anchorTimesUtcMs.length);
    expect(new TrackedBodyView(columbia).anchorLabels).toEqual(anchorLabelsOf(columbia));
  });

  it("treats labels as optional and rejects a count that does not match the anchors", () => {
    const { anchorLabels: _unused, ...unlabelled } = columbia;
    expect(anchorLabelsOf(unlabelled)).toBeNull();
    expect(() => anchorLabelsOf({ ...columbia, anchorLabels: ["A-01"] })).toThrow(RangeError);
    expect(() => new TrackedBodyView({ ...columbia, anchorLabels: [] })).toThrow(RangeError);
  });

  it("projects a point in front of the camera to pixels and drops points behind or off screen", () => {
    const camera = new PerspectiveCamera(45, 2, 0.05, 5000);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    expect(projectToScreen(new Vector3(0, 0, 0), camera, 800, 400)).toEqual({ x: 400, y: 200 });
    expect(projectToScreen(new Vector3(0, 0, 20), camera, 800, 400)).toBeNull();
    expect(projectToScreen(new Vector3(1000, 0, 0), camera, 800, 400)).toBeNull();
  });

  it("reads label positions from the drawn anchor dots without changing State", () => {
    const view = new TrackedBodyView(columbia);
    const before = columbia.trajectory.stateAt(mid);
    const origin = new FloatingOrigin();
    const camera = new PerspectiveCamera();
    view.update(mid, readableScale, origin, camera);
    const index = anchorLabelsOf(columbia)!.indexOf("A-33");
    const anchorTime = columbia.anchorTimesUtcMs[index];
    const mapped = mapOrbitPath({ timesUtcMs: [anchorTime], positionsKm: Float64Array.from(columbia.trajectory.stateAt(anchorTime).positionKm) }, readableScale);
    const expected = eqjToRenderVector(mapped.subarray(0, 3));
    const local = view.anchorLocalPosition(index, new Vector3());
    expect(local.distanceTo(new Vector3(...origin.toLocal(expected)))).toBeLessThan(1e-4);
    expect(columbia.trajectory.stateAt(mid)).toEqual(before);
  });
});

