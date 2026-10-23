import validationFile from "../data/apollo11/generated/validation.json";
import { describe, expect, it } from "vitest";
import { createOrbAstronomyAdapter } from "astraeus/core/astronomyAdapter";
import { createEvents } from "astraeus/core/events";
import { createWindows } from "astraeus/core/timeWindow";
import { createProvenance } from "astraeus/core/provenance";
import { createSceneResolver } from "astraeus/app/sceneLayout";
import { trackedAbsolute } from "astraeus/app/sceneLayout";
import { placementAbout } from "astraeus/tests/scenePlacement";
import { APOLLO11_DATA, buildApollo11Scene, POST_TLI_COAST_ID, type GeneratedValidation } from "../src/experiences/apollo11/apollo11Scene";
import { apolloMetrics, apollo11Experience, apollo11Mission } from "./support";
import type { ExperienceConfig } from "astraeus/shell/experience";
import { infoView, PROVENANCE_STATUS } from "astraeus/shell/infoModel";
import { formatMetricNumber } from "astraeus/shell/metrics";
import { SCALE_CHOICES, scalePolicyFor } from "astraeus/shell/scaleModel";
import { formatUtcTimestamp } from "astraeus/shell/timelineModel";

const validation = validationFile as unknown as GeneratedValidation;
const n = formatMetricNumber;
const objectIds = apollo11Experience.objects.map((object) => object.id);
const limitationsOf = (id: string) => apollo11Experience.objects.find((object) => object.id === id)?.knownLimitations ?? [];
const [columbia, eagle] = apollo11Mission.bodies;
const eagleMid = Math.round((eagle.trajectory.bounds.startUtcMs + eagle.trajectory.bounds.endUtcMs) / 2);

describe("provenance reachability", () => {
  it("gives every configured object a provenance status in its info panel, and never hides a reconstructed or illustrative one", () => {
    for (const id of objectIds) {
      const view = infoView(apollo11Experience, { kind: "object", id });
      expect(view?.provenance, id).not.toBeNull();
      expect(view?.provenance?.status).toBe(PROVENANCE_STATUS[view!.provenance!.sourceType]);
    }
    for (const body of apollo11Mission.bodies) {
      const source = body.provenance;
      if (source === undefined || !["reconstructed", "illustrative"].includes(source.sourceType)) continue;
      const shown = infoView(apollo11Experience, { kind: "object", id: body.id })?.provenance;
      expect(shown?.status, body.id).toBe(PROVENANCE_STATUS[source.sourceType]);
      expect(shown?.sources).toEqual(source.sources);
      expect(shown?.accuracy).toBe(source.accuracy);
      expect(shown?.notes).toBe(source.notes);
    }
  });

  it("shows the trajectory's own Provenance for Columbia and Eagle, and Ephemeris for Earth and the Moon", () => {
    expect(infoView(apollo11Experience, { kind: "object", id: "columbia" })?.provenance?.status).toBe("Reconstructed");
    expect(infoView(apollo11Experience, { kind: "object", id: "eagle" })?.provenance?.status).toBe("Reconstructed");
    expect(infoView(apollo11Experience, { kind: "object", id: "earth" })?.provenance?.status).toBe("Ephemeris");
    expect(infoView(apollo11Experience, { kind: "object", id: "moon" })?.provenance?.status).toBe("Ephemeris");
    expect(apollo11Experience.objects.find((object) => object.id === "columbia")?.provenance).toBe(
      columbia.provenance,
    );
  });

  it("gives every event its title, time and source status", () => {
    for (const event of apollo11Experience.events) {
      const view = infoView(apollo11Experience, { kind: "event", id: event.id });
      expect(view?.title).toBe(event.label);
      expect(view?.subtitle).toBe(formatUtcTimestamp(event.timeUtcMs));
      expect(view?.provenance?.status).toBe("Observed");
    }
  });

  it("renders any experience's objects and events from configuration alone", () => {
    const stream: ExperienceConfig = {
      objects: [
        { id: "comet", label: "Parent comet", description: "Source of the stream.", provenance: createProvenance({ sourceType: "observed", sources: ["catalogue"], accuracy: "orbit fit", notes: "" }) },
        { id: "stream", label: "Meteor stream", provenance: createProvenance({ sourceType: "illustrative", sources: ["model"], accuracy: "schematic", notes: "not to scale" }), knownLimitations: ["Particle density is drawn, not measured."] },
      ],
      cameraPresets: [{ id: "overview", label: "Overview", request: { kind: "overview" } }],
      events: createEvents([{ id: "peak", label: "Shower peak", timeUtcMs: 1_000_000 }]),
      window: { startUtcMs: 0, endUtcMs: 2_000_000 },
      rates: [1],
    };
    expect(infoView(stream, { kind: "object", id: "stream" })).toMatchObject({
      title: "Meteor stream",
      provenance: { status: "Illustrative", knownLimitations: ["Particle density is drawn, not measured."] },
    });
    expect(infoView(stream, { kind: "object", id: "comet" })?.description).toBe("Source of the stream.");
    expect(infoView(stream, { kind: "event", id: "peak" })).toMatchObject({ title: "Shower peak", provenance: null });
    expect(infoView(stream, { kind: "object", id: "missing" })).toBeNull();
  });
});

describe("window information", () => {
  const src = (name: string, sourceType: "observed" | "illustrative") => createProvenance({ sourceType, sources: [name], accuracy: "test", notes: "" });
  const windowed: ExperienceConfig = {
    objects: [],
    cameraPresets: [],
    events: [],
    window: { startUtcMs: 0, endUtcMs: 100 },
    rates: [1],
    eventProvenance: src("event list", "observed"),
    windows: createWindows([
      {
        id: "w", label: "Made-up period", startUtcMs: 10, endUtcMs: 90, peakUtcMs: 50,
        rate: { unit: "things per hour", samples: [{ timeUtcMs: 10, value: 0 }, { timeUtcMs: 50, value: 20 }, { timeUtcMs: 90, value: 0 }] },
        provenance: [
          { startUtcMs: 10, endUtcMs: 40, provenance: src("first source", "observed") },
          { startUtcMs: 40, endUtcMs: 90, provenance: src("second source", "illustrative") },
        ],
      },
      { id: "bare", label: "Bare period", startUtcMs: 20, endUtcMs: 30 },
    ]),
  };
  const at = (id: string, time?: number) => infoView(windowed, { kind: "window", id }, time);

  it("shows label, start, end, peak and the current rate", () => {
    const view = at("w", 30);
    expect(view?.title).toBe("Made-up period");
    expect(view?.facts).toEqual([
      { label: "Starts", value: formatUtcTimestamp(10) },
      { label: "Ends", value: formatUtcTimestamp(90) },
      { label: "Peak", value: formatUtcTimestamp(50) },
      { label: "Rate now", value: "10 things per hour" },
    ]);
    expect(at("w", 95)?.facts?.at(-1)?.value).toBe("Not available at this time");
  });

  it("changes provenance when the clock crosses a span boundary", () => {
    expect(at("w", 39)?.provenance).toMatchObject({ status: "Observed", sources: ["first source"] });
    expect(at("w", 40)?.provenance).toMatchObject({ status: "Illustrative", sources: ["second source"] });
  });

  it("falls back to the event provenance when no span applies, and omits rate and peak when absent", () => {
    expect(at("w", 95)?.provenance).toMatchObject({ sources: ["event list"] });
    expect(at("w")?.provenance).toMatchObject({ sources: ["event list"] });
    expect(at("bare", 25)?.facts?.map((fact) => fact.label)).toEqual(["Starts", "Ends"]);
    expect(at("bare", 25)?.provenance).toMatchObject({ sources: ["event list"] });
    expect(at("missing", 25)).toBeNull();
    expect(infoView({ ...windowed, windows: undefined }, { kind: "window", id: "w" })).toBeNull();
  });
});

describe("Apollo known limitations come from the generated reconstruction data", () => {
  const segment = (vehicle: string, id: string) => validation.segments.find((s) => s.vehicle === vehicle && s.id === id)!;

  it("cover smoothed joins and burn cutoff residuals for each vehicle, quoting the validation figures", () => {
    for (const vehicle of ["columbia", "eagle"]) {
      const text = limitationsOf(vehicle).join("\n");
      const own = validation.segments.filter((s) => s.vehicle === vehicle);
      const corrections = own.flatMap((s) => (s.maxCorrectionKm === undefined ? [] : [s.maxCorrectionKm]));
      const residuals = own.flatMap((s) => (s.cutoffPositionResidualKm === undefined ? [] : [s.cutoffPositionResidualKm]));
      expect(text).toMatch(/^Smoothed joins: /m);
      expect(text).toContain(`by up to ${n(Math.max(...corrections), 0)} km`);
      expect(text).toMatch(/^Burn cutoffs: /m);
      expect(text).toContain(`${n(Math.min(...residuals), 1)}–${n(Math.max(...residuals), 1)} km`);
    }
  });

  it("covers the accepted post-TLI speed limitation with the coast's own correction and the runtime peak", () => {
    const coast = segment("columbia", POST_TLI_COAST_ID);
    const burn = validation.segments.find((s) => s.vehicle === "columbia" && s.endUtcMs === coast.startUtcMs)!;
    const text = limitationsOf("columbia").find((line) => line.startsWith("Speed just after translunar injection"));
    expect(text).toContain(`${n(burn.cutoffPositionResidualKm!, 1)} km cutoff miss`);
    expect(text).toContain(`${n(coast.maxCorrectionMs!, 0)} m/s`);
    const peak = Math.max(...Array.from({ length: 101 }, (_, i) => {
      const v = columbia.trajectory.stateAt(coast.startUtcMs + i * 100).velocityKmS!;
      return Math.hypot(...v);
    }));
    expect(peak).toBeGreaterThan(20);
    expect(text).toContain(`reaches ${n(peak, 1)} km/s`);
  });

  it("covers Eagle's landing-site offset at touchdown and lift-off", () => {
    const text = limitationsOf("eagle").find((line) => line.startsWith("Landing site"));
    for (const offset of validation.landingSiteOffset) {
      expect(text).toContain(`${n(offset.offsetKm, 2)} km (${n(offset.offsetDeg, 3)}°)`);
    }
    expect(text).toContain("Lunar landing (touchdown)");
    expect(text).toContain("Lunar lift-off");
  });

  it("changes when the generated data changes, so no figure is hand-copied", () => {
    const altered: GeneratedValidation = {
      ...validation,
      landingSiteOffset: validation.landingSiteOffset.map((o) => ({ ...o, offsetKm: o.offsetKm + 1000 })),
      segments: validation.segments.map((s) => (s.cutoffPositionResidualKm === undefined ? s : { ...s, cutoffPositionResidualKm: s.cutoffPositionResidualKm + 1000 })),
    };
    const limits = (data: typeof APOLLO11_DATA) => Object.fromEntries(buildApollo11Scene(data).toDefinition().experience.objects.map((object) => [object.id, object.knownLimitations ?? []]));
    const before = limits(APOLLO11_DATA);
    const after = limits({ ...APOLLO11_DATA, validation: altered });
    expect(after.eagle.join()).not.toBe(before.eagle.join());
    expect(after.columbia.join()).not.toBe(before.columbia.join());
    expect(after.eagle.join()).toContain(n(validation.landingSiteOffset[0].offsetKm + 1000, 2));
  });
});

describe("scale choice independence", () => {
  it("maps each shell choice to the unchanged engine policy", () => {
    expect(SCALE_CHOICES.map((choice) => scalePolicyFor(choice.id).id)).toEqual(["true-scale", "readable-scale"]);
    expect(SCALE_CHOICES.map((choice) => choice.label)).toEqual(["True", "Readable"]);
    expect(SCALE_CHOICES.find((choice) => choice.id === "readable-scale")?.explanation).toMatch(/closer.*true size.*drawn on top/s);
  });

  it("leaves State and every info readout identical under True and Readable through the shell's choice", () => {
    const metricsFor = apolloMetrics(createSceneResolver(createOrbAstronomyAdapter()));
    const snapshot = () => objectIds.map((id) => metricsFor(id, eagleMid));
    const states = () => apollo11Mission.bodies.map((body) => {
      const state = body.trajectory.stateAt(eagleMid);
      return [Array.from(state.positionKm), Array.from(state.velocityKmS ?? [])];
    });
    const readouts = SCALE_CHOICES.map((choice) => {
      const policy = scalePolicyFor(choice.id);
      for (const body of apollo11Mission.bodies) trackedAbsolute(body.trajectory.stateAt(eagleMid), policy, placementAbout("earth"));
      return { metrics: snapshot(), states: states() };
    });
    expect(readouts[0].metrics.every((metrics) => metrics.length > 0)).toBe(true);
    expect(readouts[1]).toEqual(readouts[0]);
  });
});
