import { describe, expect, it } from "vitest";
import fixture from "./fixtures/showers-year-horizons.json";
import source from "./fixtures/showers-year-horizons-source.txt?raw";
import geminids from "../data/showers/geminids.json";
import geminidsPanels from "../data/stories/geminids/panels.json";
import perseidsPanels from "../data/stories/perseids/panels.json";
import { createSwiftTuttleTrajectory, SWIFT_TUTTLE_MAX_ERROR_KM } from "../src/core/bodies/swiftTuttle";
import { buildElementsBody, classifyPositionError, parseElementsBodyRecord } from "../src/core/elementsBody";
import { catalogue } from "../src/assets/catalogue";
import { buildShowerDefinition } from "../src/experiences/showers/showerDefinition";
import { shippedPanelsOf } from "./helpers/shippedPanels";
import { parseShowerSettings } from "../src/experiences/showers/showerSettings";

// O-024 T-092: the Showers demo's year (21 September 2019 to 20 September 2020) checked against JPL Horizons, as C-030/C-032 did for the
// earlier dates: 3200 Phaethon (the settings-file body) and 109P/Swift-Tuttle (the built-in comet) at six dates across the year, and
// Phaethon's perihelion times either side of it, which place the Geminid Phaethon panel. Raw responses: showers-year-horizons-source.txt.
const AU_KM = 149_597_870.7;
const CENTRE = { id: "sun", gmKm3S2: catalogue.get("sun").definition.gmKm3S2! };
const distance = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const YEAR_START = Date.parse("2019-09-21T00:00:00Z");
const YEAR_END = Date.parse("2020-09-20T06:09:09.763Z");
/** TT minus UTC in 2019-2020: 32.184 s plus 37 leap seconds. */
const TT_MINUS_UTC_MS = 69_184;
const tdbJdToUtcMs = (jd: number) => Math.round((jd - 2440587.5) * 86_400_000) - TT_MINUS_UTC_MS;

type Sample = { readonly label: string; readonly utcMs: number; readonly positionKm: readonly number[] };
const rowsFor = (samples: readonly Sample[], stateAt: (t: number) => ArrayLike<number>) =>
  samples.map((s) => {
    const errorKm = distance(stateAt(s.utcMs), s.positionKm);
    const range = Math.hypot(...s.positionKm);
    return { label: s.label, errorKm, fraction: errorKm / range, rangeAu: range / AU_KM };
  });
const worst = <T extends { errorKm: number }>(rows: readonly T[]) => rows.reduce((a, b) => (b.errorKm > a.errorKm ? b : a));

describe("the Showers year against JPL Horizons (O-024 T-092)", () => {
  const record = parseElementsBodyRecord((geminids as { parentElements: unknown }).parentElements, "parentElements");
  const phaethon = buildElementsBody(record, CENTRE).create();
  const comet = createSwiftTuttleTrajectory();
  const phaethonRows = rowsFor(fixture.phaethon.samples, (t) => phaethon.stateAt(t, "sun").positionKm);
  const cometRows = rowsFor(fixture.swiftTuttle.samples, (t) => comet.stateAt(t, "sun").positionKm);

  it("archives the three raw responses with their queries, and samples six dates spanning the year", () => {
    const parts = source.split(/^==== QUERY .*====\n/m);
    expect(parts).toHaveLength(4);
    expect(parts[1]).toContain("Target body name: 3200 Phaethon (1983 TB)");
    expect(parts[2]).toContain("Target body name: 109P/Swift-Tuttle");
    expect(parts[3]).toContain("Target body name: 3200 Phaethon (1983 TB)");
    for (const part of parts.slice(1)) expect(part).toContain("Center body name: Sun (10)");
    expect(fixture.phaethon.solution).toBe("JPL#1019");
    expect(fixture.swiftTuttle.solution).toBe("JPL#32");
    for (const samples of [fixture.phaethon.samples, fixture.swiftTuttle.samples]) {
      expect(samples).toHaveLength(6);
      expect(samples[0].utcMs).toBe(YEAR_START);
      expect(samples[5].label).toMatch(/^2020-Sep-20/);
      for (const s of samples) expect(s.utcMs).toBeLessThanOrEqual(YEAR_END);
    }
  });

  it("Phaethon: largest difference 365,665 km (0.16%) at 2020-09-20, within the recorded 935,344 km and indicative class, and the record says so", () => {
    const top = worst(phaethonRows);
    expect(top.label).toMatch(/^2020-Sep-20/);
    expect(Math.ceil(top.errorKm)).toBe(365_665);
    expect(top.fraction).toBeCloseTo(0.00159, 5);
    expect(top.errorKm).toBeLessThan(935_344);
    expect(classifyPositionError(Math.max(...phaethonRows.map((r) => r.fraction)))).toBe("approximate");
    expect(record.accuracy.classification).toBe("indicative");
    expect(record.accuracy.statement).toContain("365,665 km");
    expect(record.accuracy.validFromUtc).toBe("2019-09-21T00:00:00Z");
  });

  it("Swift-Tuttle: largest difference 7,644,938 km (0.13%) at 2019-09-21, within the recorded maximum, so its 1990-2030 validity covers the year", () => {
    const top = worst(cometRows);
    expect(top.label).toMatch(/^2019-Sep-21/);
    expect(Math.ceil(top.errorKm)).toBe(7_644_938);
    expect(Math.max(...cometRows.map((r) => r.fraction))).toBeLessThan(0.0014);
    expect(top.errorKm).toBeLessThan(SWIFT_TUTTLE_MAX_ERROR_KM);
    for (const row of cometRows) expect(row.rangeAu).toBeGreaterThan(38.7);
  });

  it("Phaethon's perihelia either side of the year (2 July 2019 and 7 December 2020, JPL#1019) fall outside it, so the Phaethon panel opens six weeks in and says when the last pass was", () => {
    const [before, after] = fixture.phaethonPerihelia.tpJdTdb.map(tdbJdToUtcMs);
    expect(new Date(before).toISOString().slice(0, 16)).toBe("2019-07-02T23:51");
    expect(new Date(after).toISOString().slice(0, 16)).toBe("2020-12-07T14:25");
    expect(before).toBeLessThan(YEAR_START);
    expect(after).toBeGreaterThan(YEAR_END);
    const panel = geminidsPanels.panels.find((p) => p.id === "phaethon")!;
    expect(panel.at).toEqual({ utc: "2019-11-01T00:00:00Z" });
    expect(panel.body.join(" ")).toMatch(/early July 2019/);
    expect(panel.details.join(" ")).toMatch(/2 July 2019 at about 23:51 UTC/);
    expect(panel.details.join(" ")).toMatch(/7 December 2020 at about 14:26 UTC/);
    // On its way out, about 1.9 AU from the Sun, as the details say.
    const r = Math.hypot(...phaethon.stateAt(Date.parse(panel.at.utc!), "sun").positionKm) / AU_KM;
    expect(r).toBeGreaterThan(1.85);
    expect(r).toBeLessThan(1.95);
  });

  it("every Showers story moment lies inside the year, and the details name the 2019-2020 values and the measured-orbit years", () => {
    for (const panels of [perseidsPanels, geminidsPanels]) {
      for (const panel of panels.panels) {
        const at = panel.at as { utc?: string; event?: string };
        if (at.utc !== undefined) {
          expect(Date.parse(at.utc)).toBeGreaterThan(YEAR_START);
          expect(Date.parse(at.utc)).toBeLessThan(YEAR_END);
        }
      }
    }
    const perseidsText = perseidsPanels.panels.flatMap((p) => p.details).join(" ");
    expect(perseidsText).toMatch(/measured in 2025/);
    expect(perseidsText).toMatch(/In 2020, the year this scene shows/);
    const geminidsText = geminidsPanels.panels.flatMap((p) => p.details).join(" ");
    expect(geminidsText).toMatch(/December 2024 and December 2025/);
    expect(geminidsText).toMatch(/Active 4 to 17 December 2019/);
    expect(geminidsText).toMatch(/14 December 2019 at 04:33:33 UTC/);
    const settings = parseShowerSettings(geminids);
    const built = buildShowerDefinition(settings, { kind: "absent" }, undefined, shippedPanelsOf(settings)).experience;
    expect(built.storyPanels!.panels.map((p) => p.id)).toEqual(["phaethon", "best-shower", "earth-crossing"]);
  });
});
