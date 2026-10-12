import { describe, expect, it } from "vitest";

/**
 * Names the generic layers must not carry (T-047 Done When 5, I-021):
 *  - experience, mission, shower or dataset names anywhere in src/core, src/assets, src/shell or generic src/app;
 *  - body names (the literals "sun", "earth", "moon" and the EARTH, MOON, SUN constants) anywhere in those folders except
 *    src/core/bodies/ and src/assets/bodies/, unless the file is allowlisted below with a reason.
 */
const EXPERIENCE_NAMES = /apollo|columbia|eagle|perseid|geminid|meteor|shower|survey-marker|debris-ring|dust-belt/i;
const BODY_NAMES = /["'`](?:sun|earth|moon)["'`]|\b(?:EARTH|MOON|SUN)\b/;

/** File (relative to the repository) -> why it may name bodies. Every entry must still be needed (a test fails on a stale one). */
const BODY_NAME_ALLOWLIST: Readonly<Record<string, string>> = {
  "src/assets/compositions.ts": "A composition is a list of catalogue ids, so it names the built-in bodies it groups; there is no way to say 'Earth and Moon' without them.",
  "src/core/astronomyAdapter.ts": "The adapter is the Orb library boundary: its methods are the Sun-from-Earth and Moon-from-Earth series the library provides.",
  "src/core/body.ts": "Re-exports the built-in body constants from src/core/bodies/ so existing imports keep working.",
  "src/core/illumination.ts": "Lunar phase is defined for the Moon seen from Earth with the Sun as the source; its guards name those three bodies.",
  "src/core/moonTrajectory.ts": "The Moon's own state provider (Earth-centred series); it is the Moon's binding, kept beside the other providers.",
  "src/core/referenceCenters.ts": "Earth-from-Sun and Sun-from-Earth geometry from the Orb library, the root of every body chain.",
  "src/core/scalePolicy.ts": "True and Readable scale are defined in Earth radii, so Earth's radius is the unit.",
  "src/core/state.ts": "Defines the body-id type guards and frame defaults used with the built-in bodies.",
  "src/core/sunCentredSources.ts": "Earth's Sun-centred trajectory and two-body defaults about the Sun: providers for the built-in Sun and Earth.",
  "src/core/twoBodyAdapter.ts": "Default gravitational parameters come from the three built-in body definitions.",
};

const sources = import.meta.glob(
  ["../src/core/**/*.{ts,tsx}", "../src/assets/**/*.{ts,tsx}", "../src/shell/**/*.{ts,tsx}", "../src/app/*.{ts,tsx}"],
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

/** Source with comments removed: prose may name a body, code may not. */
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*/g, "$1");
const relative = (path: string) => path.replace(/^\.\.\//, "");
const ownedByBodies = (path: string) => /^src\/(core|assets)\/bodies\//.test(path);

/** Offences in a set of sources: [file, what]. Pure, so the planted-offence test can feed it a made-up tree. */
export function nameOffences(files: Readonly<Record<string, string>>, allowlist: Readonly<Record<string, string>>): string[][] {
  const offences: string[][] = [];
  for (const [file, text] of Object.entries(files)) {
    const stripped = code(text);
    const experience = stripped.match(EXPERIENCE_NAMES);
    if (experience !== null) offences.push([file, `experience name "${experience[0]}"`]);
    const body = stripped.match(BODY_NAMES);
    if (body !== null && !ownedByBodies(file) && allowlist[file] === undefined) offences.push([file, `body name ${body[0]}`]);
  }
  return offences;
}

const real = Object.fromEntries(Object.entries(sources).map(([path, text]) => [relative(path), text]));

describe("name check (T-047 Done When 5)", () => {
  it("reads the folders it is meant to guard", () => {
    const paths = Object.keys(real);
    for (const folder of ["src/core/", "src/assets/", "src/shell/", "src/app/"]) expect(paths.some((path) => path.startsWith(folder))).toBe(true);
    expect(paths.some((path) => ownedByBodies(path))).toBe(true);
  });

  it("finds no experience, mission, shower or dataset name, and no body name outside the allowlist", () => {
    expect(nameOffences(real, BODY_NAME_ALLOWLIST)).toEqual([]);
  });

  it("keeps every allowlist entry real and reasoned: the file exists, still names a body, and says why", () => {
    for (const [file, reason] of Object.entries(BODY_NAME_ALLOWLIST)) {
      expect(real[file], `${file} exists`).toBeDefined();
      expect(BODY_NAMES.test(code(real[file])), `${file} still needs its allowlist entry`).toBe(true);
      expect(reason.length, `${file} has a reason`).toBeGreaterThan(20);
      expect(file.startsWith("src/shell/") || (file.startsWith("src/app/") && !file.includes("/experiences/")), `${file} is generic app or shell`).toBe(false);
    }
  });

  it("allows body names in src/core/bodies/ and src/assets/bodies/ without an entry", () => {
    expect(Object.keys(real).filter((path) => ownedByBodies(path) && BODY_NAMES.test(code(real[path]))).length).toBeGreaterThan(0);
  });

  it("catches a planted offence: an experience name, a body literal, a body constant, and an unlisted file", () => {
    const planted = {
      "src/shell/Planted.tsx": 'export const focus = "earth";',
      "src/app/Planted.ts": 'import { MOON } from "../core/body"; export const r = MOON.radiusKm;',
      "src/core/Planted.ts": "export const label = 'Apollo 11';",
      "src/assets/Planted.ts": "export const id = `sun`;",
      "src/app/Prose.ts": '// the "earth" is named only in a comment\nexport const fine = 1;',
      "src/core/bodies/Fine.ts": 'export const id = "earth";',
      "src/assets/compositions.ts": 'export const bodies = ["earth", "moon"];',
    };
    const offences = nameOffences(planted, BODY_NAME_ALLOWLIST).map(([file]) => file).sort();
    expect(offences).toEqual(["src/app/Planted.ts", "src/assets/Planted.ts", "src/core/Planted.ts", "src/shell/Planted.tsx"]);
    // The same body literal is accepted only through an allowlist entry that names the file.
    expect(nameOffences({ "src/app/Planted.ts": 'export const a = "earth";' }, { "src/app/Planted.ts": "made-up reason for the test" })).toEqual([]);
  });
});
