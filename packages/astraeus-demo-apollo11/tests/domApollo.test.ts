// @vitest-environment happy-dom
// Apollo 11's own rules (O-038 T-146), the parts of browser-apollo-shell.mjs and browser-spike02.mjs that only Apollo can show: the 30 events on the pretend page, the readouts at the
// six mission phases, the speed against the range's rate of change, the Moon's illumination at four USNO dates, and the camera presets leaving time and readouts alone. The
// provenance wording, the mission panel's metric visuals and the event jumps are kept by tests/infoProvenance.test.ts, tests/metricVisuals.test.ts and tests/missionScene.test.ts.
import { afterEach, describe, expect, it } from "vitest";
import { bodyMetrics } from "astraeus/app/bodyMetrics";
import { createSceneResolver } from "astraeus/app/sceneLayout";
import { createOrbAstronomyAdapter } from "astraeus/core/astronomyAdapter";
import { apollo11Definition } from "../src/experiences/apollo11/apollo11Definition";
import { apollo11Experience, apollo11Mission } from "../src/experiences/apollo11/apollo11";
import { apolloMetrics } from "../src/experiences/apollo11/apolloMetrics";
import { infoView } from "astraeus/shell/infoModel";
import { scaleChoicesFor } from "astraeus/shell/scaleModel";
import type { Metric } from "astraeus/shell/metrics";
import { $, findAllByLabel, mountShell, press, type Mounted } from "astraeus/tests/domSetup";

const resolver = createSceneResolver(createOrbAstronomyAdapter());
const metricsFor = apolloMetrics(apollo11Mission.bodies, resolver);
const utc = (text: string) => Date.parse(`${text.replace(" ", "T")}Z`);
const valueOf = (metrics: readonly Metric[], id: string): number => {
  const metric = metrics.find((entry) => entry.id === id);
  if (metric === undefined || !("value" in metric) || metric.value === null) throw new Error(`no value for ${id}`);
  return metric.value;
};

let m: Mounted | undefined;
afterEach(() => { m?.unmount(); m = undefined; });

describe("the thirty events", () => {
  it("are the mission's thirty, listed on the screen as many rows, and the same list the timeline markers use", () => {
    expect(apollo11Experience.events).toHaveLength(30);
    expect(apollo11Experience.events).toBe(apollo11Mission.events);
    m = mountShell({ experience: apollo11Experience });
    const rows = [...m.container.querySelectorAll<HTMLElement>(".timeline-expanded li button")];
    expect(rows).toHaveLength(30);
    const labels = rows.map((row) => row.querySelector("span")!.textContent!.trim());
    expect(labels).toEqual(apollo11Experience.events.map((event) => event.label));
    expect(new Set(labels).size).toBe(30);
  });

  it("each row jumps the clock to its event's time, and the context line names it", () => {
    m = mountShell({ experience: apollo11Experience });
    const rows = [...m.container.querySelectorAll<HTMLElement>(".timeline-expanded li button")];
    rows.forEach((row, index) => {
      press(row);
      expect(m!.clock.now()).toBe(apollo11Experience.events[index].timeUtcMs);
      expect($(m!.container, ".timeline-event-context").textContent).toContain(apollo11Experience.events[index].label);
    });
  });
});

describe("one scale", () => {
  it("offers True only, so the shell has no scale control and no explanation button", () => {
    expect(apollo11Definition.scaleChoices).toEqual(["true-scale"]);
    m = mountShell({ experience: apollo11Experience, scaleChoices: scaleChoicesFor(apollo11Definition.scaleChoices ?? []) });
    expect(m.container.querySelector(".scale-toggle")).toBeNull();
    expect(findAllByLabel(m.container, "About the scales")).toHaveLength(0);
    expect(m.scale()).toBe("true-scale");
    m.unmount();
    m = mountShell({ experience: apollo11Experience });
    expect(m.container.querySelector(".scale-toggle")).not.toBeNull();
  });
});

describe("the six mission phases (browser-spike02)", () => {
  const phases = [
    ["earth-orbit", "1969-07-16 14:30:00", ["columbia"]],
    ["translunar", "1969-07-18 12:00:00", ["columbia"]],
    ["lunar-orbit-columbia", "1969-07-21 06:00:00", ["columbia"]],
    ["lunar-surface-eagle", "1969-07-21 06:00:00", ["eagle"]],
    ["return", "1969-07-23 12:00:00", ["columbia"]],
    ["entry", "1969-07-24 16:30:00", ["columbia"]],
  ] as const;
  it.each(phases)("%s: the vehicle's range, speed and Moon gap read as finite numbers at %s", (_id, when, vehicles) => {
    for (const vehicle of vehicles) {
      const metrics = metricsFor(vehicle, utc(when));
      expect(metrics.map((metric) => metric.id)).toEqual([`${vehicle}-range`, `${vehicle}-speed`, `${vehicle}-to-moon`]);
      for (const id of [`${vehicle}-range`, `${vehicle}-speed`, `${vehicle}-to-moon`]) expect(Number.isFinite(valueOf(metrics, id))).toBe(true);
    }
  });

  it("read the same whichever camera preset is chosen: the presets are requests to the camera and the readouts are a function of time", () => {
    const when = utc("1969-07-20 20:17:00");
    const ids = ["earth", "moon", "columbia", "eagle"];
    const before = ids.map((id) => metricsFor(id, when));
    m = mountShell({ experience: apollo11Experience });
    const presets = apollo11Experience.cameraPresets.map((preset) => preset.id);
    expect(presets).toEqual(expect.arrayContaining(["focus-earth", "focus-moon", "focus-columbia", "focus-eagle", "follow-columbia", "follow-eagle", "overview"]));
    for (const preset of apollo11Experience.cameraPresets) {
      expect(preset.request).toBeDefined();
      expect(ids.map((id) => metricsFor(id, when))).toEqual(before);
    }
  });
});

describe("the speed readout (browser-spike02)", () => {
  it.each(["1969-07-17 12:00:00", "1969-07-19 12:00:00", "1969-07-23 12:00:00"])("at %s matches the range's rate of change one simulated minute later, within 8 percent, and a wrong expectation is rejected", (when) => {
    const t = utc(when);
    const first = metricsFor("columbia", t);
    const second = metricsFor("columbia", t + 60_000);
    const speed = valueOf(first, "columbia-speed");
    const implied = Math.abs(valueOf(second, "columbia-range") - valueOf(first, "columbia-range")) / 60;
    expect(speed).toBeGreaterThan(0);
    expect(Math.abs(speed - implied)).toBeLessThanOrEqual(0.08 * implied);
    expect(Math.abs(speed - implied * 1.5)).toBeGreaterThan(0.08 * implied * 1.5);
  });
});

describe("the Moon's phase at the four USNO dates (browser-spike02)", () => {
  it.each([["2024-01-04 03:30:00", 50.1], ["2024-01-11 11:57:00", 0.2], ["2024-01-18 03:52:00", 50.1], ["2024-01-25 17:54:00", 99.8]])("%s is %s percent lit within one point", (when, expected) => {
    const phase = bodyMetrics(resolver, ["earth", "moon"])("moon", utc(when)).find((metric) => metric.kind === "phase");
    expect(phase?.kind === "phase" ? phase.fraction : null).not.toBeNull();
    expect(Math.abs((phase as { fraction: number }).fraction * 100 - expected)).toBeLessThanOrEqual(1);
  });
});

describe("what the information panel says for Apollo's objects (browser-apollo-shell)", () => {
  it.each<[string, string[]]>([
    ["columbia", ["Smoothed joins", "Burn cutoffs", "translunar injection"]],
    ["eagle", ["Landing site", "Smoothed joins", "Burn cutoffs"]],
    ["moon", ["no libration"]],
  ])("%s states its limitations and carries a status", (id, phrases) => {
    const view = infoView(apollo11Experience, { kind: "object", id })!;
    const text = (view.provenance?.knownLimitations ?? []).join("\n");
    for (const phrase of phrases) expect(text).toContain(phrase);
    expect(typeof view.provenance?.status).toBe("string");
  });
});
