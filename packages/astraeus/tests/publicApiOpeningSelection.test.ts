// O-047 T-199 (I-115): the object a scene opens selected comes from its opening camera target, never a hard-coded body (ARCH-06); proved on a made-up Sun-centred scene.
import { describe, expect, it } from "vitest";
import { Scene, earth, mars, sun } from "astraeus";
import { initialObjectIdOf } from "../src/app/experienceDefinition";
import { infoView } from "../src/shell/infoModel";
import { initialObjectId as shellOpensOn } from "../src/shell/AstraeusShell";

const T0 = Date.UTC(2026, 3, 1);
const MIN = 60_000;
const samples = [0, 1, 2, 3].map((minute) => ({ time: T0 + minute * MIN, positionKm: [8_000 + minute * 1_000, 0, 0], velocityKmS: [2 + minute, 0, 0] }));
const base = () => new Scene().addBody(sun).addBody(earth).addBody(mars).addTrajectory({ id: "probe", label: "Probe", samples, lineFixedTo: "sun" });

describe("the object a scene opens selected", () => {
  it.each([
    ["lookAt on a path", (s: Scene) => s.camera.lookAt("probe"), "probe"],
    ["follow on a path", (s: Scene) => s.camera.follow("probe"), "probe"],
    ["lookAt on a body", (s: Scene) => s.camera.lookAt("mars"), "mars"],
    ["follow on a body", (s: Scene) => s.camera.follow("earth"), "earth"],
    ["no target (the scene's centre, as before)", (_s: Scene) => undefined, "sun"],
  ])("%s selects %s", (_name, open, expected) => {
    const scene = base();
    open(scene);
    const definition = scene.toDefinition();
    expect(initialObjectIdOf(definition)).toBe(expected);
    expect(shellOpensOn(definition.experience, T0)).toBe(expected);
    expect(infoView(definition.experience, { kind: "object", id: expected }, T0)?.title).toBeDefined();
  });
});

describe("a path that is not yet available at the opening moment", () => {
  it("is still the opening target by the derivation; the shell's availability fallback is the documented behaviour for an unavailable object", () => {
    const scene = base().setTimeline({ start: T0 - 60 * MIN, end: T0 + 10 * MIN }).setTime(T0 - 30 * MIN);
    scene.camera.lookAt("probe");
    const definition = scene.toDefinition();
    expect(initialObjectIdOf(definition)).toBe("probe");
    const probe = definition.experience.objects.find((o) => o.id === "probe")!;
    expect(probe.availability!.startUtcMs).toBeGreaterThan(T0 - 30 * MIN);
  });
});
