import { describe, expect, it } from "vitest";
import { createProvenance } from "../src/core/provenance";
import { createWindows, provenanceAt, rateAt, type TimelineWindow } from "../src/core/timeWindow";

const H = 3_600_000;
const T0 = Date.UTC(2030, 0, 1);
const observed = { sourceType: "observed", sources: ["log"], accuracy: "measured", notes: "" } as const;
const illustrative = { sourceType: "illustrative", sources: [], accuracy: "shape only", notes: "" } as const;

const eclipseLike: TimelineWindow = { id: "dim", label: "Dimming", type: "eclipse", startUtcMs: T0, endUtcMs: T0 + 2 * H };
const pass: TimelineWindow = {
  id: "pass", label: "Pass", startUtcMs: T0, endUtcMs: T0 + 10 * H, peakUtcMs: T0 + 5 * H,
  rate: { unit: "per hour", samples: [{ timeUtcMs: T0 + H, value: 0 }, { timeUtcMs: T0 + 5 * H, value: 100 }, { timeUtcMs: T0 + 9 * H, value: 20 }] },
};
const mixed: TimelineWindow = {
  id: "mixed", label: "Mixed", startUtcMs: T0, endUtcMs: T0 + 10 * H,
  provenance: [
    { startUtcMs: T0, endUtcMs: T0 + 4 * H, provenance: observed },
    { startUtcMs: T0 + 4 * H, endUtcMs: T0 + 8 * H, provenance: illustrative },
  ],
};

describe("createWindows", () => {
  it("returns frozen copies without rate or provenance for a plain window", () => {
    const [copy] = createWindows([eclipseLike]);
    expect(copy).toEqual(eclipseLike);
    expect(copy).not.toBe(eclipseLike);
    expect(Object.isFrozen(copy)).toBe(true);
    expect(copy.rate).toBeUndefined();
    expect(copy.provenance).toBeUndefined();
  });

  it("freezes nested rate samples and provenance spans", () => {
    const [p, m] = createWindows([pass, mixed]);
    expect(Object.isFrozen(p.rate)).toBe(true);
    expect(Object.isFrozen(p.rate?.samples)).toBe(true);
    expect(Object.isFrozen(p.rate?.samples[0])).toBe(true);
    expect(Object.isFrozen(m.provenance)).toBe(true);
    expect(Object.isFrozen(m.provenance?.[0])).toBe(true);
    expect(Object.isFrozen(m.provenance?.[0].provenance)).toBe(true);
  });

  it("sorts by start and allows ties", () => {
    const later = { ...eclipseLike, id: "later", startUtcMs: T0 + H };
    const tie = { ...eclipseLike, id: "tie" };
    expect(createWindows([later, eclipseLike, tie]).map((w) => w.id)).toEqual(["dim", "tie", "later"]);
  });

  it("rejects non-UTC times", () => {
    expect(() => createWindows([{ ...eclipseLike, startUtcMs: 1.5 }])).toThrow(RangeError);
    expect(() => createWindows([{ ...eclipseLike, endUtcMs: Number.NaN }])).toThrow(RangeError);
    expect(() => createWindows([{ ...pass, peakUtcMs: 0.5 }])).toThrow(RangeError);
  });

  it("rejects an end that is not after the start", () => {
    expect(() => createWindows([{ ...eclipseLike, endUtcMs: T0 }])).toThrow(/end must be after/);
    expect(() => createWindows([{ ...eclipseLike, endUtcMs: T0 - 1 }])).toThrow(/end must be after/);
  });

  it("rejects empty and duplicate ids", () => {
    expect(() => createWindows([{ ...eclipseLike, id: "" }])).toThrow(/non-empty/);
    expect(() => createWindows([eclipseLike, eclipseLike])).toThrow(/duplicate window id/);
  });

  it("rejects a peak outside the window", () => {
    expect(() => createWindows([{ ...pass, peakUtcMs: T0 - 1 }])).toThrow(/peak is outside/);
    expect(() => createWindows([{ ...pass, peakUtcMs: T0 + 11 * H }])).toThrow(/peak is outside/);
  });

  it("rejects rate samples outside the window", () => {
    const rate = { unit: "x", samples: [{ timeUtcMs: T0 + 11 * H, value: 1 }] };
    expect(() => createWindows([{ ...pass, rate }])).toThrow(/rate sample is outside/);
  });

  it("rejects unsorted or duplicate-time samples", () => {
    const sample = (h: number) => ({ timeUtcMs: T0 + h * H, value: 1 });
    expect(() => createWindows([{ ...pass, rate: { unit: "x", samples: [sample(3), sample(2)] } }])).toThrow(/sorted/);
    expect(() => createWindows([{ ...pass, rate: { unit: "x", samples: [sample(2), sample(2)] } }])).toThrow(/unique/);
  });

  it("rejects negative or non-finite values", () => {
    for (const value of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => createWindows([{ ...pass, rate: { unit: "x", samples: [{ timeUtcMs: T0, value }] } }])).toThrow(/finite/);
    }
  });

  it("rejects an empty unit", () => {
    expect(() => createWindows([{ ...pass, rate: { unit: "", samples: [] } }])).toThrow(/unit/);
  });

  it("rejects provenance spans outside the window", () => {
    const span = { startUtcMs: T0 - H, endUtcMs: T0 + H, provenance: observed };
    expect(() => createWindows([{ ...mixed, provenance: [span] }])).toThrow(/provenance span is outside/);
  });

  it("rejects unsorted or overlapping spans", () => {
    const [a, b] = mixed.provenance ?? [];
    expect(() => createWindows([{ ...mixed, provenance: [b, a] }])).toThrow(/sorted and not overlap/);
    const overlap = { ...b, startUtcMs: a.endUtcMs - 1 };
    expect(() => createWindows([{ ...mixed, provenance: [a, overlap] }])).toThrow(/sorted and not overlap/);
    expect(() => createWindows([{ ...mixed, provenance: [{ ...a, endUtcMs: a.startUtcMs }] }])).toThrow(/end must be after/);
  });

  it("validates span provenance and allows gaps", () => {
    const bad = { startUtcMs: T0, endUtcMs: T0 + H, provenance: { ...observed, sourceType: "guess" } };
    expect(() => createWindows([{ ...mixed, provenance: [bad as never] }])).toThrow(/sourceType/);
    const gap = [
      { startUtcMs: T0, endUtcMs: T0 + H, provenance: observed },
      { startUtcMs: T0 + 3 * H, endUtcMs: T0 + 4 * H, provenance: illustrative },
    ];
    expect(createWindows([{ ...mixed, provenance: gap }])[0].provenance).toHaveLength(2);
  });
});

describe("rateAt", () => {
  const [p] = createWindows([pass]);
  it("returns the exact sample value at a sample time", () => {
    expect(rateAt(p, T0 + H)).toBe(0);
    expect(rateAt(p, T0 + 5 * H)).toBe(100);
    expect(rateAt(p, T0 + 9 * H)).toBe(20);
  });
  it("blends linearly between samples", () => {
    expect(rateAt(p, T0 + 3 * H)).toBe(50);
    expect(rateAt(p, T0 + 7 * H)).toBe(60);
  });
  it("returns null outside the window, the samples, or without a rate", () => {
    expect(rateAt(p, T0 - 1)).toBeNull();
    expect(rateAt(p, T0 + 10 * H + 1)).toBeNull();
    expect(rateAt(p, T0 + H - 1)).toBeNull();
    expect(rateAt(p, T0 + 9 * H + 1)).toBeNull();
    expect(rateAt(createWindows([eclipseLike])[0], T0 + H)).toBeNull();
    expect(rateAt(createWindows([{ ...pass, rate: { unit: "x", samples: [] } }])[0], T0 + H)).toBeNull();
  });
});

describe("provenanceAt", () => {
  const [m] = createWindows([mixed]);
  const first = createProvenance(observed);
  const second = createProvenance(illustrative);
  it("differs along the window", () => {
    expect(provenanceAt(m, T0 + H)).toEqual(first);
    expect(provenanceAt(m, T0 + 6 * H)).toEqual(second);
  });
  it("gives a shared boundary to the later span", () => {
    expect(provenanceAt(m, T0 + 4 * H)).toEqual(second);
  });
  it("returns null where no span covers the time or there are none", () => {
    expect(provenanceAt(m, T0 + 9 * H)).toBeNull();
    expect(provenanceAt(m, T0 - 1)).toBeNull();
    expect(provenanceAt(createWindows([eclipseLike])[0], T0 + H)).toBeNull();
  });
  it("covers the end of the last span", () => {
    expect(provenanceAt(m, T0 + 8 * H)).toEqual(second);
  });
});
