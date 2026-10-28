// The rebuilt showers (O-042 T-176) against the definitions they replaced. tests/fixtures/showers-before-rebuild.json was captured from the hand-written definitions of both
// showers (shipped orbits, shipped panels) immediately before the rebuild. What should be the same is compared whole; each difference is named here with the O-042 Decision that
// allows it, or marked FLAG for the owner to judge on the preview.
import { describe, expect, it } from "vitest";
import { experienceWithGroups, groupsOf, sunCentredOf } from "astraeus/app/experienceDefinition";
import { catalogue } from "astraeus/assets/catalogue";
import { createSceneResolver } from "astraeus/app/sceneLayout";
import { createOrbAstronomyAdapter } from "astraeus/core/astronomyAdapter";
import { SimulationClock } from "astraeus/core/clock";
import { parseShowerSettings } from "../src/experiences/showers/showerSettings";
import geminidsFile from "../data/showers/geminids.json";
import perseidsFile from "../data/showers/perseids.json";
import before from "./fixtures/showers-before-rebuild.json";
import { readShippedOrbits } from "./helpers/measuredOrbits";
import { shippedPanelsOf } from "./helpers/shippedPanels";
import { buildShowerDefinition } from "./helpers/showerDefinition";

const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const resolver = createSceneResolver(createOrbAstronomyAdapter());
type Rec = Record<string, any>;
/** The provenance as the replaced definition had it: without the class and fraction O-045 T-185 added. */
const unclassed = (value: any) => (value && typeof value === "object" && "accuracyClass" in value ? Object.fromEntries(Object.entries(value).filter(([key]) => key !== "accuracyClass" && key !== "maxErrorFraction")) : value);
const byId = (list: readonly Rec[], id: string) => list.find((item) => item.id === id)!;

describe.each([["perseids", perseidsFile, "swift-tuttle"], ["geminids", geminidsFile, "phaethon"]] as const)("the rebuilt %s against the definition it replaced", (name, file, parent) => {
  const old = before[name] as Rec;
  const settings = parseShowerSettings(file);
  const definition = buildShowerDefinition(settings, { kind: "loaded", orbits: readShippedOrbits(name, settings.stream.iauCode) }, shippedPanelsOf(settings));
  const objects = plain(definition.experience.objects) as unknown as Rec[];
  const layer = groupsOf(definition)[0]!;
  const streamId = old.streamId as string;
  const peak = Date.parse(settings.activity.peakUtc);

  it("has the same bodies in the same order with the same ids, labels, colours and provenance", () => {
    expect(objects.map((o) => o.id)).toEqual(old.objects.map((o: Rec) => o.id));
    for (const was of old.objects) for (const field of ["label", "color", "provenance"]) expect(unclassed(byId(objects, was.id)[field]), `${was.id}.${field}`).toEqual(was[field]);
  });

  it("keeps the catalogue's own known limits; the 'N times larger than life' sentence moved from the planets' known limits into their descriptions (FLAG: owner to judge the wording)", () => {
    for (const was of old.objects.filter((o: Rec) => ["earth", "mercury", "venus", "mars", "jupiter"].includes(o.id))) {
      const now = byId(objects, was.id);
      expect(now.knownLimitations, was.id).toEqual(was.knownLimitations.slice(0, -1));
      expect(was.knownLimitations.at(-1)).toMatch(/times larger than life/);
      expect(now.description, was.id).toContain(`${settings.look.planetExaggeration} times larger than life so it can be seen; distances stay true.`);
      expect(now.description, was.id).toContain(was.description);
    }
  });

  it("moves the Sun's drawing note into its description (the public API cannot append to a catalogued body's limits) and keeps the Sun's own words and label setting", () => {
    const sun = byId(objects, "sun");
    const was = byId(old.objects, "sun");
    expect(sun.description).toContain(was.description);
    expect(sun.description).toContain(was.knownLimitations[0]);
    expect(sun.knownLimitations).toEqual(was.knownLimitations.slice(1));
    expect(sun.showLabel).toBe(false);
    expect(was.showLabel).toBe(false);
  });

  it("describes the parent as before and gives it the record's own provenance", () => {
    expect(byId(objects, parent).description).toBe(byId(old.objects, parent).description);
    expect(byId(objects, parent).knownLimitations).toEqual(byId(old.objects, parent).knownLimitations);
  });

  it("FLAG label priorities: the bodies are ranked by the order added (100 down to 94, Sun first) where the demo ranked Earth 100, Sun 95, parent 90, planets 80; the stream is 80 (was 70); labels no longer have a reach (unlimited in a Sun-centred scene)", () => {
    expect(objects.map((o) => o.labelPriority)).toEqual([100, 99, 98, 97, 96, 95, 94]);
    expect(old.objects.map((o: Rec) => o.labelPriority)).toEqual([95, 100, 80, 80, 80, 80, 90]);
    expect(layer.object.labelPriority).toBe(80);
    expect(old.group.object.labelPriority).toBe(70);
    expect(objects.every((o) => o.labelMaxDistance === undefined)).toBe(true);
    expect(old.objects.every((o: Rec) => typeof o.labelMaxDistance === "number")).toBe(true);
  });

  it("draws the same group: count, centre, frame, colour, dot size, refill, provenance, bounds and the sampled members' places at the peak (so the seed, the clump and the reference time carry over)", () => {
    const was = old.group;
    expect(layer.group.count).toBe(was.count);
    expect(layer.group.center).toBe(was.center);
    expect(layer.group.frame).toBe(was.frame);
    expect(plain(layer.group.bounds)).toEqual(was.bounds);
    // A 0% clump is not placed, so the group's notes no longer say a share is placed near the reference body (FLAG: the Geminids only; nothing was clumped before either).
    const noShare = (notes: string) => notes.replace(" A stated share of the dots is placed near the reference body's position along the orbit: a model, not a measurement. No orbit is added.", "");
    expect({ ...plain(layer.group.provenance), notes: noShare(layer.group.provenance.notes) }).toEqual({ ...was.provenance, notes: noShare(was.provenance.notes) });
    expect(layer.color).toBe(was.color);
    expect(layer.pointSizePx).toBe(was.pointSizePx);
    expect(layer.refillAfterMs).toBe(was.refillAfterMs);
    expect(layer.refillSliceMs).toBe(was.refillSliceMs);
    const out = new Float64Array(3 * layer.group.count);
    layer.group.fillPositionsKm(peak, out);
    for (const member of was.members) {
      expect((layer.group as Rec).recordIdAt(member.i), `member ${member.i} id`).toBe(member.recordId);
      expect((layer.group as Rec).meanAnomalyDegAt(member.i), `member ${member.i} anomaly`).toBeCloseTo(member.meanAnomalyDeg, 9);
      for (let k = 0; k < 3; k += 1) expect(out[3 * member.i + k]!, `member ${member.i}[${k}]`).toBeCloseTo(member.positionKm[k], 3);
    }
  });

  it("keeps the stream card's label, colour and orbit-count and source words; the radiant joins its description (Decision 4), the clump's basis is reworded and the generic placement and motion limits are added", () => {
    const was = old.group.object;
    expect(layer.object.label).toBe(was.label);
    expect(layer.object.color).toBe(was.color);
    const description = layer.object.description!;
    const beforeClump = was.description.split(", and the clump near")[0]!.replace(/\.$/, "");
    expect(description.startsWith(beforeClump.replace(/ is illustrative$/, " is illustrative"))).toBe(true);
    expect(description).toContain(`RA ${settings.radiant.raDeg.toFixed(1)}°`);
    const limits = layer.object.knownLimitations as string[];
    expect(limits[0]).toBe(was.knownLimitations[0]);
    for (const kept of [was.knownLimitations[3], was.knownLimitations[4]]) expect(limits).toContain(kept);
    expect(limits.join(" ")).toContain("The position of each dot along its orbit is illustrative");
    if (settings.stream.concentration.fraction > 0) expect(limits.join(" ")).toContain(`Basis of the clump near ${settings.parentBody}`);
    else expect(limits.join(" ")).not.toMatch(/clump/); // FLAG: the Geminids' stated 0% clump is not mentioned (it was a '0%' sentence before)
  });

  it("has the same events, event provenance, activity window (rate curve, peak, provenance spans), timeline window, rates, opening clock, scale choices, enlargement and layers' content", () => {
    expect(plain(definition.experience.events)).toEqual(old.events);
    expect(plain(definition.experience.eventProvenance)).toEqual(old.eventProvenance);
    const window = plain(definition.experience.windows)![0] as Rec;
    const was = old.windows[0];
    expect(window.id).toBe(was.id);
    expect(window.label).toBe(was.label);
    expect(window.type).toBe(was.type);
    expect(window.startUtcMs).toBe(was.startUtcMs);
    expect(window.endUtcMs).toBe(was.endUtcMs);
    expect(window.peakUtcMs).toBe(was.peakUtcMs);
    expect(window.rate).toEqual(was.rate);
    expect(window.provenance).toEqual(was.provenance);
    expect(plain(definition.experience.window)).toEqual(old.window);
    expect(plain(definition.experience.rates)).toEqual(old.rates);
    expect(plain(definition.clock)).toEqual(old.clock);
    expect(definition.loop).toBe(old.loop);
    expect(definition.viewUp).toBe(old.viewUp);
    expect(plain(definition.scaleChoices)).toEqual(old.scaleChoices);
    expect(plain(definition.visualOverrides)).toEqual(old.visualOverrides);
    expect(plain(definition.composition!.bodies)).toEqual(old.composition.bodies);
    expect(plain(definition.trackedBodies)).toEqual(old.trackedBodies);
  });

  it("has the same story panels (times, objects, text, badges, sources)", () => {
    expect(plain(definition.experience.storyPanels)).toEqual(old.storyPanels);
  });

  it("keeps the camera's reach; FLAG: the far plane is 2.5 times the reach (was 3 times), and the shower opens on Focus Sun pressed (before no menu item named)", () => {
    expect(definition.camera!.maxFocusDistance).toBe(old.camera.maxFocusDistance);
    expect(definition.camera!.far).toBe(old.camera.maxFocusDistance * 2.5);
    expect(old.camera.far).toBe(old.camera.maxFocusDistance * 3);
    expect(old.startCameraPresetId).toBeUndefined();
    expect(definition.experience.startCameraPresetId).toBe("focus-sun");
  });

  it("opens on the settings' view; FLAG (Geminids): a file that declares none now opens on the Sun at the default view (before it opened at the overview framing)", () => {
    if (old.startView !== undefined) expect(plain(definition.startView)).toEqual(old.startView);
    else {
      expect(old.startView).toBeUndefined();
      expect(definition.startView).toMatchObject({ focus: "sun", azimuthDeg: 100, elevationDeg: 40 });
    }
  });

  it("builds the camera menu itself (Decision 6): Overview, then Focus and Follow for every body and the stream; 'Focus parent' and 'Whole orbit' leave, 'Focus stream' keeps its place by name", () => {
    const ids = definition.experience.cameraPresets.map((p) => p.id);
    expect(ids).toHaveLength(17);
    expect(ids).toEqual(["overview", ...["sun", "earth", "mercury", "venus", "mars", "jupiter", parent, streamId].flatMap((id) => [`focus-${id}`, `follow-${id}`])]);
    expect(old.cameraPresets.map((p: Rec) => p.id)).toEqual(["overview", "focus-earth", "follow-earth", "focus-parent", "whole-orbit", "focus-stream", "follow-stream"]);
    expect(definition.experience.cameraPresets.map((p) => p.label).slice(0, 3)).toEqual(["Overview", "Focus Sun", "Follow Sun"]);
  });

  it("draws the same orbit lines on the same bodies; the Earth line is 'earth-orbit' (was 'earth-path'), lines take their body's colour and start at the opening time (FLAG), the parent's lies on the old one", () => {
    const paths = sunCentredOf(definition).paths as unknown as Rec[];
    const ids = paths.map((p) => p.object.id);
    expect(ids).toEqual(old.paths.map((p: Rec) => (p.object.id === "earth-path" ? "earth-orbit" : p.object.id)));
    for (const was of old.paths) {
      const id = was.object.id === "earth-path" ? "earth-orbit" : was.object.id;
      const now = byId(paths.map((p) => ({ ...p, id: p.object.id })), id);
      expect(now.object.partOf).toBe(was.object.partOf);
      expect(now.object.showLabel).toBe(false);
      expect(unclassed(now.object.provenance), id).toEqual(was.object.provenance);
      if (was.sampling === undefined) expect(now.samples).toBe(was.samples);
      else {
        expect(now.sampling.eccentricity).toBeCloseTo(was.sampling.eccentricity, 12);
        // The comet's period and periapsis come from the catalogue's own record (built-in) or the settings' record; the demo's sweep found them to within minutes.
        expect(Math.abs(now.sampling.periodMs - was.sampling.periodMs)).toBeLessThan(60 * 60_000);
        const gap = Math.abs(((now.sampling.periapsisUtcMs - was.sampling.periapsisUtcMs) % was.sampling.periodMs));
        expect(Math.min(gap, was.sampling.periodMs - gap)).toBeLessThan(5 * 60_000);
      }
      // The line is the same position source: where the old line stood at the old sample times, the new source is there.
      const times = [was.span.startUtcMs, (was.span.startUtcMs + was.span.endUtcMs) / 2, was.span.endUtcMs];
      times.forEach((t: number, k: number) => {
        const position = now.source.stateAt(Math.round(t), "sun").positionKm;
        for (let c = 0; c < 3; c += 1) expect(position[c], `${id} ${k}`).toBeCloseTo(was.positionsAtPeak[k][c], 0);
      });
    }
    expect(old.paths.map((p: Rec) => p.color)).toEqual(expect.arrayContaining(["#7ab8ff", "#c79bff"])); // earthPathColor and parentPathColor: no longer drawn, the lines take the body colours (FLAG)
  });

  it("reads the same rate at the same times; the rate row's id and unavailable wording changed and the radiant row went (Decision 4)", () => {
    const metrics = definition.createMetrics({ clock: new SimulationClock(peak), resolver, catalogue });
    old.times.forEach((t: number, k: number) => {
      const was = old.metricRows[streamId][k] as Rec[];
      const now = plain(metrics(streamId, t)) as unknown as Rec[];
      const wasRate = was.find((r) => r.kind === "rate")!;
      expect(now.map((r) => r.kind)).toEqual(["rate"]);
      expect(now[0]!.value, `rate at ${t}`).toBe(wasRate.value);
      expect(now[0]!.unit).toBe(wasRate.unit);
      expect(now[0]!.label).toBe(wasRate.label);
      expect(now[0]!.peak).toEqual(wasRate.peak);
      expect(now[0]!.id).toBe(`${streamId}-rate`);
      expect(wasRate.id).toBe(`${settings.id}-rate`);
      expect(now[0]!.unavailable).toBe("outside the activity");
      expect(wasRate.unavailable).toBe("outside the activity window");
      expect(was.some((r) => r.kind === "coordinates")).toBe(true);
    });
  });

  it("gives every other object the distance row it had", () => {
    const metrics = definition.createMetrics({ clock: new SimulationClock(peak), resolver, catalogue });
    old.times.forEach((t: number, k: number) => {
      for (const id of ["earth", "sun", "mars", parent]) expect(plain(metrics(id, t)) as unknown as Rec[], `${id} at ${t}`).toEqual(old.metricRows[id][k]);
    });
  });

  it("lists the same shell objects: the bodies, the stream and the orbit lines", () => {
    const shell = experienceWithGroups(definition).objects.map((o) => o.id);
    expect(shell).toEqual(old.shellObjects.map((id: string) => (id === "earth-path" ? "earth-orbit" : id)));
  });

  it("FLAG: scene layers now list 'tracked-bodies' too, and the alternates (orbit-set buttons) are gone (Decision 1)", () => {
    expect(plain(definition.sceneLayers)).toEqual(["tracked-bodies", ...old.sceneLayers]);
    expect(definition.alternates).toBeUndefined();
  });
});
