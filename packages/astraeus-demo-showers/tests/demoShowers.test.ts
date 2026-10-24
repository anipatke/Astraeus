// The showers' own rules, checked on each real shower file through the public-API scene (O-038 T-146, rebuilt O-042 T-176): the parts of the browser checks that are about what the
// settings and the scene builder make, not about pixels. Both real shower files run the same cases. The settings contract, the spans, the loop and the labels are kept by
// tests/showers.test.ts; the measured file's counts by tests/showersMeasured.test.ts; the comparison with the pre-rebuild definitions by tests/rebuildComparison.test.ts;
// the switch by astraeus-site/tests/showerSwitch.test.ts. The stream's dots, the glow's gradient and the camera flights are the smoke check.
import { describe, expect, it } from "vitest";
import { experienceWithGroups, groupsOf, mountedBodiesOf, scaleChoiceIdsOf, sceneCenterOf, sunCentredOf } from "astraeus/app/experienceDefinition";
import { catalogue } from "astraeus/assets/catalogue";
import { createSceneResolver } from "astraeus/app/sceneLayout";
import { createOrbAstronomyAdapter } from "astraeus/core/astronomyAdapter";
import { SimulationClock } from "astraeus/core/clock";
import { rateAt } from "astraeus/core/timeWindow";
import { infoView } from "astraeus/shell/infoModel";
import { streamIdOf, timelineBoundsOf } from "../src/experiences/showers/showerBasics";
import { parseShowerSettings, type ShowerSettings } from "../src/experiences/showers/showerSettings";
import geminidsFile from "../data/showers/geminids.json";
import perseidsFile from "../data/showers/perseids.json";
import { madeUpOrbits, readShippedFile, readShippedOrbits } from "./helpers/measuredOrbits";
import { buildShowerDefinition } from "./helpers/showerDefinition";

const resolver = createSceneResolver(createOrbAstronomyAdapter());
const PLANETS = ["mercury", "venus", "mars", "jupiter"];
const SHOWERS = [["perseids", perseidsFile, "perseids"], ["geminids", geminidsFile, "geminids"]] as const;
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe.each(SHOWERS)("the %s shower", (_name, file, story) => {
  const settings: ShowerSettings = parseShowerSettings(file);
  const kept = readShippedFile(story, settings.stream.iauCode).provenance.counts.kept as number;
  const definition = buildShowerDefinition(settings, { kind: "loaded", orbits: madeUpOrbits(settings.stream.iauCode, 50) });
  const experience = experienceWithGroups(definition);
  const streamId = streamIdOf(settings);
  const parentId = settings.parentBodyId;
  const view = (id: string) => infoView(experience, { kind: "object", id })!;
  const detail = (id: string) => { const p = view(id).provenance!; return [p.accuracy, p.notes, ...p.sources, ...(p.knownLimitations ?? [])].join(" ").replace(/\s+/g, " "); };

  it("is a Sun-centred scene of the Sun, Earth, the four planets and its own parent, with six orbit lines and no other shower's parent", () => {
    expect(sceneCenterOf(definition)).toBe("sun");
    expect(mountedBodiesOf(definition)).toEqual(["sun", "earth", ...PLANETS, parentId]);
    expect(mountedBodiesOf(definition)).not.toContain(parentId === "swift-tuttle" ? "phaethon" : "swift-tuttle");
    expect(sunCentredOf(definition).paths).toHaveLength(6);
  });

  it("lists the stream once and every mounted body, keeps every orbit line out of the Object list but offers each from its body, and has no Moon or Apollo item", () => {
    const ids = experience.objects.map((object) => object.id);
    expect(ids.filter((id) => id === streamId)).toHaveLength(1);
    for (const id of [...mountedBodiesOf(definition), streamId]) expect(ids).toContain(id);
    for (const body of ["earth", ...PLANETS, parentId]) {
      const object = experience.objects.find((o) => o.id === `${body}-orbit`)!;
      expect(object.partOf).toBe(body);
      expect(view(`${body}-orbit`).description).not.toBe("");
    }
    expect(ids).not.toContain("moon");
    expect(ids).not.toContain("columbia");
    expect(groupsOf(definition)).toHaveLength(1);
  });

  it("offers True and Solar-system scale, and states Earth's and every planet's factor in their descriptions", () => {
    expect(scaleChoiceIdsOf(definition)).toEqual(["true-scale", "solar-system"]);
    const factor = `${settings.look.planetExaggeration} times larger than life`;
    expect(view("earth").description).toContain(factor);
    expect(view("mars").description).toContain(factor);
  });

  it("builds the camera menu itself: Overview, then Focus and Follow for the Sun, Earth, the planets, the parent and the stream", () => {
    const ids = experience.cameraPresets.map((preset) => preset.id);
    expect(ids[0]).toBe("overview");
    for (const id of ["sun", "earth", ...PLANETS, parentId, streamId]) expect(ids).toEqual(expect.arrayContaining([`focus-${id}`, `follow-${id}`]));
    expect(experience.cameraPresets.find((p) => p.id === `focus-${parentId}`)!.label).toBe(`Focus ${view(parentId).title}`);
    expect(ids).not.toContain("whole-orbit");
    const sun = experience.objects.find((object) => object.id === "sun")!;
    expect(settings.labels).toEqual({ sun: false });
    expect(sun.showLabel).toBe(false);
    expect(experience.objects.find((object) => object.id === "earth")!.showLabel).toBeUndefined();
  });

  it("opens where the settings say: the declared view and up direction, looping, and the settings' reach", () => {
    expect(definition.viewUp).toBe(settings.look.viewUp);
    expect(definition.loop).toBe(settings.look.loop);
    expect(definition.camera?.maxFocusDistance).toBe(settings.look.cameraMaxFocusDistance);
    expect(definition.startView).toMatchObject({ focus: settings.look.startView?.focus ?? "sun" });
    if (settings.look.startView !== undefined) expect(definition.startView).toEqual(settings.look.startView);
  });

  it("gives each planet's orbit the planet's position provenance and the compared range, and Jupiter's orbit says it passes it", () => {
    for (const planet of ["mercury", "jupiter"]) {
      expect(view(`${planet}-orbit`).title).toMatch(/orbit/i);
      expect(detail(`${planet}-orbit`)).toMatch(/Horizons/);
    }
  });

  it("puts the radiant in the stream's description: right ascension, declination, J2000 and the cited source", () => {
    const text = view(streamId).description!;
    expect(text).toContain(`RA ${settings.radiant.raDeg.toFixed(1)}°`);
    expect(text).toContain(`${settings.radiant.decDeg.toFixed(1)}°`);
    expect(text).toContain(settings.radiant.equinox);
    expect(text).toContain(settings.radiant.source.name);
  });

  it("shows the live rate on the stream's card: the settings' peak rate at the peak, the published peak as the mark", () => {
    const peak = Date.parse(settings.activity.peakUtc);
    const metrics = definition.createMetrics({ clock: new SimulationClock(peak), resolver, catalogue })(streamId, peak);
    const rate = metrics.find((metric) => metric.kind === "rate");
    expect(rate).toMatchObject({ value: settings.activity.peakRate, unit: settings.activity.rateUnit, peak: { label: "Published peak", value: settings.activity.peakRate } });
    expect(metrics.some((metric) => metric.kind === "coordinates")).toBe(false);
  });

  it("marks the stream illustrative and states its parts: the measured shapes, the dots' positions, the clump as a model (or none), what is not shown, and no invented spread", () => {
    expect(view(streamId).provenance!.status).toBe("Illustrative");
    const text = detail(streamId);
    expect(text).toMatch(/position of each dot along its orbit is illustrative/i);
    expect(text).toMatch(/Parts of the stream that miss Earth are not shown/i);
    expect(text).not.toMatch(/invented|Modelled spread/);
    const clump = settings.stream.concentration;
    if (clump.fraction > 0) {
      expect(text).toMatch(new RegExp(`${Math.round(clump.fraction * 100)}% of the dots are drawn near .* position along its orbit. That clump is a model`));
      expect(text).toMatch(new RegExp(`band at ${escape(settings.parentBody)}'s phase, not a blob on ${escape(settings.parentBody)}`, "i"));
    } else {
      expect(text).not.toMatch(/clump is a model/);
    }
  });

  it("cites the Global Meteor Network with licence, months, both papers and counts, names no CAMS source, offers no orbit-set switch, and counts the shipped orbits it draws", () => {
    const gmn = settings.stream.sources.gmn;
    const shipped = experienceWithGroups(buildShowerDefinition(settings, { kind: "loaded", orbits: readShippedOrbits(story, settings.stream.iauCode) }));
    const p = infoView(shipped, { kind: "object", id: streamId })!;
    const text = [p.description, ...p.provenance!.sources, p.provenance!.notes].join(" ");
    for (const needed of ["Global Meteor Network", gmn.licence, "Vida", "506(4)", "491(2)", ...gmn.months, `${kept} bound orbits in the file`]) expect(text).toContain(needed);
    expect(text).not.toMatch(/CAMS Meteoroid Orbit Database|cams\.seti|Jenniskens et al\. 2018/);
    expect(p.description).toContain(`${kept} measured meteoroid orbits`);
    expect(definition.alternates).toBeUndefined();
  });

  it("when the orbits are absent, draws no stream and says so in the Sun's description with the GMN fetch command; in a public build it says the build has none and gives no command", () => {
    const absent = buildShowerDefinition(settings, { kind: "absent" });
    expect(groupsOf(absent)).toHaveLength(0);
    const sun = infoView(experienceWithGroups(absent), { kind: "object", id: "sun" })!;
    expect(sun.description).toMatch(/not fetched on this machine/i);
    expect(sun.description).toContain(`node packages/astraeus-demo-showers/tools/data/fetch-meteoroid-orbits.mjs ${settings.stream.iauCode} --months ${settings.stream.sources.gmn.months.join(",")}`);
    expect(mountedBodiesOf(absent)).toEqual(mountedBodiesOf(definition));
    const shipped = infoView(experienceWithGroups(buildShowerDefinition(settings, { kind: "absent" }, undefined, true)), { kind: "object", id: "sun" })!;
    expect(shipped.description).toMatch(/This build does not include measured orbits/);
    expect(shipped.description).not.toMatch(/fetch-meteoroid-orbits/);
  });

  it("spans about a year from the settings' year start, mid-way through the peak, with the settings' playback rate and its activity glow and peak mark", () => {
    const { startUtcMs, endUtcMs } = timelineBoundsOf(settings);
    expect(Math.abs((endUtcMs - startUtcMs) / 86_400_000 - 365.25)).toBeLessThan(1);
    expect(startUtcMs).toBe(Date.parse(settings.timeline.yearStartUtc!));
    const peak = Date.parse(settings.activity.peakUtc);
    expect(peak).toBeGreaterThan(startUtcMs);
    expect(peak).toBeLessThan(endUtcMs);
    expect(definition.clock.rate).toBe(settings.timeline.rateSecondsPerSecond);
    expect(definition.experience.windows).toHaveLength(1);
    expect(definition.experience.windows![0].peakUtcMs).toBe(peak);
  });

  it("reads the rate highest at the peak, above the start and the end, and says so outside the activity window", () => {
    const window = definition.experience.windows![0];
    const peak = Date.parse(settings.activity.peakUtc);
    const rate = (t: number) => rateAt(window, t)!;
    expect(rate(peak)).toBeGreaterThan(rate(window.startUtcMs));
    expect(rate(peak)).toBeGreaterThan(rate(window.endUtcMs));
    expect(rateAt(window, window.endUtcMs + 86_400_000 * 40)).toBeNull();
  });
});
