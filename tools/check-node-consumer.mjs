// Proves a developer's Node test can import the packed engine (O-044 T-182): `npm run check:node-consumer` builds `astraeus`, packs it, unpacks the tarball into a scratch
// consumer next to links to the installed peers and Vitest, and runs one Vitest test in the Node environment (no `test.server.deps.inline`) that builds
// `new Scene().addBody(sun).addBody(earth).check()`. Before the JSON import attributes it failed with ERR_IMPORT_ATTRIBUTE_MISSING (showers finding E9).
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scratch = mkdtempSync(join(tmpdir(), "astraeus-node-consumer-"));

function run(command, args, cwd, quiet = false) {
  const result = spawnSync(command, args, { cwd, stdio: quiet ? "pipe" : "inherit", encoding: "utf8", shell: process.platform === "win32" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed (exit ${result.status})\n${result.stdout ?? ""}${result.stderr ?? ""}`);
  return result.stdout;
}

let failed = false;
try {
  // The engine and two data packages (Jupiter's moons, the constellations), both packed and unpacked as a customer installs them (the cold-start case below uses the package's own `dataSource`).
  const packed = ["astraeus", "astraeus-data-jupiter", "astraeus-data-constellations"];
  run(process.execPath, [join(root, "tools", "build-packages.mjs"), ...packed], root);
  const modules = join(scratch, "node_modules");
  for (const name of packed) {
    const into = join(scratch, name);
    mkdirSync(into);
    run("npm", ["pack", join(root, "packages", name, "dist"), "--pack-destination", into, "--silent"], root, true);
    mkdirSync(join(modules, name), { recursive: true });
    run("tar", ["-xzf", join(into, readdirSync(into).find((file) => file.endsWith(".tgz"))), "-C", join(modules, name), "--strip-components=1"], scratch, true);
  }
  // The consumer's own installs (peers, the engine's dependency and Vitest) are the checkout's, linked one by one; the engine itself is the unpacked tarball.
  for (const name of readdirSync(join(root, "node_modules"))) {
    if (name === "astraeus" || name.startsWith("astraeus-")) continue;
    symlinkSync(join(root, "node_modules", name), join(modules, name));
  }
  writeFileSync(join(scratch, "package.json"), JSON.stringify({ name: "node-consumer", private: true, type: "module" }));
  writeFileSync(join(scratch, "vitest.config.mjs"), 'export default { test: { environment: "node", include: ["consumer.test.mjs"] } };\n');
  writeFileSync(join(scratch, "consumer.test.mjs"), [
    'import { expect, test } from "vitest";',
    'import { Scene, classifyPositionError, earth, io, jupiter, listedMoons, moon, saturn, titan, sun, solarSystemScale } from "astraeus";',
    'test("the packed package builds a scene in plain Node", () => {',
    "  const scene = new Scene().addBody(sun).addBody(earth);",
    "  expect(() => scene.check()).not.toThrow();",
    "  expect(scene.bodies.map((body) => body.id)).toEqual(['sun', 'earth']);",
    "  expect(scene.timeline.openUtcMs).toEqual(expect.any(Number));",
    "});",
    'test("stateOf and provenanceOf answer for a built-in body", () => {',
    "  const scene = new Scene().addBody(sun).addBody(earth);",
    '  expect(Math.hypot(...scene.stateOf("earth", "2026-08-12T00:00:00Z").positionKm)).toBeGreaterThan(1.4e8);',
    '  expect(scene.provenanceOf("earth").sources.length).toBeGreaterThan(0);',
    '  expect(classifyPositionError(0.005)).toBe("approximate");',
    "});",
    'test("a Sun-centred scene holds a path fixed to the Sun on the Solar system scale (O-046)", () => {',
    "  const t0 = Date.parse('2026-01-01T00:00:00Z');",
    "  const day = 86_400_000;",
    "  // a made-up probe given in the ecliptic plane, 1 AU out and then 1.2 AU out along x",
    "  const samples = [0, 1, 2].map((i) => ({ time: t0 + i * 100 * day, positionKm: [149_597_870.7 * (1 + 0.1 * i), 1000 * i, 0] }));",
    "  const scene = new Scene().addBody(sun).addBody(earth, { enlarge: 50 }).setTime(t0)",
    "    .addTrajectory({ id: 'probe', center: 'sun', samples, plane: 'ecliptic-j2000', lineFixedTo: 'sun' }).setScale(solarSystemScale);",
    "  expect(() => scene.check()).not.toThrow();",
    "  expect(scene.scales[0]).toBe('solar-system');",
    "  const at = scene.stateOf('probe', t0 + 100 * day);",
    "  expect(at.center).toBe('sun');",
    "  expect(Math.hypot(...at.positionKm)).toBeGreaterThan(1.5e8);",
    "  expect(at.positionKm[2]).not.toBe(0); // the ecliptic point was turned into the equator frame",
    "});",
    'test("a 1979 journey: Saturn orbit line, pacing and span provenance on the packed package (O-047)", async () => {',
    "  const t0 = Date.parse('1977-09-05T00:00:00Z');",
    "  const day = 86_400_000;",
    "  const samples = [0, 1, 2].map((i) => ({ time: t0 + i * 400 * day, positionKm: [149_597_870.7 * (1 + 4 * i), 1000 * i, 0] }));",
    "  const scene = new Scene().addBody(sun).addBody(earth, { enlarge: 50 }).addBody(saturn, { orbit: true }).setTime(t0)",
    "    .addTrajectory({ id: 'traveller', center: 'sun', samples, lineFixedTo: 'sun',",
    "      provenanceSpans: [{ start: t0, end: t0 + 400 * day, provenance: { sourceType: 'reconstructed', sources: ['Made up'], accuracy: 'None', notes: 'x' } }, { start: t0 + 400 * day, end: t0 + 800 * day, provenance: { sourceType: 'illustrative', sources: ['Made up'], accuracy: 'None', notes: 'y' } }] })",
    "    .addEvents([{ id: 'pass', label: 'Pass', time: t0 + 400 * day, type: 'encounter' }])",
    "    .setTimeline({ start: t0, end: t0 + 800 * day, rates: [86_400, 2_592_000], rate: 2_592_000, pacing: [{ near: { type: 'encounter', withinSeconds: 30 * 86_400 }, rate: 86_400 }] })",
    "    .setScale(solarSystemScale);",
    "  await scene.load(); // a full turn of Saturn from 1977 sits inside the planet series",
    "  expect(scene.bodies.find((body) => body.id === 'saturn').orbit).toBe(true);",
    "  expect(scene.paths.map((path) => path.id)).toEqual(['traveller']);",
    "  expect(scene.timeline.rates).toEqual([86_400, 2_592_000]);",
    "  const early = new Scene().addBody(sun).addBody(saturn).setTimeline({ start: '1945-01-01T00:00:00Z', end: '1946-01-01T00:00:00Z' });",
    "  await expect(early.load()).rejects.toMatchObject({ code: 'out-of-span' }); // before the planet series begin (1950)",
    "});",
    'test("a cold start in plain Node: await scene.load({ data }) then stateOf and provenanceOf for a planet and a moon (O-056)", async () => {',
    "  const { dataSource } = await import('astraeus-data-jupiter');",
    "  const scene = new Scene().addBody(sun).addBody(jupiter).addBody(io).setTime('2026-03-01T00:00:00Z');",
    "  expect(() => scene.stateOf('io', '2026-03-01T00:00:00Z')).toThrow(/scene\\.load/); // Jupiter's moon fits are not loaded in this process yet",
    "  expect(() => scene.check({ data: [dataSource] })).not.toThrow();",
    "  await scene.load({ data: [dataSource] });",
    "  expect(Math.hypot(...scene.stateOf('jupiter', '2026-03-01T00:00:00Z').positionKm)).toBeGreaterThan(7e8);",
    "  const ioKm = Math.hypot(...scene.stateOf('io', '2026-03-01T00:00:00Z').positionKm);",
    "  expect(ioKm).toBeGreaterThan(4e5);",
    "  expect(ioKm).toBeLessThan(4.5e5);",
    "  expect(scene.provenanceOf('io').sources.length).toBeGreaterThan(0);",
    "});",
    'test("a two-probe scene with views and view-aware pacing builds on the packed package (O-052)", () => {',
    "  const t0 = Date.parse('2026-01-01T00:00:00Z');",
    "  const hour = 3_600_000;",
    "  const path = (km) => [0, 1, 2].map((i) => ({ time: t0 + i * hour, positionKm: [km, 1000 * i, 0] }));",
    "  const scene = new Scene().addBody(earth).setTime(t0)",
    "    .addTrajectory({ id: 'a', label: 'A', samples: path(40_000) }).addTrajectory({ id: 'b', label: 'B', samples: path(70_000) })",
    "    .addEvents([{ id: 'a-pass', label: 'A pass', time: t0 + hour, type: 'flyby', object: 'a' }, { id: 'b-pass', label: 'B pass', time: t0 + hour, type: 'flyby', object: 'b' }])",
    "    .setViews([{ id: 'a', label: 'A', objects: ['a'], events: ['a-pass'] }, { id: 'b', label: 'B', objects: ['b'], events: ['b-pass'] }, { id: 'both', label: 'Both' }], { place: 'top-bar' })",
    "    .setTimeline({ start: t0, end: t0 + 2 * hour, rates: [60, 600], rate: 600, pacing: [{ near: { type: 'flyby', withinSeconds: 600 }, rate: 60 }] });",
    "  expect(() => scene.check()).not.toThrow();",
    "  expect(scene.views.items.map((view) => view.id)).toEqual(['a', 'b', 'both']);",
    "  expect(scene.events.map((event) => event.id)).toEqual(['a-pass', 'b-pass']);",
    "});",
    'test("a ringed planet is added and a moon beyond Io draws its orbit line on the packed package (O-048)", () => {',
    "  // the ring facts (Saturn has bands, Mars none) are proven on the packed catalogue by `npm run check:pack` (ringFactProblems); this check reads only the public entry (I-147)",
    "  const scene = new Scene().addBody(saturn).addBody(titan, { orbit: true });",
    "  expect(() => scene.check({ data: [{ name: 'made-up', provides: ['titan'] }] })).not.toThrow(); // a made-up source for Titan's positions, so the data package is not needed",
    "  expect(scene.bodies.find((body) => body.id === 'titan').orbit).toBe(true); // a moon beyond Io, drawn about Saturn by the one catalogue rule",
    "});",
    'test("Uranus\'s listed moons are added by id with orbit lines on the packed package (O-049)", () => {',
    "  const scene = new Scene().addBody(sun).addBody('uranus').addBody('miranda', { orbit: true }).addBody('titania', { orbit: true });",
    "  expect(() => scene.check({ data: [{ name: 'astraeus-data-uranus', provides: ['miranda', 'titania'] }] })).not.toThrow(); // a made-up source stands in for the data package",
    "  expect(scene.bodies.filter((body) => ['miranda', 'titania'].includes(body.id)).map((body) => body.orbit)).toEqual([true, true]);",
    "  expect(listedMoons('uranus').map((moon) => moon.id)).toEqual(expect.arrayContaining(['miranda', 'ariel', 'umbriel', 'titania', 'oberon']));",
    "  expect(() => new Scene().addBody(sun).addBody('uranus').addBody('miranda').check()).toThrow(/astraeus-data-uranus/); // no package, no moon",
    "});",
    'test("one path through every stretch: listed, automatic and a Moon orbit, one menu object each on the packed package (O-050)", async () => {',
    "  const t0 = Date.parse('1979-01-01T00:00:00Z');",
    "  const hour = 3_600_000;",
    "  const day = 24 * hour;",
    "  // a made-up flyby of Earth: along x past the planet, hourly for ten days, 20,000 km a sample",
    "  const flyby = (scene) => Array.from({ length: 241 }, (_, i) => { const t = t0 + i * hour; const e = scene.stateOf('earth', t).positionKm; return { time: t, positionKm: [e[0] + (i - 120) * 20_000, e[1], e[2]] }; });",
    "  const base = () => new Scene().addBody(sun).addBody(earth, { enlarge: 50 }).setTime(t0).setScale(solarSystemScale);",
    "  const listed = [{ start: t0, end: t0 + 100 * hour, body: 'sun' }, { start: t0 + 100 * hour, end: t0 + 140 * hour, body: 'earth' }, { start: t0 + 140 * hour, end: t0 + 240 * hour, body: 'sun' }];",
    "  const probe = base();",
    "  const listedScene = base().addTrajectory({ id: 'probe', center: 'sun', samples: flyby(probe), lineFixedTo: listed });",
    "  await listedScene.load();",
    "  expect(listedScene.paths.filter((path) => path.id === 'probe')).toHaveLength(1); // one path (one menu entry) for three stretches",
    "  const autoScene = base().addTrajectory({ id: 'probe', center: 'sun', samples: flyby(probe), lineFixedTo: 'auto' });",
    "  await autoScene.load(); // the stretches are worked out in here",
    "  expect(autoScene.paths.filter((path) => path.id === 'probe')).toHaveLength(1);",
    "  expect(autoScene.stateOf('probe', t0 + 120 * hour).center).toBe('sun');",
    "  const moonScene = new Scene().addBody(earth).addBody(moon).setTime(t0);",
    "  const moonSamples = Array.from({ length: 6 }, (_, i) => { const t = t0 + i * day; const m = moonScene.stateOf('moon', t).positionKm; return { time: t, positionKm: [m[0] + 3_000, m[1], m[2]] }; });",
    "  await moonScene.addTrajectory({ id: 'orbiter', samples: moonSamples, lineFixedTo: 'auto' }).load(); // a Moon orbit holds against the Moon",
    "  expect(moonScene.paths.filter((path) => path.id === 'orbiter')).toHaveLength(1);",
    "});",
    'test("views: two made-up probe paths, a shared body and three views resolve once, and every fault is named, on the packed package (O-051)", () => {',
    "  const t0 = Date.parse('2026-03-01T00:00:00Z');",
    "  const min = 60_000;",
    "  const path = (x) => [0, 1, 2, 3].map((i) => ({ time: t0 + i * 10 * min, positionKm: [x + i * 1_000, 0, 0] }));",
    "  const panel = (id) => ({ id, at: { time: '2026-03-01T00:15:00Z' }, title: id, body: ['A made-up line.'], provenance: { sourceType: 'illustrative', sources: ['Made up'], accuracy: 'None', notes: 'Made up.' } });",
    "  const scene = () => new Scene().addBody(earth)",
    "    .addTrajectory({ id: 'probe-a', center: 'earth', samples: path(10_000) }).addTrajectory({ id: 'probe-b', center: 'earth', samples: path(20_000) })",
    "    .addEvents([{ id: 'ea', label: 'A', time: t0 + 5 * min }, { id: 'eb', label: 'B', time: t0 + 6 * min }, { id: 'es', label: 'Shared', time: t0 + 7 * min }])",
    "    .addStoryPanels([panel('qa'), panel('qb'), panel('qs')]);",
    "  const A = { id: 'a', label: 'A', objects: ['probe-a'], events: ['ea'], panels: ['qa'], camera: 'stay' };",
    "  const B = { id: 'b', label: 'B', objects: ['probe-b'], events: ['eb'], panels: ['qb'], camera: { follow: 'probe-b' } };",
    "  const BOTH = { id: 'both', label: 'Both', objects: ['probe-a', 'probe-b'], events: ['ea', 'eb'], panels: ['qa', 'qb'], camera: { focus: 'probe-a' } };",
    "  const built = scene().setViews([A, B, BOTH], { place: 'top-bar', start: 'b' });",
    "  expect(() => built.check()).not.toThrow();",
    "  expect(built.views).toMatchObject({ place: 'top-bar', startId: 'b' });",
    "  expect(built.views.items.map((view) => view.id)).toEqual(['a', 'b', 'both']);",
    "  expect(new Scene().addBody(earth).views).toBeUndefined(); // a scene without views is as it was",
    "  const fault = (fn) => { try { fn(); } catch (error) { return `${error.code}: ${error.message}`; } return 'no error'; };",
    "  const top = { place: 'top-bar' };",
    "  expect(fault(() => scene().setViews([], top))).toMatch(/^bad-view: setViews: give a non-empty list/);",
    "  expect(fault(() => scene().setViews([A, { ...B, id: 'a' }], top))).toMatch(/^bad-view: .*view \"a\" appears twice/);",
    "  expect(fault(() => scene().setViews([A], { place: 'sidebar' }))).toMatch(/^bad-view: .*place must be one of top-bar, panel/);",
    "  expect(fault(() => scene().setViews([{ ...A, camera: 'orbit' }], top))).toMatch(/^bad-view: /);",
    "  expect(fault(() => scene().setViews([A, B], { place: 'top-bar', start: 'nope' }))).toMatch(/^bad-view: .*start/);",
    "  expect(fault(() => scene().setViews([{ ...A, objects: ['probe-z'] }], top).check())).toMatch(/^bad-view: .*probe-z/); // an id the scene does not hold is caught when it is built",
    "  expect(fault(() => scene().setViews([{ ...A, camera: { follow: 'probe-b' } }, B], top).check())).toMatch(/^bad-view: /); // a camera target the view hides",
    "});",
    'test("a sky figure that names stars loads in plain Node: the engine reads its own star list from disk (I-167)", async () => {',
    "  const { constellations } = await import('astraeus-data-constellations');",
    "  const scene = new Scene().addBody(earth).addSkyFigures(await constellations(['Ori'], { outlines: true })); // every end of Orion names a Hipparcos star",
    "  expect(() => scene.check()).not.toThrow();",
    "  await expect(scene.load()).resolves.toBeUndefined(); // no fetch stub; was missing-data",
    "  const unknown = new Scene().addBody(earth).addSkyFigures([{ id: 'nowhere', label: 'Nowhere', segments: [[{ star: 1 }, { star: 2_000_000 }]] }]);",
    "  await expect(unknown.load()).rejects.toMatchObject({ code: 'unknown-star' }); // a number not in the list is still named, not read as missing data",
    "});",
    "",
  ].join("\n"));
  run(process.execPath, [join(modules, "vitest", "vitest.mjs"), "run"], scratch);
} catch (error) {
  failed = true;
  console.error(String(error.message ?? error));
}
rmSync(scratch, { recursive: true, force: true });
console.log(`node consumer: ${failed ? "FAILED" : "pass"}`);
process.exit(failed ? 1 : 0);
