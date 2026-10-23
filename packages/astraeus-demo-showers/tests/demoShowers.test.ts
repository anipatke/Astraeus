// The showers' own rules, checked on each real shower file with the shared builder (O-038 T-146): the parts of browser-showers.mjs and browser-public-showers.mjs that
// are about what the settings and the builder make, not about pixels. Both real shower files run the same cases (nothing belongs to one shower). The settings contract, the orbit
// sets, the year and activity spans, the loop, the label settings, the parent, the story panels and the solar longitudes are kept by tests/showers.test.ts; the measured file's counts by
// tests/showersMeasured.test.ts; the switch by tests/showerChoice.test.ts. The stream's dots, the glow's gradient and the camera flights are the smoke check.
import { describe, expect, it } from "vitest";
import { experienceWithGroups, groupsOf, mountedBodiesOf, scaleChoiceIdsOf, sceneCenterOf, sunCentredOf } from "astraeus/app/experienceDefinition";
import { catalogue } from "astraeus/assets/catalogue";
import { createSceneResolver } from "astraeus/app/sceneLayout";
import { createOrbAstronomyAdapter } from "astraeus/core/astronomyAdapter";
import { SimulationClock } from "astraeus/core/clock";
import { rateAt } from "astraeus/core/timeWindow";
import { buildShowerDefinition, parentOrbitIdOf, streamIdOf, timelineBoundsOf } from "../src/experiences/showers/showerDefinition";
import { parseShowerSettings, type ShowerSettings } from "../src/experiences/showers/showerSettings";
import { infoView } from "astraeus/shell/infoModel";
import geminidsFile from "../data/showers/geminids.json";
import perseidsFile from "../data/showers/perseids.json";
import { madeUpOrbits, readShippedFile, readShippedOrbits } from "./helpers/measuredOrbits";

const adapter = createOrbAstronomyAdapter();
const resolver = createSceneResolver(adapter);
const PLANETS = ["mercury", "venus", "mars", "jupiter"];
const SHOWERS = [["perseids", perseidsFile, "perseids"], ["geminids", geminidsFile, "geminids"]] as const;
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe.each(SHOWERS)("the %s shower", (_name, file, story) => {
  const settings: ShowerSettings = parseShowerSettings(file);
  const kept = readShippedFile(story, settings.stream.iauCode).provenance.counts.kept as number;
  const definition = buildShowerDefinition(settings, { kind: "loaded", orbits: madeUpOrbits(settings.stream.iauCode, 50) });
  const experience = experienceWithGroups(definition);
  const streamId = streamIdOf(settings);
  const parentId = settings.parentBodyId ?? (settings.parentElements as { id: string }).id;
  const view = (id: string) => infoView(experience, { kind: "object", id })!;
  const detail = (id: string) => { const p = view(id).provenance!; return [p.accuracy, p.notes, ...p.sources, ...(p.knownLimitations ?? [])].join(" ").replace(/\s+/g, " "); };

  it("is a Sun-centred scene of the Sun, Earth, the four planets and its own parent, with six declared paths and no other shower's parent", () => {
    expect(sceneCenterOf(definition)).toBe("sun");
    expect(mountedBodiesOf(definition)).toEqual(["sun", "earth", ...PLANETS, parentId]);
    expect(mountedBodiesOf(definition)).not.toContain(parentId === "swift-tuttle" ? "phaethon" : "swift-tuttle");
    expect(sunCentredOf(definition)?.paths).toHaveLength(6);
  });

  it("lists the stream once and every mounted body, keeps every orbit line out of the Object list but offers each from its body, and has no Moon or Apollo item", () => {
    const ids = experience.objects.map((object) => object.id);
    expect(ids.filter((id) => id === streamId)).toHaveLength(1);
    for (const id of [...mountedBodiesOf(definition), streamId]) expect(ids).toContain(id);
    for (const [orbit, body] of [["earth-path", "earth"], ...PLANETS.map((p) => [`${p}-orbit`, p]), [parentOrbitIdOf(settings), parentId]]) {
      const object = experience.objects.find((o) => o.id === orbit)!;
      expect(object.partOf).toBe(body);
      expect(view(orbit).description).not.toBe("");
    }
    expect(ids).not.toContain("moon");
    expect(ids).not.toContain("columbia");
    expect(ids).not.toContain("debris-ring");
    expect(groupsOf(definition)).toHaveLength(1);
  });

  it("offers True and Solar-system scale, and states Earth's and every planet's factor in the Solar-system scale", () => {
    expect(scaleChoiceIdsOf(definition)).toEqual(["true-scale", "solar-system"]);
    const factor = `${settings.look.planetExaggeration} times larger than life`;
    expect(detail("earth")).toContain(factor);
    expect(detail("mars")).toContain(factor);
  });

  it("offers Focus parent, Whole orbit, Focus stream and Follow Earth, and the Sun's label follows the settings while the Sun stays listed", () => {
    expect(experience.cameraPresets.map((preset) => preset.id)).toEqual(expect.arrayContaining(["overview", "focus-earth", "follow-earth", "focus-parent", "whole-orbit", "focus-stream"]));
    const sun = experience.objects.find((object) => object.id === "sun")!;
    expect(settings.labels).toEqual({ sun: false });
    expect(sun.showLabel).toBe(false);
    expect(experience.objects.find((object) => object.id === "earth")!.showLabel).toBeUndefined();
  });

  it("opens where the settings say: the declared view and up direction", () => {
    expect(definition.viewUp).toBe(settings.look.viewUp);
    expect(definition.startView).toEqual(settings.look.startView);
    expect(definition.loop).toBe(settings.look.loop);
  });

  it("gives each planet's orbit the planet's position provenance and the compared range, and Jupiter's orbit says it passes it", () => {
    for (const planet of ["mercury", "jupiter"]) {
      expect(view(`${planet}-orbit`).title).toMatch(/orbit/i);
      expect(detail(`${planet}-orbit`)).toMatch(/Horizons/);
    }
    expect(detail("jupiter-orbit")).toMatch(/reaches past 2030/);
  });

  it("reads the radiant from the settings: right ascension, declination, J2000 and the cited source", () => {
    const radiant = definition.createMetrics({ clock: new SimulationClock(Date.parse(settings.activity.peakUtc)), resolver, catalogue })(streamId, Date.parse(settings.activity.peakUtc)).find((metric) => metric.id === `${settings.id}-radiant`)!;
    if (radiant.kind !== "coordinates") throw new Error("the radiant is a coordinates metric");
    expect(radiant).toMatchObject({ system: "radec", frame: "J2000" });
    expect(radiant.components!.map((c) => [c.label, c.value])).toEqual([["RA", settings.radiant.raDeg], ["Dec", settings.radiant.decDeg]]);
    expect(radiant.context).toContain(settings.radiant.source.name.split(/[,(:]/)[0].trim());
  });

  it("marks the stream illustrative and states its parts: the measured shapes, the dots' positions, the clump as a model (or none), what is not shown, and no invented spread", () => {
    expect(view(streamId).provenance!.status).toBe("Illustrative");
    const text = detail(streamId);
    expect(text).toMatch(/position of each dot along its orbit is illustrative/i);
    expect(text).toMatch(/Parts of the stream that miss Earth are not shown/i);
    expect(text).not.toMatch(/invented|Modelled spread/);
    const clump = settings.stream.concentration;
    expect(text).toMatch(new RegExp(`clump near ${escape(settings.parentBody)} is a model: ${Math.round(clump.fraction * 100)}% of the dots are placed within ±${clump.widthDeg}° of ${escape(settings.parentBody)}`));
    expect(text).toMatch(new RegExp(`band at ${escape(settings.parentBody)}'s phase, not a blob on ${escape(settings.parentBody)}`, "i"));
  });

  it("cites the Global Meteor Network with licence, months, both papers and counts, names no CAMS source, offers no source switch, and counts the shipped orbits it draws", () => {
    const gmn = settings.stream.sources.gmn;
    const shipped = experienceWithGroups(buildShowerDefinition(settings, { kind: "loaded", orbits: readShippedOrbits(story, settings.stream.iauCode) }));
    const p = infoView(shipped, { kind: "object", id: streamId })!;
    const text = [p.description, ...p.provenance!.sources, p.provenance!.notes].join(" ");
    for (const needed of ["Global Meteor Network", gmn.licence, "Vida", "506(4)", "491(2)", ...gmn.months, `${kept} bound orbits in the file`]) expect(text).toContain(needed);
    expect(text).not.toMatch(/CAMS Meteoroid Orbit Database|cams\.seti|Jenniskens et al\. 2018/);
    expect(p.description).toContain(`${kept} measured meteoroid orbits`);
    expect(definition.alternates!.map((option) => option.param)).toEqual(["orbits", "orbits"]);
  });

  it("when the orbits are absent, still lists the stream and says so with the GMN fetch command; in a public build it says the build has none and gives no command", () => {
    const absent = experienceWithGroups(buildShowerDefinition(settings, { kind: "absent" }));
    expect(groupsOf(buildShowerDefinition(settings, { kind: "absent" }))).toHaveLength(0);
    const stream = infoView(absent, { kind: "object", id: streamId })!;
    expect(stream.description).toMatch(/not fetched on this machine/i);
    expect(stream.description).toContain(`node tools/data/fetch-meteoroid-orbits.mjs ${settings.stream.iauCode} --months ${settings.stream.sources.gmn.months.join(",")}`);
    expect(stream.description).not.toContain("--source");
    expect(mountedBodiesOf(buildShowerDefinition(settings, { kind: "absent" }))).toEqual(mountedBodiesOf(definition));
  });

  it("spans about a year from the settings' year start, mid-way through the peak, with the settings' playback rate and its activity glow and peak mark", () => {
    const { startUtcMs, endUtcMs } = timelineBoundsOf(settings);
    expect(Math.abs((endUtcMs - startUtcMs) / 86_400_000 - 365.25)).toBeLessThan(1);
    expect(startUtcMs).toBe(Date.parse(settings.timeline.yearStartUtc!));
    const peak = Date.parse(settings.activity.peakUtc);
    expect(peak).toBeGreaterThan(startUtcMs);
    expect(peak).toBeLessThan(endUtcMs);
    expect(definition.clock.rate).toBe(settings.timeline.rateSecondsPerSecond);
    expect(experience.windows).toHaveLength(1);
    expect(experience.windows![0].peakUtcMs).toBe(peak);
  });

  it("reads the rate highest at the peak, above the start and the end, and says so outside the activity window", () => {
    const window = experience.windows![0];
    const peak = Date.parse(settings.activity.peakUtc);
    const rate = (t: number) => rateAt(window, t)!;
    expect(rate(peak)).toBeGreaterThan(rate(window.startUtcMs));
    expect(rate(peak)).toBeGreaterThan(rate(window.endUtcMs));
    expect(rateAt(window, window.endUtcMs + 86_400_000 * 40)).toBeNull();
  });
});
