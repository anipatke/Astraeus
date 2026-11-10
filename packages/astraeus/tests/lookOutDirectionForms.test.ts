// @vitest-environment happy-dom
// I-168, I-169: one rule decides which look-out directions an entry takes. `setCamera` is the reference (cameraRequestOf, then checkCameraIds); every other entry that
// takes a look-out direction is fed every form and must accept or refuse it exactly as setCamera does. Add a row to ENTRIES when a new entry takes a direction, and a
// row to FORMS when the rule grows a form; the scans below fail when a second direction check appears.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Scene, SceneError, earth, moon, type StoryPanelInput } from "astraeus";
import { definitionOf } from "../src/api/definitionOf";
import { ViewerLink } from "../src/api/viewerLink";
import { FAKE_PRESENTATION, FAKE_PRESENTATION_CONTROL } from "./helpers/viewerPresentation";

const kite = { id: "kite", label: "The Kite", segments: [[{ raDeg: 10, decDeg: 20 }, { raDeg: 20, decDeg: 30 }]] } as const;
const made = { sourceType: "illustrative", sources: ["Made up"], accuracy: "None claimed.", notes: "Made up." } as const;
const T0 = Date.parse("2026-03-01T00:00:00Z");
const samples = [0, 1, 2, 3].map((i) => ({ time: T0 + i * 600_000, positionKm: [10_000 + i * 1_000, 0, 0], velocityKmS: [1, 0, 0] }));
/** Earth, the Moon and a probe path `pa`: the objects a look-out can turn toward. */
const scene = () => new Scene().addBody(earth).addBody(moon).addTrajectory({ id: "pa", label: "Probe A", center: "earth", samples });

/** The outcome of one entry fed one form: accepted, or the error code and message. */
type Outcome = { readonly code: string; readonly message: string };
const outcomeOf = (fn: () => unknown): Outcome => {
  try { fn(); } catch (error) { return error instanceof SceneError ? { code: error.code, message: error.message } : { code: "other", message: String(error) }; }
  return { code: "none", message: "" };
};

/** Every look-out field set, standing in Earth. The rule's forms: a position (nested or flat), an object or figure id, or nothing; and the shapes it refuses. */
const FORMS: readonly { readonly name: string; readonly fields: Record<string, unknown> }[] = [
  { name: "a position", fields: { direction: { raDeg: 83.6, decDeg: 22 } } },
  { name: "a flat raDeg and decDeg", fields: { raDeg: 83.6, decDeg: 22 } },
  { name: "no direction", fields: {} },
  { name: "a body id", fields: { direction: "moon" } },
  { name: "a trajectory id", fields: { direction: "pa" } },
  { name: "a sky figure id", fields: { direction: "kite" } },
  { name: "an unknown id", fields: { direction: "ghost" } },
  { name: "the body stood in", fields: { direction: "earth" } },
  { name: "an empty id", fields: { direction: "" } },
  { name: "a half position", fields: { direction: { raDeg: 10 } } },
  { name: "a position given twice", fields: { direction: { raDeg: 1, decDeg: 2 }, raDeg: 1, decDeg: 2 } },
  { name: "a field of view out of range", fields: { direction: "moon", fovDeg: 200 } },
];

/** The reference: `setCamera` on a viewer showing Earth, the Moon and the probe, with the kite drawn. */
const setCamera = (fields: Record<string, unknown>): void => {
  const link = new ViewerLink();
  link.attach({
    ...FAKE_PRESENTATION_CONTROL, window: { startUtcMs: 0, endUtcMs: 10 }, events: [], rates: [1], paced: false, playable: true, setPlaying: () => undefined,
    read: () => ({ timeUtcMs: 1, rate: 1, playing: false, ...FAKE_PRESENTATION }), seek: () => undefined, setRate: () => undefined, views: [], setView: () => undefined,
    cameraTargets: () => ["earth", "moon", "pa"], readCamera: () => undefined, setCamera: () => undefined,
    skyFigures: [{ id: "kite", label: "The Kite", kind: "figure", listed: true, provenance: made }],
  } as never);
  link.setCamera({ lookOut: "earth", ...fields } as never);
};

/** Each other entry: takes the fields and does what its call and build do with them. */
const ENTRIES: readonly { readonly name: string; readonly open: (fields: Record<string, unknown>) => void }[] = [
  { name: "scene.camera.lookOut, figure added before", open: (fields) => { const s = scene().addSkyFigures([kite]); s.camera.lookOut("earth", fields as never); definitionOf(s); } },
  { name: "scene.camera.lookOut, figure added after", open: (fields) => { const s = scene(); s.camera.lookOut("earth", fields as never); definitionOf(s.addSkyFigures([kite])); } },
  { name: "story panel camera", open: (fields) => { definitionOf(scene().addSkyFigures([kite]).addStoryPanels([{ id: "a", title: "A", body: "Made up.", provenance: made, camera: { lookOut: "earth", ...fields } } as StoryPanelInput])); } },
];

describe("every entry that takes a look-out direction accepts and refuses what setCamera does", () => {
  it("the reference: setCamera accepts positions, no direction and object or figure ids, and refuses the rest", () => {
    const accepted = FORMS.filter(({ fields }) => outcomeOf(() => setCamera(fields)).code === "none").map(({ name }) => name);
    expect(accepted).toEqual(["a position", "a flat raDeg and decDeg", "no direction", "a body id", "a trajectory id", "a sky figure id"]);
  });
  describe.each(ENTRIES)("$name", ({ open }) => {
    it.each(FORMS)("$name: the same outcome as setCamera", ({ fields }) => {
      const reference = outcomeOf(() => setCamera(fields));
      const outcome = outcomeOf(() => open(fields));
      expect(outcome.code === "none", outcome.message).toBe(reference.code === "none");
      // An unknown id is named, whichever entry refuses it.
      if (fields.direction === "ghost") expect(outcome.message).toContain('"ghost"');
    });
  });
});

describe("one rule, in one place", () => {
  const apiFiles = () => {
    const dir = join(__dirname, "../src/api");
    return readdirSync(dir).filter((name) => /\.tsx?$/.test(name)).map((name) => ({ name, text: readFileSync(join(dir, name), "utf8") }));
  };
  it("only cameraRequest.ts checks a look-out direction's shape", () => {
    const checkers = apiFiles().filter(({ text }) => /\bvalidateSky(Position|Direction)\b/.test(text)).map(({ name }) => name);
    expect(checkers, "a second look-out direction check: run the look through cameraRequestOf instead").toEqual(["cameraRequest.ts"]);
  });
  it("no declared look-out direction in the API source is positions only", () => {
    const bare: string[] = [];
    for (const { name, text } of apiFiles()) {
      text.split("\n").forEach((line, index) => {
        const code = line.trim().startsWith("*") || line.trim().startsWith("//") ? "" : line;
        const declared = /\bdirection\??:\s*([^;,}]*)/.exec(code);
        if (declared !== null && declared[1]!.includes("SkyDirection") && !declared[1]!.includes("string")) bare.push(`${name}:${index + 1}`);
      });
    }
    expect(bare, "a direction typed as a position only: add the id form (and a row in ENTRIES)").toEqual([]);
  });
});

describe("the opening look-out toward an id", () => {
  it("carries the look-out request setCamera would send, and reads no pose until the viewer resolves it", () => {
    const s = scene().addSkyFigures([kite]);
    s.camera.lookOut("earth", { direction: "moon", fovDeg: 80 });
    expect(s.camera.pose).toBeUndefined();
    expect(definitionOf(s).startView).toEqual({ kind: "lookOut", body: "earth", direction: "moon", fovDeg: 80 });
    s.camera.lookOut("earth", { direction: "kite" });
    expect(definitionOf(s).startView).toEqual({ kind: "lookOut", body: "earth", direction: "kite" });
  });
  it("a later opening call replaces it, and a position opens on numbers again", () => {
    const s = scene();
    s.camera.lookOut("earth", { direction: "moon" });
    s.camera.lookOut("earth", { direction: { raDeg: 5, decDeg: 6 } });
    expect(definitionOf(s).startView).toEqual({ lookOut: "earth", raDeg: 5, decDeg: 6, fovDeg: 60 });
    expect(s.camera.pose).toEqual({ lookOut: "earth", raDeg: 5, decDeg: 6, fovDeg: 60 });
    s.camera.lookOut("earth", { direction: "moon" });
    s.camera.focus("earth");
    expect(definitionOf(s).startView).toMatchObject({ focus: "earth" });
    s.camera.lookOut("earth", { direction: "moon" });
    s.camera.setStartView({ lookOut: "earth", raDeg: 1, decDeg: 2, fovDeg: 30 });
    expect(definitionOf(s).startView).toEqual({ lookOut: "earth", raDeg: 1, decDeg: 2, fovDeg: 30 });
  });
  it("an object the opening view hides is refused at build as setCamera refuses it on that view", () => {
    const s = scene().addTrajectory({ id: "pb", label: "Probe B", center: "earth", samples })
      .setViews([{ id: "a", label: "View A", objects: ["pa"] }, { id: "b", label: "View B", objects: ["pb"] }], { place: "top-bar" });
    s.camera.lookOut("earth", { direction: "pb" });
    const refused = outcomeOf(() => definitionOf(s));
    expect(refused.code).toBe("bad-camera");
    expect(refused.message).toContain('"pb" is neither an object the opening view shows');
    s.camera.lookOut("earth", { direction: "pa" });
    expect(outcomeOf(() => definitionOf(s)).code).toBe("none");
  });
  it("a body not added is unknown-body, as with a position", () => {
    expect(outcomeOf(() => scene().camera.lookOut("mars", { direction: "moon" })).code).toBe("unknown-body");
  });
});
