// O-056 Full Objective Check probes (checker, scratch only). Public entry "astraeus" plus internal definition reads where a probe needs the oracle.
import { describe, expect, it } from "vitest";
import { Scene, earth, moon, sun, mars, venus, jupiter, io, solarSystemScale, readableScale, trueScale } from "/home/user/code/Astraeus/packages/astraeus/src/api/index.ts";
import { resolveLook, LOOK_FIELDS } from "/home/user/code/Astraeus/packages/astraeus/src/app/look";
import { activeEventZones } from "/home/user/code/Astraeus/packages/astraeus/src/core/pacing";

const T0 = Date.UTC(2026, 0, 1);
const DAY = 86_400_000;
const code = (call: () => unknown): string => { try { call(); } catch (e) { return `${(e as { code?: string }).code}`; } return "ok"; };
const msg = (call: () => unknown): string => { try { call(); } catch (e) { return (e as Error).message; } return "ok"; };

describe("setLook input classes", () => {
  const rows: [string, unknown, string][] = [
    ["empty object", {}, "ok"],
    ["null", null, "bad-look"],
    ["array", [], "bad-look"],
    ["number", 3, "bad-look"],
    ["unknown key", { brightness: 1 }, "bad-look"],
    ["min boundary", { starBrightness: 0 }, "ok"],
    ["max boundary", { starBrightness: 2 }, "ok"],
    ["just above", { starBrightness: 2.000001 }, "bad-look"],
    ["just below", { starBrightness: -0.000001 }, "bad-look"],
    ["NaN", { starBrightness: Number.NaN }, "bad-look"],
    ["Infinity", { loadFadeSeconds: Infinity }, "bad-look"],
    ["numeric string", { starBrightness: "1" }, "bad-look"],
    ["boolean as string", { milkyWay: "on" }, "bad-look"],
    ["boolean ok", { milkyWay: true, skyVisible: false }, "ok"],
    ["nested not object", { sunGlow: 5 }, "bad-look"],
    ["nested null", { sunGlow: null }, "bad-look"],
    ["nested unknown", { sunGlow: { size: 4 } }, "bad-look"],
    ["nested range low", { sunGlow: { scale: 0.99 } }, "bad-look"],
    ["nested range ok", { sunGlow: { scale: 1, sizePx: 400, brightness: 0 } }, "ok"],
    ["undefined value", { starBrightness: undefined }, "ok"],
    ["marker 100", { markerSwapRadiusPx: 100 }, "ok"],
    ["marker 101", { markerSwapRadiusPx: 101 }, "bad-look"],
    ["feature 2001", { featureMinBodyPx: 2001 }, "bad-look"],
    ["fade 3", { loadFadeSeconds: 3 }, "ok"],
    ["fade 3.01", { loadFadeSeconds: 3.01 }, "bad-look"],
  ];
  it.each(rows)("%s", (_n, input, expected) => {
    expect(code(() => new Scene().addBody(earth).setLook(input as never))).toBe(expected);
  });

  it("copies the caller's object; mutation after the call does not reach the scene", () => {
    const input = { starBrightness: 1.2, sunGlow: { sizePx: 100 } };
    const scene = new Scene().addBody(sun).addBody(earth).setLook(input);
    input.starBrightness = 1.9; input.sunGlow.sizePx = 5;
    const look = (scene.toDefinition() as { look?: Record<string, unknown> }).look;
    expect(look).toEqual({ starBrightness: 1.2, sunGlow: { sizePx: 100 } });
  });

  it("replaces the whole look", () => {
    const scene = new Scene().addBody(earth).setLook({ starBrightness: 1.2 }).setLook({ markerSwapRadiusPx: 4 });
    expect((scene.toDefinition() as { look?: unknown }).look).toEqual({ markerSwapRadiusPx: 4 });
  });

  it("is refused after mount (frozen)", () => {
    const scene = new Scene().addBody(earth);
    // prepareScene is the shared mount path
    return import("/home/user/code/Astraeus/packages/astraeus/src/api/prepared").then(({ prepareScene }) => {
      prepareScene(scene);
      expect(code(() => scene.setLook({}))).toBe("scene-mounted");
    });
  });
});

describe("resolveLook precedence (address over setLook over default)", () => {
  it.each(LOOK_FIELDS.map((f) => [f.param, f] as const))("%s", (_p, field) => {
    const base = field.spec.kind === "range" ? field.spec.min : true;
    const param = field.spec.kind === "range" ? String(field.spec.max) : "off";
    const want = field.spec.kind === "range" ? field.spec.max : false;
    const out = resolveLook(field.path.length === 1 ? { [field.path[0]]: base } : { [field.path[0]]: { [field.path[1]]: base } } as never, `?${field.param}=${param}`) as Record<string, unknown>;
    const got = field.path.length === 1 ? out[field.path[0]] : (out[field.path[0]] as Record<string, unknown>)[field.path[1]];
    expect(got).toBe(want);
    // no address: base kept
    const kept = resolveLook({ [field.path[0]]: field.path.length === 1 ? base : { [field.path[1]]: base } } as never, "") as Record<string, unknown>;
    expect(field.path.length === 1 ? kept[field.path[0]] : (kept[field.path[0]] as Record<string, unknown>)[field.path[1]]).toBe(base);
  });
  it("sky=on cannot override setLook skyVisible false (offOnly) and garbage is ignored", () => {
    expect((resolveLook({ skyVisible: false }, "?sky=on") as { skyVisible?: boolean }).skyVisible).toBe(false);
    expect((resolveLook({ starBrightness: 1.5 }, "?stars=abc") as { starBrightness?: number }).starBrightness).toBe(1.5);
  });
});

describe("scene reads", () => {
  const build = () => new Scene().addBody(sun).addBody(earth, { orbit: true, enlarge: 5 }).addBody(mars)
    .addTrajectory({ id: "probe", label: "Probe", center: "sun", samples: [0, 1, 2].map((i) => ({ time: T0 + i * DAY, positionKm: [1.5e8 + i * 1e5, 0, 0] })), provenance: undefined as never })
    .addEvents([{ id: "b", label: "B", time: T0 + DAY, withinSeconds: 3600 }, { id: "a", label: "A", time: T0 }]);
  it("lists bodies in order with orbit/enlarge; events sorted; frozen; fresh each read", () => {
    let scene: Scene;
    try { scene = build(); } catch (e) { scene = new Scene().addBody(sun).addBody(earth, { orbit: true, enlarge: 5 }).addBody(mars).addEvents([{ id: "b", label: "B", time: T0 + DAY, withinSeconds: 3600 }, { id: "a", label: "A", time: T0 }]); }
    const bodies = scene.bodies;
    expect(bodies.map((b) => b.id).slice(0, 3)).toEqual(["sun", "earth", "mars"]);
    expect(bodies[1]).toMatchObject({ orbit: true, enlarge: 5 });
    expect(Object.isFrozen(bodies)).toBe(true);
    expect(Object.isFrozen(bodies[1])).toBe(true);
    expect(scene.bodies).not.toBe(bodies);
    expect(() => { (bodies as unknown as unknown[]).push(1); }).toThrow();
    expect(scene.events.map((e) => e.id)).toEqual(["a", "b"]);
    expect(scene.events[1].withinSeconds).toBe(3600);
  });
  it("scales follow setScale and only", () => {
    expect(new Scene().addBody(sun).addBody(earth).setScale(solarSystemScale).scales[0]).toBe("solar-system");
    expect(new Scene().addBody(sun).addBody(earth).setScale(readableScale, { only: true }).scales).toEqual(["readable-scale"]);
    expect(Object.isFrozen(new Scene().addBody(earth).scales)).toBe(true);
    void trueScale;
  });
  it("timeline read matches setTimeline", () => {
    const t = new Scene().addBody(earth).setTimeline({ start: T0, end: T0 + 10 * DAY }).setTime(T0 + DAY).timeline;
    expect([t.windowStartUtcMs, t.windowEndUtcMs, t.openUtcMs]).toEqual([T0, T0 + 10 * DAY, T0 + DAY]);
    expect(Object.isFrozen(t)).toBe(true);
  });
  it("reads do not need loaded data (a moon of a data package)", () => {
    const s = new Scene().addBody(sun).addBody(jupiter).addBody(io);
    expect(s.bodies.map((b) => b.id)).toContain("io");
  });
});

describe("event zones without pacing (independent oracle: plain interval arithmetic)", () => {
  it("own zone, pacing rule override and default", () => {
    const scene = new Scene().addBody(earth).addBody(moon)
      .addEvents([{ id: "own", label: "Own", time: T0 + 5 * DAY, withinSeconds: 3600 }, { id: "ruled", label: "R", time: T0 + 2 * DAY, type: "x" }, { id: "ruledOwn", label: "RO", time: T0 + 8 * DAY, type: "x", withinSeconds: 60 }, { id: "none", label: "N", time: T0 + 3 * DAY }])
      .setTimeline({ start: T0, end: T0 + 10 * DAY, pacing: [{ near: { type: "x", within: 7200 }, rate: 10 }] });
    const def = scene.toDefinition() as { eventZones?: { fromUtcMs: number; toUtcMs: number; eventId?: string }[]; pacing?: { zones: { fromUtcMs: number; toUtcMs: number; eventId?: string }[] } };
    const z = Object.fromEntries((def.eventZones ?? []).map((zone) => [zone.eventId, [zone.fromUtcMs, zone.toUtcMs]]));
    expect(z.own).toEqual([T0 + 5 * DAY - 3_600_000, T0 + 5 * DAY + 3_600_000]);
    expect(z.ruled).toEqual([T0 + 2 * DAY - 7_200_000, T0 + 2 * DAY + 7_200_000]);
    expect(z.ruledOwn).toEqual([T0 + 8 * DAY - 60_000, T0 + 8 * DAY + 60_000]);
    expect(z.none).toBeUndefined();
    expect((def.eventZones ?? []).filter((zone) => zone.eventId === "ruledOwn")).toHaveLength(1);
    const pz = (def.pacing?.zones ?? []).find((zone) => zone.eventId === "ruledOwn")!;
    expect([pz.fromUtcMs, pz.toUtcMs]).toEqual([T0 + 8 * DAY - 60_000, T0 + 8 * DAY + 60_000]);
    // edges inclusive, one past outside
    expect(activeEventZones(def.eventZones!, undefined, T0 + 5 * DAY + 3_600_000)).toEqual(["own"]);
    expect(activeEventZones(def.eventZones!, undefined, T0 + 5 * DAY + 3_600_001)).toEqual([]);
  });
  it("scene with no pacing at all still lists own zones", () => {
    const def = new Scene().addBody(earth).addEvents([{ id: "e", label: "E", time: T0, withinSeconds: 1 }]).toDefinition() as { eventZones?: unknown[]; pacing?: unknown };
    expect(def.pacing).toBeUndefined();
    expect(def.eventZones).toHaveLength(1);
  });
  it.each([0, -1, Number.NaN, Infinity, "5", null])("withinSeconds %s is bad-event naming the event", (value) => {
    const m = msg(() => new Scene().addBody(earth).addEvents([{ id: "evt-x", label: "E", time: T0, withinSeconds: value as never }]));
    expect(m).toContain("evt-x");
    expect(code(() => new Scene().addBody(earth).addEvents([{ id: "evt-x", label: "E", time: T0, withinSeconds: value as never }]))).toBe("bad-event");
  });
  it("tiny positive withinSeconds accepted", () => {
    expect(code(() => new Scene().addBody(earth).addEvents([{ id: "e", label: "E", time: T0, withinSeconds: Number.MIN_VALUE }]))).toBe("ok");
  });
});

describe("check parity extras", () => {
  it("check on a scene with venus (planet) passes without load and stateOf works warm", () => {
    const s = new Scene().addBody(sun).addBody(venus).setTime(T0);
    expect(code(() => s.check())).toBe("ok");
    expect(Math.hypot(...s.stateOf("venus", T0).positionKm)).toBeGreaterThan(1.07e8);
  });
});
